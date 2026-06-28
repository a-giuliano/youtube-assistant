import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const FUNCTION_URL =
  process.env.NEON_FUNCTION_URL ?? 'http://localhost:8787';

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Pin the request to the signed-in user. The Function trusts this proxy as
  // its only caller; if you switch to direct browser → Function calls, verify
  // a Neon Auth JWT in the Function instead of trusting a body field.
  body.userId = session.user.id;

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
