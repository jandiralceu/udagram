/**
 * Standardized error codes for the Feed API.
 * These codes are used by the frontend to display user-friendly messages.
 */
export const ErrorCodes = {
  FEED_NOT_FOUND: 'FEED_NOT_FOUND',
  NO_FILE_UPLOADED: 'NO_FILE_UPLOADED',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
