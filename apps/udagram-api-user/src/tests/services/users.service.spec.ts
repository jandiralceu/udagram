import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'

import { UploaderError } from '@udagram/aws-uploader'

import { db } from '../../db/index.js'
import { s3Service } from '../../lib/s3.js'
import { publishUserEvent } from '../../lib/sns.js'
import * as usersService from '../../services/users.service.js'
import { hashPassword } from '../../services/password.service.js'
import { usersTable } from '../../db/schema.js'

type User = typeof usersTable.$inferSelect

// Mock dependencies
vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      usersTable: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../services/password.service.js', () => ({
  hashPassword: vi.fn(),
}))

vi.mock('../../lib/s3.js', () => ({
  s3Service: {
    upload: vi.fn(),
    deleteFile: vi.fn(),
  },
}))

vi.mock('../../lib/sns.js', () => ({
  publishUserEvent: vi.fn(),
}))

describe('Users Service', () => {
  const mockUser = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'hashed-password',
    avatar: faker.image.avatar(),
    created_at: new Date(),
    updated_at: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserById', () => {
    it('should return user if found', async () => {
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(
        mockUser as User
      )

      const result = await usersService.getUserById(mockUser.id)

      expect(result).toEqual(mockUser)
      expect(db.query.usersTable.findFirst).toHaveBeenCalled()
    })

    it('should return undefined if not found', async () => {
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(undefined)

      const result = await usersService.getUserById('non-existent')

      expect(result).toBeUndefined()
    })
  })

  describe('create', () => {
    it('should create user successfully', async () => {
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(undefined) // No existing user
      vi.mocked(hashPassword).mockResolvedValue('hashed-password')

      const mockInsertBuilder = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUser]),
      }
      vi.mocked(db.insert).mockReturnValue(
        mockInsertBuilder as unknown as ReturnType<typeof db.insert>
      )

      const userData = {
        email: mockUser.email,
        password: 'password123',
        name: mockUser.name,
        confirmPassword: 'password123',
      }

      const result = await usersService.create(
        userData as typeof usersTable.$inferInsert
      )

      expect(result).toEqual(mockUser)
      expect(hashPassword).toHaveBeenCalledWith('password123')
      expect(db.insert).toHaveBeenCalled()
    })

    it('should throw error if user exists', async () => {
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(
        mockUser as User
      )

      const userData = {
        email: mockUser.email,
        password: 'password123',
        name: mockUser.name,
      }

      await expect(
        usersService.create(userData as typeof usersTable.$inferInsert)
      ).rejects.toThrow('User already exists')
    })
  })

  describe('updateUser', () => {
    it('should update user name', async () => {
      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockResolvedValue([{ ...mockUser, name: 'New Name' }]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      const result = await usersService.updateUser(mockUser.id, {
        name: 'New Name',
      })

      expect(result?.name).toBe('New Name')
      expect(db.update).toHaveBeenCalled()
      expect(publishUserEvent).toHaveBeenCalledWith(
        'UserUpdated',
        expect.anything()
      )
    })

    it('should update password with hashing', async () => {
      vi.mocked(hashPassword).mockResolvedValue('new-hashed-password')
      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockResolvedValue([
            { ...mockUser, password: 'new-hashed-password' },
          ]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      await usersService.updateUser(mockUser.id, { password: 'new-password' })

      expect(hashPassword).toHaveBeenCalledWith('new-password')
      expect(mockUpdateBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'new-hashed-password' })
      )
    })

    it('should update nothing if no data provided', async () => {
      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUser]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      await usersService.updateUser(mockUser.id, {})

      // Even with empty body, it updates updated_at
      expect(mockUpdateBuilder.set).toHaveBeenCalled()
    })

    it('should not publish event if user not found', async () => {
      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      await usersService.updateUser(mockUser.id, { name: 'New Name' })

      expect(publishUserEvent).not.toHaveBeenCalled()
    })
  })

  describe('updateAvatar', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should upload new avatar and update user', async () => {
      // Mock current user
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(
        mockUser as User
      )

      // Mock upload
      const mockUrl = 'https://bucket.s3.amazonaws.com/avatars/new.png'
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: mockUrl,
        key: 'avatars/new.png',
      })

      // Mock update
      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockResolvedValue([{ ...mockUser, avatar: mockUrl }]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      const file = {
        data: Buffer.from('test'),
        filename: 'test.png',
        mimetype: 'image/png',
      }
      const result = await usersService.updateAvatar(
        mockUser.id,
        'test-bucket',
        file
      )

      expect(result?.avatar).toBe(mockUrl)
      expect(s3Service.upload).toHaveBeenCalled()

      // Should delete old avatar if exists
      expect(s3Service.deleteFile).toHaveBeenCalledWith(
        'test-bucket',
        mockUser.avatar
      )
    })

    it('should handle s3 delete error gracefully', async () => {
      // Mock current user
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(
        mockUser as User
      )

      // Mock upload
      const mockUrl = 'https://bucket.s3.amazonaws.com/avatars/new.png'
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: mockUrl,
        key: 'avatars/new.png',
      })

      // Mock update
      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockResolvedValue([{ ...mockUser, avatar: mockUrl }]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      // Mock delete failure
      vi.mocked(s3Service.deleteFile).mockRejectedValue(
        new Error('Delete failed')
      )

      const file = {
        data: Buffer.from('test'),
        filename: 'test.png',
        mimetype: 'image/png',
      }
      const result = await usersService.updateAvatar(
        mockUser.id,
        'test-bucket',
        file
      )

      expect(result?.avatar).toBe(mockUrl)
      // should not throw
    })

    it('should handle UploaderError specifically', async () => {
      // Mock current user
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(
        mockUser as User
      )

      const mockUrl = 'https://bucket.s3.amazonaws.com/avatars/new.png'
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: mockUrl,
        key: 'avatars/new.png',
      })

      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockResolvedValue([{ ...mockUser, avatar: mockUrl }]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      // Mock delete failure with UploaderError
      vi.mocked(s3Service.deleteFile).mockRejectedValue(
        new UploaderError('S3 Error')
      )

      const file = {
        data: Buffer.from('test'),
        filename: 'test.png',
        mimetype: 'image/png',
      }
      await usersService.updateAvatar(mockUser.id, 'test-bucket', file)

      // Should satisfy the 'if (error instanceof UploaderError)' branch
    })

    it('should not delete old avatar if not present', async () => {
      // Mock current user with no avatar
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue({
        ...mockUser,
        avatar: null,
      })

      // Mock upload
      const mockUrl = 'https://bucket.s3.amazonaws.com/avatars/new.png'
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: mockUrl,
        key: 'avatars/new.png',
      })

      // Mock update
      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi
          .fn()
          .mockResolvedValue([{ ...mockUser, avatar: mockUrl }]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      const file = {
        data: Buffer.from('test'),
        filename: 'test.png',
        mimetype: 'image/png',
      }
      await usersService.updateAvatar(mockUser.id, 'test-bucket', file)

      expect(s3Service.deleteFile).not.toHaveBeenCalled()
    })

    it('should not delete old avatar if user update fails (user not found)', async () => {
      // Mock current user
      vi.mocked(db.query.usersTable.findFirst).mockResolvedValue(
        mockUser as User
      )

      // Mock upload
      const mockUrl = 'https://bucket.s3.amazonaws.com/avatars/new.png'
      vi.mocked(s3Service.upload).mockResolvedValue({
        url: mockUrl,
        key: 'avatars/new.png',
      })

      // Mock update returning empty
      const mockUpdateBuilder = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.update).mockReturnValue(
        mockUpdateBuilder as unknown as ReturnType<typeof db.update>
      )

      const file = {
        data: Buffer.from('test'),
        filename: 'test.png',
        mimetype: 'image/png',
      }
      await usersService.updateAvatar(mockUser.id, 'test-bucket', file)

      expect(s3Service.deleteFile).not.toHaveBeenCalled()
    })
  })

  it('should delete user', async () => {
    const mockDeleteBuilder = {
      where: vi.fn().mockReturnThis(),
    }
    vi.mocked(db.delete).mockReturnValue(
      mockDeleteBuilder as unknown as ReturnType<typeof db.delete>
    )

    const result = await usersService.deleteUser(mockUser.id)

    expect(result).toEqual({ message: 'User deleted successfully' })
    expect(db.delete).toHaveBeenCalled()
  })
})
