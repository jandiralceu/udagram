import type { AxiosInstance } from 'axios'
import type { UserModel } from '../../models'

export interface IUserRemoteDataSource {
  getProfile(): Promise<UserModel>
  updateAvatar(file: File): Promise<UserModel>
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

  async updateAvatar(file: File): Promise<UserModel> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.#httpClient.post<UserModel>(
      `${this.#url}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }
}
