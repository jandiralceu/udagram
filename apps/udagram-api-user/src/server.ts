import Fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import fastifyPostgres from '@fastify/postgres'

import schema, { type EnvConfig } from './config/env.js'

const fastify = Fastify({
  logger: true,
})

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig
  }
}

// Register the environment plugin
await fastify.register(fastifyEnv, {
  schema,
  dotenv: true,
})

// Register the postgres plugin
await fastify.register(fastifyPostgres, {
  connectionString: fastify.config.DB_CONNECTION_STRING,
})

fastify.get('/health', async function handler(_, __) {
  try {
    const client = await fastify.pg.connect()
    client.release()
    return { app: fastify.config.APP_NAME, database: true }
  } catch (error) {
    fastify.log.error(error)
    return { app: fastify.config.APP_NAME, database: false }
  }
})

fastify.listen({ port: fastify.config.PORT }, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  console.log(`Server listening at ${address}`)
})
