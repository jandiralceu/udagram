import argon2 from 'argon2'

/**
 * Hashes a plain text password using the Argon2id algorithm (hybrid resistant to GPU and side-channel attacks).
 *
 * This function handles salt generation automatically, producing a secure,
 * time-memory trade-off optimized hash suitable for password storage.
 *
 * @param password - The plain text password to be hashed.
 * @returns A Promise that resolves to the encoded hash string (containing parameters, salt, and digest).
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password, { type: argon2.argon2id })
}

/**
 * Verifies a plain text password against a stored Argon2 hash.
 *
 * @param password - The user-provided plain text password.
 * @param hash - The stored hash to compare against.
 * @returns A Promise that resolves to `true` if authentic, `false` otherwise.
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await argon2.verify(hash, password)
}
