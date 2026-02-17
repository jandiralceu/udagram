import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthStorage, type AuthSession } from './auth_storage'

describe('AuthStorage', () => {
  const mockSession: AuthSession = {
    accessToken: 'valid-access-token',
    accessTokenExpiry: 123456789,
    refreshToken: 'valid-refresh-token',
    refreshTokenExpiry: 987654321,
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should save session to localStorage', () => {
    AuthStorage.save(mockSession)
    const data = localStorage.getItem('@udagram/auth')
    expect(data).toBe(JSON.stringify(mockSession))
  })

  it('should get session from localStorage', () => {
    localStorage.setItem('@udagram/auth', JSON.stringify(mockSession))
    const session = AuthStorage.get()
    expect(session).toEqual(mockSession)
  })

  it('should return null if no session in localStorage', () => {
    const session = AuthStorage.get()
    expect(session).toBeNull()
  })

  it('should return null if session data is invalid JSON', () => {
    localStorage.setItem('@udagram/auth', 'invalid-json')
    const session = AuthStorage.get()
    expect(session).toBeNull()
  })

  it('should clear session from localStorage', () => {
    localStorage.setItem('@udagram/auth', JSON.stringify(mockSession))
    AuthStorage.clear()
    const data = localStorage.getItem('@udagram/auth')
    expect(data).toBeNull()
  })
})
