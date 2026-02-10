import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyEnv, { type FastifyEnvOptions } from '@fastify/env'
import fastifyMultipart from '@fastify/multipart'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyJwt from '@fastify/jwt'
import fastifyI18n from 'fastify-i18n'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify'
import grpcRoutes from './controllers/grpc/users.grpc.js'

import dynamoPlugin from '@udagram/fastify-dynamo-plugin'
import { createS3Client } from '@udagram/aws-uploader'
import logger from '@udagram/logger-config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import schema, { type EnvConfig } from './config/env.js'
import messages from './config/i18n.js'

import authRoutes from './routes/v1/auth.js'
import usersRoutes from './routes/v1/users.js'

const env = process.env.NODE_ENV || 'development'

const fastify = Fastify({
  logger: logger[env as keyof typeof logger],
}).withTypeProvider<ZodTypeProvider>()

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }
}

// Register the environment plugin
await fastify.register(fastifyEnv, {
  schema,
  dotenv: true,
} as FastifyEnvOptions)

// Register the i18n plugin
await fastify.register(fastifyI18n, {
  fallbackLocale: 'en',
  messages,
})

// Register JWT plugin
await fastify.register(fastifyJwt, {
  secret: {
    private: fs.readFileSync(
      path.join(__dirname, '../../../private.pem'),
      'utf8'
    ),
    public: fs.readFileSync(
      path.join(__dirname, '../../../public.pem'),
      'utf8'
    ),
  },
  sign: { algorithm: 'RS256' },
})

fastify.decorate(
  'authenticate',
  async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  }
)

// Register the dynamo plugin
await fastify.register(dynamoPlugin, {
  endpoint: fastify.config.DYNAMO_DB_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
})

// Register multipart plugin for file uploads
await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// Initialize S3 client
createS3Client({
  region: fastify.config.AWS_REGION,
  credentials: {
    accessKeyId: fastify.config.AWS_ACCESS_KEY_ID,
    secretAccessKey: fastify.config.AWS_SECRET_ACCESS_KEY,
  },
})

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

fastify.get('/health', async function handler(_, __) {
  return {
    app: fastify.config.APP_NAME,
  }
})

fastify.register(authRoutes, { prefix: '/api/v1/auth' })
fastify.register(usersRoutes, { prefix: '/api/v1/users' })
fastify.register(fastifyConnectPlugin, { routes: grpcRoutes })

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
