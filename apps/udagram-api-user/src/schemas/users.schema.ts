import { z } from 'zod'

export const GetUserParamsSchema = z.object({
  userId: z.string().uuid(),
})

export const UpdateUserParamsSchema = z.object({
  userId: z.string().uuid(),
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

export type GetUserParams = z.infer<typeof GetUserParamsSchema>
export type UpdateUserParams = z.infer<typeof UpdateUserParamsSchema>
export type UpdateUserBody = z.infer<typeof UpdateUserBodySchema>
