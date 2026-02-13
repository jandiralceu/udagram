import 'dotenv/config'
import { S3Service } from '@udagram/aws-uploader'

/**
 * Initialized S3 Service instance.
 *
 * Configured with AWS credentials and region from environment variables.
 * Provides methods for uploading and managing files in S3 buckets.
 */
export const s3Service = new S3Service({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
