import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import * as usersController from '../../controllers/rest/users.controller.js'
import {
  UpdateUserBodySchema,
  UpdateUserParamsSchema,
} from '../../schemas/users.schema.js'

export default async function usersRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  fastify.addHook('onRequest', fastify.authenticate)

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
    '',
    {
      schema: {
        body: UpdateUserBodySchema,
      },
    },
    usersController.update
  )

  app.delete('', usersController.remove)
}
