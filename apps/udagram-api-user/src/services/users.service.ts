import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { usersTable } from '../db/schema.js'
import { hashPassword } from './password.service.js'
import type { UpdateUserBody } from '../schemas/users.schema.js'

export const getUserById = async (userId: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
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
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at,
    })

  return updatedUser
}

export const deleteUser = async (userId: string) => {
  await db.delete(usersTable).where(eq(usersTable.id, userId))
  return { message: 'User deleted successfully' }
}
