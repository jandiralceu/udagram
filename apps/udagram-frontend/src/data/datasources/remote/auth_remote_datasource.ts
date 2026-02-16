import type { AxiosInstance } from 'axios'
import type {
  signinRequest,
  signupRequest,
  signupResponse,
} from '@domain/entities'
import type { AuthSessionModel } from '../../models'

export interface IAuthRemoteDataSource {
  signin(request: signinRequest): Promise<AuthSessionModel>
  signup(request: signupRequest): Promise<signupResponse>
  signout(refreshToken: string): Promise<void>
}

export class AuthRemoteDataSource implements IAuthRemoteDataSource {
  readonly #httpClient: AxiosInstance
  readonly #url: string = '/api/v1/auth'

  constructor(httpClient: AxiosInstance) {
    this.#httpClient = httpClient
  }

  async signin(request: signinRequest): Promise<AuthSessionModel> {
    const response = await this.#httpClient.post<AuthSessionModel>(
      `${this.#url}/signin`,
      request
    )
    return response.data
  }

  async signup(request: signupRequest): Promise<signupResponse> {
    const response = await this.#httpClient.post<signupResponse>(
      `${this.#url}/signup`,
      request
    )
    return response.data
  }

  async signout(refreshToken: string): Promise<void> {
    return this.#httpClient.delete(`${this.#url}/signout`, {
      data: { refreshToken },
    })
  }
}
