'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { videos } from '@/db/schema';
import { deleteThumbnail } from '@/lib/storage';
import { auth } from '@/lib/auth/server';

export async function deleteVideo(id: number): Promise<void> {
  const { data: session } = await auth.getSession();
  if (!session?.user) throw new Error('Unauthorized');

  const [row] = await db
    .select({ thumbnailKey: videos.thumbnailKey })
    .from(videos)
    .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)))
    .limit(1);

  if (!row) return;

  if (row.thumbnailKey) {
    try {
      await deleteThumbnail(row.thumbnailKey);
    } catch (error) {
      console.warn(`[deleteVideo] could not delete thumbnail ${row.thumbnailKey}:`, error);
    }
  }

  await db
    .delete(videos)
    .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));
  revalidatePath('/history');
}
