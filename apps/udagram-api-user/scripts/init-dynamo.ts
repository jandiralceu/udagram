import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb'
import 'dotenv/config'

const client = new DynamoDBClient({
  endpoint: process.env.DYNAMO_DB_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
})

const tableName = process.env.DYNAMO_TABLE_NAME || 'RefreshTokens'

const run = async () => {
  console.log(`Checking if table "${tableName}" exists...`)

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    console.log(`Table "${tableName}" already exists.`)
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      console.log(`Table "${tableName}" not found. Creating...`)
      await client.send(
        new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [
            { AttributeName: 'refreshToken', AttributeType: 'S' },
          ],
          KeySchema: [{ AttributeName: 'refreshToken', KeyType: 'HASH' }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        })
      )
      console.log(`Table "${tableName}" created.`)

      console.log('Enabling TTL...')
      // Wait a moment for the table to become ACTIVE (just a simple delay for local dev safety)
      // In a real robust script you'd poll DescribeTable until TableStatus === 'ACTIVE'
      await new Promise(resolve => setTimeout(resolve, 2000))

      await client.send(
        new UpdateTimeToLiveCommand({
          TableName: tableName,
          TimeToLiveSpecification: {
            Enabled: true,
            AttributeName: 'expiresAt',
          },
        })
      )
      console.log('TTL enabled on "expiresAt".')
    } else {
      console.error('Error checking table:', error)
      process.exit(1)
    }
  }
}

run()
