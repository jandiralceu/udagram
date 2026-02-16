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
      const model = await this.#remoteDataSource.getProfile()
      return {
        id: model.id,
        name: model.name,
        email: model.email,
        avatar: model.avatar ?? undefined,
        createdAt: new Date(model.created_at),
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateAvatar(file: File): Promise<void> {
    try {
      await this.#remoteDataSource.updateAvatar(file)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
