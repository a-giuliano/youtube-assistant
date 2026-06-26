'use client';

import { useState, useTransition } from 'react';
import { deleteVideo } from '../history/actions';

export function DeleteVideoButton({ id }: { id: number }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      await deleteVideo(id);
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
        >
          {pending ? 'Deleting…' : 'Confirm delete'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Delete entry"
      className="text-xs text-[var(--color-muted)] transition hover:text-red-300"
    >
      Delete
    </button>
  );
}
