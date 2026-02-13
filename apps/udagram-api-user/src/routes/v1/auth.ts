import { z } from 'zod'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  LoginSchema,
  RefreshTokenSchema,
  SignupSchema,
  SignupResponseSchema,
  TokenResponseSchema,
} from '../../schemas/auth.schema.js'
import * as authController from '../../controllers/rest/auth.controller.js'

export default async function authRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/signup',
    {
      schema: {
        description: 'Create a new user account',
        tags: ['Auth'],
        body: SignupSchema,
        response: {
          201: SignupResponseSchema,
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    authController.signup
  )

  app.post(
    '/signin',
    {
      schema: {
        description: 'Authenticate user and return tokens',
        tags: ['Auth'],
        body: LoginSchema,
        response: {
          200: TokenResponseSchema,
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    authController.signin
  )

  app.post(
    '/refresh',
    {
      schema: {
        description: 'Refresh access token using refresh token',
        tags: ['Auth'],
        body: RefreshTokenSchema,
        response: {
          200: TokenResponseSchema,
        },
      },
    },
    authController.refresh
  )
}
