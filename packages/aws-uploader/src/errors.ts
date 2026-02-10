export class UploaderError extends Error {
  public readonly originalError?: unknown
  public readonly code?: string

  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = 'UploaderError'
    this.originalError = originalError

    if (
      originalError &&
      typeof originalError === 'object' &&
      'name' in originalError
    ) {
      this.code = (originalError as { name: string }).name
    }
  }
}
