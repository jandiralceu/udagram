import type { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function authRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  fastify.get('/me', async (_request, _reply) => {
    return { message: 'Profile' }
  })

  fastify.get('/:userId', async (_request, _reply) => {
    return { message: 'Login' }
  })

  fastify.delete('', async (_request, _reply) => {
    return { message: 'Signout' }
  })
}
