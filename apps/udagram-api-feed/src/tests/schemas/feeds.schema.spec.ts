import { faker } from '@faker-js/faker'
import { describe, it, expect } from 'vitest'

import {
  CreateFeedMultipartSchema,
  GetFeedParamsSchema,
  CreateFeedBodySchema,
} from '../../schemas/feeds.schema.js'

describe('Feed Schemas', () => {
  describe('GetFeedParamsSchema', () => {
    it('should accept a valid UUID', () => {
      const result = GetFeedParamsSchema.safeParse({
        feedId: faker.string.uuid(),
      })

      expect(result.success).toBe(true)
    })

    it('should reject a non-UUID string', () => {
      const result = GetFeedParamsSchema.safeParse({
        feedId: 'not-a-uuid',
      })

      expect(result.success).toBe(false)
    })

    it('should reject an empty string', () => {
      const result = GetFeedParamsSchema.safeParse({
        feedId: '',
      })

      expect(result.success).toBe(false)
    })

    it('should reject missing feedId', () => {
      const result = GetFeedParamsSchema.safeParse({})

      expect(result.success).toBe(false)
    })
  })

  describe('CreateFeedBodySchema', () => {
    it('should accept valid caption and imageUrl', () => {
      const result = CreateFeedBodySchema.safeParse({
        caption: faker.lorem.sentence(),
        imageUrl: faker.image.avatar(),
      })

      expect(result.success).toBe(true)
    })

    it('should reject empty caption', () => {
      const result = CreateFeedBodySchema.safeParse({
        caption: '',
        imageUrl: faker.image.avatar(),
      })

      expect(result.success).toBe(false)
    })

    it('should reject invalid URL', () => {
      const result = CreateFeedBodySchema.safeParse({
        caption: faker.lorem.sentence(),
        imageUrl: 'not-a-url',
      })

      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const result = CreateFeedBodySchema.safeParse({})

      expect(result.success).toBe(false)
    })
  })

  describe('CreateFeedMultipartSchema', () => {
    const validPayload = () => ({
      caption: faker.lorem.sentence(),
      file: {
        filename: `${faker.string.uuid()}.png`,
        mimetype: 'image/png',
        data: Buffer.from('test-data'),
        size: 1024,
      },
    })

    it('should accept valid payload with image/png', () => {
      const result = CreateFeedMultipartSchema.safeParse(validPayload())

      expect(result.success).toBe(true)
    })

    it('should accept image/jpeg', () => {
      const payload = validPayload()
      payload.file.mimetype = 'image/jpeg'

      const result = CreateFeedMultipartSchema.safeParse(payload)

      expect(result.success).toBe(true)
    })

    it('should accept image/webp', () => {
      const payload = validPayload()
      payload.file.mimetype = 'image/webp'

      const result = CreateFeedMultipartSchema.safeParse(payload)

      expect(result.success).toBe(true)
    })

    it('should accept image/gif', () => {
      const payload = validPayload()
      payload.file.mimetype = 'image/gif'

      const result = CreateFeedMultipartSchema.safeParse(payload)

      expect(result.success).toBe(true)
    })

    it('should reject invalid mimetype (text/plain)', () => {
      const payload = validPayload()
      payload.file.mimetype = 'text/plain'

      const result = CreateFeedMultipartSchema.safeParse(payload)

      expect(result.success).toBe(false)
      if (!result.success) {
        const mimeError = result.error.issues.find(issue =>
          issue.path.includes('mimetype')
        )
        expect(mimeError).toBeDefined()
      }
    })

    it('should reject invalid mimetype (application/pdf)', () => {
      const payload = validPayload()
      payload.file.mimetype = 'application/pdf'

      const result = CreateFeedMultipartSchema.safeParse(payload)

      expect(result.success).toBe(false)
    })

    it('should reject file exceeding 10MB', () => {
      const payload = validPayload()
      payload.file.size = 11 * 1024 * 1024 // 11MB

      const result = CreateFeedMultipartSchema.safeParse(payload)

      expect(result.success).toBe(false)
      if (!result.success) {
        const sizeError = result.error.issues.find(issue =>
          issue.path.includes('size')
        )
        expect(sizeError).toBeDefined()
        expect(sizeError?.message).toContain('10MB')
      }
    })

    it('should accept file exactly at 10MB limit', () => {
      const payload = validPayload()
      payload.file.size = 10 * 1024 * 1024 // Exactly 10MB

      const result = CreateFeedMultipartSchema.safeParse(payload)

      expect(result.success).toBe(true)
    })

    it('should reject empty caption', () => {
      const payload = validPayload()
      payload.caption = ''

      const result = CreateFeedMultipartSchema.safeParse(payload)

      expect(result.success).toBe(false)
    })

    it('should reject missing file', () => {
      const result = CreateFeedMultipartSchema.safeParse({
        caption: faker.lorem.sentence(),
      })

      expect(result.success).toBe(false)
    })

    it('should reject missing caption', () => {
      const result = CreateFeedMultipartSchema.safeParse({
        file: {
          filename: 'test.png',
          mimetype: 'image/png',
          data: Buffer.from('test'),
          size: 100,
        },
      })

      expect(result.success).toBe(false)
    })
  })
})
