import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { faker } from '@faker-js/faker'
import log from 'loglevel'
import { UserRepository } from './user.repository'
import type { IUserRemoteDataSource } from '../datasources/remote'

vi.mock('loglevel', () => ({
  default: {
    error: vi.fn(),
  },
}))

describe('UserRepository', () => {
  let repository: UserRepository
  let mockDataSource: IUserRemoteDataSource

  const createMockUserModel = () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  })

  beforeEach(() => {
    mockDataSource = {
      getProfile: vi.fn(),
      updateAvatar: vi.fn(),
    }
    repository = new UserRepository(mockDataSource)
    vi.clearAllMocks()
  })

  it('getProfile calls datasource and maps to domain entity', async () => {
    const mockModel = createMockUserModel()
    ;(mockDataSource.getProfile as Mock).mockResolvedValue(mockModel)

    const result = await repository.getProfile()

    expect(mockDataSource.getProfile).toHaveBeenCalled()
    expect(result).toEqual({
      id: mockModel.id,
      name: mockModel.name,
      email: mockModel.email,
      avatar: mockModel.avatar,
      createdAt: new Date(mockModel.created_at),
    })
  })

  it('getProfile maps null avatar to undefined', async () => {
    const mockModel = { ...createMockUserModel(), avatar: null }
    ;(mockDataSource.getProfile as Mock).mockResolvedValue(mockModel)

    const result = await repository.getProfile()

    expect(result.avatar).toBeUndefined()
  })

  it('getProfile rethrows and logs error', async () => {
    const error = new Error('API Error')
    ;(mockDataSource.getProfile as Mock).mockRejectedValue(error)

    await expect(repository.getProfile()).rejects.toThrow(error)
    expect(log.error).toHaveBeenCalledWith('❌ Get profile failed:', error)
  })
})
