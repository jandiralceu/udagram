import httpClient from '@infra/adapters/http'
import {
  AuthRemoteDataSource,
  FeedRemoteDataSource,
  UserRemoteDataSource,
} from '@data/datasources'
import {
  AuthRepository,
  FeedRepository,
  UserRepository,
} from '@data/repositories'

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

export class FeedFactory {
  static createRemoteDataSource() {
    return new FeedRemoteDataSource(httpClient)
  }

  static createRepository() {
    return new FeedRepository(this.createRemoteDataSource())
  }
}
