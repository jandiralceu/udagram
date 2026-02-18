# 🔐 Udagram Secrets Manager Utility

A secure utility for runtime secret retrieval from **AWS Secrets Manager**, ensuring that sensitive data like API keys and database credentials are never stored in plain text.

---

## 🚀 Overview

The **Secrets Manager Utility** provides a simple, robust interface to fetch and parse JSON secrets from the AWS cloud during the microservice startup sequence.

### Key Features

- **Strict Parsing**: Uses generic types to ensure the fetched secret matches the expected application interface.
- **PEM Formatting**: Built-in utility for converting raw secret strings into valid RSA PEM formats (useful for JWT keys).
- **Security by Design**: Encourages an architecture where secrets are injected into memory at runtime, never touching the disk or environment variables in a way that could be leaked.

---

## 🏗 Why this is a shared package?

Managing secrets is the most sensitive part of our infrastructure. By centralizing this logic:

- We enforce a single way to handle credentials across all teams.
- We simplify the process of rotating keys by abstracting the cloud-specific API calls.
- We reduce the risk of accidental credential exposure in logs or configuration files.

---

## 🛠 Usage Example

### Fetching a Database Secret

```typescript
import { getSecret } from '@udagram/secrets-manager'

interface DBSecret {
  url: string
}

const credentials = await getSecret<DBSecret>('prod/db/main', 'us-east-1')
console.log(credentials.url)
```
