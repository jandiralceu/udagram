/**
 * JSON Schema for validating environment variables.
 *
 * This schema is used by fastify-env to validate and load configuration
 * from .env files or system environment variables.
 */
const schema = {
  type: 'object',
  required: [
    'DB_CONNECTION_STRING',
    'USER_SERVICE',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET',
    'AWS_SQS_QUEUE_URL',
    'API_KEYS_NAME',
  ],
  properties: {
    APP_NAME: { type: 'string', default: 'udagram-feed-api' },
    PORT: { type: 'number', default: 8080 },
    DB_CONNECTION_STRING: { type: 'string' },
    USER_SERVICE: { type: 'string' },
    AWS_ACCESS_KEY_ID: { type: 'string' },
    AWS_SECRET_ACCESS_KEY: { type: 'string' },
    AWS_REGION: { type: 'string', default: 'us-east-1' },
    AWS_BUCKET: { type: 'string' },
    AWS_SQS_QUEUE_URL: { type: 'string' },
    JWT_PUBLIC_KEY_FILE: { type: 'string' },
    JWT_SECRET_NAME: { type: 'string' },
    API_KEYS_NAME: { type: 'string' },
  },
} as const

/**
 * TypeScript interface representing the validated environment configuration.
 */
export interface EnvConfig {
  APP_NAME: string
  PORT: number
  DB_CONNECTION_STRING: string
  USER_SERVICE: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
  AWS_BUCKET: string
  AWS_SQS_QUEUE_URL: string
  JWT_PUBLIC_KEY_FILE?: string
  JWT_SECRET_NAME?: string
  API_KEYS_NAME: string
  USER_SERVICE_API_KEY: string
}

export default schema
