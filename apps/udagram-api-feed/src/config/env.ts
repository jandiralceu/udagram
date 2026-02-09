const schema = {
  type: 'object',
  required: ['DB_CONNECTION_STRING', 'USER_GRPC_URL'],
  properties: {
    APP_NAME: { type: 'string', default: 'udagram-feed-api' },
    PORT: { type: 'number', default: 8080 },
    DB_CONNECTION_STRING: { type: 'string' },
    USER_GRPC_URL: { type: 'string' },
  },
} as const

export interface EnvConfig {
  APP_NAME: string
  PORT: number
  DB_CONNECTION_STRING: string
  USER_GRPC_URL: string
}

export default schema
