import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs'

export class PubSubClient {
  private readonly snsClient: SNSClient
  private readonly sqsClient: SQSClient

  constructor(region: string = process.env.AWS_REGION || 'us-east-1') {
    this.snsClient = new SNSClient({ region })
    this.sqsClient = new SQSClient({ region })
  }

  async publish(
    topicArn: string,
    eventType: string,
    payload: Record<string, unknown>
  ) {
    try {
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify({
          eventType,
          data: payload,
          timestamp: new Date().toISOString(),
        }),
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: eventType,
          },
        },
      })

      const response = await this.snsClient.send(command)
      console.info(
        `✅ Published event ${eventType} to topic ${topicArn}. MessageId: ${response.MessageId}`
      )
      return response
    } catch (error) {
      console.error(`❌ Failed to publish event ${eventType}:`, error)
      throw error
    }
  }

  async poll(
    queueUrl: string,
    handler: (eventType: string, data: unknown) => Promise<void>
  ) {
    console.info(`🚀 Starting poll on queue ${queueUrl}\n`)
    // Infinite loop correctly implemented for polling
    while (true) {
      try {
        const { Messages } = await this.sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20, // Long polling
          })
        )

        if (!Messages || Messages.length === 0) continue

        for (const message of Messages) {
          if (!message.Body) continue

          try {
            // SQS message body from SNS is a JSON string containing the 'Message' field
            // The actual payload we sent is inside that 'Message' field
            const snsMessage = JSON.parse(message.Body)
            const { eventType, data } = JSON.parse(snsMessage.Message)

            await handler(eventType, data)

            // Delete message after successful processing
            await this.sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              })
            )
          } catch (processingError) {
            console.error(
              '[PubSub] Error processing message:',
              processingError,
              message.Body
            )
            // We don't delete the message so it can be retried (Dead Letter Queue recommended)
          }
        }
      } catch (pollError) {
        console.error('[PubSub] Pooling error:', pollError)
        // Wait a bit before retrying to avoid tight loop on network errors
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }
}

export * from '@aws-sdk/client-sns'

export const PubSubEvents = {
  USER_UPDATED: 'UserUpdated',
} as const

export type PubSubEventType = (typeof PubSubEvents)[keyof typeof PubSubEvents]
