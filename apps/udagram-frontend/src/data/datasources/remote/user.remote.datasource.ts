import type { AxiosInstance } from 'axios'
import type { UserModel } from '../../models'

export interface IUserRemoteDataSource {
  getProfile(): Promise<UserModel>
}

export class UserRemoteDataSource implements IUserRemoteDataSource {
  readonly #httpClient: AxiosInstance
  readonly #url: string = '/api/v1/users'

  constructor(httpClient: AxiosInstance) {
    this.#httpClient = httpClient
  }

  async getProfile(): Promise<UserModel> {
    const response = await this.#httpClient.get<UserModel>(`${this.#url}/me`)
    return response.data
  }
}
