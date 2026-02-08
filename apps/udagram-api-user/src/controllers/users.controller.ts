import type { FastifyReply, FastifyRequest } from 'fastify'
import * as usersService from '../services/users.service.js'
import type {
  UpdateUserBody,
  UpdateUserParams,
} from '../schemas/users.schema.js'

export const getProfile = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  // TODO: Get userId from JWT token
  const userId = 'user-id-from-token'
  const profile = await usersService.getUserById(userId)
  return reply.send(profile)
}

export const getById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.params as { userId: string }
  const user = await usersService.getUserById(userId)
  return reply.send(user)
}

export const update = async (
  request: FastifyRequest<{ Params: UpdateUserParams; Body: UpdateUserBody }>,
  reply: FastifyReply
) => {
  const { userId } = request.params
  const data = request.body
  const result = await usersService.updateUser(userId, data)
  return reply.send(result)
}

export const remove = async (request: FastifyRequest, reply: FastifyReply) => {
  // TODO: Get userId from JWT token
  const userId = 'user-id-placeholder'
  const result = await usersService.deleteUser(userId)
  return reply.send(result)
}
