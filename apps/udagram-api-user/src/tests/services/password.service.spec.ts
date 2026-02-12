import { describe, it, expect, vi } from 'vitest'
import argon2 from 'argon2'
import {
  hashPassword,
  verifyPassword,
} from '../../services/password.service.js'

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn(),
    verify: vi.fn(),
    argon2id: 2,
  },
}))

describe('Password Service', () => {
  it('should hash password using argon2', async () => {
    vi.mocked(argon2.hash).mockResolvedValue('hashed_password')

    const result = await hashPassword('password123')

    expect(result).toBe('hashed_password')
    expect(argon2.hash).toHaveBeenCalledWith(
      'password123',
      expect.objectContaining({ type: 2 })
    )
  })

  it('should return true for valid password', async () => {
    vi.mocked(argon2.verify).mockResolvedValue(true)

    const result = await verifyPassword('password123', 'hashed_password')

    expect(result).toBe(true)
    expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123')
  })

  it('should return false for invalid password', async () => {
    vi.mocked(argon2.verify).mockResolvedValue(false)

    const result = await verifyPassword('wrong', 'hashed_password')

    expect(result).toBe(false)
  })
})
