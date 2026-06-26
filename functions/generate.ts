import { neon } from '@neondatabase/ai-sdk-provider';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { parseEnv } from '@neondatabase/env';
import config from '../neon';
import { videos } from '../src/db/schema';

const env = parseEnv(config);

const pool = new Pool({ connectionString: env.postgres.databaseUrl, max: 5 });
const db = drizzle(pool);

const s3 = new S3Client({
  forcePathStyle:
    (process.env.NEON_STORAGE_FORCE_PATH_STYLE ?? 'true').toLowerCase() !== 'false',
});

const BUCKET = 'thumbnails';
const TEXT_MODEL = 'gpt-5';
const IMAGE_MODEL = 'gpt-5';

const MetadataSchema = z.object({
  title: z
    .string()
    .describe('A punchy, clickable YouTube title under 70 characters. No clickbait emojis.'),
  description: z
    .string()
    .describe(
      'A YouTube description with a 1-2 sentence hook, then a short summary paragraph, ' +
        'then a "Chapters:" section listing timestamps from the transcript as "MM:SS - topic" lines. The chapters should be grouped into logical chunks. A video should have at least 5 chapters, but no more than 10.' +
        'Plain text, no markdown.',
    ),
  thumbnailPrompt: z
    .string()
    .describe(
      'A concise visual prompt (under 60 words) for an image model to generate a ' +
        'YouTube thumbnail. Describe subject, composition, lighting, mood. The thumbnail should be attention grabbing and visually interesting. The thumbnail should have a 16:9 aspect ratio.',
    ),
});

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return json({ error: 'POST a transcript to this endpoint' }, 405);
    }

    let body: { transcript?: string };
    try {
      body = (await request.json()) as { transcript?: string };
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const transcript = (body.transcript ?? '').trim();
    if (transcript.length < 20) {
      return json({ error: 'Transcript is too short' }, 400);
    }

    try {
      const { object: meta } = await generateObject({
        model: neon(TEXT_MODEL),
        schema: MetadataSchema,
        system:
          'You are a YouTube publishing assistant. Given a video transcript with timestamps, ' +
          'produce a compelling title, a description with a chapter list pulled from the ' +
          'timestamps, and a thumbnail visual prompt.',
        prompt: `Transcript:\n\n${transcript}`,
      });

      const thumbnail = await generateThumbnail(meta.thumbnailPrompt);

      const [row] = await db
        .insert(videos)
        .values({
          transcript,
          title: meta.title,
          description: meta.description,
          thumbnailKey: thumbnail?.key ?? null,
          thumbnailPrompt: meta.thumbnailPrompt,
        })
        .returning({ id: videos.id });

      return json(
        {
          id: row?.id,
          title: meta.title,
          description: meta.description,
          thumbnailPrompt: meta.thumbnailPrompt,
          thumbnailUrl: thumbnail?.url ?? null,
        },
        200,
      );
    } catch (error) {
      console.error('[generate] failed:', error);
      return json(
        { error: error instanceof Error ? error.message : 'Generation failed' },
        500,
      );
    }
  },
};

async function generateThumbnail(
  prompt: string,
): Promise<{ key: string; url: string } | null> {
  const result = await generateText({
    model: neon(IMAGE_MODEL),
    system:
      'Always call the image_generation tool exactly once to produce the requested thumbnail.',
    prompt,
    tools: {
      image_generation: neon.tools.imageGeneration({
        outputFormat: 'jpeg',
        quality: 'low',
        outputCompression: 30,
        size: '1024x1024',
      }),
    },
  });

  for (const tr of result.toolResults) {
    if (tr.toolName !== 'image_generation') continue;
    const base64 = imageResultBase64(tr.output);
    if (!base64) continue;
    return persistThumbnail(base64);
  }
  return null;
}

async function persistThumbnail(base64: string): Promise<{ key: string; url: string }> {
  const body = Buffer.from(base64, 'base64');
  const key = `thumbnails/${randomUUID()}.jpg`;
  const contentType = 'image/jpeg';

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 },
  );
  return { key, url };
}

function imageResultBase64(output: unknown): string | null {
  if (typeof output === 'object' && output !== null && 'result' in output) {
    const { result } = output as { result: unknown };
    if (typeof result === 'string') return result;
  }
  return null;
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
