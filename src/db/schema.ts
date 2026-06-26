import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  transcript: text('transcript').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  thumbnailKey: text('thumbnail_key'),
  thumbnailPrompt: text('thumbnail_prompt'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
