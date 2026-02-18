# 🔌 Udagram User gRPC/Connect Definitions

The source of truth for all cross-service communication related to user data, utilizing the **Connect Protocol** and **Protocol Buffers**.

---

## 🚀 Overview

This package contains the service definitions (`.proto` files) and the generated TypeScript code for the **User Service** internal API. It allows other services (like the Feed Service) to call the User Service using a strongly-typed, high-performance RPC interface.

### Key Features

- **Contract-First Design**: Communication is defined in Protobuf files, ensuring a rigid schema that both client and server must follow.
- **Connect Protocol**: Provides gRPC compatibility over standard HTTP/1.1 or HTTP/2, making it easier to debug and more compatible with modern load balancers.
- **Auto-generated Types**: TypeScript interfaces are automatically generated from `.proto` files, eliminating the need for manual DTO maintenance.

---

## 🏗 Why this is a shared package?

Sharing the RPC definitions in a separate package is a microservices best practice:

1. **Single Source of Truth**: Changes to the User Service API are made here and automatically reflected in all consumer services.
2. **Type Safety**: Consumers get full autocompletion and compile-time checking for cross-service calls.
3. **Decoupling**: Services only depend on the _interface_, not on the internal implementation of the other service.

---

## 🛠 Usage Example

### Client Side (Feed Service)

```typescript
import { createPromiseClient } from '@connectrpc/connect'
import { UserService } from '@udagram/user-grpc'

const client = createPromiseClient(UserService, transport)
const user = await client.getUserMetadata({ userId: '123' })
```
