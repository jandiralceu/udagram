import type { FastifyReply, FastifyRequest } from 'fastify'
import * as usersService from '../../services/users.service.js'
import type { UpdateUserBody } from '../../schemas/users.schema.js'

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

export const remove = async (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request.user as { sub: string }).sub
  const result = await usersService.deleteUser(userId)
  return reply.send(result)
}
