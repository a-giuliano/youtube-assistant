'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { videos } from '@/db/schema';
import { deleteThumbnail } from '@/lib/storage';

export async function deleteVideo(id: number): Promise<void> {
  const [row] = await db
    .select({ thumbnailKey: videos.thumbnailKey })
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1);

  if (!row) return;

  if (row.thumbnailKey) {
    try {
      await deleteThumbnail(row.thumbnailKey);
    } catch (error) {
      console.warn(`[deleteVideo] could not delete thumbnail ${row.thumbnailKey}:`, error);
    }
  }

  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath('/history');
}
