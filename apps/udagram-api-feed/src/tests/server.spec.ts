import type { FastifyInstance } from 'fastify'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { faker } from '@faker-js/faker'

import { buildServer, startEventPolling } from '../server.js'
import { getSecret } from '@udagram/secrets-manager'
import { PubSubClient } from '@udagram/pubsub'
import * as feedsService from '../services/feeds.service.js'

vi.mock('@udagram/secrets-manager', () => ({
  getSecret: vi.fn(),
  formatAsPem: vi.fn(k => k),
}))

vi.mock('@udagram/pubsub', () => ({
  PubSubClient: class {
    publish = vi.fn()
    subscribe = vi.fn()
    poll = vi.fn()
  },
  PubSubEvents: {
    USER_UPDATED: 'UserUpdated',
  },
}))

vi.mock('../services/feeds.service.js', () => ({
  updateUserInfo: vi.fn(),
  findAll: vi.fn(), // Mock other service methods used in controllers if needed, though controllers usually import them.
  // Wait, controllers import * as feedService.
  // This mock here only affects imports in THIS file unless centralized.
  // But startEventPolling imports updateUserInfo directly.
}))

describe('Feed API Server', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    vi.mocked(getSecret).mockImplementation(async name => {
      if (name?.includes('api-keys')) return { feed_service: 'key-123' }
      return { public: 'test-public-aws' }
    })
    vi.stubEnv('JWT_SECRET_NAME', '')
    vi.stubEnv('API_KEYS_NAME', 'test-api-keys')
    vi.stubEnv('JWT_PUBLIC_KEY_FILE', path.join(__dirname, 'public_test.pem'))
    vi.stubEnv('AWS_REGION', 'us-east-1')
    vi.stubEnv('AWS_ACCESS_KEY_ID', faker.string.uuid())
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', faker.string.uuid())
    vi.stubEnv('AWS_BUCKET', faker.lorem.word())
    vi.stubEnv('AWS_SQS_QUEUE_URL', faker.internet.url())
    vi.stubEnv('USER_GRPC_URL', faker.internet.url())
    vi.stubEnv('GRPC_INTERNAL_TOKEN', faker.string.uuid())
    vi.stubEnv(
      'DB_CONNECTION_STRING',
      'postgresql://user:pass@localhost:5432/db'
    )

    const server = await buildServer()
    app = server.fastify
  })

  afterAll(async () => {
    if (app) await app.close()
    vi.unstubAllEnvs()
  })

  it('GET /health should return 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      app: 'udagram-feed-api',
      status: 'healthy',
    })
  })

  it('GET /api/v1/feeds should be protected (401 without token)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/feeds',
    })

    expect(response.statusCode).toBe(401)
  })

  it('should start with keys from AWS Secrets Manager', async () => {
    vi.stubEnv('JWT_SECRET_NAME', 'test-secret')
    vi.stubEnv('API_KEYS_NAME', 'test-api-keys')
    vi.mocked(getSecret).mockImplementation(async name => {
      if (name?.includes('api-keys')) return { feed_service: 'key-123' }
      return { public: 'test-public-aws' }
    })

    const { fastify: app } = await buildServer()
    await app.ready()
    await app.close()

    expect(getSecret).toHaveBeenCalledWith('test-secret', 'us-east-1')
  })

  it('should throw if no JWT configuration provided', async () => {
    vi.stubEnv('JWT_SECRET_NAME', '')
    vi.stubEnv('JWT_PUBLIC_KEY_FILE', '')

    await expect(buildServer()).rejects.toThrow(
      'Either JWT_SECRET_NAME or JWT_PUBLIC_KEY_FILE must be provided'
    )
  })

  it('startEventPolling should handle USER_UPDATED events', async () => {
    const mockPubSubClient = new PubSubClient('us-east-1')
    const queueUrl = faker.internet.url()

    // We need to capture the callback passed to poll
    let pollCallback:
      | ((eventType: string, data: unknown) => Promise<void>)
      | undefined

    vi.mocked(mockPubSubClient.poll).mockImplementation(async (url, cb) => {
      pollCallback = cb
    })

    startEventPolling(mockPubSubClient, queueUrl)

    expect(mockPubSubClient.poll).toHaveBeenCalledWith(
      queueUrl,
      expect.any(Function)
    )
    expect(pollCallback).toBeDefined()

    // Simulate event
    const userData = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      avatar: faker.image.avatar(),
    }

    if (pollCallback) {
      await pollCallback('UserUpdated', userData)
      expect(feedsService.updateUserInfo).toHaveBeenCalledWith(
        userData.id,
        userData
      )
    }

    // Should ignore other events?
    if (pollCallback) {
      vi.clearAllMocks()
      await pollCallback('OtherEvent', {})
      expect(feedsService.updateUserInfo).not.toHaveBeenCalled()
    }
  })

  it('should support absolute path for JWT_PUBLIC_KEY_FILE', async () => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const absolutePath = path.join(__dirname, 'public_test.pem')

    vi.stubEnv('JWT_SECRET_NAME', '')
    vi.stubEnv('JWT_PUBLIC_KEY_FILE', absolutePath)

    const server = await buildServer()
    expect(server.fastify).toBeDefined()
    await server.fastify.close()
  })

  it('should support relative path for JWT_PUBLIC_KEY_FILE', async () => {
    vi.stubEnv('JWT_SECRET_NAME', '')
    vi.stubEnv('JWT_PUBLIC_KEY_FILE', 'tests/public_test.pem')

    const server = await buildServer()
    expect(server.fastify).toBeDefined()
    await server.fastify.close()
  })
})
