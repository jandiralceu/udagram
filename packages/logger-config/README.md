# 📝 Udagram Logger Configuration

Centralized observability and diagnostic logging configuration for all Udagram microservices, powered by **Pino**.

---

## 🚀 Overview

This package provides a unified **Pino** logger configuration that ensures consistent log formats across all services, optimized for both local development and cloud-based log aggregation (like AWS CloudWatch).

### Key Features

- **Structured Logging**: Outputs logs in JSON format for easy parsing by monitoring tools.
- **Environment Aware**:
  - **Development**: Pretty-printed logs for human readability.
  - **Production**: Minimized, fast JSON output for high performance.
- **Microservice Metadata**: Automatically includes service names and request IDs in every log entry.

---

## 🏗 Why this is a shared package?

Consistent logging is critical for debugging distributed systems. By sharing the logger config, we ensure that:

1. Every service reports logs with the same severity levels.
2. Tracing requests across services becomes easier with standardized headers and IDs.
3. We avoid repeating complex Pino configurations in every microservice.

---

## 🛠 Usage

```typescript
import logger from '@udagram/logger-config'

// Automatically uses the correct configuration based on NODE_ENV
const log = logger[process.env.NODE_ENV]

log.info('Service started on port 8080')
log.error({ err }, 'Failed to process request')
```
