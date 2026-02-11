import { faker } from '@faker-js/faker'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  findAll,
  findById,
  create,
  deleteFeed,
  updateUserInfo,
} from '../../services/feeds.service.js'
import { s3Service } from '../../clients/s3.js'
import { userClient } from '../../clients/user.client.js'
import type { GetUserByIdResponse } from '@udagram/user-grpc'
import { feedsTable } from '../../db/schema.js'
import { setupTestDb } from '../test-db.js'

// 1. Setup global variable for test DB instance
let testDb: Awaited<ReturnType<typeof setupTestDb>>['db']

// 2. Mock the DB module to return a Proxy that delegates to testDb
vi.mock('../../db/index.js', () => ({
  db: new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (!testDb) throw new Error('Test DB not initialized')
        return Reflect.get(testDb, prop)
      },
    }
  ),
}))

// 3. Keep other mocks (S3, UserClient) as we don't want to test them here
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

describe('Feeds Service (Integration with PGLite)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Initialize a fresh in-memory DB for each test
    const setup = await setupTestDb()
    testDb = setup.db
  })

  describe('findAll', () => {
    it('should return empty array when no feeds exist', async () => {
      const result = await findAll()
      expect(result).toEqual([])
    })

    it('should return all feeds', async () => {
      const feedsToCreate = [
        {
          caption: faker.lorem.sentence(),
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
          mockUser: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            avatarUrl: faker.image.avatar(),
          },
        },
        {
          caption: faker.lorem.sentence(),
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
          mockUser: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            avatarUrl: faker.image.avatar(),
          },
        },
        {
          caption: faker.lorem.sentence(),
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
          mockUser: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            avatarUrl: faker.image.avatar(),
          },
        },
        {
          caption: faker.lorem.sentence(),
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
          mockUser: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            avatarUrl: faker.image.avatar(),
          },
        },
      ]

      for (const feed of feedsToCreate) {
        vi.mocked(userClient.getUserById).mockResolvedValueOnce(
          feed.mockUser as unknown as GetUserByIdResponse
        )
        vi.mocked(s3Service.upload).mockResolvedValueOnce({
          url: `http://s3.com/${faker.string.uuid()}.png`,
          key: `feeds/${faker.string.uuid()}.png`,
        })
      }

      await Promise.all(
        feedsToCreate.map(feed =>
          create(feed.mockUser.id, 'bucket', {
            caption: feed.caption,
            file: feed.file,
          })
        )
      )

      const result = await findAll()
      expect(result).toHaveLength(4)

      expect(result).toEqual(
        expect.arrayContaining(
          feedsToCreate.map(feed =>
            expect.objectContaining({
              caption: feed.caption,
              user_name: feed.mockUser.name,
              user_avatar: feed.mockUser.avatarUrl,
            })
          )
        )
      )
    })

    it('should return feeds ordered by created_at descending', async () => {
      const feedsToCreate = [
        {
          caption: 'First created',
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
          mockUser: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            avatarUrl: faker.image.avatar(),
          },
        },
        {
          caption: 'Second created',
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
          mockUser: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            avatarUrl: faker.image.avatar(),
          },
        },
      ]

      // Create sequentially to ensure different created_at timestamps
      for (const feed of feedsToCreate) {
        vi.mocked(userClient.getUserById).mockResolvedValue(
          feed.mockUser as unknown as GetUserByIdResponse
        )
        vi.mocked(s3Service.upload).mockResolvedValue({
          url: faker.image.avatar(),
          key: faker.string.uuid(),
        })

        await create(feed.mockUser.id, 'bucket', {
          caption: feed.caption,
          file: feed.file,
        })

        // Small delay to ensure distinct created_at timestamps in PGLite
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const result = await findAll()
      expect(result).toHaveLength(2)

      // Most recent feed should come first (DESC order)
      expect(result[0]?.caption).toBe('Second created')
      expect(result[1]?.caption).toBe('First created')
    })
  })

  describe('findById', () => {
    it('should return feed by id', async () => {
      const mockUser = {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        avatarUrl: faker.image.avatar(),
      }
      vi.mocked(userClient.getUserById).mockResolvedValue(
        mockUser as unknown as GetUserByIdResponse
      )
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: faker.image.avatar(),
        key: faker.string.uuid(),
      })

      const newFeed = await create(mockUser.id, 'bucket', {
        caption: faker.lorem.sentence(),
        file: {
          data: Buffer.from(''),
          filename: `${faker.string.uuid()}.png`,
          mimetype: 'image/png',
        },
      })

      if (!newFeed) throw new Error('Feed not created')
      // newFeed is guaranteed to be defined if create succeeds (it throws on error)
      const found = await findById(newFeed.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(newFeed.id)
    })

    it('should return undefined for non-existent id', async () => {
      const found = await findById(faker.string.uuid())
      expect(found).toBeUndefined()
    })
  })

  describe('create', () => {
    it('should insert feed into DB', async () => {
      const userId = faker.string.uuid()
      const mockUser = {
        id: userId,
        name: faker.person.fullName(),
        avatarUrl: null,
      }
      vi.mocked(userClient.getUserById).mockResolvedValue(
        mockUser as unknown as GetUserByIdResponse
      )
      const mockUploadUrl = faker.image.avatar()
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: mockUploadUrl,
        key: faker.string.uuid(),
      })

      const feedCaption = faker.lorem.sentence()
      const feedImage = `${faker.string.uuid()}.png`

      const feed = await create(userId, 'bucket', {
        caption: feedCaption,
        file: {
          data: Buffer.from('test'),
          filename: feedImage,
          mimetype: 'image/png',
        },
      })

      if (!feed) throw new Error('Feed not created')

      expect(feed.id).toBeDefined()
      expect(feed.caption).toBe(feedCaption)
      expect(feed.image_url).toBe(mockUploadUrl)
      expect(feed.user_id).toBe(userId)

      // Verify DB persistence
      const inDb = await findById(feed.id)
      expect(inDb).toBeDefined()
    })

    it('should rollback S3 upload if DB insert fails', async () => {
      const userId = faker.string.uuid()
      const key = faker.string.uuid()

      vi.mocked(userClient.getUserById).mockResolvedValue({
        id: userId,
        name: faker.person.fullName(),
      } as unknown as GetUserByIdResponse)

      const mockUploadUrl = faker.image.avatar()

      vi.mocked(s3Service.upload).mockResolvedValue({
        url: mockUploadUrl,
        key,
      })
      vi.mocked(s3Service.deleteFile).mockResolvedValue(undefined)

      // Mock DB insert failure by overriding the proxy target's insert method
      // Note: modifying testDb itself works because the proxy delegates to it
      vi.spyOn(testDb, 'insert').mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockRejectedValue(new Error('DB Fail intentionally')),
        }),
      } as unknown as ReturnType<typeof testDb.insert>)

      await expect(
        create(userId, 'bucket', {
          caption: faker.lorem.sentence(),
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
        })
      ).rejects.toThrow('DB Fail')

      expect(s3Service.deleteFile).toHaveBeenCalledWith('bucket', key)
    })

    it('should throw if user is not found', async () => {
      vi.mocked(userClient.getUserById).mockResolvedValue(
        null as unknown as GetUserByIdResponse
      )

      await expect(
        create(faker.string.uuid(), 'bucket', {
          caption: faker.lorem.sentence(),
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
        })
      ).rejects.toThrow('User not found')

      // S3 upload should never be called if user doesn't exist
      expect(s3Service.upload).not.toHaveBeenCalled()
    })

    it('should throw if S3 upload fails', async () => {
      const userId = faker.string.uuid()
      const errorMessage = 'S3 unavailable'

      vi.mocked(userClient.getUserById).mockResolvedValue({
        id: userId,
        name: faker.person.fullName(),
        avatarUrl: faker.image.avatar(),
      } as unknown as GetUserByIdResponse)
      vi.mocked(s3Service.upload).mockRejectedValue(new Error(errorMessage))

      await expect(
        create(userId, 'bucket', {
          caption: faker.lorem.sentence(),
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
        })
      ).rejects.toThrow(errorMessage)
    })

    it('should throw original DB error even if S3 cleanup fails', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const userId = faker.string.uuid()
      const dbErrorMessage = 'DB insert failed'

      vi.mocked(userClient.getUserById).mockResolvedValue({
        id: userId,
        name: faker.person.fullName(),
      } as unknown as GetUserByIdResponse)
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: faker.image.avatar(),
        key: faker.string.uuid(),
      })
      vi.mocked(s3Service.deleteFile).mockRejectedValue(
        new Error('S3 cleanup failed')
      )

      vi.spyOn(testDb, 'insert').mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error(dbErrorMessage)),
        }),
      } as unknown as ReturnType<typeof testDb.insert>)

      // Should throw the DB error, not the S3 cleanup error
      await expect(
        create(userId, 'bucket', {
          caption: faker.lorem.sentence(),
          file: {
            data: Buffer.from(''),
            filename: `${faker.string.uuid()}.png`,
            mimetype: 'image/png',
          },
        })
      ).rejects.toThrow(dbErrorMessage)
    })
  })

  describe('deleteFeed', () => {
    it('should delete from DB and S3', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const userId = faker.string.uuid()
      const feedImage = faker.image.avatar()

      vi.mocked(userClient.getUserById).mockResolvedValue({
        id: userId,
        name: faker.person.fullName(),
      } as unknown as GetUserByIdResponse)
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: feedImage,
        key: faker.string.uuid(),
      })

      const feed = await create(userId, 'bucket', {
        caption: faker.lorem.sentence(),
        file: {
          data: Buffer.from(''),
          filename: `${faker.string.uuid()}.png`,
          mimetype: 'image/png',
        },
      })

      if (!feed) throw new Error('Feed not created')

      await deleteFeed(feed.id, 'bucket')

      const found = await findById(feed.id)
      expect(found).toBeUndefined()
      expect(s3Service.deleteFile).toHaveBeenCalledWith('bucket', feedImage)
    })

    it('should throw if feed does not exist', async () => {
      await expect(deleteFeed(faker.string.uuid(), 'bucket')).rejects.toThrow(
        'Feed not found'
      )
    })

    it('should delete from DB even if S3 deletion fails', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const userId = faker.string.uuid()

      vi.mocked(userClient.getUserById).mockResolvedValue({
        id: userId,
        name: faker.person.fullName(),
      } as unknown as GetUserByIdResponse)
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: faker.image.avatar(),
        key: faker.string.uuid(),
      })

      const feed = await create(userId, 'bucket', {
        caption: faker.lorem.sentence(),
        file: {
          data: Buffer.from(''),
          filename: `${faker.string.uuid()}.png`,
          mimetype: 'image/png',
        },
      })

      if (!feed) throw new Error('Feed not created')

      // S3 deletion will fail, but DB delete should still succeed
      vi.mocked(s3Service.deleteFile).mockRejectedValue(new Error('S3 error'))

      // Should NOT throw despite S3 failure
      await expect(deleteFeed(feed.id, 'bucket')).resolves.not.toThrow()

      const found = await findById(feed.id)
      expect(found).toBeUndefined()
    })

    it('should skip S3 deletion when image_url is empty', async () => {
      // Insert a feed with empty image_url directly into the DB
      const [feed] = await testDb
        .insert(feedsTable)
        .values({
          caption: faker.lorem.sentence(),
          image_url: '',
          user_id: faker.string.uuid(),
          user_name: faker.person.fullName(),
        })
        .returning()

      if (!feed) throw new Error('Feed not created')

      vi.mocked(s3Service.deleteFile).mockClear()

      await deleteFeed(feed.id, 'bucket')

      const found = await findById(feed.id)
      expect(found).toBeUndefined()
      expect(s3Service.deleteFile).not.toHaveBeenCalled()
    })
  })

  describe('updateUserInfo', () => {
    it('should update user info in existing feeds', async () => {
      const userId = faker.string.uuid()
      const mockUser = {
        id: userId,
        name: faker.person.fullName(),
        avatarUrl: faker.image.avatar(),
      }
      vi.mocked(userClient.getUserById).mockResolvedValue(
        mockUser as unknown as GetUserByIdResponse
      )
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: faker.image.avatar(),
        key: faker.string.uuid(),
      })

      const feed = await create(userId, 'bucket', {
        caption: faker.lorem.sentence(),
        file: {
          data: Buffer.from(''),
          filename: `${faker.string.uuid()}.png`,
          mimetype: 'image/png',
        },
      })

      if (!feed) throw new Error('Feed not created')
      expect(feed.user_name).toBe(mockUser.name)
      expect(feed.user_avatar).toBe(mockUser.avatarUrl)

      const newUserFullName = faker.person.fullName()
      const newUserAvatarUrl = faker.image.avatar()
      await updateUserInfo(userId, {
        name: newUserFullName,
        avatar: newUserAvatarUrl,
      })

      const updatedFeed = await findById(feed.id)
      expect(updatedFeed).toBeDefined()
      expect(updatedFeed!.user_name).toBe(newUserFullName)
      expect(updatedFeed!.user_avatar).toBe(newUserAvatarUrl)
    })

    it('should not throw when user has no feeds', async () => {
      await expect(
        updateUserInfo(faker.string.uuid(), {
          name: faker.person.fullName(),
          avatar: faker.image.avatar(),
        })
      ).resolves.not.toThrow()
    })
  })
})
