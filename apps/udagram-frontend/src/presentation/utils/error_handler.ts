import axios, { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@domain/entities'
import { AppError } from '@domain/entities'

/**
 * Maps common HTTP status codes and backend error codes to user-friendly messages.
 */
const ERROR_MESSAGES: Record<number | string, string> = {
  // HTTP status codes
  400: 'Invalid request. Please check your information.',
  401: 'Session expired or invalid. Please sign in again.',
  403: "You don't have permission to perform this action.",
  404: 'The requested resource was not found.',
  408: 'Request timeout. Please check your connection.',
  409: 'This record already exists in our system.',
  422: 'Validation error. Please check the provided data.',
  429: 'Too many requests. Please slow down and try again later.',
  500: 'Our server encountered an issue. Please try again soon.',
  502: 'Bad gateway. Our services are currently unavailable.',
  503: 'Service unavailable. We are performing maintenance.',
  504: 'Gateway timeout. Please check your connection.',

  // Custom backend error codes
  USER_ALREADY_EXISTS: 'Wait, an account with this email already exists.',
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect.',
  FILE_TOO_LARGE: 'The selected file is too large (max 5MB).',
  INVALID_FILE_TYPE: 'Only image files (JPEG, PNG, WEBP, GIF) are allowed.',
}

const FALLBACK_MESSAGE = 'An unexpected error occurred. Please try again.'

/**
 * Parses any error into a standard AppError with a human-readable message.
 *
 * It prioritizes:
 * 1. Custom messages based on backend error codes.
 * 2. Messages based on HTTP status codes.
 * 3. The raw message from the API.
 * 4. A generic fallback message.
 */
export const parseError = (error: unknown): AppError => {
  // If it's already an AppError, just return it
  if (AppError.isAppError(error)) {
    return error
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>
    const response = axiosError.response
    const status = response?.status
    const data = response?.data

    // 1. Extract the error code from common locations in the response body
    const rawData = data as Record<string, unknown> | undefined
    const code = data?.code || rawData?.errorCode || rawData?.error_code

    // 2. HIGHEST PRIORITY: Map specific business error code if available
    if (code && ERROR_MESSAGES[code.toString()]) {
      return new AppError(
        ERROR_MESSAGES[code.toString()],
        code.toString(),
        status
      )
    }

    // 3. SECOND PRIORITY: Map general HTTP status code
    if (status && ERROR_MESSAGES[status]) {
      return new AppError(
        ERROR_MESSAGES[status],
        code?.toString() ?? `HTTP_${status}`,
        status
      )
    }

    // 4. FALLBACK: Use API's raw message or Axios default message or generic fallback
    const message = data?.message || axiosError.message || FALLBACK_MESSAGE
    return new AppError(
      message,
      code?.toString() ?? `HTTP_${status || 'ERR'}`,
      status
    )
  }

  if (error instanceof Error) {
    return new AppError(error.message)
  }

  return new AppError(FALLBACK_MESSAGE)
}
