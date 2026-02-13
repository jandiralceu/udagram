import { eq } from 'drizzle-orm'

import { UploaderError } from '@udagram/aws-uploader'

import { db } from '../db/index.js'
import { s3Service } from '../lib/s3.js'
import { usersTable } from '../db/schema.js'
import { hashPassword } from './password.service.js'
import type { UpdateUserBody } from '../schemas/users.schema.js'
import { publishUserEvent } from '../lib/sns.js'

/**
 * Retrieves a user by their unique identifier.
 *
 * @param userId - The UUID of the user to retrieve.
 * @returns A Promise resolving to the user object if found, or undefined.
 */
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

/**
 * Retrieves a user by their email address.
 *
 * @param email - The email address to search for.
 * @returns A Promise resolving to the user object if found, or undefined.
 */
export const getUserByEmail = async (email: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  })
  return user
}

// Defining a type for creation based on table schema but forcing required fields
type CreateUserDTO = typeof usersTable.$inferInsert

/**
 * Creates a new user in the database.
 *
 * This function handles password hashing before storage and verifies
 * that the email is not already in use.
 *
 * @param userData - The user data for creation (email, password, name, etc.).
 * @returns A Promise resolving to the newly created user object.
 * @throws Error if a user with the given email already exists.
 */
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

/**
 * Updates an existing user's profile information.
 *
 * If a password is provided, it will be hashed before storage.
 * If the update is successful, a 'UserUpdated' event is published to SNS.
 *
 * @param userId - The UUID of the user to update.
 * @param data - The partial user data to update (name, password).
 * @returns A Promise resolving to the updated user object, or undefined if not found.
 */
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

/**
 * Updates the user's avatar image.
 *
 * This process involves:
 * 1. Uploading the new image to S3.
 * 2. Updating the user record in the database with the new URL.
 * 3. Deleting the old avatar from S3 (if one existed).
 * 4. Publishing a 'UserUpdated' event to SNS.
 *
 * @param userId - The UUID of the user.
 * @param bucket - The S3 bucket name for storage.
 * @param file - The file object containing buffer, filename, and mimetype.
 * @returns A Promise resolving to the updated user object.
 */
export const updateAvatar = async (
  userId: string,
  bucket: string,
  file: { data: Buffer; filename: string; mimetype: string }
) => {
  // Save reference to the old avatar before doing anything
  const currentUser = await getUserById(userId)
  const oldAvatar = currentUser?.avatar

  // 1. Upload the new avatar first
  const { url } = await s3Service.upload(bucket, {
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
  // 3. Only after everything succeeded, delete the old avatar
  if (updatedUser) {
    if (oldAvatar) {
      try {
        await s3Service.deleteFile(bucket, oldAvatar)
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

    await publishUserEvent('UserUpdated', updatedUser)
  }

  return updatedUser
}

/**
 * Deletes a user from the database.
 *
 * @param userId - The UUID of the user to delete.
 * @returns A Promise resolving to a success message object.
 */
export const deleteUser = async (userId: string) => {
  await db.delete(usersTable).where(eq(usersTable.id, userId))
  return { message: 'User deleted successfully' }
}
