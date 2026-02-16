import type { AxiosInstance } from 'axios'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { faker } from '@faker-js/faker'

import { AuthRemoteDataSource } from './auth.remote.datasource'

describe('AuthRemoteDataSource', () => {
  let dataSource: AuthRemoteDataSource
  let mockHttpClient: Partial<AxiosInstance>

  const mockAuthSession = {
    accessToken: faker.internet.jwt(),
    accessTokenExpiry: 3600,
    refreshToken: faker.internet.jwt(),
    refreshTokenExpiry: 86400,
  }

  beforeEach(() => {
    mockHttpClient = {
      post: vi.fn(),
      delete: vi.fn(),
    }
    dataSource = new AuthRemoteDataSource(mockHttpClient as AxiosInstance)
  })

  it('signin calls post with correct url and data and returns response', async () => {
    const request = {
      email: faker.internet.email(),
      password: faker.internet.password(),
    }
    ;(mockHttpClient.post as Mock).mockResolvedValue({ data: mockAuthSession })

    const result = await dataSource.signin(request)

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/api/v1/auth/signin',
      request
    )
    expect(result).toEqual(mockAuthSession)
  })

  it('signup calls post with correct url and data', async () => {
    const request = {
      name: faker.person.firstName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    }
    ;(mockHttpClient.post as Mock).mockResolvedValue({ data: {} })

    await dataSource.signup(request)

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/api/v1/auth/signup',
      request
    )
  })

  it('signout calls delete with correct url and refresh token', async () => {
    const refreshToken = faker.internet.jwt()
    ;(mockHttpClient.delete as Mock).mockResolvedValue({})

    await dataSource.signout(refreshToken)

    expect(mockHttpClient.delete).toHaveBeenCalledWith('/api/v1/auth/signout', {
      data: { refreshToken },
    })
  })
})
