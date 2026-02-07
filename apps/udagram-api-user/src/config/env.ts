const schema = {
  type: 'object',
  required: ['DB_CONNECTION_STRING'],
  properties: {
    APP_NAME: { type: 'string', default: 'udagram-user-api' },
    PORT: { type: 'number', default: 8080 },
    DB_CONNECTION_STRING: { type: 'string' },
    DYNAMO_DB_ENDPOINT: { type: 'string' },
  },
} as const

export interface EnvConfig {
  APP_NAME: string
  PORT: number
  DB_CONNECTION_STRING: string
  DYNAMO_DB_ENDPOINT: string
}

export default schema
