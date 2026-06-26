<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://neon.com/brand/neon-logo-dark-color.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://neon.com/brand/neon-logo-light-color.svg">
  <img width="250px" alt="Neon Logo fallback" src="https://neon.com/brand/neon-logo-dark-color.svg">
</picture>

# YouTube Publish Helper

A demo Next.js app that turns a video transcript with timestamps into a publish-ready package: a punchy title, a description with chapter markers, and a thumbnail image.

It is intentionally small, and it leans hard on Neon's backend primitives:

- **Neon AI Gateway** &mdash; `gpt-5-mini` via `@neondatabase/ai-sdk-provider`, plus the gateway's built-in `image_generation` tool for thumbnails.
- **Neon Object Storage** &mdash; the generated JPEG is uploaded to a Neon-managed S3-compatible bucket (`thumbnails`).
- **Neon Postgres** &mdash; every generation is persisted to a `videos` table via Drizzle ORM.
- **Neon Functions** &mdash; the long-running generation work runs on a Neon Function (`generate`) that sits next to all of the above, so the only thing flying across the network is the final JSON.

Everything &mdash; the database URL, the AI Gateway endpoint, the object-storage credentials &mdash; is declared in `neon.ts` and injected by `neon dev` / `neon deploy`.

## How it fits together

```
┌────────────────────────┐         ┌──────────────────────────────┐
│  Next.js (localhost)   │         │  Neon Function (`generate`)  │
│                        │         │                              │
│  /                     │  POST   │  ─► generateObject (title +  │
│   └ TranscriptForm  ───┼────────►│        description + prompt) │
│                        │ /api/   │  ─► image_generation tool    │
│  /history              │ generate│  ─► upload JPEG → bucket     │
│   └ Server Component   │         │  ─► INSERT INTO videos       │
│      reads Postgres ◄──┼─────────┼──  returns { id, title, …,   │
│                        │  Drizzle│        thumbnailUrl }        │
└────────────────────────┘ over pg └──────────────────────────────┘
                                          ▲       ▲       ▲
                                          │       │       │
                                  ┌───────┴──┐ ┌──┴──┐ ┌──┴────────┐
                                  │ Neon AI  │ │Neon │ │ Neon      │
                                  │ Gateway  │ │Bucket│ │ Postgres │
                                  └──────────┘ └─────┘ └───────────┘
```

