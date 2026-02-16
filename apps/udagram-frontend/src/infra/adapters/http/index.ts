import axios from 'axios'
import log from 'loglevel'
import { AuthStorage } from '../../cache/auth_storage'
import type { AuthSessionModel } from '@data/models'

/**
 * HTTP Client with support for header-based authentication and automatic token refresh.
 *
 * Configuration:
 * - baseURL: API base endpoint
 */
const http = axios.create({
  // baseURL: import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL,
  baseURL: import.meta.env.BASE_API,
})

/**
 * Dedicated client for refresh requests to avoid interceptor recursion.
 */
const refreshClient = axios.create({
  baseURL: http.defaults.baseURL,
})

/**
 * Flag to track if a token refresh is currently in progress.
 * Prevents multiple simultaneous refresh requests.
 */
let isRefreshing = false

/**
 * Queue of requests that failed with 401 Unauthorized while a token refresh was in progress.
 * Once the refresh completes, all requests in this queue are retried with the new token.
 *
 * Structure: { resolve: function to resolve with new token, reject: function to reject }
 */
let failedQueue: Array<{
  resolve: () => void
  reject: (error: unknown) => void
}> = []

/**
 * Authentication endpoints that may return 401 due to business handling (e.g., wrong password).
 * The response interceptor will NOT attempt to refresh the token for these endpoints.
 * If they return 401, the error is propagated normally without attempting to renew the session.
 *
 * Includes:
 * - /v1/auth/signin: Invalid credentials
 */
const authEndpoints = new Set([
  '/v1/auth/signin',
  '/v1/auth/signup',
  '/v1/auth/refresh',
])

/**
 * Normalizes the URL for consistent comparison against the endpoint arrays.
 * Ensures the URL always starts with '/' for consistent matching.
 *
 * @param url - The URL to normalize (can come from axios request config.url)
 * @returns The normalized URL starting with '/', or an empty string if url is undefined
 */
const getFullUrl = (url?: string) => {
  if (!url) return ''
  return url.startsWith('/') ? url : `/${url}`
}

/**
 * Processes all requests that were in the queue waiting for the token refresh.
 *
 * If refresh was successful:
 * - Resolves all promises, allowing the requests to be retried.
 *
 * If refresh failed:
 * - Rejects all promises with the error.
 *
 * @param error - The error from the failed refresh attempt (if any)
 */
const processQueue = (error?: unknown) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  resetQueue()
}

/**
 * Clears the request queue.
 */
const resetQueue = () => {
  failedQueue = []
}

/**
 * Handles the actual token refresh call and storage update.
 */
const calculateExpiry = (expiryInSeconds: number) => {
  return Math.floor(Date.now() / 1000) + expiryInSeconds
}

/**
 * Handles the actual token refresh call and storage update.
 */
const handleTokenRefresh = async (
  refreshToken: string
): Promise<AuthSessionModel> => {
  const response = await refreshClient.post<AuthSessionModel>(
    '/v1/auth/refresh',
    {
      refreshToken,
    }
  )

  const newSession: AuthSessionModel = {
    accessToken: response.data.accessToken,
    accessTokenExpiry: calculateExpiry(response.data.accessTokenExpiry),
    refreshToken: response.data.refreshToken,
    refreshTokenExpiry: calculateExpiry(response.data.refreshTokenExpiry),
  }

  AuthStorage.save(newSession)
  return newSession
}

/**
 * Redirects to the signin page and clears storage.
 */
const handleAuthFailure = (error: unknown) => {
  AuthStorage.clear()

  const currentPath = globalThis.location.pathname
  // Don't redirect if we are already in an authentication flow (signin, signup, social callback, etc)
  if (currentPath.startsWith('/signin') || currentPath.startsWith('/signup')) {
    throw error
  }

  const redirect = encodeURIComponent(currentPath)
  globalThis.location.href = `/signin?redirect=${redirect}`
  throw error
}

/**
 * Configures the HTTP client's authentication interceptors.
 *
 * RESPONSE INTERCEPTOR:
 * - If 401 received and NOT an auth endpoint:
 *   1. If refresh is already in progress: Add request to queue and wait.
 *   2. If refresh is NOT in progress:
 *      a. Attempt to renew access token using the refresh endpoint.
 *      b. If success: Retry the original request.
 *      c. If fail: Propagate error (which usually triggers logout in the app).
 * - If 401 received from an auth endpoint: Propagate error normally.
 */
