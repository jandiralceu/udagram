import { desc, eq } from 'drizzle-orm'

import { db } from '../db/index.js'
import { feedsTable } from '../db/schema.js'

import { s3Service } from '../clients/s3.js'

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

export const create = async (
  userId: string,
  bucket: string,
  data: {
    caption: string
    file: { data: Buffer; filename: string; mimetype: string }
  }
) => {
  // 1. Fetch user to ensure valid user before uploading
  const user = await userClient.getUserById({ id: userId })

  if (!user) {
    throw new Error('User not found')
  }

  // 2. Upload image to S3 first
  const { url, key } = await s3Service.upload(bucket, {
    file: data.file.data,
    fileName: data.file.filename,
    mimeType: data.file.mimetype,
    folder: 'feeds',
  })

  try {
    // 3. Create feed record in DB
    const [newFeed] = await db
      .insert(feedsTable)
      .values({
        caption: data.caption,
        image_url: url,
        user_id: user.id,
        user_name: user.name,
        user_avatar: user.avatarUrl ?? null,
      })
      .returning()

    return newFeed
  } catch (error) {
    // 4. Rollback: specific cleanup if DB fails, to avoid orphaned files in S3
    await s3Service
      .deleteFile(bucket, key)
      .catch(_error => console.warn('Failed to cleanup orphaned file:', _error))
    throw error // Re-throw original error
  }
}

export const deleteFeed = async (id: string, bucket: string) => {
  // 1. Get feed to find image URL
  const feed = await findById(id)

  if (!feed) {
    throw new Error('Feed not found')
  }

  // 2. Delete from DB
  await db.delete(feedsTable).where(eq(feedsTable.id, id))

  // 3. Delete from S3 (cleanup)
  if (feed.image_url) {
    try {
      await s3Service.deleteFile(bucket, feed.image_url)
    } catch (error) {
      console.warn(`Failed to delete S3 file for feed ${id}:`, error)
    }
  }

  return { message: 'Feed deleted successfully' }
}

export const updateUserInfo = async (
  userId: string,
  data: { name: string; avatar: string | null }
) => {
  await db
    .update(feedsTable)
    .set({
      user_name: data.name,
      user_avatar: data.avatar,
      updated_at: new Date(),
    })
    .where(eq(feedsTable.user_id, userId))
}
