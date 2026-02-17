/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosInstance } from 'axios'

const mocks = vi.hoisted(() => {
  return {
    adapter: vi.fn(),
    authGet: vi.fn(),
    authSave: vi.fn(),
    authClear: vi.fn(),
  }
})

vi.mock('axios', async importOriginal => {
  const actual = await importOriginal<typeof import('axios')>()
  return {
    default: {
      ...actual.default,
      create: vi.fn().mockImplementation(config => {
        const instance = actual.default.create(config)
        instance.defaults.adapter = mocks.adapter
        return instance
      }),
    },
  }
})

vi.mock('../../cache/auth_storage', () => ({
  AuthStorage: {
    get: mocks.authGet,
    save: mocks.authSave,
    clear: mocks.authClear,
  },
}))

describe('HTTP Client Adapter', () => {
  let http: AxiosInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // @ts-expect-error: location is read-only and needs to be deleted to be mocked
    delete globalThis.location
    // @ts-expect-error: location is read-only and needs to be reassigned to be mocked
    globalThis.location = {
      href: '',
      pathname: '/',
    }

    mocks.adapter.mockReset()
    mocks.adapter.mockImplementation(async config => {
      return { status: 200, data: { success: true }, headers: {}, config }
    })

    const mod = await import('./index')
    http = mod.default
  })

  it('should add Authorization header if token exists', async () => {
    mocks.authGet.mockReturnValue({
      accessToken: 'valid-token',
      accessTokenExpiry: Math.floor(Date.now() / 1000) + 3600,
      refreshToken: 'refresh-token',
      refreshTokenExpiry: Math.floor(Date.now() / 1000) + 7200,
    })

    await http.get('/api/v1/users')
    const userCall = mocks.adapter.mock.calls.find(
      call => call[0].url === '/api/v1/users'
    )
    expect(userCall).toBeDefined()
    expect(userCall![0].headers.Authorization).toBe('Bearer valid-token')
  })

  it('should handle proactive refresh and multiple concurrent requests', async () => {
    const now = Math.floor(Date.now() / 1000)
    mocks.authGet.mockReturnValue({
      accessToken: 'old-token',
      accessTokenExpiry: now + 30,
      refreshToken: 'refresh-token',
      refreshTokenExpiry: now + 7200,
    })

    let refreshCalls = 0
    mocks.adapter.mockImplementation(async config => {
      if (config.url === '/api/v1/auth/refresh') {
        refreshCalls++
        await new Promise(resolve => setTimeout(resolve, 50))
        return {
          status: 200,
          data: {
            accessToken: 'new-token',
            accessTokenExpiry: 3600,
            refreshToken: 'new-refresh',
            refreshTokenExpiry: 7200,
          },
          headers: {},
          config,
        }
      }
      return { status: 200, data: { success: true }, headers: {}, config }
    })

    const [res1, res2] = await Promise.all([
      http.get('/api/v1/user/1'),
      http.get('/api/v1/user/2'),
    ])

    expect(refreshCalls).toBe(1)
    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
  })

  it('should handle 401 and queue multiple requests while refreshing', async () => {
    const now = Math.floor(Date.now() / 1000)
    mocks.authGet.mockReturnValue({
      accessToken: 'expired-token',
      accessTokenExpiry: now + 3600,
      refreshToken: 'valid-refresh',
      refreshTokenExpiry: now + 7200,
    })

    let userCallsCount = 0
    mocks.adapter.mockImplementation(async config => {
      if (config.url && config.url.includes('/api/v1/user/')) {
        userCallsCount++
        if (!config._retry) {
          return Promise.reject({ response: { status: 401 }, config })
        }
        return { status: 200, data: { success: true }, headers: {}, config }
      }
      if (config.url === '/api/v1/auth/refresh') {
        return {
          status: 200,
          data: {
            accessToken: 'retry-token',
            accessTokenExpiry: 3600,
            refreshToken: 'new-refresh',
            refreshTokenExpiry: 7200,
          },
          headers: {},
          config,
        }
      }
      return { status: 200, data: {}, headers: {}, config }
    })

    await Promise.all([http.get('/api/v1/user/1'), http.get('/api/v1/user/2')])

    // Should have at least 4 calls (2 fails + 2 retries)
    expect(userCallsCount).toBeGreaterThanOrEqual(4)
  })

  it('should redirect for unauthenticated users', async () => {
    mocks.authGet.mockReturnValue(null)

    await expect(http.get('/api/v1/protected')).rejects.toThrow()

    expect(mocks.authClear).toHaveBeenCalled()
    expect(globalThis.location.href).toContain('/signin')
  })

  it('should propagate 401 for auth endpoints', async () => {
    const error = {
      response: { status: 401 },
      config: { url: '/api/v1/auth/signin', _retry: false },
    }
    mocks.adapter.mockRejectedValue(error)

    await expect(http.post('/api/v1/auth/signin')).rejects.toThrow()

    const refreshCall = mocks.adapter.mock.calls.find(
      call => call[0].url === '/api/v1/auth/refresh'
    )
    expect(refreshCall).toBeUndefined()
  })
})
