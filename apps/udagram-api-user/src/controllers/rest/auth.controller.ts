import type { FastifyReply, FastifyRequest } from 'fastify'

import * as usersService from '../../services/users.service.js'
import { verifyPassword } from '../../services/password.service.js'
import * as dynamoService from '../../services/dynamo.service.js'
import type {
  LoginDTO,
  RefreshTokenDTO,
  SignupDTO,
} from '../../schemas/auth.schema.js'

export const signin = async (
  request: FastifyRequest<{ Body: LoginDTO }>,
  reply: FastifyReply
) => {
  const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || 'RefreshTokens'

  const { email, password } = request.body

  const user = await usersService.getUserByEmail(email)

  if (!user) {
    return reply.status(401).send({ message: 'Invalid credentials' })
  }

  const isPasswordValid = await verifyPassword(password, user.password)

  if (!isPasswordValid) {
    return reply.status(401).send({ message: 'Invalid credentials' })
  }

  const accessToken = await reply.jwtSign(
    { sub: user.id },
    { sign: { expiresIn: '15m' } }
  )

  const refreshToken = await reply.jwtSign(
    { sub: user.id },
    { sign: { expiresIn: '7d' } }
  )

  await dynamoService.putItem(request.server.dynamo.doc, TABLE_NAME, {
    refreshToken,
    userId: user.id,
    expiresAt: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })

  return reply.send({
    accessToken,
    refreshToken,
  })
}

export const signup = async (
  request: FastifyRequest<{ Body: SignupDTO }>,
  reply: FastifyReply
) => {
  // We can destructure confirming we only pass relevant data to service
  // But usersService.create expects CreateUserDTO (which is $inferInsert)
  // We need to map DTO -> Service Input

  try {
    const newUser = await usersService.create(request.body)

    if (!newUser) {
      throw new Error('Failed to create user')
    }

    return reply.status(201).send(newUser)
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      return reply.status(409).send({ message: 'User already exists' })
    }
    throw error
  }
}

export const refresh = async (
  request: FastifyRequest<{ Body: RefreshTokenDTO }>,
  reply: FastifyReply
) => {
  const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || 'RefreshTokens'

  const { refreshToken } = request.body

  let payload: { sub: string }

  try {
    payload = request.server.jwt.verify<{ sub: string }>(refreshToken)
  } catch (error) {
    request.log.error(error)
    return reply.status(401).send({ message: 'Invalid refresh token' })
  }

  const userId = payload.sub

  const storedToken = await dynamoService.getItem(
    request.server.dynamo.doc,
    TABLE_NAME,
    { refreshToken }
  )

  if (!storedToken) {
    return reply.status(401).send({ message: 'Invalid refresh token' })
  }

  await dynamoService.deleteItem(request.server.dynamo.doc, TABLE_NAME, {
    refreshToken,
  })

  const newAccessToken = await reply.jwtSign(
    { sub: userId },
    { sign: { expiresIn: '15m' } }
  )

  const newRefreshToken = await reply.jwtSign(
    { sub: userId },
    { sign: { expiresIn: '7d' } }
  )

  await dynamoService.putItem(request.server.dynamo.doc, TABLE_NAME, {
    refreshToken: newRefreshToken,
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })

  return reply.send({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  })
}
