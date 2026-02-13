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
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET',
    'AWS_SNS_TOPIC_ARN',
    'GRPC_INTERNAL_TOKEN',
  ],
  properties: {
    APP_NAME: { type: 'string', default: 'udagram-user-api' },
    PORT: { type: 'number', default: 8080 },
    DB_CONNECTION_STRING: { type: 'string' },
    DYNAMO_DB_ENDPOINT: { type: 'string' },
    AWS_ACCESS_KEY_ID: { type: 'string' },
    AWS_SECRET_ACCESS_KEY: { type: 'string' },
    AWS_REGION: { type: 'string', default: 'us-east-1' },
    AWS_BUCKET: { type: 'string' },
    AWS_SNS_TOPIC_ARN: { type: 'string' },
    JWT_PUBLIC_KEY_FILE: { type: 'string' },
    JWT_PRIVATE_KEY_FILE: { type: 'string' },
    JWT_SECRET_NAME: { type: 'string' },
    GRPC_INTERNAL_TOKEN: { type: 'string' },
  },
} as const

/**
 * TypeScript interface representing the validated environment configuration.
 */
export interface EnvConfig {
  APP_NAME: string
  PORT: number
  DB_CONNECTION_STRING: string
  DYNAMO_DB_ENDPOINT: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
  AWS_BUCKET: string
  AWS_SNS_TOPIC_ARN: string
  JWT_PUBLIC_KEY_FILE?: string
  JWT_PRIVATE_KEY_FILE?: string
  JWT_SECRET_NAME?: string
  GRPC_INTERNAL_TOKEN: string
}

export default schema
