import type { FastifyInstance, FastifyPluginOptions } from 'fastify'

export default async function authRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  fastify.post('/signup', async (_request, _reply) => {
    return { message: 'Register' }
  })

  fastify.post('/signin', async (_request, _reply) => {
    return { message: 'Login' }
  })

  fastify.post('/signout', async (_request, _reply) => {
    return { message: 'Signout' }
  })
}
