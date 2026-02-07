import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  type TranslateConfig,
} from '@aws-sdk/lib-dynamodb'

// Declare module augmentation so users get type hints
declare module 'fastify' {
  interface FastifyInstance {
    dynamo: {
      client: DynamoDBClient
      doc: DynamoDBDocumentClient
    }
  }
}

export interface DynamoPluginOptions extends DynamoDBClientConfig {
  documentClientConfig?: TranslateConfig
}

const dynamoPlugin = fp(
  async (fastify: FastifyInstance, options: DynamoPluginOptions) => {
    const { documentClientConfig, ...clientConfig } = options

    // 1. Initialize the low-level DynamoDB Client
    const client = new DynamoDBClient(clientConfig)

    // 2. Initialize the high-level Document Client (for easy JSON handling)
    const doc = DynamoDBDocumentClient.from(client, documentClientConfig)

    // 3. Decorate the fastify instance
    fastify.decorate('dynamo', {
      client,
      doc,
    })

    // 4. Clean up on close
    fastify.addHook('onClose', async instance => {
      instance.log.info('Disconnecting DynamoDB client...')
      instance.dynamo.client.destroy()
    })
  },
  {
    name: '@udagram/fastify-dynamo-plugin',
  }
)

export default dynamoPlugin
