import { eq } from 'drizzle-orm'

import { upload, deleteFile, UploaderError } from '@udagram/aws-uploader'

import { db } from '../db/index.js'
import { usersTable } from '../db/schema.js'
import { hashPassword } from './password.service.js'
import type { UpdateUserBody } from '../schemas/users.schema.js'
import { publishUserEvent } from '../lib/sns.js'

export const getUserById = async (userId: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      created_at: true,
      updated_at: true,
    },
  })
  return user
}

export const getUserByEmail = async (email: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  })
  return user
}

// Defining a type for creation based on table schema but forcing required fields
type CreateUserDTO = typeof usersTable.$inferInsert

export const create = async (userData: CreateUserDTO) => {
  const existingUser = await getUserByEmail(userData.email)
  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = await hashPassword(userData.password)

  const [newUser] = await db
    .insert(usersTable)
    .values({
      ...userData,
      password: hashedPassword,
    })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      avatar: usersTable.avatar,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at,
    })

  return newUser
}

export const updateUser = async (userId: string, data: UpdateUserBody) => {
  const { name, password } = data
  const updatePayload: Partial<typeof usersTable.$inferInsert> = {
    updated_at: new Date(),
  }

  if (name) {
    updatePayload.name = name
  }

  if (password) {
    updatePayload.password = await hashPassword(password)
  }

  const [updatedUser] = await db
    .update(usersTable)
    .set(updatePayload)
    .where(eq(usersTable.id, userId))
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      avatar: usersTable.avatar,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at,
    })

  if (updatedUser) {
    // Only publish if something was actually updated
    await publishUserEvent('UserUpdated', updatedUser)
  }

  return updatedUser
}

export const updateAvatar = async (
  userId: string,
  bucket: string,
  file: { data: Buffer; filename: string; mimetype: string }
) => {
  // Save reference to the old avatar before doing anything
  const currentUser = await getUserById(userId)
  const oldAvatar = currentUser?.avatar

  // 1. Upload the new avatar first
  const { url } = await upload(bucket, {
    file: file.data,
    fileName: file.filename,
    mimeType: file.mimetype,
    folder: 'avatars',
  })

  // 2. Update the user's avatar in the database
  const [updatedUser] = await db
    .update(usersTable)
    .set({ avatar: url, updated_at: new Date() })
    .where(eq(usersTable.id, userId))
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      avatar: usersTable.avatar,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at,
    })

  // 3. Only after everything succeeded, delete the old avatar
  if (oldAvatar) {
    try {
      await deleteFile(bucket, oldAvatar)
    } catch (error) {
      // Old file cleanup failure is not critical — the new avatar is already saved
      // But we should log it for visibility
      if (error instanceof UploaderError) {
        console.warn(
          `[Avatar Cleanup] Failed to delete old avatar: ${error.message}`
        )
      } else {
        console.warn(
          '[Avatar Cleanup] Unknown error deleting old avatar',
          error
        )
      }
    }
  }

  if (updatedUser) {
    await publishUserEvent('UserUpdated', updatedUser)
  }

  return updatedUser
}

export const deleteUser = async (userId: string) => {
  await db.delete(usersTable).where(eq(usersTable.id, userId))
  return { message: 'User deleted successfully' }
}
