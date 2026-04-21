// Centralized error handling utility

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown, context?: string): void {
  if (error instanceof AppError) {
    // Handle application-specific errors
    console.error(`[${context || 'App'}] ${error.code}: ${error.message}`)
  } else if (error instanceof Error) {
    // Handle generic errors
    console.error(`[${context || 'App'}] ${error.message}`)
  } else {
    // Handle unknown errors
    console.error(`[${context || 'App'}] Unknown error:`, error)
  }

  // In production, you would send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  } else if (error instanceof Error) {
    return error.message
  } else if (typeof error === 'string') {
    return error
  } else {
    return 'An unexpected error occurred'
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    )
  }
  return false
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('auth') ||
      error.message.includes('unauthorized') ||
      error.message.includes('401')
    )
  }
  return false
}
