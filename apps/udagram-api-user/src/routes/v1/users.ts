import { z } from 'zod'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import * as usersController from '../../controllers/rest/users.controller.js'
import {
  UpdateUserBodySchema,
  UpdateUserParamsSchema,
  UserResponseSchema,
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

  app.get(
    '/me',
    {
      schema: {
        description: 'Get current user profile',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        response: {
          200: UserResponseSchema,
        },
      },
    },
    usersController.getProfile
  )

  app.get(
    '/:userId',
    {
      schema: {
        description: 'Get user profile by ID',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        params: UpdateUserParamsSchema,
        response: {
          200: UserResponseSchema,
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    usersController.getById
  )

  app.patch(
    '',
    {
      schema: {
        description: 'Update user profile',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        body: UpdateUserBodySchema,
        response: {
          200: UserResponseSchema,
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    usersController.update
  )

  app.post(
    '/avatar',
    {
      schema: {
        description: 'Update user avatar',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        body: z.object({
          file: z.any().describe('Binary file data'),
        }),
        response: {
          200: UserResponseSchema,
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    usersController.updateAvatar
  )

  app.delete(
    '',
    {
      schema: {
        description: 'Delete user account',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    usersController.remove
  )
}
