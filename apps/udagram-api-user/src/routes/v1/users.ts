import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import * as usersController from '../../controllers/rest/users.controller.js'
import {
  UpdateUserBodySchema,
  UpdateUserParamsSchema,
} from '../../schemas/users.schema.js'

/**
 * User REST Routes (v1)
 *
 * Handles all user-related profile operations including retrieval,
 * updates, avatar management, and account deletion.
 * All routes in this plugin are protected by JWT authentication.
 */
export default async function usersRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Apply authentication to all routes in this plugin
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

  app.post('/avatar', usersController.updateAvatar)

  app.delete('', usersController.remove)
}
