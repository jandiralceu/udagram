import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildServer } from '../server.js'
import { getSecret } from '@udagram/secrets-manager'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

// Mock external dependencies to avoid starting real connections
vi.mock('@udagram/fastify-dynamo-plugin', () => ({
  default: vi.fn(),
}))

vi.mock('@udagram/secrets-manager', () => ({
  getSecret: vi.fn(),
  formatAsPem: vi.fn(k => k),
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
    vi.stubEnv('JWT_SECRET_NAME', '')

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
    vi.stubEnv('GRPC_INTERNAL_TOKEN', 'test-grpc-token')

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
    vi.stubEnv('JWT_PUBLIC_KEY_FILE', 'tests/public_test.pem')
    vi.stubEnv('JWT_PRIVATE_KEY_FILE', 'tests/private_test.pem')
    vi.stubEnv('JWT_SECRET_NAME', '')

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
    vi.stubEnv('GRPC_INTERNAL_TOKEN', 'test-grpc-token')

    const app = await buildServer()
    await app.ready()
    await app.close()
  })

  it('should start with keys from AWS Secrets Manager', async () => {
    vi.stubEnv('JWT_SECRET_NAME', 'test-secret')

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
    vi.stubEnv('GRPC_INTERNAL_TOKEN', 'test-grpc-token')

    vi.mocked(getSecret).mockResolvedValue({
      private: fs.readFileSync(
        path.join(__dirname, 'private_test.pem'),
        'utf8'
      ),
      public: fs.readFileSync(path.join(__dirname, 'public_test.pem'), 'utf8'),
    })

    const app = await buildServer()
    await app.ready()
    await app.close()

    expect(getSecret).toHaveBeenCalledWith('test-secret', 'us-east-1')
  })
})
