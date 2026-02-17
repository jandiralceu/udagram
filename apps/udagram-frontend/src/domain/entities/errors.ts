/**
 * Represents a business or infrastructure error within the application.
 * Encapsulates the message, a stable error code, and the original status code if applicable.
 */
export class AppError extends Error {
  public override readonly message: string
  public readonly code: string
  public readonly statusCode?: number

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode?: number
  ) {
    super(message)
    this.message = message
    this.code = code
    this.statusCode = statusCode
    this.name = 'AppError'
  }

  /**
   * Helper to identify if an error is an AppError
   */
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError
  }
}

/**
 * Standard API error response structure expected from the backend.
 */
export interface ApiErrorResponse {
  message: string
  code?: string
}
