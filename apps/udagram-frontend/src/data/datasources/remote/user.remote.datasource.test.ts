import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { faker } from '@faker-js/faker'
import type { AxiosInstance } from 'axios'
import { UserRemoteDataSource } from './user.remote.datasource'

describe('UserRemoteDataSource', () => {
  let dataSource: UserRemoteDataSource
  let mockHttpClient: Partial<AxiosInstance>

  const mockUserResponse = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  }

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
    }
    dataSource = new UserRemoteDataSource(mockHttpClient as AxiosInstance)
  })

  it('getProfile calls get with correct url and returns response', async () => {
    ;(mockHttpClient.get as Mock).mockResolvedValue({ data: mockUserResponse })

    const result = await dataSource.getProfile()

    expect(mockHttpClient.get).toHaveBeenCalledWith('/api/v1/users/me')
    expect(result).toEqual(mockUserResponse)
  })

  it('updateAvatar calls post with correct url, formData and headers', async () => {
    ;(mockHttpClient.post as Mock).mockResolvedValue({ data: mockUserResponse })
    const file = new File([''], 'avatar.jpg', { type: 'image/jpeg' })

    const result = await dataSource.updateAvatar(file)

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/api/v1/users/avatar',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    expect(result).toEqual(mockUserResponse)
  })
})
