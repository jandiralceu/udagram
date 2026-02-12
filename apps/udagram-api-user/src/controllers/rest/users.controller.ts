import type { FastifyReply, FastifyRequest } from 'fastify'
import * as usersService from '../../services/users.service.js'
import type { UpdateUserBody } from '../../schemas/users.schema.js'
import { UpdateUserAvatarBodySchema } from '../../schemas/users.schema.js'

export const getProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as { sub: string }).sub
  const profile = await usersService.getUserById(userId)

  if (!profile) {
    return reply.status(404).send({ message: 'User not found' })
  }

  return reply.send(profile)
}

export const getById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.params as { userId: string }
  const user = await usersService.getUserById(userId)

  if (!user) {
    return reply.status(404).send({ message: 'User not found' })
  }

  return reply.send(user)
}

export const update = async (
  request: FastifyRequest<{ Body: UpdateUserBody }>,
  reply: FastifyReply
) => {
  const userId = (request.user as { sub: string }).sub
  const data = request.body
  const result = await usersService.updateUser(userId, data)
  return reply.send(result)
}

export const updateAvatar = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (request.user as { sub: string }).sub

  const data = await request.file()

  if (!data) {
    return reply.status(400).send({ message: 'No file uploaded' })
  }

  const buffer = await data.toBuffer()

  const filePayload = {
    filename: data.filename,
    mimetype: data.mimetype,
    data: buffer,
    size: buffer.byteLength,
  }

  // Validate file with Zod schema
  const validation = UpdateUserAvatarBodySchema.safeParse({ file: filePayload })

  if (!validation.success) {
    return reply.status(400).send({
      message: 'Invalid file',
      errors: validation.error.issues,
    })
  }

  const { config } = request.server
  const result = await usersService.updateAvatar(
    userId,
    config.AWS_BUCKET,
    filePayload
  )

  return reply.send(result)
}

export const remove = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as { sub: string }).sub
  const result = await usersService.deleteUser(userId)
  return reply.send(result)
}
