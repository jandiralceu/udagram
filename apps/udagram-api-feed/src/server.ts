import Fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import fastifyI18n from 'fastify-i18n'

import logger from '@udagram/logger-config'

import schema, { type EnvConfig } from './config/env.js'
import messages from './config/i18n.js'

const env = process.env.NODE_ENV || 'development'

const fastify = Fastify({
  logger: logger[env as keyof typeof logger],
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

// Register the i18n plugin
await fastify.register(fastifyI18n, {
  fallbackLocale: 'en',
  messages,
})

fastify.get('/health', async function handler(_request, _reply) {
  return { app: fastify.config.APP_NAME, database: false }
})

fastify.listen(
  { port: fastify.config.PORT, host: '0.0.0.0' },
  (err, address) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }

    console.log(`Server listening at ${address}`)
  }
)
