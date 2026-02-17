import log from 'loglevel'

import { AuthStorage } from '@infra/cache/auth_storage'
import type { IAuthRepository } from '@domain/repositories'
import type { signinRequest, signupRequest } from '@domain/entities'

import type { IAuthRemoteDataSource } from '../datasources'

export class AuthRepository implements IAuthRepository {
  readonly #remoteDataSource: IAuthRemoteDataSource

  constructor(remoteDataSource: IAuthRemoteDataSource) {
    this.#remoteDataSource = remoteDataSource
  }

  async signin(request: signinRequest): Promise<void> {
    try {
      const response = await this.#remoteDataSource.signin(request)

      const now = Math.floor(Date.now() / 1000)

      AuthStorage.save({
        accessToken: response.accessToken,
        accessTokenExpiry: now + response.accessTokenExpiry,
        refreshToken: response.refreshToken,
        refreshTokenExpiry: now + response.refreshTokenExpiry,
      })
    } catch (error) {
      log.error('❌ Signin failed:', error)
      throw error
    }
  }

  async signup(request: signupRequest): Promise<void> {
    try {
      await this.#remoteDataSource.signup(request)
    } catch (error) {
      log.error('❌ Signup failed:', error)
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
      log.error('❌ Signout failed:', error)
    } finally {
      AuthStorage.clear()
    }
  }
}
