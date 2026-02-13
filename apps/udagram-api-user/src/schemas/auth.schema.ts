import { z } from 'zod'

/**
 * Schema for validating user login credentials.
 */
export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

/**
 * Schema for validating user registration data.
 * Requires email, password (min 8 chars), and name.
 * Validates that password matches confirmPassword.
 */
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

/**
 * Schema for the response after successful signup.
 */
export const SignupResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  avatar: z.string().nullable(),
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
})

/**
 * Schema for the response containing authentication tokens.
 */
export const TokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export type LoginDTO = z.infer<typeof LoginSchema>
export type SignupDTO = z.infer<typeof SignupSchema>
export type SignupResponse = z.infer<typeof SignupResponseSchema>
export type TokenResponse = z.infer<typeof TokenResponseSchema>

/**
 * Schema for validating token refresh requests.
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
})

export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>
