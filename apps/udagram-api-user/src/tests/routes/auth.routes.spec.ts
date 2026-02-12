import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildServer } from '../../server.js'
import { faker } from '@faker-js/faker'
import type { FastifyInstance } from 'fastify'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as usersService from '../../services/users.service.js'
import * as passwordService from '../../services/password.service.js'
import * as dynamoService from '@udagram/fastify-dynamo-plugin'

// Mock external dependencies
vi.mock('../../db/index.js', () => ({
  db: {},
}))

vi.mock('../../services/users.service.js', () => ({
  create: vi.fn(),
  getUserByEmail: vi.fn(),
}))

vi.mock('../../services/password.service.js', () => ({
  verifyPassword: vi.fn(),
}))

vi.mock('@udagram/fastify-dynamo-plugin', () => ({
  default: vi.fn(async (fastify: FastifyInstance) => {
    fastify.decorate('dynamo', { doc: 'mock-doc' })
  }),
  putItem: vi.fn(),
  getItem: vi.fn(),
  deleteItem: vi.fn(),
}))

describe('Auth Routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    // Configure server to use test public key
    vi.stubEnv(
      'JWT_PUBLIC_KEY_FILE',
      path.join(__dirname, '../public_test.pem')
    )
    vi.stubEnv(
      'JWT_PRIVATE_KEY_FILE',
      path.join(__dirname, '../private_test.pem')
    )

    app = await buildServer()
    app.decorate('dynamo', { doc: 'mock-doc' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    vi.unstubAllEnvs()
  })

  describe('POST /api/v1/auth/signup', () => {
    it('should create user and return it', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        avatar: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      vi.mocked(usersService.create).mockResolvedValue(mockUser as any)

      const payload = {
        email: mockUser.email,
        password: 'password123',
        confirmPassword: 'password123',
        name: mockUser.name,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload,
      })

      expect(response.statusCode).toBe(201)
      expect(JSON.parse(response.payload)).toEqual({
        ...JSON.parse(JSON.stringify(mockUser)),
      })
      expect(usersService.create).toHaveBeenCalled()
    })

    it('should return 409 if user exists', async () => {
      vi.mocked(usersService.create).mockRejectedValue(
        new Error('User already exists')
      )

      const payload = {
        email: faker.internet.email(),
        password: 'password123',
        confirmPassword: 'password123',
        name: faker.person.fullName(),
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload,
      })

      expect(response.statusCode).toBe(409)
    })

    it('should throw generic error if create fails', async () => {
      vi.mocked(usersService.create).mockRejectedValue(
        new Error('Database error')
      )

      const payload = {
        email: faker.internet.email(),
        password: 'password123',
        confirmPassword: 'password123',
        name: faker.person.fullName(),
      }

      // Fastify default error handler should return 500
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload,
      })

      expect(response.statusCode).toBe(500)
    })
  })

  describe('POST /api/v1/auth/signin', () => {
    it('should return tokens on valid credentials', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: 'hashed-password',
      }

      vi.mocked(usersService.getUserByEmail).mockResolvedValue(mockUser as any)
      vi.mocked(passwordService.verifyPassword).mockResolvedValue(true)

      const payload = {
        email: mockUser.email,
        password: 'password123',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signin',
        payload,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body).toHaveProperty('accessToken')
      expect(body).toHaveProperty('refreshToken')
      expect(dynamoService.putItem).toHaveBeenCalled()
    })

    it('should return 401 on invalid user', async () => {
      vi.mocked(usersService.getUserByEmail).mockResolvedValue(undefined)

      const payload = {
        email: faker.internet.email(),
        password: 'password123',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signin',
        payload,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 401 on invalid password', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: 'hashed-password',
      }

      vi.mocked(usersService.getUserByEmail).mockResolvedValue(mockUser as any)
      vi.mocked(passwordService.verifyPassword).mockResolvedValue(false)

      const payload = {
        email: mockUser.email,
        password: 'wrongpassword',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signin',
        payload,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token', async () => {
      const mockUserId = faker.string.uuid()
      // Create a valid token for validation
      const validToken = app.jwt.sign({ sub: mockUserId })

      vi.mocked(dynamoService.getItem).mockResolvedValue({
        refreshToken: validToken,
      })

      const payload = {
        refreshToken: validToken,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body).toHaveProperty('accessToken')
      expect(body).toHaveProperty('refreshToken')
      expect(dynamoService.deleteItem).toHaveBeenCalled()
      expect(dynamoService.putItem).toHaveBeenCalled()
    })

    it('should return 401 on invalid token signature', async () => {
      const payload = {
        refreshToken: 'invalid-token',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 401 if token not in dynamo', async () => {
      const mockUserId = faker.string.uuid()
      const validToken = app.jwt.sign({ sub: mockUserId })

      vi.mocked(dynamoService.getItem).mockResolvedValue(undefined)

      const payload = {
        refreshToken: validToken,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
