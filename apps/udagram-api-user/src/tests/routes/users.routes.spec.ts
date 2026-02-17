import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FastifyInstance } from 'fastify'
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest'
import { faker } from '@faker-js/faker'
import jwt from 'jsonwebtoken'

import { buildServer } from '../../server.js'
import * as usersService from '../../services/users.service.js'

// Mock external dependencies
vi.mock('../../db/index.js', () => ({
  db: {},
}))

vi.mock('../../services/users.service.js', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  updateAvatar: vi.fn(),
  deleteUser: vi.fn(),
}))

vi.mock('../../lib/s3.js', () => ({
  s3Service: {
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
  },
}))

vi.mock('@udagram/fastify-dynamo-plugin', () => ({
  default: vi.fn(async () => {}),
}))

describe('Users Routes', () => {
  let app: FastifyInstance
  const testUserId = faker.string.uuid()
  let authToken: string

  // Helper to generate token for a specific user
  const generateToken = (userId: string) => {
    const privateKey = fs.readFileSync(
      path.join(__dirname, '../private_test.pem'),
      'utf8'
    )
    return jwt.sign({ sub: userId }, privateKey, {
      algorithm: 'RS256',
    })
  }

  // Necessary for path resolution in helper
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  beforeAll(async () => {
    // Configure server to use test public key
    vi.stubEnv(
      'JWT_PUBLIC_KEY_FILE',
      path.join(__dirname, '../public_test.pem')
    )
    vi.stubEnv('JWT_SECRET_NAME', '')
    vi.stubEnv(
      'JWT_PRIVATE_KEY_FILE',
      path.join(__dirname, '../private_test.pem')
    )
    vi.stubEnv(
      'DB_CONNECTION_STRING',
      'postgresql://user:pass@localhost:5432/db'
    )
    vi.stubEnv('AWS_ACCESS_KEY_ID', faker.string.uuid())
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', faker.string.uuid())
    vi.stubEnv('AWS_BUCKET', faker.lorem.word())
    vi.stubEnv(
      'AWS_SNS_TOPIC_ARN',
      'arn:aws:sns:us-east-1:000000000000:test-topic'
    )
    vi.stubEnv('GRPC_INTERNAL_TOKEN', faker.string.uuid())

    app = await buildServer()
    app.decorate('dynamo', {
      client: {} as unknown as FastifyInstance['dynamo']['client'],
      doc: {} as unknown as FastifyInstance['dynamo']['doc'],
    }) // Dynamo plugin bypass

    // Generate valid token for default test user
    authToken = generateToken(testUserId)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  afterAll(async () => {
    if (app) await app.close()
    vi.unstubAllEnvs()
  })

  describe('GET /api/v1/users/me', () => {
    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return user profile', async () => {
      const mockUser = {
        id: testUserId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      vi.mocked(usersService.getUserById).mockResolvedValue(
        mockUser as unknown as Awaited<
          ReturnType<typeof usersService.getUserById>
        >
      )

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual(mockUser)
      expect(usersService.getUserById).toHaveBeenCalledWith(testUserId)
    })

    it('should return 404 if user not found', async () => {
      vi.mocked(usersService.getUserById).mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /api/v1/users/:userId', () => {
    it('should return user by id', async () => {
      const targetUserId = faker.string.uuid()
      const mockUser = {
        id: targetUserId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      vi.mocked(usersService.getUserById).mockResolvedValue(
        mockUser as unknown as Awaited<
          ReturnType<typeof usersService.getUserById>
        >
      )

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${targetUserId}`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual(mockUser)
      expect(usersService.getUserById).toHaveBeenCalledWith(targetUserId)
    })

    it('should return 404 if user not found', async () => {
      vi.mocked(usersService.getUserById)
        .mockReset()
        .mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${faker.string.uuid()}`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PATCH /api/v1/users', () => {
    it('should update user', async () => {
      const updatedUser = {
        id: testUserId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      vi.mocked(usersService.updateUser).mockResolvedValue(
        updatedUser as unknown as Awaited<
          ReturnType<typeof usersService.updateUser>
        >
      )

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/users',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { name: updatedUser.name },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body).toEqual(updatedUser)
      expect(usersService.updateUser).toHaveBeenCalledWith(testUserId, {
        name: updatedUser.name,
      })
    })
  })

  describe('POST /api/v1/users/avatar', () => {
    it('should return 406 if no file uploaded', async () => {
      // Expecting 406 Not Acceptable because req.isMultipart() check fails in controller
      // or duplicate test block issues in previous runs.
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/users/avatar',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      })

      expect(response.statusCode).toBe(406)
    })
  })

  describe('DELETE /api/v1/users', () => {
    it('should delete user', async () => {
      vi.mocked(usersService.deleteUser).mockResolvedValue({
        message: faker.lorem.sentence(),
      })

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/users',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      expect(usersService.deleteUser).toHaveBeenCalledWith(testUserId)
    })
  })
})