http.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    if (!originalRequest || !error.response) {
      throw error
    }

    const url = getFullUrl(originalRequest.url)

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !authEndpoints.has(url)
    ) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => http(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      const session = AuthStorage.get()
      if (!session?.refreshToken) {
        isRefreshing = false
        return handleAuthFailure(error)
      }

      try {
        const newSession = await executeRefresh(session.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`
        return http(originalRequest)
      } catch (refreshError) {
        return handleAuthFailure(refreshError)
      }
    }
    throw error
  }
)

/**
 * Checks if the URL is an authentication or public endpoint.
 */
const isTokenRefreshNeeded = (url: string): boolean => {
  // Auth endpoints like signin or refresh are always public.
  // We also assume anything in /v1/auth/ except /signout is public (signup, password recovery, etc.)
  if (
    authEndpoints.has(url) ||
    (url.includes('/v1/auth/') && !url.includes('/signout'))
  ) {
    return false
  }

  const isPublicEndpoint =
    url.includes('/terms') ||
    url.includes('/privacy') ||
    url.includes('/signup')
  return !isPublicEndpoint
}

/**
 * REFRESH THRESHOLD: 1 minute in seconds
 */
const REFRESH_THRESHOLD = 60

/**
 * Singleton promise for the current refresh operation.
 * Ensures only one network request is made even if multiple calls overlap.
 */
let refreshPromise: Promise<AuthSessionModel> | null = null

/**
 * Timestamp of the last successful or attempted refresh to prevent loops.
 */
let lastRefreshAttemptTime = 0

/**
 * Executes a token refresh call and updates storage.
 * If a refresh is already in progress, returns the existing promise.
 */
const executeRefresh = async (
  refreshToken: string
): Promise<AuthSessionModel> => {
  if (refreshPromise) return refreshPromise

  isRefreshing = true
  refreshPromise = handleTokenRefresh(refreshToken)

  try {
    const session = await refreshPromise
    log.info('🔄 Token refreshed successfully')
    processQueue(null)
    return session
  } catch (error) {
    processQueue(error)
    throw error
  } finally {
    refreshPromise = null
    isRefreshing = false
    lastRefreshAttemptTime = Math.floor(Date.now() / 1000)
  }
}

/**
 * Executes a proactive token refresh if the current token is close to expiry or missing.
 */
const executeProactiveRefresh = async () => {
  const session = AuthStorage.get()

  // If no tokens at all, we can't do anything here
  if (!session?.accessToken && !session?.refreshToken) {
    return handleAuthFailure(new Error('No session available'))
  }

  const now = Math.floor(Date.now() / 1000)

  // AVOID LOOP: If we just refreshed (in the last 5s), don't try again.
  // This handles cases where client clock is ahead of server clock.
  if (now - lastRefreshAttemptTime < 5) return

  const timeUntilExpiry = session.accessTokenExpiry
    ? session.accessTokenExpiry - now
    : 0

  // Refresh if missing accessToken or close to expiry
  if (!session.accessToken || timeUntilExpiry < REFRESH_THRESHOLD) {
    // If already refreshing, just wait for it to finish then return
    if (refreshPromise) {
      await refreshPromise
      return
    }

    if (!session.refreshToken) {
      return handleAuthFailure(new Error('Refresh token missing'))
    }

    try {
      await executeRefresh(session.refreshToken)
    } catch (refreshError) {
      return handleAuthFailure(refreshError)
    }
  }
}

/**
 * REQUEST INTERCEPTOR:
 * 1. Proactive Token Refresh: Checks if token expires in < 3 minutes
 * 2. Authorization Header: Adds Bearer token if available
 * 3. Language Header: Adds Accept-Language based on i18next
 */
http.interceptors.request.use(async config => {
  const url = getFullUrl(config.url)

  if (isTokenRefreshNeeded(url)) {
    await executeProactiveRefresh()
  }

  // Add Authorization header
  const session = AuthStorage.get()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  return config
})

export default http
