const schema = {
  type: 'object',
  required: ['PORT'],
  properties: {
    PORT: { type: 'number', default: 5100 },
  },
} as const

export interface EnvConfig {
  PORT: number
}

export default schema
