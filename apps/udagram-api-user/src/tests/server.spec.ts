import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'

import { getSecret } from '@udagram/secrets-manager'

import { buildServer } from '../server.js'

// Mock external dependencies to avoid starting real connections
vi.mock('@udagram/fastify-dynamo-plugin', () => ({
  default: vi.fn(),
}))

vi.mock('@udagram/secrets-manager', () => ({
  getSecret: vi.fn(name => {
    if (name?.includes('sns'))
      return Promise.resolve({ user_events: 'arn:test' })
    if (name?.includes('api-keys'))
      return Promise.resolve({ feed_service: 'key-123' })
    return Promise.resolve({})
  }),
  formatAsPem: vi.fn(k => k),
}))

describe('Server', () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const defaultRegion = 'us-east-1'

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
    vi.stubEnv('AWS_ACCESS_KEY_ID', faker.string.uuid())
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', faker.string.uuid())
    vi.stubEnv('AWS_BUCKET', faker.lorem.word())
    vi.stubEnv(
      'AWS_SNS_TOPIC_ARN',
      `arn:aws:sns:${defaultRegion}:000000000000:test-topic`
    )
    vi.stubEnv('GRPC_INTERNAL_TOKEN', faker.string.uuid())
    vi.stubEnv('SNS_NAME', 'test-sns')
    vi.stubEnv('API_KEYS_NAME', 'test-api-keys')
    vi.stubEnv('SNS_NAME', 'test-sns')
    vi.stubEnv('API_KEYS_NAME', 'test-api-keys')

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
    vi.stubEnv('AWS_ACCESS_KEY_ID', faker.string.uuid())
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', faker.string.uuid())
    vi.stubEnv('AWS_BUCKET', faker.lorem.word())
    vi.stubEnv(
      'AWS_SNS_TOPIC_ARN',
      `arn:aws:sns:${defaultRegion}:000000000000:test-topic`
    )
    vi.stubEnv('GRPC_INTERNAL_TOKEN', faker.string.uuid())
    vi.stubEnv('SNS_NAME', 'test-sns')
    vi.stubEnv('API_KEYS_NAME', 'test-api-keys')

    const app = await buildServer()
    await app.ready()
    await app.close()
  })

  it('should start with keys from AWS Secrets Manager', async () => {
    const secretName = faker.string.uuid()
    vi.stubEnv('JWT_SECRET_NAME', secretName)

    vi.stubEnv(
      'DB_CONNECTION_STRING',
      'postgresql://user:pass@localhost:5432/db'
    )
    vi.stubEnv('AWS_ACCESS_KEY_ID', faker.string.uuid())
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', faker.string.uuid())
    vi.stubEnv('AWS_BUCKET', faker.lorem.word())
    vi.stubEnv(
      'AWS_SNS_TOPIC_ARN',
      `arn:aws:sns:${defaultRegion}:000000000000:test-topic`
    )
    vi.stubEnv('GRPC_INTERNAL_TOKEN', faker.string.uuid())
    vi.stubEnv('SNS_NAME', 'test-sns')
    vi.stubEnv('API_KEYS_NAME', 'test-api-keys')

    vi.mocked(getSecret).mockImplementation(name => {
      if (name === secretName) {
        return Promise.resolve({
          private: fs.readFileSync(
            path.join(__dirname, 'private_test.pem'),
            'utf8'
          ),
          public: fs.readFileSync(
            path.join(__dirname, 'public_test.pem'),
            'utf8'
          ),
        })
      }
      if (name === 'test-sns')
        return Promise.resolve({ user_events: 'arn:test' })
      if (name === 'test-api-keys')
        return Promise.resolve({ feed_service: 'key-123' })
      return Promise.resolve({})
    })

    const app = await buildServer()
    await app.ready()
    await app.close()

    expect(getSecret).toHaveBeenCalledWith(secretName, defaultRegion)
  })

  it('should throw if JWT keys are missing from Secrets Manager', async () => {
    const secretName = faker.string.uuid()
    vi.stubEnv('JWT_SECRET_NAME', secretName)
    vi.stubEnv('AWS_ACCESS_KEY_ID', faker.string.uuid())
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', faker.string.uuid())
    vi.stubEnv('AWS_BUCKET', faker.lorem.word())
    vi.stubEnv(
      'AWS_SNS_TOPIC_ARN',
      `arn:aws:sns:${defaultRegion}:000000000000:test-topic`
    )
    vi.stubEnv('GRPC_INTERNAL_TOKEN', faker.string.uuid())
    vi.stubEnv('SNS_NAME', 'test-sns')
    vi.stubEnv('API_KEYS_NAME', 'test-api-keys')
    vi.stubEnv(
      'DB_CONNECTION_STRING',
      'postgresql://user:pass@localhost:5432/db'
    )

    vi.mocked(getSecret).mockImplementation(name => {
      if (name === secretName) {
        return Promise.resolve({
          private: 'some-key',
          // public key missing
        })
      }
      if (name === 'test-sns')
        return Promise.resolve({ user_events: 'arn:test' })
      if (name === 'test-api-keys')
        return Promise.resolve({ feed_service: 'key-123' })
      return Promise.resolve({})
    })

    await expect(buildServer()).rejects.toThrow(
      'JWT_SECRET_NAME must contain both private and public keys'
    )
  })

  it('should throw if no JWT keys configuration is provided', async () => {
    vi.stubEnv('JWT_SECRET_NAME', '')
    vi.stubEnv('JWT_PUBLIC_KEY_FILE', '')
    vi.stubEnv('JWT_PRIVATE_KEY_FILE', '')
    vi.stubEnv('AWS_ACCESS_KEY_ID', faker.string.uuid())
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', faker.string.uuid())
    vi.stubEnv('AWS_BUCKET', faker.lorem.word())
    vi.stubEnv(
      'AWS_SNS_TOPIC_ARN',
      `arn:aws:sns:${defaultRegion}:000000000000:test-topic`
    )
    vi.stubEnv('GRPC_INTERNAL_TOKEN', faker.string.uuid())
    vi.stubEnv('SNS_NAME', 'test-sns')
    vi.stubEnv('API_KEYS_NAME', 'test-api-keys')
    vi.stubEnv(
      'DB_CONNECTION_STRING',
      'postgresql://user:pass@localhost:5432/db'
    )

    await expect(buildServer()).rejects.toThrow(
      'Either JWT_SECRET_NAME or both local key files must be provided'
    )
  })
})
