import 'dotenv/config'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyEnv, { type FastifyEnvOptions } from '@fastify/env'
import fastifyMultipart from '@fastify/multipart'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyJwt from '@fastify/jwt'

import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify'
import grpcRoutes from './controllers/grpc/users.grpc.js'

import dynamoPlugin from '@udagram/fastify-dynamo-plugin'
// s3 initialized in lib/s3.ts
import logger from '@udagram/logger-config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import schema, { type EnvConfig } from './config/env.js'

import authRoutes from './routes/v1/auth.js'
import usersRoutes from './routes/v1/users.js'

// Export buildServer for testing
declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }
}

export async function buildServer() {
  const fastify = Fastify({
    logger: logger[process.env.NODE_ENV as keyof typeof logger],
  }).withTypeProvider<ZodTypeProvider>()

  // Register the environment plugin
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
  } as FastifyEnvOptions)

  // Register JWT plugin
  await fastify.register(fastifyJwt, {
    secret: {
      private: fs.readFileSync(
        path.isAbsolute(fastify.config.JWT_PRIVATE_KEY_FILE)
          ? fastify.config.JWT_PRIVATE_KEY_FILE
          : path.join(__dirname, fastify.config.JWT_PRIVATE_KEY_FILE),
        'utf8'
      ),
      public: fs.readFileSync(
        path.isAbsolute(fastify.config.JWT_PUBLIC_KEY_FILE)
          ? fastify.config.JWT_PUBLIC_KEY_FILE
          : path.join(__dirname, fastify.config.JWT_PUBLIC_KEY_FILE),
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
  // S3 Client initialized in lib/s3.ts

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

  return fastify
}

// Function to start the server
/* v8 ignore start */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const fastify = await buildServer()
    fastify.listen(
      { port: fastify.config.PORT, host: '0.0.0.0' },
      (err, _address) => {
        if (err) {
          fastify.log.error(err)
          process.exit(1)
        }
      }
    )
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
/* v8 ignore stop */
