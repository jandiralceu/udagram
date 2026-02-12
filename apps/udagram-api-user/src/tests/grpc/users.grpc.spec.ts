import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FastifyInstance } from 'fastify'
import { faker } from '@faker-js/faker'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

import { buildServer } from '../../server.js'
import * as userService from '../../services/users.service.js'

// Mock external dependencies
vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}))

vi.mock('../../services/users.service.js', () => ({
  getUserById: vi.fn(),
}))

describe('Users GRPC Service', () => {
  let app: FastifyInstance
  const internalToken = faker.string.uuid()

  beforeAll(async () => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    // Configure server to use test keys
    vi.stubEnv(
      'JWT_PUBLIC_KEY_FILE',
      path.join(__dirname, '../public_test.pem')
    )
    vi.stubEnv(
      'JWT_PRIVATE_KEY_FILE',
      path.join(__dirname, '../private_test.pem')
    )
    vi.stubEnv('JWT_SECRET_NAME', '')
    vi.stubEnv('GRPC_INTERNAL_TOKEN', internalToken)
    vi.stubEnv(
      'DB_CONNECTION_STRING',
      'postgresql://user:pass@localhost:5432/db'
    )
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'test-key-id')
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'test-secret-key')
    vi.stubEnv('AWS_BUCKET', 'test-bucket')
    vi.stubEnv(
      'AWS_SNS_TOPIC_ARN',
      'arn:aws:sns:us-east-1:000000000000:test-topic'
    )

    app = await buildServer()
    await app.ready()
  })

  afterAll(async () => {
    if (app) await app.close()
    vi.unstubAllEnvs()
  })

  describe('getUserById', () => {
    it('should return 401 without internal token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/user.UserService/GetUserById',
        headers: {
          'content-type': 'application/json',
        },
        payload: { id: faker.string.uuid() },
      })

      // Connect RPC usually returns 401 Unauthenticated for authentication errors
      expect(response.statusCode).toBe(401)
    })

    it('should return user when found', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'hashed-password',
        avatar: faker.image.avatar(),
        created_at: new Date(),
        updated_at: new Date(),
      }

      vi.mocked(userService.getUserById).mockResolvedValue(mockUser)

      const response = await app.inject({
        method: 'POST',
        url: '/user.UserService/GetUserById',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': internalToken,
        },
        payload: { id: mockUser.id },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.id).toBe(mockUser.id)
      expect(body.name).toBe(mockUser.name)
      expect(body.avatarUrl).toBe(mockUser.avatar)
    })

    it('should return 404 when user not found', async () => {
      vi.mocked(userService.getUserById).mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/user.UserService/GetUserById',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': internalToken,
        },
        payload: { id: faker.string.uuid() },
      })

      // Connect RPC maps Code.NotFound to 404
      expect(response.statusCode).toBe(404)
    })
    it('should return 401 with invalid internal token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/user.UserService/GetUserById',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': 'wrong-token',
        },
        payload: { id: faker.string.uuid() },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 401 if server token is not configured', async () => {
      // We need to restart server with different env
      // But we can just verify the logic by stubbing env and calling a new request?
      // No, `validateInternalToken` reads process.env INSIDE that function every time?
      // Let's check users.grpc.ts content.
      // `const GRPC_INTERNAL_TOKEN = process.env.GRPC_INTERNAL_TOKEN`
      // YES, it reads inside the function `validateInternalToken`.

      vi.stubEnv('GRPC_INTERNAL_TOKEN', '')

      const response = await app.inject({
        method: 'POST',
        url: '/user.UserService/GetUserById',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': internalToken,
        },
        payload: { id: faker.string.uuid() },
      })

      expect(response.statusCode).toBe(401)

      // Restore env
      vi.stubEnv('GRPC_INTERNAL_TOKEN', internalToken)
    })

    it('should return user without avatarUrl if no avatar', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'hashed-password',
        avatar: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      vi.mocked(userService.getUserById).mockResolvedValue(mockUser as any)

      const response = await app.inject({
        method: 'POST',
        url: '/user.UserService/GetUserById',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': internalToken,
        },
        payload: { id: mockUser.id },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.id).toBe(mockUser.id)
      expect(body.name).toBe(mockUser.name)
      expect(body).not.toHaveProperty('avatarUrl')
    })
  })
})
