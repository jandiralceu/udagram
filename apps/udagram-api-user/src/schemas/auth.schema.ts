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

export type LoginDTO = z.infer<typeof LoginSchema>
export type SignupDTO = z.infer<typeof SignupSchema>
