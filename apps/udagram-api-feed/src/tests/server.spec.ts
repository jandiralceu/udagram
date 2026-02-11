import type { FastifyInstance } from 'fastify'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { buildServer } from '../server.js'

describe('Feed API Server', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    const server = await buildServer()
    app = server.fastify
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health should return 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ app: 'udagram-feed-api' })
  })

  it('GET /api/v1/feeds should be protected (401 without token)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/feeds',
    })

    expect(response.statusCode).toBe(401)
  })
})
