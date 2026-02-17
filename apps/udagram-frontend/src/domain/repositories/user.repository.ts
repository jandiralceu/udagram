import type { User } from '../entities/user'

export interface IUserRepository {
  getProfile(): Promise<User>
  updateAvatar(file: File): Promise<void>
}
