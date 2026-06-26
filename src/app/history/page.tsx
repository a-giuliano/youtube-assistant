import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { videos } from '@/db/schema';
import { signThumbnailUrl } from '@/lib/storage';
import { ClickableThumbnail } from '../_components/clickable-thumbnail';
import { DeleteVideoButton } from '../_components/delete-video-button';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const rows = await db
    .select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailKey: videos.thumbnailKey,
      createdAt: videos.createdAt,
    })
    .from(videos)
    .orderBy(desc(videos.createdAt))
    .limit(50);

  const items = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      thumbnailUrl: row.thumbnailKey ? await signThumbnailUrl(row.thumbnailKey) : null,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Past generations stored in Neon Postgres.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          New
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-muted)]">
          Nothing generated yet. Head back to{' '}
          <Link href="/" className="text-[var(--color-accent)] hover:underline">
            the home page
          </Link>{' '}
          and paste a transcript.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[160px_1fr]"
            >
              <div className="aspect-video overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]">
                {item.thumbnailUrl ? (
                  <ClickableThumbnail src={item.thumbnailUrl} alt={item.title} />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs text-[var(--color-muted)]">
                    no thumbnail
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col space-y-2">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="truncate text-base font-semibold">{item.title}</h2>
                  <time
                    dateTime={item.createdAt.toISOString()}
                    className="shrink-0 text-xs text-[var(--color-muted)]"
                  >
                    {item.createdAt.toLocaleString()}
                  </time>
                </div>
                <p className="line-clamp-3 text-sm text-[var(--color-muted)]">
                  {item.description}
                </p>
                <div className="mt-auto flex justify-end pt-2">
                  <DeleteVideoButton id={item.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
