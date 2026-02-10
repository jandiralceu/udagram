import 'dotenv/config'
import { S3Service } from '@udagram/aws-uploader'

export const s3Service = new S3Service({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
