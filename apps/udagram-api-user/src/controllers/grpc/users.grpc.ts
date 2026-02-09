import { Code, ConnectError, type ConnectRouter } from '@connectrpc/connect'
import { UserService } from '@udagram/user-grpc'
import * as userService from '../../services/users.service.js'

const GRPC_INTERNAL_TOKEN = process.env.GRPC_INTERNAL_TOKEN

function validateInternalToken(context: {
  requestHeader: { get: (name: string) => string | null }
}) {
  const token = context.requestHeader.get('x-internal-token')

  if (!GRPC_INTERNAL_TOKEN || token !== GRPC_INTERNAL_TOKEN) {
    throw new ConnectError(
      'Unauthorized: invalid internal token',
      Code.Unauthenticated
    )
  }
}

const usersGrpcController = (router: ConnectRouter) => {
  router.service(UserService, {
    async getUserById(req, context) {
      validateInternalToken(context)

      const user = await userService.getUserById(req.id)

      if (!user) {
        throw new ConnectError('User not found', Code.NotFound)
      }

      return {
        id: user.id,
        name: user.name,
        ...(user.avatar ? { avatarUrl: user.avatar } : {}),
      }
    },
  })
}

export default usersGrpcController
