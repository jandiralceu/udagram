import { z } from 'zod'
import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import * as feedController from '../../controllers/feeds.controller.js'
import {
  GetFeedParamsSchema,
  FeedResponseSchema,
} from '../../schemas/feeds.schema.js'

/**
 * Feed REST Routes (v1)
 *
 * Handles all feed-related operations including listing, retrieval,
 * creation, and deletion of feed items.
 * All routes in this plugin are protected by JWT authentication.
 */
export default async function feedRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  // Apply authentication to all routes in this plugin
  fastify.addHook('onRequest', fastify.authenticate)

  app.get(
    '',
    {
      schema: {
        description: 'List all feeds',
        tags: ['Feeds'],
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(FeedResponseSchema),
        },
      },
    },
    feedController.getFeeds
  )

  app.get(
    '/:feedId',
    {
      schema: {
        description: 'Get a specific feed by ID',
        tags: ['Feeds'],
        security: [{ bearerAuth: [] }],
        params: GetFeedParamsSchema,
        response: {
          200: FeedResponseSchema,
          404: z.object({
            message: z.string(),
            code: z.string().optional(),
          }),
        },
      },
    },
    feedController.getFeedById
  )

  app.post(
    '',
    {
      schema: {
        description: 'Create a new feed',
        tags: ['Feeds'],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        body: z
          .any()
          .describe('Multipart data: caption (string), file (binary)'),
        response: {
          201: FeedResponseSchema,
          400: z.object({
            message: z.string(),
            code: z.string().optional(),
          }),
        },
      },
    },
    feedController.createFeed
  )

  app.delete(
    '/:feedId',
    {
      schema: {
        description: 'Delete a feed by ID',
        tags: ['Feeds'],
        params: GetFeedParamsSchema,
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    feedController.deleteFeed
  )
}
