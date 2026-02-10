import type { FastifyReply, FastifyRequest } from 'fastify'

import * as feedService from '../services/feeds.service.js'
import type { GetFeedParams } from '../schemas/feeds.schema.js'
import { CreateFeedMultipartSchema } from '../schemas/feeds.schema.js'

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

type FilePayload = {
  filename: string
  mimetype: string
  data: Buffer
  size: number
}

const processMultipartRequest = async (request: FastifyRequest) => {
  const parts = request.parts()
  let filePayload: FilePayload | undefined
  let caption: string | undefined

  for await (const part of parts) {
    if (part.type === 'file') {
      if (part.fieldname === 'file') {
        const buffer = await part.toBuffer()
        filePayload = {
          filename: part.filename,
          mimetype: part.mimetype,
          data: buffer,
          size: buffer.byteLength,
        }
      } else {
        // IMPORTANT: Must consume stream to proceed to next part
        part.file.resume()
        request.log.warn({
          msg: 'Ignored file part',
          fieldname: part.fieldname,
        })
      }
    } else if (part.type === 'field') {
      if (part.fieldname === 'caption') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        caption = (part as any).value
      } else {
        request.log.warn({
          msg: 'Ignored field part',
          fieldname: part.fieldname,
        })
      }
    }
  }

  return { filePayload, caption }
}

export const createFeed = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user as { sub: string }

    const { filePayload, caption } = await processMultipartRequest(request)

    if (!filePayload) {
      return reply.status(400).send({ message: 'File is required' })
    }

    if (!caption) {
      return reply.status(400).send({ message: 'Caption is required' })
    }

    const payload = {
      caption,
      file: filePayload,
    }

    // Validate payload
    const result = CreateFeedMultipartSchema.safeParse(payload)

    if (!result.success) {
      return reply.status(400).send({
        message: 'Invalid input',
        errors: result.error.issues,
      })
    }

    const { config } = request.server
    const newFeed = await feedService.create(user.sub, config.AWS_BUCKET, {
      caption: result.data.caption,
      file: result.data.file,
    })

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
  const { config } = request.server
  await feedService.deleteFeed(feedId, config.AWS_BUCKET)
  return reply.send({ message: 'Feed deleted successfully' })
}
