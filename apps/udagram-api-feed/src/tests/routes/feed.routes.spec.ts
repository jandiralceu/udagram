import { faker } from '@faker-js/faker'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jwt from 'jsonwebtoken'
import type { FastifyInstance } from 'fastify'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

import { buildServer } from '../../server.js'

// Mock external dependencies
vi.mock('../../clients/s3.js', () => ({
  s3Service: {
    upload: vi.fn(),
    deleteFile: vi.fn(),
  },
}))

vi.mock('../../clients/user.client.js', () => ({
  userClient: {
    getUserById: vi.fn(),
  },
}))

vi.mock('../../db/index.js', () => ({
  db: {},
}))

vi.mock('../../services/feeds.service.js', () => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  deleteFeed: vi.fn(),
  updateUserInfo: vi.fn(),
}))

import * as feedService from '../../services/feeds.service.js'

function mockFeed(overrides: Record<string, unknown> = {}) {
  return {
    id: faker.string.uuid(),
    caption: faker.lorem.sentence(),
    image_url: faker.image.avatar(),
    user_id: faker.string.uuid(),
    user_name: faker.person.fullName(),
    user_avatar: faker.image.avatar(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

describe('Feed Routes', () => {
  let app: FastifyInstance
  const testUserId = faker.string.uuid()
  let authToken: string

  beforeAll(async () => {
    const server = await buildServer()
    app = server.fastify

    // The server has JWT configured in verify-only mode (public key),
    // so we sign test tokens using the private key directly
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const privateKey = fs.readFileSync(
      path.join(__dirname, '../../../../../private.pem'),
      'utf8'
    )
    authToken = jwt.sign({ sub: testUserId }, privateKey, {
      algorithm: 'RS256',
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /api/v1/feeds', () => {
    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/feeds',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return list of feeds', async () => {
      const mockFeeds = [mockFeed({ user_id: testUserId })]

      vi.mocked(feedService.findAll).mockResolvedValue(mockFeeds)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/feeds',
        headers: { authorization: `Bearer ${authToken}` },
      })

      const body = response.json()
      expect(body).toHaveLength(1)

      const expected = mockFeeds[0]!
      expect(body[0]).toMatchObject({
        id: expected.id,
        caption: expected.caption,
        image_url: expected.image_url,
        user_id: testUserId,
      })
    })

    it('should return empty array when no feeds exist', async () => {
      vi.mocked(feedService.findAll).mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/feeds',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual([])
    })
  })

  describe('GET /api/v1/feeds/:feedId', () => {
    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/feeds/${faker.string.uuid()}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return feed by id', async () => {
      const feed = mockFeed({ user_id: testUserId })

      vi.mocked(feedService.findById).mockResolvedValue(feed)

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/feeds/${feed.id}`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        id: feed.id,
        caption: feed.caption,
        image_url: feed.image_url,
        user_id: testUserId,
      })
    })

    it('should return 404 for non-existent feed', async () => {
      vi.mocked(feedService.findById).mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/feeds/${faker.string.uuid()}`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({ message: 'Feed not found' })
    })

    it('should return 400 for invalid feedId (not a UUID)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/feeds/not-a-uuid',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/v1/feeds', () => {
    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/feeds',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should create feed with valid multipart data', async () => {
      const createdFeed = mockFeed({
        caption: 'Test caption',
        user_id: testUserId,
      })

      vi.mocked(feedService.create).mockResolvedValue(createdFeed)

      const form = createMultipartPayload(
        'Test caption',
        'test.png',
        'image/png',
        Buffer.from('fake-image-data')
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/feeds',
        headers: {
          authorization: `Bearer ${authToken}`,
          ...form.headers,
        },
        payload: form.body,
      })

      expect(response.statusCode).toBe(201)
      expect(response.json()).toMatchObject({
        id: createdFeed.id,
        caption: 'Test caption',
        user_id: testUserId,
      })
      expect(feedService.create).toHaveBeenCalledWith(
        testUserId,
        expect.any(String),
        expect.objectContaining({
          caption: 'Test caption',
        })
      )
    })

    it('should return 400 when file is missing', async () => {
      const boundary = `----formdata-${faker.string.uuid()}`
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="caption"',
        '',
        'A caption without file',
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/feeds',
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({ message: 'File is required' })
    })

    it('should return 400 when caption is missing', async () => {
      const form = createMultipartPayload(
        undefined,
        'test.png',
        'image/png',
        Buffer.from('fake-image-data')
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/feeds',
        headers: {
          authorization: `Bearer ${authToken}`,
          ...form.headers,
        },
        payload: form.body,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({ message: 'Caption is required' })
    })

    it('should return 400 for invalid mimetype', async () => {
      const form = createMultipartPayload(
        'Some caption',
        'doc.pdf',
        'application/pdf',
        Buffer.from('fake-pdf-data')
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/feeds',
        headers: {
          authorization: `Bearer ${authToken}`,
          ...form.headers,
        },
        payload: form.body,
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toHaveProperty('message', 'Invalid input')
    })

    it('should ignore extra file parts with unknown fieldnames', async () => {
      const createdFeed = mockFeed({
        caption: 'Extra files test',
        user_id: testUserId,
      })

      vi.mocked(feedService.create).mockResolvedValue(createdFeed)

      // Build multipart with an extra file part (fieldname: "avatar")
      const boundary = `----formdata-${faker.string.uuid()}`
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="caption"',
        '',
        'Extra files test',
        `--${boundary}`,
        'Content-Disposition: form-data; name="avatar"; filename="avatar.png"',
        'Content-Type: image/png',
        '',
        'extra-file-data',
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.png"',
        'Content-Type: image/png',
        '',
        'real-file-data',
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/feeds',
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      })

      expect(response.statusCode).toBe(201)
    })

    it('should ignore extra field parts with unknown fieldnames', async () => {
      const createdFeed = mockFeed({
        caption: 'Extra fields test',
        user_id: testUserId,
      })

      vi.mocked(feedService.create).mockResolvedValue(createdFeed)

      // Build multipart with an extra text field (fieldname: "description")
      const boundary = `----formdata-${faker.string.uuid()}`
      const body = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="caption"',
        '',
        'Extra fields test',
        `--${boundary}`,
        'Content-Disposition: form-data; name="description"',
        '',
        'This extra field should be ignored',
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.png"',
        'Content-Type: image/png',
        '',
        'real-file-data',
        `--${boundary}--`,
      ].join('\r\n')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/feeds',
        headers: {
          authorization: `Bearer ${authToken}`,
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload: body,
      })

      expect(response.statusCode).toBe(201)
    })

    it('should return 500 when service throws', async () => {
      vi.mocked(feedService.create).mockRejectedValue(
        new Error('Service error')
      )

      const form = createMultipartPayload(
        'Caption',
        'test.png',
        'image/png',
        Buffer.from('fake-image-data')
      )

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/feeds',
        headers: {
          authorization: `Bearer ${authToken}`,
          ...form.headers,
        },
        payload: form.body,
      })

      expect(response.statusCode).toBe(500)
      expect(response.json()).toEqual({ message: 'Internal Server Error' })
    })
  })

  describe('DELETE /api/v1/feeds/:feedId', () => {
    it('should return 401 without token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/feeds/${faker.string.uuid()}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should delete feed successfully', async () => {
      const feedId = faker.string.uuid()
      vi.mocked(feedService.deleteFeed).mockResolvedValue({
        message: 'Feed deleted successfully',
      })

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/feeds/${feedId}`,
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        message: 'Feed deleted successfully',
      })
      expect(feedService.deleteFeed).toHaveBeenCalledWith(
        feedId,
        expect.any(String)
      )
    })

    it('should return 400 for invalid feedId (not a UUID)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/feeds/not-a-uuid',
        headers: { authorization: `Bearer ${authToken}` },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})

// Helper: creates a raw multipart/form-data payload for fastify.inject
function createMultipartPayload(
  caption: string | undefined,
  filename: string,
  mimetype: string,
  fileData: Buffer
): { body: string; headers: Record<string, string> } {
  const boundary = `----formdata-${faker.string.uuid()}`
  const parts: string[] = []

  if (caption !== undefined) {
    parts.push(
      `--${boundary}`,
      'Content-Disposition: form-data; name="caption"',
      '',
      caption
    )
  }

  parts.push(
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${mimetype}`,
    '',
    fileData.toString('binary'),
    `--${boundary}--`
  )

  return {
    body: parts.join('\r\n'),
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
  }
}
