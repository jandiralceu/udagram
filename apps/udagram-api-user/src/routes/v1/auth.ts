import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { LoginSchema, SignupSchema } from '../../schemas/auth.schema.js'
import * as authController from '../../controllers/auth.controller.js'

export default async function authRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.post(
    '/signup',
    {
      schema: {
        body: SignupSchema,
      },
    },
    authController.signup
  )

  app.post(
    '/signin',
    {
      schema: {
        body: LoginSchema,
      },
    },
    authController.signin
  )
}
