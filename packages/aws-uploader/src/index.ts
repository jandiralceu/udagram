export { createS3Client, getS3Client, destroyS3Client } from './s3.client.js'

export {
  upload,
  deleteFile,
  generateSignedUrl,
  generateUploadSignedUrl,
} from './uploader.service.js'

export type {
  UploadOptions,
  UploadResult,
  SignedUrlOptions,
} from './uploader.service.js'

export { UploaderError } from './errors.js'
