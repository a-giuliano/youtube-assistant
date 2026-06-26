import { TranscriptForm } from './_components/transcript-form';

const SAMPLE = `00:00 - Hey everyone, today we're rebuilding a tiny note-taking app from scratch in 20 minutes.
00:42 - First we'll scaffold a Next.js app and wire up Tailwind for styling.
03:15 - Then we'll add a Postgres database for persistence using Neon.
07:30 - Next we'll add an AI-powered "summarize" button using the Vercel AI SDK.
13:10 - We'll handle streaming responses and show a nice loading state.
17:45 - Finally we'll deploy it and walk through the production setup.
19:30 - Thanks for watching, hit subscribe if this helped.`;

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Turn a transcript into a publish-ready video
        </h1>
      </div>

      <TranscriptForm sample={SAMPLE} />
    </div>
  );
}
