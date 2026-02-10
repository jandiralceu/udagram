import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

export class PubSubClient {
  private readonly snsClient: SNSClient

  constructor(region: string = process.env.AWS_REGION || 'us-east-1') {
    this.snsClient = new SNSClient({ region })
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
        `[PubSub] Published event ${eventType} to topic ${topicArn}. MessageId: ${response.MessageId}`
      )
      return response
    } catch (error) {
      console.error(`[PubSub] Failed to publish event ${eventType}:`, error)
      throw error
    }
  }
}

export * from '@aws-sdk/client-sns'

export const PubSubEvents = {
  USER_UPDATED: 'UserUpdated',
} as const

export type PubSubEventType = (typeof PubSubEvents)[keyof typeof PubSubEvents]
