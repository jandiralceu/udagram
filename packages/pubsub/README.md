# 📡 Udagram PubSub Package

A shared internal library for implementing the **Event-Driven Architecture** across Udagram microservices using **AWS SNS** (Simple Notification Service) and **AWS SQS** (Simple Queue Service).

---

## 🚀 Overview

This package provides a high-level abstraction for the **Fan-out** messaging pattern. It allows services to publish events without knowing who the consumers are, and allows consumers to process messages asynchronously via worker queues.

### Key Features

- **SNS Publisher**: Simple interface to publish JSON events to a specific topic.
- **SQS Poller**: Efficient background polling mechanism for consuming messages from queues.
- **Auto-Acknowledge**: Automatically manages message deletion from SQS after successful processing.
- **Type Safety**: Built with TypeScript to ensure event payload consistency.

---

## 🏗 Why this is a shared package?

In a microservices environment, messaging patterns should be standardized. By centralizing the Pub/Sub logic:

1. **Consistency**: All services follow the same retry and polling logic.
2. **Simplified Boilerplate**: Developers only focus on the logic of the event, not the AWS SDK configuration.
3. **Optimized Performance**: Shared polling strategies reduce unnecessary AWS API calls.

---

## 🛠 Usage Example

### Publishing an Event (User Service)

```typescript
import { PubSubClient } from '@udagram/pubsub'

const pubSub = new PubSubClient(REGION)
await pubSub.publish(TOPIC_ARN, {
  type: 'USER_UPDATED',
  data: { id: '123', name: 'Jandir' },
})
```

### Consuming an Event (Feed Service)

```typescript
import { PubSubClient } from '@udagram/pubsub'

const pubSub = new PubSubClient(REGION)
pubSub.poll(QUEUE_URL, async (type, data) => {
  if (type === 'USER_UPDATED') {
    // Perform data synchronization logic
  }
})
```
