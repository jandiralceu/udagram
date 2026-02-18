import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyEnv, { type FastifyEnvOptions } from '@fastify/env'
import fastifyMultipart from '@fastify/multipart'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'

import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
  jsonSchemaTransform,
} from 'fastify-type-provider-zod'
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify'

import logger from '@udagram/logger-config'
import dynamoPlugin from '@udagram/fastify-dynamo-plugin'
import { getSecret, formatAsPem } from '@udagram/secrets-manager'

import schema, { type EnvConfig } from './config/env.js'
import { initSNS } from './lib/sns.js'
import authRoutes from './routes/v1/auth.router.js'
import usersRoutes from './routes/v1/users.router.js'
import grpcRoutes, { initAPIKeys } from './controllers/grpc/users.grpc.js'

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
  private: string
  public: string
}

interface SNSKeys {
  user_events: string
}

interface APIKeys {
  feed_service: string
}

/**
 * Builds the Fastify server instance for the User API.
 * Configures environment variables, security (JWT), database (DynamoDB), and routes.
 */
export async function buildServer() {
  const fastify = Fastify({
    logger: logger[process.env.NODE_ENV as keyof typeof logger],
  }).withTypeProvider<ZodTypeProvider>()

  // 1. CORS Configuration
  await fastify.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })

  // 2. Environment Configuration
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: true,
  } as FastifyEnvOptions)

  // 3. Swagger Configuration
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Udagram User API',
        description: 'User management service for Udagram application',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      servers: [],
    },
    transform: (params: Parameters<typeof jsonSchemaTransform>[0]) => {
      const { schema, url } = jsonSchemaTransform(params)
      const isRestRoute = url.startsWith('/api/')
      return { schema: { ...schema, hide: !isRestRoute }, url }
    },
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  })

  // 4. Messaging (SNS) Configuration
  const snsKeys = await getSecret<SNSKeys>(
    fastify.config.SNS_NAME,
    fastify.config.AWS_REGION
  )
  if (!snsKeys.user_events) {
    throw new Error('SNS_NAME secret must contain a user_events ARN')
  }
  fastify.config.AWS_SNS_TOPIC_ARN = snsKeys.user_events
  initSNS(snsKeys.user_events)

  // 5. API Keys Configuration
  const apiKeys = await getSecret<APIKeys>(
    fastify.config.API_KEYS_NAME,
    fastify.config.AWS_REGION
  )
  const apiKeysList = Object.values(apiKeys)
  if (apiKeysList.length === 0) {
    throw new Error(
      `Secret ${fastify.config.API_KEYS_NAME} must contain at least one API key`
    )
  }
  fastify.config.API_KEYS = apiKeysList
  initAPIKeys(apiKeysList)

  // 6. JWT & Security Setup
  let jwtKeys: JwtKeys

  if (fastify.config.JWT_SECRET_NAME) {
    // Load keys from AWS Secrets Manager if configured
    const keys = await getSecret<JwtKeys>(
      fastify.config.JWT_SECRET_NAME,
      fastify.config.AWS_REGION
    )
    if (!keys.private || !keys.public) {
      throw new Error(
        'JWT_SECRET_NAME must contain both private and public keys'
      )
    }
    jwtKeys = {
      private: formatAsPem(keys.private, 'PRIVATE KEY'),
      public: formatAsPem(keys.public, 'PUBLIC KEY'),
    }
  } else {
    // Fallback to local PEM files
    if (
      !fastify.config.JWT_PRIVATE_KEY_FILE ||
      !fastify.config.JWT_PUBLIC_KEY_FILE
    ) {
      throw new Error(
        'Either JWT_SECRET_NAME or both local key files must be provided'
      )
    }
    jwtKeys = {
      private: formatAsPem(
        fs.readFileSync(
          path.isAbsolute(fastify.config.JWT_PRIVATE_KEY_FILE)
            ? fastify.config.JWT_PRIVATE_KEY_FILE
            : path.join(__dirname, fastify.config.JWT_PRIVATE_KEY_FILE),
          'utf8'
        ),
        'PRIVATE KEY'
      ),
      public: formatAsPem(
        fs.readFileSync(
          path.isAbsolute(fastify.config.JWT_PUBLIC_KEY_FILE)
            ? fastify.config.JWT_PUBLIC_KEY_FILE
            : path.join(__dirname, fastify.config.JWT_PUBLIC_KEY_FILE),
          'utf8'
        ),
        'PUBLIC KEY'
      ),
    }
  }

  await fastify.register(fastifyJwt, {
    secret: jwtKeys,
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

  // 7. Database & Storage Setup
  await fastify.register(dynamoPlugin, {
    region: fastify.config.AWS_REGION,
    credentials: {
      accessKeyId: fastify.config.AWS_ACCESS_KEY_ID,
      secretAccessKey: fastify.config.AWS_SECRET_ACCESS_KEY,
    },
  })

  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  })

  // 8. Compilers & Global Hooks
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  // 9. Route Registration
  fastify.get('/health', { schema: { hide: true } }, async () => ({
    app: fastify.config.APP_NAME,
    status: 'healthy',
  }))

  fastify.register(authRoutes, { prefix: '/api/v1/auth' })
  fastify.register(usersRoutes, { prefix: '/api/v1/users' })
  fastify.register(fastifyConnectPlugin, { routes: grpcRoutes })

  return fastify
}

/**
 * Server Execution Block
 */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const fastify = await buildServer()
    fastify.listen(
      { port: fastify.config.PORT, host: '0.0.0.0' },
      (err, address) => {
        if (err) {
          fastify.log.error(err)
          process.exit(1)
        }
        console.log(`\n🚀 User API Server listening at ${address}\n`)
      }
    )
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}
