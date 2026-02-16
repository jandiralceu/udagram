import type { User } from './user'

export type signinRequest = {
  email: string
  password: string
}

export type signupRequest = {
  name: string
  email: string
  password: string
}

export type signupResponse = User

export type AuthSession = {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
  refreshTokenExpiry: number
}
