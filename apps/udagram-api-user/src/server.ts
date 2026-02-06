import Fastify from 'fastify'

import fastifyEnv from '@fastify/env'
import schema, { type EnvConfig } from './config/env.js'

const fastify = Fastify({
  logger: true,
})

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig
  }
}

await fastify.register(fastifyEnv, {
  schema,
  dotenv: true,
})

fastify.get('/health', async function handler(_request, _reply) {
  return { status: 'ok' }
})

fastify.listen({ port: fastify.config.PORT }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  console.log(`Server listening at ${address}`)
})
