import { z } from 'zod'

export const GetUserParamsSchema = z.object({
  userId: z.uuid(),
})

export const UpdateUserParamsSchema = z.object({
  userId: z.uuid(),
})

export const UpdateUserBodySchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .optional(),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .optional(),
    confirmPassword: z
      .string()
      .min(8, {
        message: 'Confirm password must be at least 8 characters long',
      })
      .optional(),
  })
  .refine(data => !!data.name || !!data.password, {
    message:
      'At least one field (name or password) must be provided for update',
  })
  .refine(
    data => {
      if (data.password) {
        return data.password === data.confirmPassword
      }
      return true
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  )

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const UpdateUserAvatarBodySchema = z.object({
  file: z.object({
    filename: z.string(),
    mimetype: z
      .string()
      .refine(
        (val): val is (typeof ALLOWED_MIME_TYPES)[number] =>
          ALLOWED_MIME_TYPES.includes(
            val as (typeof ALLOWED_MIME_TYPES)[number]
          ),
        {
          message: `Only ${ALLOWED_MIME_TYPES.join(', ')} files are allowed`,
        }
      ),
    data: z.instanceof(Buffer),
    size: z
      .number()
      .max(MAX_FILE_SIZE, { message: 'File size must be at most 5MB' }),
  }),
})

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
})

export type GetUserParams = z.infer<typeof GetUserParamsSchema>
export type UpdateUserParams = z.infer<typeof UpdateUserParamsSchema>
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>
export type UpdateUserAvatarBody = z.infer<typeof UpdateUserAvatarBodySchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
