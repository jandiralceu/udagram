import Fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import fastifyI18n from 'fastify-i18n'
import { ListTablesCommand } from '@aws-sdk/client-dynamodb'

import dynamoPlugin from '@udagram/fastify-dynamo-plugin'
import logger from '@udagram/logger-config'

import schema, { type EnvConfig } from './config/env.js'
import messages from './config/i18n.js'
import authRoutes from './routes/v1/auth.js'
import usersRoutes from './routes/v1/users.js'

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

// Register the dynamo plugin
await fastify.register(dynamoPlugin, {
  endpoint: fastify.config.DYNAMO_DB_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
})

fastify.get('/health', async function handler(_, __) {
  let dynamoStatus = false

  try {
    await fastify.dynamo.client.send(new ListTablesCommand({}))
    dynamoStatus = true
  } catch (error) {
    fastify.log.error(error)
  }

  return {
    app: fastify.config.APP_NAME,
    components: {
      dynamodb: dynamoStatus,
    },
  }
})

fastify.register(authRoutes, { prefix: '/api/v1/auth' })
fastify.register(usersRoutes, { prefix: '/api/v1/users' })

fastify.listen(
  { port: fastify.config.PORT, host: '0.0.0.0.' },
  (err, address) => {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }

    console.log(`Server listening at ${address}`)
  }
)
