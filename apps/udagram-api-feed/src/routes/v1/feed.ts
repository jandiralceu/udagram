import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import * as feedController from '../../controllers/feeds.controller.js'
import {
  CreateFeedBodySchema,
  GetFeedParamsSchema,
} from '../../schemas/feeds.schema.js'

export default async function feedRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const app = fastify.withTypeProvider<ZodTypeProvider>()

  fastify.addHook('onRequest', fastify.authenticate)

  app.get('', feedController.getFeeds)

  app.get(
    '/:feedId',
    {
      schema: {
        params: GetFeedParamsSchema,
      },
    },
    feedController.getFeedById
  )

  app.post(
    '',
    {
      schema: {
        body: CreateFeedBodySchema,
      },
    },
    feedController.createFeed
  )

  app.delete(
    '/:feedId',
    {
      schema: {
        params: GetFeedParamsSchema,
      },
    },
    feedController.deleteFeed
  )
}
