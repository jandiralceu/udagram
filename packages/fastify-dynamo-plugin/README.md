# ⚡ Udagram Fastify DynamoDB Plugin

A custom, high-performance plugin for **Fastify** that provides seamless integration with **AWS DynamoDB**.

---

## 🚀 Overview

This package encapsulates the **AWS SDK v3 DynamoDB Client** and provides a standardized way to register and use DynamoDB as a data source within Fastify-based microservices.

### Key Features

- **Fastify lifecycle integration**: Correctly handles DB connection initialization and cleanup.
- **Type-safe interaction**: Provides a structured `dynamo` object on the Fastify instance.
- **Optimized configuration**: Pre-configured for high-throughput environments with automatic retries and connection pooling.

---

## 🏗 Why this is a shared package?

Standardizing database plugins prevents configuration drift and ensures that all microservices follow the same best practices for connection management and security.

---

## 🛠 Usage Example

### Registering the Plugin

```typescript
import dynamoPlugin from '@udagram/fastify-dynamo-plugin';

await fastify.register(dynamoPlugin, {
  region: 'us-east-1',
  credentials: { ... }
});
```

### Accessing the Client in a Route

```typescript
fastify.get('/profile', async (request, reply) => {
  const result = await fastify.dynamo.getItem({
    TableName: 'Users',
    Key: { id: { S: '123' } },
  })
})
```
