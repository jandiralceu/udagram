import Fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import fastifyPostgres from '@fastify/postgres'
import { ListTablesCommand } from '@aws-sdk/client-dynamodb'

import dynamoPlugin from '@udagram/fastify-dynamo-plugin'
import logger from '@udagram/logger-config'

import schema, { type EnvConfig } from './config/env.js'

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

// Register the postgres plugin
await fastify.register(fastifyPostgres, {
  connectionString: fastify.config.DB_CONNECTION_STRING,
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
  let pgStatus = false
  let dynamoStatus = false

  try {
    const client = await fastify.pg.connect()
    client.release()
    pgStatus = true
  } catch (error) {
    fastify.log.error(error)
  }

  try {
    await fastify.dynamo.client.send(new ListTablesCommand({}))
    dynamoStatus = true
  } catch (error) {
    fastify.log.error(error)
  }

  return {
    app: fastify.config.APP_NAME,
    components: {
      postgres: pgStatus,
      dynamodb: dynamoStatus,
    },
  }
})

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
