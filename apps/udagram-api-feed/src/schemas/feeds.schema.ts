import { z } from 'zod'

export const CreateFeedBodySchema = z.object({
  caption: z.string().min(1),
  imageUrl: z.url(),
})

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

export const FeedResponseSchema = z.object({
  id: z.uuid(),
  caption: z.string(),
  url: z.string(),
  userId: z.uuid(),
  userName: z.string(),
  userAvatar: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type CreateFeedBody = z.infer<typeof CreateFeedBodySchema>
export type GetFeedParams = z.infer<typeof GetFeedParamsSchema>
export type CreateFeedMultipart = z.infer<typeof CreateFeedMultipartSchema>
export type FeedResponse = z.infer<typeof FeedResponseSchema>
