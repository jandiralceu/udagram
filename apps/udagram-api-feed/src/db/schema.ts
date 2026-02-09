import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core'

export const feedsTable = pgTable('feeds', {
  id: uuid('id').defaultRandom().primaryKey(),
  caption: text('caption').notNull(),
  image_url: text('image_url').notNull(),
  user_id: uuid('user_id').notNull(),
  user_name: text('user_name').notNull(),
  user_avatar: text('user_avatar'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})
