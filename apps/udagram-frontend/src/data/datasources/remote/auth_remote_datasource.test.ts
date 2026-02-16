import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { AuthRemoteDataSource } from './auth_remote_datasource'
import type { AxiosInstance } from 'axios'

describe('AuthRemoteDataSource', () => {
  let dataSource: AuthRemoteDataSource
  let mockHttpClient: Partial<AxiosInstance>

  const mockAuthSession = {
    accessToken: 'access-token',
    accessTokenExpiry: 3600,
    refreshToken: 'refresh-token',
    refreshTokenExpiry: 86400,
  }

  const mockUserResponse = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
  }

  beforeEach(() => {
    mockHttpClient = {
      post: vi.fn(),
      delete: vi.fn(),
    }
    dataSource = new AuthRemoteDataSource(mockHttpClient as AxiosInstance)
  })

  it('signin calls post with correct url and data and returns response', async () => {
    const request = { email: 'test@example.com', password: 'password123' }
    ;(mockHttpClient.post as Mock).mockResolvedValue({ data: mockAuthSession })

    const result = await dataSource.signin(request)

    expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/auth/signin', request)
    expect(result).toEqual(mockAuthSession)
  })

  it('signup calls post with correct url and data and returns response', async () => {
    const request = { name: 'Test User', email: 'test@example.com', password: 'password123' }
    ;(mockHttpClient.post as Mock).mockResolvedValue({ data: mockUserResponse })

    const result = await dataSource.signup(request)

    expect(mockHttpClient.post).toHaveBeenCalledWith('/api/v1/auth/signup', request)
    expect(result).toEqual(mockUserResponse)
  })

  it('signout calls delete with correct url and refresh token', async () => {
    const refreshToken = 'refresh-token-123'
    ;(mockHttpClient.delete as Mock).mockResolvedValue({})

    await dataSource.signout(refreshToken)

    expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/auth/signout', {
      data: { refreshToken },
    })
  })
})
