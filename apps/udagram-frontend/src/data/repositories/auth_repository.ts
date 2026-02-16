import type { IAuthRepository } from '@domain/repositories'
import type {
  AuthSession,
  signinRequest,
  signupRequest,
  signupResponse,
} from '@domain/entities'
import { AuthStorage } from '@infra/cache/auth_storage'

import type { IAuthRemoteDataSource } from '../datasources'

export class AuthRepository implements IAuthRepository {
  readonly #remoteDataSource: IAuthRemoteDataSource

  constructor(remoteDataSource: IAuthRemoteDataSource) {
    this.#remoteDataSource = remoteDataSource
  }

  async signin(request: signinRequest): Promise<AuthSession> {
    try {
      const response = await this.#remoteDataSource.signin(request)

      const now = Math.floor(Date.now() / 1000)
      const session: AuthSession = {
        accessToken: response.accessToken,
        accessTokenExpiry: now + response.accessTokenExpiry,
        refreshToken: response.refreshToken,
        refreshTokenExpiry: now + response.refreshTokenExpiry,
      }

      AuthStorage.save(session)
      return session
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async signup(request: signupRequest): Promise<signupResponse> {
    try {
      const response = await this.#remoteDataSource.signup(request)
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async signout(): Promise<void> {
    try {
      const session = AuthStorage.get()
      if (session?.refreshToken) {
        await this.#remoteDataSource.signout(session.refreshToken)
      }
    } catch (error) {
      console.error(error)
    } finally {
      AuthStorage.clear()
    }
  }
}
