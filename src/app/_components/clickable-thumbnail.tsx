'use client';

import { useEffect, useState } from 'react';

export function ClickableThumbnail({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Enlarge thumbnail"
        className="group block size-full cursor-zoom-in overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="size-full object-cover transition group-hover:opacity-85"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged thumbnail"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full cursor-default rounded-lg shadow-2xl"
          />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
            }}
            className="absolute top-4 right-4 rounded-md border border-white/20 bg-black/40 px-3 py-1.5 text-sm text-white transition hover:bg-black/60"
          >
            Close (Esc)
          </button>
        </div>
      )}
    </>
  );
}
