import { S3Client, type S3ClientConfig } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null

export function createS3Client(config?: S3ClientConfig): S3Client {
  if (!s3Client) {
    s3Client = new S3Client(config ?? {})
  }

  return s3Client
}

export function getS3Client(): S3Client {
  if (!s3Client) {
    throw new Error(
      'S3 client has not been initialized. Call createS3Client() first.'
    )
  }

  return s3Client
}

export function destroyS3Client(): void {
  if (s3Client) {
    s3Client.destroy()
    s3Client = null
  }
}
