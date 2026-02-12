import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { faker } from '@faker-js/faker'

// Mock the external dependency
vi.mock('@udagram/aws-uploader', () => ({
  S3Service: vi.fn(),
  UploaderError: class extends Error {},
}))

import { S3Service } from '@udagram/aws-uploader'

describe('S3 Client', () => {
  const env = process.env

  beforeAll(() => {
    vi.resetModules()
    process.env = { ...env }
    process.env.AWS_REGION = 'us-east-1'
    process.env.AWS_ACCESS_KEY_ID = faker.string.uuid()
    process.env.AWS_SECRET_ACCESS_KEY = faker.string.uuid()
  })

  afterAll(() => {
    process.env = env
    vi.unstubAllEnvs()
  })

  it('should initialize S3Service with environment variables', async () => {
    // Dynamic import to ensure fresh execution with mocked env
    await import('../../clients/s3.js')

    expect(S3Service).toHaveBeenCalledWith({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  })
})
