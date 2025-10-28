import { useEffect, useState } from 'react'
import { StorageFactory } from '../core/storage'
import type { StorageService } from '../core/storage'

/**
 * Hook for accessing the storage service instance
 * Provides a singleton storage service with initialization handling
 */
export function useStorage() {
  const [storageService, setStorageService] = useState<StorageService | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeStorage = async () => {
      try {
        const service = await StorageFactory.getInstance()
        if (mounted) {
          setStorageService(service)
          setIsInitialized(true)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize storage'))
          setIsInitialized(false)
        }
      }
    }

    initializeStorage()

    return () => {
      mounted = false
    }
  }, [])

  return {
    storageService,
    isInitialized,
    error,
  }
}