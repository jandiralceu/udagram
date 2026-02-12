import 'dotenv/config'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyEnv, { type FastifyEnvOptions } from '@fastify/env'
import { PubSubClient, PubSubEvents } from '@udagram/pubsub'

import fastifyJwt from '@fastify/jwt'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import fastifyMultipart from '@fastify/multipart'

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import logger from '@udagram/logger-config'

import feedRoutes from './routes/v1/feed.js'
import schema, { type EnvConfig } from './config/env.js'
import { updateUserInfo } from './services/feeds.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }
}

// Export buildServer for testing
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

  // Register multipart plugin for file uploads
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for posts (higher than avatars)
    },
  })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.get('/health', async function handler(_request, _reply) {
    return { app: fastify.config.APP_NAME }
  })

  fastify.register(feedRoutes, { prefix: '/api/v1/feeds' })

  // Initialize PubSub (but don't start polling here to avoid side effects in tests)
  // We can start polling in the listen callback or separate start function
  const pubSubClient = new PubSubClient(fastify.config.AWS_REGION)

  return { fastify, pubSubClient }
}

// Function to start the server
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { fastify, pubSubClient } = await buildServer()

    await fastify.listen({ port: fastify.config.PORT, host: '0.0.0.0' })

    // Start polling for events in the background
    pubSubClient.poll(
      fastify.config.AWS_SQS_QUEUE_URL,
      async (eventType: string, data: unknown) => {
        if (eventType === PubSubEvents.USER_UPDATED) {
          const userData = data as {
            id: string
            name: string
            avatar: string | null
          }
          console.log(
            `[Feed Service] Received UserUpdated event for user ${userData.id}`
          )
          await updateUserInfo(userData.id, userData)
        }
      }
    )
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