The Next.js Route Handler `/api/generate` is a thin proxy in front of the Function so you only deal with one URL in the browser. For production, swap the proxy for a direct browser → Function call (see the Neon Functions docs — that pattern dodges your app host's serverless timeout for long agents and needs CORS + a short-lived JWT).

## Project structure

```
youtube-publisher/
├── neon.ts                          # AI Gateway + thumbnails bucket + `generate` function
├── drizzle.config.ts                # Drizzle Kit config
├── next.config.ts                   # Next.js config (pg/aws-sdk as server externals)
├── postcss.config.mjs               # Tailwind v4
├── functions/
│   └── generate.ts                  # The Neon Function: transcript → title/desc/thumbnail
└── src/
    ├── app/
    │   ├── layout.tsx               # Root layout, nav, fonts
    │   ├── page.tsx                 # Home: transcript form + result panel
    │   ├── history/page.tsx         # Server Component listing past generations
    │   ├── api/generate/route.ts    # Proxy → Neon Function
    │   └── _components/             # TranscriptForm, GenerationResult
    ├── db/schema.ts                 # Drizzle schema (videos table)
    └── lib/
        ├── db.ts                    # pg Pool + Drizzle for the Next.js side
        └── storage.ts               # S3 client + signed-URL helper
```

## Prerequisites

```bash
# Neon CLI (also gives you `neonctl`)
npm i -g neonctl
neon login
```

## One-time setup

```bash
npm install

# Link this repo to a Neon project (creates `.neon`).
neon link

# Provision AI Gateway + the `thumbnails` bucket + the `generate` function,
# and write all the credentials to `.env.local`.
neon deploy

# Apply the Drizzle schema (creates the `videos` table).
npm run db:push
```

## Run the demo

Two processes, two terminals:

```bash
# Terminal 1 — the Neon Function (defaults to http://localhost:8787)
neon dev

# Terminal 2 — Next.js (http://localhost:3000)
npm run dev
```

Open <http://localhost:3000>. Paste a transcript (or click **Use sample**) and hit **Generate**. You'll get back a title, description with chapter markers, and a thumbnail in 20–40s. Hit `/history` to see everything you've generated, pulled straight from Neon Postgres with fresh presigned thumbnail URLs.

> The Next.js proxy defaults to `http://localhost:8787`. Point it at a deployed function by setting `NEON_FUNCTION_URL` in `.env.local`:
>
> ```
> NEON_FUNCTION_URL="https://<branch-id>-generate.compute.c-3.us-east-2.aws.neon.tech"
> ```
>
> You can grab that URL with `neon functions get generate`.

## What to look at

- [`functions/generate.ts`](./functions/generate.ts) — the whole agent: `generateObject` for the structured metadata, `generateText` + `image_generation` for the thumbnail, S3 upload, Drizzle insert.
- [`neon.ts`](./neon.ts) — all the infra declared in one ~15-line file.
- [`src/app/history/page.tsx`](./src/app/history/page.tsx) — Server Component that reads Postgres directly via Drizzle and signs thumbnail URLs at render time.

## Redeploying the function

After editing `functions/generate.ts`:

```bash
neon deploy
```

That bundles the function with esbuild, uploads it, and applies the `neon.ts` policy to your linked branch.

## Deploying the web app to Vercel

The Next.js app deploys to Vercel; the Neon Function stays on Neon's compute. They're independent: `neon deploy` ships the function, `git push` (or `vercel deploy`) ships the web app. The Next.js Route Handler at `/api/generate` proxies to the Function's public URL.

### 1. Deploy the Neon Function and grab its invocation URL

```bash
neon deploy
neon functions get generate
```

Copy the `invocation_url` (it looks like `https://<branch-id>-generate.compute.c-3.us-east-2.aws.neon.tech`).

### 2. Push this repo to GitHub (or another git provider)

Vercel deploys from a connected git repo, so make sure your latest code is on a branch Vercel can see.

### 3. Import the project on Vercel

From the Vercel dashboard click **Add New → Project** and pick this repo. Vercel auto-detects Next.js — no need to override the build command, output directory, or install command.

### 4. Set environment variables on the Vercel project

Under **Project Settings → Environment Variables**, add these (all for Production, Preview, and Development):

| Variable                | Where to find it                                          | What it's for                                                  |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`          | `.env.local` (pooled URL written by `neon deploy`)        | Server Component reads on `/history` and the delete action     |
| `AWS_ACCESS_KEY_ID`     | `.env.local`                                              | Signing thumbnail URLs and deleting objects                    |
| `AWS_SECRET_ACCESS_KEY` | `.env.local`                                              | Same                                                           |
| `AWS_ENDPOINT_URL_S3`   | `.env.local` (your Neon Object Storage endpoint)          | Same                                                           |
| `AWS_REGION`            | `.env.local` (e.g. `us-east-2`)                           | Same                                                           |
| `NEON_FUNCTION_URL`     | From `neon functions get generate` above                  | The proxy at `/api/generate` forwards POSTs here               |

You do **not** need to set `OPENAI_API_KEY`, `NEON_AI_GATEWAY_*`, or `DATABASE_URL_UNPOOLED` on Vercel — the AI Gateway tokens are used only by the Function (which Neon injects automatically), and the Next.js side doesn't need the unpooled connection.

### 5. Bump the route-handler timeout if needed

`/api/generate` already declares `export const maxDuration = 300;`, which is the maximum allowed on Vercel **Pro** (and is plenty — generation takes 20-40s). On the **Hobby** tier the cap is 60s. Generation usually fits in that window, but a slow thumbnail render can occasionally push past it. If you're on Hobby and you hit timeouts, the fix is to deploy the same Neon Function URL but have the browser call it directly (bypassing the proxy) — see the "Functions as an agent backend" pattern in the [Neon Functions docs](https://neon.com/docs/compute/functions/overview.md).

### 6. Apply the schema once

Vercel does not run migrations. From your laptop, against the same branch you'll point Vercel at:

```bash
npm run db:push
```

### 7. Deploy

Click **Deploy** on Vercel. Your Production URL (something like `https://your-app.vercel.app`) is the live app — it talks to Neon Postgres for history, Neon Object Storage for thumbnails, and forwards every **Generate** click to the Neon Function.

### Branch-per-environment (optional but matches the Neon model)

A nice pattern: one Neon branch per Vercel environment. Create a `preview` branch on Neon (`neon branches create preview`), `neon checkout preview && neon deploy` to spin up its own Function + bucket + Postgres, then set the `Preview` environment in Vercel to use that branch's connection strings and Function URL. Production Vercel keeps using `main`.
