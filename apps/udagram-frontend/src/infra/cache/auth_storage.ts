export type AuthSession = {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
  refreshTokenExpiry: number
}

const AUTH_KEY = '@udagram/auth'

export const AuthStorage = {
  save(session: AuthSession) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  },

  get(): AuthSession | null {
    const data = localStorage.getItem(AUTH_KEY)
    if (!data) return null
    try {
      return JSON.parse(data) as AuthSession
    } catch {
      return null
    }
  },

  clear() {
    localStorage.removeItem(AUTH_KEY)
  },
}
