import type { FastifyReply, FastifyRequest } from 'fastify'

import * as usersService from '../services/users.service.js'
import { verifyPassword } from '../services/password.service.js'
import type { LoginDTO, SignupDTO } from '../schemas/auth.schema.js'

export const signin = async (
  request: FastifyRequest<{ Body: LoginDTO }>,
  reply: FastifyReply
) => {
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

    const { password: _password, ...userWithoutPassword } = newUser
    return reply.status(201).send(userWithoutPassword)
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      return reply.status(409).send({ message: 'User already exists' })
    }
    throw error
  }
}
