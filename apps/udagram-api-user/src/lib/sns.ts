import 'dotenv/config'
import { PubSubClient, type PubSubEventType } from '@udagram/pubsub'

// Initialize the PubSub client
const pubSubClient = new PubSubClient(process.env.AWS_REGION)

let topicArn: string

export const initSNS = (arn: string) => {
  topicArn = arn
}

export const publishUserEvent = async (
  eventType: PubSubEventType,
  payload: Record<string, unknown>
) => {
  if (!topicArn) {
    console.warn('SNS not initialized. Call initSNS() first.')
    return undefined
  }

  try {
    const response = await pubSubClient.publish(topicArn, eventType, payload)
    return response
  } catch {
    // Already logged in the client, but we catch here to prevent crashing the request
    return undefined
  }
}
