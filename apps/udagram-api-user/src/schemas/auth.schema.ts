import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const SignupSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(8),
    name: z.string().min(2, 'Name is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const SignupResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  avatar: z.string().nullable(),
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
})

export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export type LoginDTO = z.infer<typeof LoginSchema>
export type SignupDTO = z.infer<typeof SignupSchema>
export type SignupResponse = z.infer<typeof SignupResponseSchema>
export type TokenResponse = z.infer<typeof TokenResponseSchema>

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
})

export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>
