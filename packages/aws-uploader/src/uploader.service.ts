import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { getS3Client } from './s3.client.js'

export interface UploadOptions {
  /** The file content as a Buffer */
  file: Buffer
  /** Original file name (used to extract extension) */
  fileName: string
  /** MIME type of the file (e.g., 'image/jpeg') */
  mimeType: string
  /** Folder/prefix in the S3 bucket (e.g., 'avatars', 'posts') */
  folder?: string
}

export interface UploadResult {
  /** The full URL of the uploaded file */
  url: string
  /** The S3 object key */
  key: string
}

export interface SignedUrlOptions {
  /** The S3 object key */
  key: string
  /** Expiration time in seconds (default: 3600 = 1 hour) */
  expiresIn?: number
}

/**
 * Generates a unique key for the S3 object.
 * Format: folder/uuid.extension
 */
function generateKey(fileName: string, folder?: string): string {
  const ext = path.extname(fileName)
  const uniqueName = `${randomUUID()}${ext}`

  return folder ? `${folder}/${uniqueName}` : uniqueName
}

/**
 * Extracts the S3 object key from a full S3 URL.
 * Supports both formats:
 *   - https://bucket.s3.amazonaws.com/folder/file.jpg
 *   - https://s3.region.amazonaws.com/bucket/folder/file.jpg
 *
 * If the value is not a URL, it is returned as-is (assumed to be a key).
 */
function extractKeyFromUrl(keyOrUrl: string): string {
  if (!keyOrUrl.startsWith('https://')) {
    return keyOrUrl
  }

  const url = new URL(keyOrUrl)

  // Format: https://bucket.s3.amazonaws.com/key
  if (url.hostname.includes('.s3.')) {
    return decodeURIComponent(url.pathname.slice(1))
  }

  // Format: https://s3.region.amazonaws.com/bucket/key
  // Remove the first segment (bucket name) from pathname
  const parts = url.pathname.slice(1).split('/')
  return decodeURIComponent(parts.slice(1).join('/'))
}

/**
 * Uploads a file to S3 and returns the URL and key.
 */
export async function upload(
  bucket: string,
  options: UploadOptions
): Promise<UploadResult> {
  const s3 = getS3Client()
  const key = generateKey(options.fileName, options.folder)

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: options.file,
    ContentType: options.mimeType,
  })

  await s3.send(command)

  const url = `https://${bucket}.s3.amazonaws.com/${key}`

  return { url, key }
}

/**
 * Deletes a file from S3 by its key or full URL.
 */
export async function deleteFile(
  bucket: string,
  keyOrUrl: string
): Promise<void> {
  const s3 = getS3Client()
  const key = extractKeyFromUrl(keyOrUrl)

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  await s3.send(command)
}

/**
 * Generates a pre-signed URL for temporary access to a private S3 object.
 */
export async function generateSignedUrl(
  bucket: string,
  options: SignedUrlOptions
): Promise<string> {
  const s3 = getS3Client()

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: options.key,
  })

  return getSignedUrl(s3, command, {
    expiresIn: options.expiresIn ?? 3600,
  })
}

/**
 * Generates a pre-signed URL for uploading directly from the frontend.
 */
export async function generateUploadSignedUrl(
  bucket: string,
  options: {
    fileName: string
    mimeType: string
    folder?: string
    expiresIn?: number
  }
): Promise<{ uploadUrl: string; key: string }> {
  const s3 = getS3Client()
  const key = generateKey(options.fileName, options.folder)

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: options.mimeType,
  })

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: options.expiresIn ?? 3600,
  })

  return { uploadUrl, key }
}
