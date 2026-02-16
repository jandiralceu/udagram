import type { User } from '@domain/entities'

export interface IUserRepository {
  getProfile(): Promise<User>
}
