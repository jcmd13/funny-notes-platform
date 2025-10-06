import { useState, useCallback } from 'react'
import { useToast } from '../components/ui/Toast'

export interface ErrorWithRetry extends Error {
  retryable?: boolean
  retryCount?: number
  maxRetries?: number
}

export interface UseErrorHandlerOptions {
  maxRetries?: number
  retryDelay?: number
  showToast?: boolean
  logErrors?: boolean
}

/**
 * Enhanced error handler with retry mechanisms and user-friendly messaging
 */
export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    showToast = true,
    logErrors = true
  } = options

  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { error: showErrorToast, warning: showWarningToast } = useToast()

  const handleError = useCallback(async (
    error: Error | ErrorWithRetry,
    operation?: () => Promise<any>,
    context?: string
  ) => {
    if (logErrors) {
      console.error(`Error in ${context || 'operation'}:`, error)
    }

    const errorWithRetry = error as ErrorWithRetry
    const currentRetryCount = errorWithRetry.retryCount || 0
    const maxRetriesForError = errorWithRetry.maxRetries || maxRetries

    // Show user-friendly error message
    if (showToast) {
      const userMessage = getUserFriendlyErrorMessage(error, context)
      
      if (errorWithRetry.retryable !== false && operation && currentRetryCount < maxRetriesForError) {
        showWarningToast(
          'Something went wrong',
          `${userMessage} We'll try again automatically.`
        )
      } else {
        showErrorToast(
          'Error occurred',
          userMessage
        )
      }
    }

    // Attempt retry if operation is provided and error is retryable
    if (
      operation &&
      errorWithRetry.retryable !== false &&
      currentRetryCount < maxRetriesForError
    ) {
      setIsRetrying(true)
      setRetryCount(currentRetryCount + 1)

      try {
        // Wait before retrying (exponential backoff)
        const delay = retryDelay * Math.pow(2, currentRetryCount)
        await new Promise(resolve => setTimeout(resolve, delay))

        const result = await operation()
        
        // Reset retry count on success
        setRetryCount(0)
        setIsRetrying(false)
        
        return result
      } catch (retryError) {
        const retryErrorWithCount = retryError as ErrorWithRetry
        retryErrorWithCount.retryCount = currentRetryCount + 1
        retryErrorWithCount.maxRetries = maxRetriesForError
        
        setIsRetrying(false)
        
        // Recursively handle the retry error
        return handleError(retryErrorWithCount, operation, context)
      }
    }

    setIsRetrying(false)
    throw error
  }, [maxRetries, retryDelay, showToast, logErrors, showErrorToast, showWarningToast])

  const withErrorHandling = useCallback(<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await operation(...args)
      } catch (error) {
        return handleError(error as Error, () => operation(...args), context)
      }
    }
  }, [handleError])

  const createRetryableOperation = useCallback(<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    context?: string,
    retryOptions?: { maxRetries?: number; retryable?: boolean }
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await operation(...args)
      } catch (error) {
        const retryableError = error as ErrorWithRetry
        retryableError.retryable = retryOptions?.retryable ?? true
        retryableError.maxRetries = retryOptions?.maxRetries ?? maxRetries
        
        return handleError(retryableError, () => operation(...args), context)
      }
    }
  }, [handleError, maxRetries])

  return {
    handleError,
    withErrorHandling,
    createRetryableOperation,
    isRetrying,
    retryCount
  }
}

/**
 * Convert technical errors into user-friendly messages
 */
function getUserFriendlyErrorMessage(error: Error, context?: string): string {
  const message = error.message.toLowerCase()

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return "Couldn't connect to the server. Please check your internet connection."
  }

  // Storage errors
  if (message.includes('storage') || message.includes('quota') || message.includes('disk')) {
    return "Not enough storage space available. Please free up some space and try again."
  }

  // Permission errors
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
    return "You don't have permission to perform this action."
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return "Please check your input and try again."
  }

  // File/media errors
  if (message.includes('file') || message.includes('media') || message.includes('upload')) {
    return "There was a problem with the file. Please try a different file or format."
  }

  // Sync errors
  if (message.includes('sync') || message.includes('conflict')) {
    return "There was a sync conflict. Your data is safe, but some changes may need to be reviewed."
  }

  // Generic context-based messages
  if (context) {
    switch (context.toLowerCase()) {
      case 'capture':
      case 'note creation':
        return "Couldn't save your note. Don't worry, we'll keep trying."
      case 'search':
        return "Search is temporarily unavailable. Please try again in a moment."
      case 'sync':
        return "Sync is having trouble. Your data is safe and we'll sync when possible."
      case 'load':
      case 'fetch':
        return "Couldn't load the data. Please try refreshing the page."
      default:
        return "Something unexpected happened. Please try again."
    }
  }

  // Fallback message
  return "Something went wrong. Please try again, and contact support if the problem persists."
}

/**
 * Hook for handling async operations with built-in error handling and loading states
 */
export const useAsyncOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: UseErrorHandlerOptions & { 
    context?: string
    onSuccess?: (result: R) => void
    onError?: (error: Error) => void
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<R | null>(null)
  
  const { handleError, isRetrying } = useErrorHandler(options)

  const execute = useCallback(async (...args: T) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await operation(...args)
      setData(result)
      options.onSuccess?.(result)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      options.onError?.(error)
      
      try {
        return await handleError(error, () => operation(...args), options.context)
      } catch (finalError) {
        throw finalError
      }
    } finally {
      setIsLoading(false)
    }
  }, [operation, handleError, options])

  const reset = useCallback(() => {
    setError(null)
    setData(null)
    setIsLoading(false)
  }, [])

  return {
    execute,
    reset,
    isLoading: isLoading || isRetrying,
    error,
    data,
    isRetrying
  }
}