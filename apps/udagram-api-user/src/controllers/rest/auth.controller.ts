import type { FastifyReply, FastifyRequest } from 'fastify'

import { ErrorCodes } from '../../lib/errors.js'
import * as usersService from '../../services/users.service.js'
import { verifyPassword } from '../../services/password.service.js'
import * as dynamoService from '@udagram/fastify-dynamo-plugin'
import type {
  LoginDTO,
  RefreshTokenDTO,
  SignupDTO,
} from '../../schemas/auth.schema.js'

const DYNAMO_REFRESH_TABLE = 'RefreshTokens'
const ACCESS_TOKEN_EXPIRY = 15 * 60 // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds

export const signin = async (
  request: FastifyRequest<{ Body: LoginDTO }>,
  reply: FastifyReply
) => {
  const { email, password } = request.body

  const user = await usersService.getUserByEmail(email)

  if (!user) {
    return reply.status(401).send({
      message: 'Invalid credentials',
      code: ErrorCodes.INVALID_CREDENTIALS,
    })
  }

  const isPasswordValid = await verifyPassword(password, user.password)

  if (!isPasswordValid) {
    return reply.status(401).send({
      message: 'Invalid credentials',
      code: ErrorCodes.INVALID_CREDENTIALS,
    })
  }

  const accessToken = await reply.jwtSign(
    { sub: user.id },
    { sign: { expiresIn: ACCESS_TOKEN_EXPIRY } }
  )

  const refreshToken = await reply.jwtSign(
    { sub: user.id },
    { sign: { expiresIn: REFRESH_TOKEN_EXPIRY } }
  )

  await dynamoService.putItem(request.server.dynamo.doc, DYNAMO_REFRESH_TABLE, {
    refreshToken,
    userId: user.id,
    expiresAt: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY,
  })

  return reply.send({
    accessToken,
    refreshToken,
    accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: REFRESH_TOKEN_EXPIRY,
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
      return reply.status(409).send({
        message: 'User already exists',
        code: ErrorCodes.USER_ALREADY_EXISTS,
      })
    }
    throw error
  }
}

export const refresh = async (
  request: FastifyRequest<{ Body: RefreshTokenDTO }>,
  reply: FastifyReply
) => {
  const { refreshToken } = request.body

  let payload: { sub: string }

  try {
    payload = request.server.jwt.verify<{ sub: string }>(refreshToken)
  } catch (error) {
    request.log.error(error)
    return reply.status(401).send({
      message: 'Invalid refresh token',
      code: ErrorCodes.INVALID_REFRESH_TOKEN,
    })
  }

  const userId = payload.sub

  const storedToken = await dynamoService.getItem(
    request.server.dynamo.doc,
    DYNAMO_REFRESH_TABLE,
    { refreshToken }
  )

  if (!storedToken) {
    return reply.status(401).send({
      message: 'Invalid refresh token',
      code: ErrorCodes.INVALID_REFRESH_TOKEN,
    })
  }

  await dynamoService.deleteItem(
    request.server.dynamo.doc,
    DYNAMO_REFRESH_TABLE,
    {
      refreshToken,
    }
  )

  const newAccessToken = await reply.jwtSign(
    { sub: userId },
    { sign: { expiresIn: ACCESS_TOKEN_EXPIRY } }
  )

  const newRefreshToken = await reply.jwtSign(
    { sub: userId },
    { sign: { expiresIn: REFRESH_TOKEN_EXPIRY } }
  )

  await dynamoService.putItem(request.server.dynamo.doc, DYNAMO_REFRESH_TABLE, {
    refreshToken: newRefreshToken,
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY,
  })

  return reply.send({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: REFRESH_TOKEN_EXPIRY,
  })
}

export const signout = async (
  request: FastifyRequest<{ Body: RefreshTokenDTO }>,
  reply: FastifyReply
) => {
  const { refreshToken } = request.body

  await dynamoService.deleteItem(
    request.server.dynamo.doc,
    DYNAMO_REFRESH_TABLE,
    {
      refreshToken,
    }
  )

  return reply.status(204).send()
}
