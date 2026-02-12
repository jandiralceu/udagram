import type { FastifyInstance } from 'fastify'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildServer } from '../server.js'
import { getSecret } from '@udagram/secrets-manager'

vi.mock('@udagram/secrets-manager', () => ({
  getSecret: vi.fn(),
  formatAsPem: vi.fn(k => k),
}))

vi.mock('@udagram/pubsub', () => ({
  PubSubClient: class {
    publish = vi.fn()
    subscribe = vi.fn()
  },
  PubSubEvents: {},
}))

describe('Feed API Server', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    vi.mocked(getSecret).mockResolvedValue({
      public: 'test-public-aws',
    })
    vi.stubEnv('JWT_SECRET_NAME', '')
    vi.stubEnv('JWT_PUBLIC_KEY_FILE', path.join(__dirname, 'public_test.pem'))
    const server = await buildServer()
    app = server.fastify
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it('GET /health should return 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
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
    vi.mocked(getSecret).mockResolvedValue({
      public: 'test-public-aws',
    })

    const { fastify: app } = await buildServer()
    await app.ready()
    await app.close()

    expect(getSecret).toHaveBeenCalledWith('test-secret', 'us-east-1')
  })
})
