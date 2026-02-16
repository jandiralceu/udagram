import type { AxiosInstance } from 'axios'
import type { User } from '@domain/entities'

export interface IUserRemoteDataSource {
  getProfile(): Promise<User>
}

export class UserRemoteDataSource implements IUserRemoteDataSource {
  readonly #httpClient: AxiosInstance
  readonly #url: string = '/api/v1/users'

  constructor(httpClient: AxiosInstance) {
    this.#httpClient = httpClient
  }

  async getProfile(): Promise<User> {
    return (await this.#httpClient.get<User>(`${this.#url}/me`)).data
  }
}
