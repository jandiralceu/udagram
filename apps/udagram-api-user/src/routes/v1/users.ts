import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import * as usersController from '../../controllers/users.controller.js'
import {
  UpdateUserBodySchema,
  UpdateUserParamsSchema,
} from '../../schemas/users.schema.js'

export default async function usersRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  app.get('/me', usersController.getProfile)

  app.get(
    '/:userId',
    {
      schema: {
        params: UpdateUserParamsSchema,
      },
    },
    usersController.getById
  )

  app.patch(
    '/:userId',
    {
      schema: {
        params: UpdateUserParamsSchema,
        body: UpdateUserBodySchema,
      },
    },
    usersController.update
  )

  app.delete('', usersController.remove)
}
