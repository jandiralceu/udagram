import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Interceptor } from '@connectrpc/connect'
import { faker } from '@faker-js/faker'

// Track the values passed to the mocked factories
let capturedTransportOptions: {
  baseUrl: string
  httpVersion: string
  interceptors: Interceptor[]
}
let capturedCreateClientArgs: { service: unknown; transport: unknown }

const mockTransport = Symbol('mock-transport')
const mockClient = Symbol('mock-client')

// Mock @connectrpc/connect-node
vi.mock('@connectrpc/connect-node', () => ({
  createConnectTransport: vi.fn((options: typeof capturedTransportOptions) => {
    capturedTransportOptions = options
    return mockTransport
  }),
}))

// Mock @connectrpc/connect
vi.mock('@connectrpc/connect', () => ({
  createClient: vi.fn((service: unknown, transport: unknown) => {
    capturedCreateClientArgs = { service, transport }
    return mockClient
  }),
}))

// Mock @udagram/user-grpc
const mockUserService = Symbol('UserService')
vi.mock('@udagram/user-grpc', () => ({
  UserService: mockUserService,
}))

describe('User Client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  describe('transport configuration', () => {
    it('should create transport with URL from parameters', async () => {
      const grpcEndpoint = faker.internet.url()
      const token = faker.string.uuid()

      const { initUserClient } = await import('../../clients/user.client.js')
      initUserClient(grpcEndpoint, token)

      expect(capturedTransportOptions.baseUrl).toBe(grpcEndpoint)
    })

    it('should use HTTP/1.1 for transport', async () => {
      const grpcEndpoint = faker.internet.url()
      const token = faker.string.uuid()

      const { initUserClient } = await import('../../clients/user.client.js')
      initUserClient(grpcEndpoint, token)

      expect(capturedTransportOptions.httpVersion).toBe('1.1')
    })

    it('should include auth interceptor in transport', async () => {
      const { initUserClient } = await import('../../clients/user.client.js')
      initUserClient(faker.internet.url(), faker.string.uuid())

      expect(capturedTransportOptions.interceptors).toHaveLength(1)
      expect(typeof capturedTransportOptions.interceptors[0]).toBe('function')
    })
  })

  describe('client creation', () => {
    it('should create client with UserService and transport', async () => {
      const { initUserClient } = await import('../../clients/user.client.js')
      initUserClient(faker.internet.url(), faker.string.uuid())

      expect(capturedCreateClientArgs.transport).toBe(mockTransport)
    })

    it('should export userClient', async () => {
      const { userClient, initUserClient } =
        await import('../../clients/user.client.js')
      initUserClient(faker.internet.url(), faker.string.uuid())

      expect(userClient).toBeDefined()
    })
  })

  describe('authInterceptor', () => {
    it('should add x-internal-token header when GRPC_INTERNAL_TOKEN is set', async () => {
      const secretToken = faker.string.uuid()
      const { initUserClient } = await import('../../clients/user.client.js')
      initUserClient(faker.internet.url(), secretToken)

      const interceptor = capturedTransportOptions.interceptors[0]

      if (!interceptor) throw new Error('Expected interceptor to be defined')

      const mockNext = vi
        .fn()
        .mockResolvedValue({ message: faker.lorem.sentences() })
      const mockReq = {
        header: new Headers(),
      }

      // The interceptor signature is: (next) => async (req) => ...
      const handler = interceptor(mockNext)
      await handler(mockReq as Parameters<typeof handler>[0])

      expect(mockReq.header.get('x-internal-token')).toBe(secretToken)
      expect(mockNext).toHaveBeenCalledWith(mockReq)
    })

    it('should NOT add x-internal-token header when apiKey is empty', async () => {
      const { initUserClient } = await import('../../clients/user.client.js')
      initUserClient(faker.internet.url(), '')

      const interceptor = capturedTransportOptions.interceptors[0]
      if (!interceptor) throw new Error('Expected interceptor to be defined')

      const mockNext = vi
        .fn()
        .mockResolvedValue({ message: faker.lorem.sentences() })
      const mockReq = {
        header: new Headers(),
      }

      const handler = interceptor(mockNext)
      await handler(mockReq as Parameters<typeof handler>[0])

      expect(mockReq.header.has('x-internal-token')).toBe(false)
      expect(mockNext).toHaveBeenCalledWith(mockReq)
    })

    it('should forward the response from next', async () => {
      const { initUserClient } = await import('../../clients/user.client.js')
      initUserClient(faker.internet.url(), faker.string.uuid())

      const interceptor = capturedTransportOptions.interceptors[0]
      if (!interceptor) throw new Error('Expected interceptor to be defined')

      const expectedResponse = { message: faker.lorem.sentences() }
      const mockNext = vi.fn().mockResolvedValue(expectedResponse)
      const mockReq = {
        header: new Headers(),
      }

      const handler = interceptor(mockNext)
      const result = await handler(mockReq as Parameters<typeof handler>[0])

      expect(result).toBe(expectedResponse)
    })
  })
})
