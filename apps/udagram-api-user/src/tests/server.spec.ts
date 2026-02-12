import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildServer } from '../server.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

// Mock external dependencies to avoid starting real connections
vi.mock('@udagram/fastify-dynamo-plugin', () => ({
  default: vi.fn(),
}))

describe('Server', () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('health check returns app name', async () => {
    vi.stubEnv('JWT_PUBLIC_KEY_FILE', path.join(__dirname, 'public_test.pem'))
    vi.stubEnv('JWT_PRIVATE_KEY_FILE', path.join(__dirname, 'private_test.pem'))

    const app = await buildServer()
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.payload)).toHaveProperty('app')
    await app.close()
  })

  it('should start with relative key paths', async () => {
    // Determine relative path from server.ts location
    // server.ts is in ../../src/server.ts relative to this test file?
    // No, this test file is src/tests/server.spec.ts
    // server.ts is src/server.ts
    // keys are in src/tests/

    // Config relative path: "tests/public_test.pem" (relative to src/?)
    // In server.ts: path.join(__dirname, config.JWT...)
    // __dirname of server.ts is src/
    // So if I pass "tests/public_test.pem", it joins src/ + tests/public_test.pem -> src/tests/public_test.pem.
    // This exists!

    vi.stubEnv('JWT_PUBLIC_KEY_FILE', 'tests/public_test.pem')
    vi.stubEnv('JWT_PRIVATE_KEY_FILE', 'tests/private_test.pem')

    const app = await buildServer()
    await app.ready()
    await app.close()
  })
})
