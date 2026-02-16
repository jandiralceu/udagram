import type { signinRequest, signupRequest } from '../entities'

export interface IAuthRepository {
  signin(request: signinRequest): Promise<void>
  signup(request: signupRequest): Promise<void>
  signout(): Promise<void>
}
