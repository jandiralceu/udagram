import { z } from 'zod'

export const CreateFeedBodySchema = z.object({
  caption: z.string().min(1),
  imageUrl: z.url(),
})

export const GetFeedParamsSchema = z.object({
  feedId: z.uuid(),
})

export type CreateFeedBody = z.infer<typeof CreateFeedBodySchema>
export type GetFeedParams = z.infer<typeof GetFeedParamsSchema>
