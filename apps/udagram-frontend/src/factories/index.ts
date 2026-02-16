import httpClient from '@infra/adapters/http'
import { AuthRemoteDataSource, UserRemoteDataSource } from '@data/datasources'
import { AuthRepository, UserRepository } from '@data/repositories'

export class AuthFactory {
  static createRemoteDataSource() {
    return new AuthRemoteDataSource(httpClient)
  }

  static createRepository() {
    return new AuthRepository(this.createRemoteDataSource())
  }
}

export class UserFactory {
  static createRemoteDataSource() {
    return new UserRemoteDataSource(httpClient)
  }

  static createRepository() {
    return new UserRepository(this.createRemoteDataSource())
  }
}
