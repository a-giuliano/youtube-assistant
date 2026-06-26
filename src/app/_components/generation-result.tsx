'use client';

import { useState } from 'react';
import { ClickableThumbnail } from './clickable-thumbnail';

type Result = {
  id: number;
  title: string;
  description: string;
  thumbnailPrompt: string | null;
  thumbnailUrl: string | null;
};

export function GenerationResult({ result }: { result: Result }) {
  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-2">
        <ThumbnailCard url={result.thumbnailUrl} prompt={result.thumbnailPrompt} />
      </div>
      <div className="space-y-6 md:col-span-3">
        <CopyField label="Title" value={result.title} singleLine />
        <CopyField label="Description" value={result.description} />
      </div>
    </div>
  );
}

function ThumbnailCard({ url, prompt }: { url: string | null; prompt: string | null }) {
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
        Thumbnail
      </div>
      <div className="aspect-video overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        {url ? (
          <ClickableThumbnail src={url} alt={prompt ?? 'Generated thumbnail'} />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-[var(--color-muted)]">
            No thumbnail generated
          </div>
        )}
      </div>
      {prompt && (
        <details className="text-xs text-[var(--color-muted)]">
          <summary className="cursor-pointer select-none hover:text-[var(--color-text)]">
            Prompt
          </summary>
          <p className="mt-2 whitespace-pre-wrap italic">{prompt}</p>
        </details>
      )}
    </div>
  );
}

function CopyField({
  label,
  value,
  singleLine = false,
}: {
  label: string;
  value: string;
  singleLine?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </div>
        <button
          type="button"
          onClick={copy}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {singleLine ? (
          <p className="text-lg font-semibold leading-snug">{value}</p>
        ) : (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--color-text)]">
            {value}
          </pre>
        )}
      </div>
    </div>
  );
}
