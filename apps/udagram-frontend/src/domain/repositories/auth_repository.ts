import type {
  AuthSession,
  signinRequest,
  signupRequest,
  signupResponse,
} from '../entities'

export interface IAuthRepository {
  signin(request: signinRequest): Promise<AuthSession>
  signup(request: signupRequest): Promise<signupResponse>
  signout(): Promise<void>
}
