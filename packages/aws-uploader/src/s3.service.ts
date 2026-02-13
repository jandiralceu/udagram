import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3'
import { getSignedUrl as getPresignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { UploaderError } from './errors.js'

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

export class S3Service {
  private readonly client: S3Client

  constructor(config: S3ClientConfig) {
    this.client = new S3Client(config)
  }

  /**
   * Generates a unique key for the S3 object.
   * Format: folder/uuid.extension
   */
  private generateKey(fileName: string, folder?: string): string {
    const ext = path.extname(fileName)
    const uniqueName = `${randomUUID()}${ext}`

    return folder ? `${folder}/${uniqueName}` : uniqueName
  }

  /**
   * Extracts the S3 object key from a full S3 URL.
   */
  private extractKeyFromUrl(keyOrUrl: string): string {
    if (!keyOrUrl.startsWith('https://')) {
      return keyOrUrl
    }

    const url = new URL(keyOrUrl)

    // Format: https://bucket.s3.amazonaws.com/key
    if (url.hostname.includes('.s3.')) {
      return decodeURIComponent(url.pathname.slice(1))
    }

    // Format: https://s3.region.amazonaws.com/bucket/key
    const parts = url.pathname.slice(1).split('/')
    return decodeURIComponent(parts.slice(1).join('/'))
  }

  /**
   * Uploads a file to S3 and returns the URL and key.
   */
  async upload(bucket: string, options: UploadOptions): Promise<UploadResult> {
    const key = this.generateKey(options.fileName, options.folder)

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: options.file,
      ContentType: options.mimeType,
    })

    try {
      await this.client.send(command)

      const region = await this.client.config.region()

      // Standard S3 URL format
      const hostname =
        region === 'us-east-1'
          ? `${bucket}.s3.amazonaws.com`
          : `${bucket}.s3.${region}.amazonaws.com`

      const url = `https://${hostname}/${key}`

      return { url, key }
    } catch (error) {
      throw new UploaderError(`Failed to upload file "${key}" to S3`, error)
    }
  }

  /**
   * Deletes a file from S3 by its key or full URL.
   */
  async deleteFile(bucket: string, keyOrUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(keyOrUrl)

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    try {
      await this.client.send(command)
    } catch (error) {
      throw new UploaderError(`Failed to delete file "${key}" from S3`, error)
    }
  }

  /**
   * Generates a pre-signed URL for temporary access to a private S3 object.
   */
  async generateSignedUrl(
    bucket: string,
    options: SignedUrlOptions
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: options.key,
    })

    try {
      return await getPresignedUrl(this.client, command, {
        expiresIn: options.expiresIn ?? 3600,
      })
    } catch (error) {
      throw new UploaderError(
        `Failed to generate read-signed URL for "${options.key}"`,
        error
      )
    }
  }

  /**
   * Generates a pre-signed URL for uploading directly from the frontend.
   */
  async generateUploadSignedUrl(
    bucket: string,
    options: {
      fileName: string
      mimeType: string
      folder?: string
      expiresIn?: number
    }
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = this.generateKey(options.fileName, options.folder)

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: options.mimeType,
    })

    try {
      const uploadUrl = await getPresignedUrl(this.client, command, {
        expiresIn: options.expiresIn ?? 3600,
      })

      return { uploadUrl, key }
    } catch (error) {
      throw new UploaderError(
        `Failed to generate upload-signed URL for "${key}"`,
        error
      )
    }
  }

  /**
   * Closes the underlying S3 client.
   */
  destroy(): void {
    this.client.destroy()
  }
}
