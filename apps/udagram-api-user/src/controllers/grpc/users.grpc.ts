import type { ConnectRouter } from '@connectrpc/connect'
import { UserService } from '@udagram/user-grpc'
import * as userService from '../../services/users.service.js'

const usersGrpcController = (router: ConnectRouter) => {
  router.service(UserService, {
    async getUserById(req) {
      const user = await userService.getUserById(req.id)

      if (!user) {
        throw new Error('user not found')
      }

      return {
        id: user.id,
        name: user.name,
        avatarUrl: 'placeholder',
      }
    },
  })
}

export default usersGrpcController
