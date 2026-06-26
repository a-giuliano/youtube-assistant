import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const FUNCTION_URL =
  process.env.NEON_FUNCTION_URL ?? 'http://localhost:8787';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const upstream = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('[api/generate] proxy failed:', error);
    return NextResponse.json(
      {
        error:
          'Could not reach the Neon Function. Is `neon dev` running? ' +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 502 },
    );
  }
}
