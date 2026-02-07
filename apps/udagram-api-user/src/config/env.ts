const schema = {
  type: 'object',
  required: ['DB_CONNECTION_STRING'],
  properties: {
    APP_NAME: { type: 'string', default: 'Udagram User Service' },
    PORT: { type: 'number', default: 8080 },
    DB_CONNECTION_STRING: { type: 'string' },
  },
} as const

export interface EnvConfig {
  APP_NAME: string
  PORT: number
  DB_CONNECTION_STRING: string
}

export default schema
