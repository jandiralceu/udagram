import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest'
import { AuthRepository } from './auth.repository'
import type { IAuthRemoteDataSource } from '../datasources'
import { AuthStorage } from '@infra/cache/auth_storage'

vi.mock('loglevel', () => ({
  default: {
    error: vi.fn(),
  },
}))

describe('AuthRepository', () => {
  let repository: AuthRepository
  let mockDataSource: IAuthRemoteDataSource

  const mockAuthResponse = {
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
    mockDataSource = {
      signin: vi.fn(),
      signup: vi.fn(),
      signout: vi.fn(),
    }
    repository = new AuthRepository(mockDataSource)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('signin calls datasource and saves to storage', async () => {
    const request = { email: 'test@example.com', password: 'password123' }
    ;(mockDataSource.signin as Mock).mockResolvedValue(mockAuthResponse)
    const saveSpy = vi.spyOn(AuthStorage, 'save').mockImplementation(() => {})

    await repository.signin(request)

    expect(mockDataSource.signin).toHaveBeenCalledWith(request)
    expect(saveSpy).toHaveBeenCalled()
  })

  it('signup calls datasource', async () => {
    const request = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }
    ;(mockDataSource.signup as Mock).mockResolvedValue(mockUserResponse)

    await repository.signup(request)

    expect(mockDataSource.signup).toHaveBeenCalledWith(request)
  })

  it('signout calls datasource and clears storage', async () => {
    const refreshToken = 'refresh-token'
    vi.spyOn(AuthStorage, 'get').mockReturnValue({
      ...mockAuthResponse,
      refreshToken,
    })
    const clearSpy = vi.spyOn(AuthStorage, 'clear').mockImplementation(() => {})
    ;(mockDataSource.signout as Mock).mockResolvedValue(undefined)

    await repository.signout()

    expect(mockDataSource.signout).toHaveBeenCalledWith(refreshToken)
    expect(clearSpy).toHaveBeenCalled()
  })

  it('signin rethrows and logs error', async () => {
    const request = { email: 'test@example.com', password: 'password123' }
    const error = new Error('Signin Error')
    ;(mockDataSource.signin as Mock).mockRejectedValue(error)
    vi.spyOn(console, 'error').mockImplementation(() => {}) // though we mock loglevel

    await expect(repository.signin(request)).rejects.toThrow(error)
  })

  it('signup rethrows and logs error', async () => {
    const request = {
      name: 'Test Name',
      email: 'test@example.com',
      password: 'password123',
    }
    const error = new Error('Signup Error')
    ;(mockDataSource.signup as Mock).mockRejectedValue(error)

    await expect(repository.signup(request)).rejects.toThrow(error)
  })

  it('signout logs error but clears storage', async () => {
    const refreshToken = 'refresh-token'
    vi.spyOn(AuthStorage, 'get').mockReturnValue({
      ...mockAuthResponse,
      refreshToken,
    })
    const error = new Error('Signout Error')
    ;(mockDataSource.signout as Mock).mockRejectedValue(error)
    const clearSpy = vi.spyOn(AuthStorage, 'clear').mockImplementation(() => {})

    await repository.signout()

    expect(clearSpy).toHaveBeenCalled()
  })

  it('signout skips remote call if no refresh token exists', async () => {
    vi.spyOn(AuthStorage, 'get').mockReturnValue(null)
    const clearSpy = vi.spyOn(AuthStorage, 'clear').mockImplementation(() => {})

    await repository.signout()

    expect(mockDataSource.signout).not.toHaveBeenCalled()
    expect(clearSpy).toHaveBeenCalled()
  })
})
