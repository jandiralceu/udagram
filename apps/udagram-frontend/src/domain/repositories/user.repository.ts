import type { User } from '@domain/entities'

export interface IUserRepository {
  getProfile(): Promise<User>
  updateAvatar(file: File): Promise<void>
}
