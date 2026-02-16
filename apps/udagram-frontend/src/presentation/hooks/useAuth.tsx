import { useContext, createContext } from 'react'
import type {
  AuthSession,
  signinRequest,
  signupRequest,
  signupResponse,
  User,
} from '../../domain/entities'

export type AuthState = {
  user: User | undefined
  isAuthenticated: boolean
  isAuthenticating: boolean
  signin(request: signinRequest): Promise<AuthSession>
  signup(request: signupRequest): Promise<signupResponse>
  signout(): Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
