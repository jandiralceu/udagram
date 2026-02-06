const schema = {
  type: 'object',
  required: ['PORT'],
  properties: {
    PORT: { type: 'number', default: 5200 },
  },
} as const

export interface EnvConfig {
  PORT: number
}

export default schema
