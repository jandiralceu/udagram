# 🖼️ Udagram AWS Uploader Package

A specialized internal library for managing binary asset uploads and retrieval using **AWS S3** (Simple Storage Service).

---

## 🚀 Overview

The **AWS Uploader** package abstracts the complexities of the AWS S3 SDK, providing a clean, promise-based API for handling user-generated content, such as profile pictures and feed images.

### Key Features

- **Stream-based Uploads**: Efficiently handles large file uploads without consuming excessive server memory.
- **Signed Get URLs**: Generates temporary, secure URLs for accessing private S3 objects.
- **Simplified Configuration**: Centralized management of bucket permissions and regions.
- **Mime-type Enforcement**: Ensures uploaded files are correctly categorized in the cloud.

---

## 🏗 Why this is a shared package?

Media handling is a cross-cutting concern in Udagram. Centralizing it ensures:

- **Security Compliance**: All services use the same logic for generating secure, time-limited URLs.
- **Storage Standard**: Consistent file naming and folder structure across S3 buckets.
- **SDK Management**: A single place to update or optimize AWS SDK v3 configurations.

---

## 🛠 Usage Example

### Uploading a File

```typescript
import { S3Uploader } from '@udagram/aws-uploader'

const uploader = new S3Uploader(BUCKET_NAME, REGION)
const imageUrl = await uploader.uploadItem(fileBuffer, fileName, 'image/jpeg')
```

### Generating a Secure View URL

```typescript
const viewUrl = await uploader.getGetSignedUrl(fileName)
```
