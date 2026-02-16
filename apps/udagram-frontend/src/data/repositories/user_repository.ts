import type { IUserRepository } from '@domain/repositories'
import type { User } from '@domain/entities'

import type { IUserRemoteDataSource } from '../datasources/remote'

export class UserRepository implements IUserRepository {
  readonly #remoteDataSource: IUserRemoteDataSource

  constructor(remoteDataSource: IUserRemoteDataSource) {
    this.#remoteDataSource = remoteDataSource
  }

  async getProfile(): Promise<User> {
    try {
      const response = await this.#remoteDataSource.getProfile()
      return response
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
