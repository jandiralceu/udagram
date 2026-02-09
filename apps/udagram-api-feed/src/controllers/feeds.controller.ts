import type { FastifyReply, FastifyRequest } from 'fastify'

import * as feedService from '../services/feeds.service.js'
import type { CreateFeedBody, GetFeedParams } from '../schemas/feeds.schema.js'

export const getFeeds = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const feeds = await feedService.findAll()
  return reply.send(feeds)
}

export const getFeedById = async (
  request: FastifyRequest<{ Params: GetFeedParams }>,
  reply: FastifyReply
) => {
  const { feedId } = request.params
  const feed = await feedService.findById(feedId)

  if (!feed) {
    return reply.status(404).send({ message: 'Feed not found' })
  }

  return reply.send(feed)
}

export const createFeed = async (
  request: FastifyRequest<{ Body: CreateFeedBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user as { sub: string }
    const newFeed = await feedService.create(user.sub, request.body)
    return reply.status(201).send(newFeed)
  } catch (error) {
    request.log.error(error)
    return reply.status(500).send({ message: 'Internal Server Error' })
  }
}

export const deleteFeed = async (
  request: FastifyRequest<{ Params: GetFeedParams }>,
  reply: FastifyReply
) => {
  const { feedId } = request.params
  await feedService.deleteFeed(feedId)
  return reply.send({ message: 'Feed deleted successfully' })
}
