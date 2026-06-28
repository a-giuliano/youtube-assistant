import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// `userId` references `neon_auth.user(id)` — a table managed by Neon Auth.
// We don't model the FK here on purpose so Drizzle Kit never tries to touch
// the `neon_auth` schema (see `schemaFilter: ['public']` in drizzle.config.ts).
// Authorization is enforced in application code by always scoping queries to
// the signed-in user's id.
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  transcript: text('transcript').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  thumbnailKey: text('thumbnail_key'),
  thumbnailPrompt: text('thumbnail_prompt'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
