import {
  createClient,
  type Interceptor,
  type Client,
} from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-node'
import { UserService } from '@udagram/user-grpc'

/**
 * gRPC Client for the User Service.
 *
 * This client is initialized at runtime via initUserClient to ensure
 * environment variables are correctly loaded.
 */
let internalClient: Client<typeof UserService>

/**
 * gRPC Client for the User Service.
 *
 * This client is initialized at runtime via initUserClient to ensure
 * environment variables are correctly loaded.
 * It uses a Proxy to allow late initialization while maintaining a stable 'const' export.
 */
export const userClient = new Proxy({} as Client<typeof UserService>, {
  get(_, prop) {
    if (!internalClient) {
      throw new Error(
        'userClient must be initialized with initUserClient() before use.'
      )
    }
    const value = internalClient[prop as keyof Client<typeof UserService>]
    return typeof value === 'function'
      ? (value as Function).bind(internalClient)
      : value
  },
})

/**
 * Initializes the User gRPC client with the provided URL and API key.
 * This should be called during server startup.
 *
 * @param url - The base URL of the User Service gRPC endpoint.
 * @param apiKey - The internal API key for authentication.
 */
export function initUserClient(url: string, apiKey: string) {
  // Interceptor to add internal service authentication
  const authInterceptor: Interceptor = next => async req => {
    req.header.set('x-internal-token', apiKey)
    return await next(req)
  }

  const transport = createConnectTransport({
    baseUrl: url,
    httpVersion: '1.1',
    interceptors: [authInterceptor],
  })

  internalClient = createClient(UserService, transport)
}
