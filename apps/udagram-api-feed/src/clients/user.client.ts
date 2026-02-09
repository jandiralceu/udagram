import 'dotenv/config'
import { createClient, type Interceptor } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-node'
import { UserService } from '@udagram/user-grpc'

const USER_GRPC_URL = process.env.USER_GRPC_URL
const GRPC_INTERNAL_TOKEN = process.env.GRPC_INTERNAL_TOKEN

// Interceptor to add internal service authentication
const authInterceptor: Interceptor = next => async req => {
  if (GRPC_INTERNAL_TOKEN) {
    req.header.set('x-internal-token', GRPC_INTERNAL_TOKEN)
  }
  return await next(req)
}

const transport = createConnectTransport({
  baseUrl: USER_GRPC_URL ?? '',
  httpVersion: '1.1',
  interceptors: [authInterceptor],
})

export const userClient = createClient(UserService, transport)
