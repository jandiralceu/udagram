import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyEnv, { type FastifyEnvOptions } from '@fastify/env'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod'

import logger from '@udagram/logger-config'
import { PubSubClient, PubSubEvents } from '@udagram/pubsub'
import { getSecret, formatAsPem } from '@udagram/secrets-manager'

import schema, { type EnvConfig } from './config/env.js'
import feedRoutes from './routes/v1/feed.js'
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

interface JwtKeys {
  public: string
}

/**
 * Builds the Fastify server instance for the Feed API.
 * Configures environment, JWT verification (public key only), SQS polling and routes.
 *
 * @returns Object containing the fastify instance and the pubSubClient
 */
export async function buildServer() {
  const fastify = Fastify({
    logger: logger[process.env.NODE_ENV as keyof typeof logger],
  }).withTypeProvider<ZodTypeProvider>()

  // 1. Environment Configuration
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
  } as FastifyEnvOptions)

  // 1.5 Swagger Configuration
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Udagram Feed API',
        description: 'Feed management service for Udagram application',
        version: '1.0.0',
      },
      servers: [],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: (params: any) => {
      const { schema, url } = jsonSchemaTransform(params)
      const isRestRoute = url.startsWith('/api/')
      return { schema: { ...schema, hide: !isRestRoute }, url }
    },
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  })

  // 2. JWT Verification Setup (Public Key only for Feed API)
  let jwtPublicKey: string

  if (fastify.config.JWT_SECRET_NAME) {
    // Load public key from AWS Secrets Manager
    const keys = await getSecret<JwtKeys>(
      fastify.config.JWT_SECRET_NAME,
      fastify.config.AWS_REGION
    )
    jwtPublicKey = formatAsPem(keys.public, 'PUBLIC KEY')
  } else {
    // Fallback to local public key file
    if (!fastify.config.JWT_PUBLIC_KEY_FILE) {
      throw new Error(
        'Either JWT_SECRET_NAME or JWT_PUBLIC_KEY_FILE must be provided'
      )
    }
    jwtPublicKey = formatAsPem(
      fs.readFileSync(
        path.isAbsolute(fastify.config.JWT_PUBLIC_KEY_FILE)
          ? fastify.config.JWT_PUBLIC_KEY_FILE
          : path.join(__dirname, fastify.config.JWT_PUBLIC_KEY_FILE),
        'utf8'
      ),
      'PUBLIC KEY'
    )
  }

  await fastify.register(fastifyJwt, {
    secret: { public: jwtPublicKey },
    sign: { algorithm: 'RS256' },
  })

  // Auth decorator for route protection
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

  // 3. Storage & Multipart Setup
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for feed posts
    },
  })

  // 4. Compilers & Global Settings
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  // 5. Route Registration
  fastify.get('/health', { schema: { hide: true } }, async () => ({
    app: fastify.config.APP_NAME,
    status: 'healthy',
  }))

  fastify.register(feedRoutes, { prefix: '/api/v1/feeds' })

  // 6. Messaging (SQS) Initialization
  const pubSubClient = new PubSubClient(fastify.config.AWS_REGION)

  return { fastify, pubSubClient }
}

export const startEventPolling = (
  pubSubClient: PubSubClient,
  queueUrl: string
) => {
  pubSubClient.poll(queueUrl, async (eventType: string, data: unknown) => {
    if (eventType === PubSubEvents.USER_UPDATED) {
      const userData = data as {
        id: string
        name: string
        avatar: string | null
      }
      console.log(`[Feed Service] Synced user data for ${userData.id}`)
      await updateUserInfo(userData.id, userData)
    }
  })
}

/**
 * Server Execution Block
 */
/* v8 ignore start */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { fastify, pubSubClient } = await buildServer()

    const address = await fastify.listen({
      port: fastify.config.PORT,
      host: '0.0.0.0',
    })

    console.info(`\n🚀 Feed API Server listening at ${address}\n`)

    // Start background event polling
    startEventPolling(pubSubClient, fastify.config.AWS_SQS_QUEUE_URL)
  } catch (err) {
    console.error('Failed to start Feed API:', err)
    process.exit(1)
  }
}
/* v8 ignore stop */
