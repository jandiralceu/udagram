import { describe, it, expect, vi } from 'vitest'
import argon2 from 'argon2'
import { faker } from '@faker-js/faker'

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
    const password = faker.internet.password()
    const hashedPassword = faker.internet.jwt()

    vi.mocked(argon2.hash).mockResolvedValue(hashedPassword)

    const result = await hashPassword(password)

    expect(result).toBe(hashedPassword)
    expect(argon2.hash).toHaveBeenCalledWith(
      password,
      expect.objectContaining({ type: 2 })
    )
  })

  it('should return true for valid password', async () => {
    vi.mocked(argon2.verify).mockResolvedValue(true)

    const password = faker.internet.password()
    const hashedPassword = faker.internet.jwt()

    const result = await verifyPassword(password, hashedPassword)

    expect(result).toBe(true)
    expect(argon2.verify).toHaveBeenCalledWith(hashedPassword, password)
  })

  it('should return false for invalid password', async () => {
    vi.mocked(argon2.verify).mockResolvedValue(false)

    const result = await verifyPassword(
      faker.internet.password(),
      faker.internet.jwt()
    )

    expect(result).toBe(false)
  })
})
