import { z } from 'zod'

/**
 * Schema for validating feed creation payload when providing an image URL directly.
 */
export const CreateFeedBodySchema = z.object({
  caption: z.string().min(1),
  imageUrl: z.url(),
})

/**
 * Schema for validating feed retrieval parameters.
 */
export const GetFeedParamsSchema = z.object({
  feedId: z.uuid(),
})

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Schema for validating feed creation via multipart/form-data.
 * Validates caption and file (image type and size limit 10MB).
 */
export const CreateFeedMultipartSchema = z.object({
  caption: z.string().min(1),
  file: z.object({
    filename: z.string(),
    mimetype: z
      .string()
      .refine(
        (val): val is (typeof ALLOWED_MIME_TYPES)[number] =>
          ALLOWED_MIME_TYPES.includes(
            val as (typeof ALLOWED_MIME_TYPES)[number]
          ),
        {
          message: `Only ${ALLOWED_MIME_TYPES.join(', ')} files are allowed`,
        }
      ),
    data: z.instanceof(Buffer),
    size: z
      .number()
      .max(MAX_FILE_SIZE, { message: 'File size must be at most 10MB' }),
  }),
})

/**
 * Schema for the feed item response.
 */
export const FeedResponseSchema = z.object({
  id: z.uuid(),
  caption: z.string(),
  image_url: z.string(),
  user_id: z.uuid(),
  user_name: z.string(),
  user_avatar: z.string().nullable(),
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
})

export type CreateFeedBody = z.infer<typeof CreateFeedBodySchema>
export type GetFeedParams = z.infer<typeof GetFeedParamsSchema>
export type CreateFeedMultipart = z.infer<typeof CreateFeedMultipartSchema>
export type FeedResponse = z.infer<typeof FeedResponseSchema>
