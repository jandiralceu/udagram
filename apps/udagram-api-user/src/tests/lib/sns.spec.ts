import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock PubSubClient
const mockPublish = vi.fn()

class MockPubSubClient {
  publish = mockPublish
}

vi.mock('@udagram/pubsub', () => ({
  PubSubClient: MockPubSubClient,
}))

describe('SNS Lib', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should publish event if topic ARN is defined', async () => {
    process.env.AWS_SNS_TOPIC_ARN =
      'arn:aws:sns:us-east-1:123456789012:UserEvents'
    mockPublish.mockResolvedValue({ MessageId: '123' })

    const { publishUserEvent } = await import('../../lib/sns.js')

    const result = await publishUserEvent('UserUpdated', { id: '1' })

    expect(result).toBeDefined()
    expect(mockPublish).toHaveBeenCalledWith(
      'arn:aws:sns:us-east-1:123456789012:UserEvents',
      'UserUpdated',
      { id: '1' }
    )
  })

  it('should skip publish if topic ARN is missing', async () => {
    delete process.env.AWS_SNS_TOPIC_ARN

    const { publishUserEvent } = await import('../../lib/sns.js')

    const result = await publishUserEvent('UserUpdated', { id: '1' })

    expect(result).toBeUndefined()
    expect(mockPublish).not.toHaveBeenCalled()
  })

  it('should handle publish errors gratefully', async () => {
    process.env.AWS_SNS_TOPIC_ARN =
      'arn:aws:sns:us-east-1:123456789012:UserEvents'
    mockPublish.mockRejectedValue(new Error('SNS Error'))

    const { publishUserEvent } = await import('../../lib/sns.js')

    const result = await publishUserEvent('UserUpdated', { id: '1' })

    expect(result).toBeUndefined()
    expect(mockPublish).toHaveBeenCalled()
  })
})
