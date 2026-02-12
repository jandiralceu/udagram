const schema = {
  type: 'object',
  required: [
    'DB_CONNECTION_STRING',
    'USER_GRPC_URL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET',
    'AWS_SQS_QUEUE_URL',
    'JWT_PUBLIC_KEY_FILE',
  ],
  properties: {
    APP_NAME: { type: 'string', default: 'udagram-feed-api' },
    PORT: { type: 'number', default: 8080 },
    DB_CONNECTION_STRING: { type: 'string' },
    USER_GRPC_URL: { type: 'string' },
    AWS_ACCESS_KEY_ID: { type: 'string' },
    AWS_SECRET_ACCESS_KEY: { type: 'string' },
    AWS_REGION: { type: 'string', default: 'us-east-1' },
    AWS_BUCKET: { type: 'string' },
    AWS_SQS_QUEUE_URL: { type: 'string' },
    JWT_PUBLIC_KEY_FILE: { type: 'string', default: '../../../public.pem' },
  },
} as const

export interface EnvConfig {
  APP_NAME: string
  PORT: number
  DB_CONNECTION_STRING: string
  USER_GRPC_URL: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
  AWS_BUCKET: string
  AWS_SQS_QUEUE_URL: string
  JWT_PUBLIC_KEY_FILE: string
}

export default schema
