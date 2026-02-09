import { desc, eq } from 'drizzle-orm'

import { db } from '../db/index.js'
import { feedsTable } from '../db/schema.js'
import type { CreateFeedBody } from '../schemas/feeds.schema.js'

import { userClient } from '../clients/user.client.js'

export const findAll = async () => {
  return await db.query.feedsTable.findMany({
    orderBy: [desc(feedsTable.created_at)],
  })
}

export const findById = async (id: string) => {
  return await db.query.feedsTable.findFirst({
    where: eq(feedsTable.id, id),
  })
}

export const create = async (userId: string, data: CreateFeedBody) => {
  // Fetch user details via gRPC
  const user = await userClient.getUserById({ id: userId })

  if (!user) {
    throw new Error('User not found')
  }

  const [newFeed] = await db
    .insert(feedsTable)
    .values({
      caption: data.caption,
      image_url: data.imageUrl,
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatarUrl ?? null,
    })
    .returning()

  return newFeed
}

export const deleteFeed = async (id: string) => {
  await db.delete(feedsTable).where(eq(feedsTable.id, id))
  return { message: 'Feed deleted successfully' }
}
