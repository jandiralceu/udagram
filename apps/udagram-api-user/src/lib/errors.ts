/**
 * Standard error codes for the User API.
 * These codes are used by the frontend to provide specific error messages.
 */
export const ErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  NO_FILE_UPLOADED: 'NO_FILE_UPLOADED',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = keyof typeof ErrorCodes
