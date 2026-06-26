import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'YouTube Publish Helper',
  description: 'Turn a transcript into a title, thumbnail, and description.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-[var(--color-border)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
              <span className="inline-block size-2 rounded-full bg-[var(--color-accent)]" />
              YouTube Publish Helper
            </Link>
            <nav className="flex items-center gap-6 text-sm text-[var(--color-muted)]">
              <Link href="/" className="hover:text-[var(--color-text)]">
                New
              </Link>
              <Link href="/history" className="hover:text-[var(--color-text)]">
                History
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-[var(--color-muted)]">
          Built on Neon Postgres, Neon AI Gateway, Neon Object Storage, and Neon Functions.
        </footer>
      </body>
    </html>
  );
}
