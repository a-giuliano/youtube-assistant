'use client';

import { useState } from 'react';
import { GenerationResult } from './generation-result';

type Result = {
  id: number;
  title: string;
  description: string;
  thumbnailPrompt: string | null;
  thumbnailUrl: string | null;
};

export function TranscriptForm({ sample }: { sample: string }) {
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transcript.trim()) return;

    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setResult(data as Result);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setResult(null);
    setError(null);
  }

  const isLoading = status === 'loading';

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-3">
        <label
          htmlFor="transcript"
          className="flex items-center justify-between text-sm text-[var(--color-muted)]"
        >
          <span>Transcript with timestamps</span>
          <button
            type="button"
            onClick={() => setTranscript(sample)}
            className="text-[var(--color-accent)] hover:underline"
            disabled={isLoading}
          >
            Use sample
          </button>
        </label>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="00:00 - Welcome back to the channel..."
          rows={14}
          disabled={isLoading}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-sm leading-relaxed text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] disabled:opacity-60"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {status !== 'idle' && (
              <button
                type="button"
                onClick={reset}
                disabled={isLoading}
                className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-60"
              >
                Reset
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || transcript.trim().length < 20}
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-fg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </form>

      {status === 'loading' && <LoadingState />}
      {status === 'error' && error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}
      {status === 'done' && result && <GenerationResult result={result} />}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
        <span className="size-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
        Generating title, description, and thumbnail&hellip; this usually takes 20-40
        seconds.
      </div>
    </div>
  );
}
