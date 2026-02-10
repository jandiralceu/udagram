import 'dotenv/config'
import { PubSubClient, type PubSubEventType } from '@udagram/pubsub'

// Initialize the PubSub client
const pubSubClient = new PubSubClient(process.env.AWS_REGION)

const topicArn = process.env.AWS_SNS_TOPIC_ARN

if (!topicArn) {
  console.warn('AWS_SNS_TOPIC_ARN is not defined. SNS notifications will fail.')
}

export const publishUserEvent = async (
  eventType: PubSubEventType,
  payload: Record<string, unknown>
) => {
  if (!topicArn) {
    console.warn('Skipping SNS publish because AWS_SNS_TOPIC_ARN is missing.')
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
