import { useState, useEffect } from 'react'
import { pwaService, type PWAServiceState } from '@core/services/PWAService'

/**
 * Hook for PWA functionality
 */
export function usePWA() {
  const [state, setState] = useState<PWAServiceState>(pwaService.getState())

  useEffect(() => {
    const unsubscribe = pwaService.subscribe(setState)
    return () => {
      unsubscribe()
    }
  }, [])

  const promptInstall = async () => {
    return await pwaService.promptInstall()
  }

  const updateApp = async () => {
    await pwaService.updateApp()
  }

  const triggerSync = async () => {
    await pwaService.triggerBackgroundSync()
  }

  const requestNotifications = async () => {
    return await pwaService.requestNotificationPermission()
  }

  return {
    ...state,
    promptInstall,
    updateApp,
    triggerSync,
    requestNotifications
  }
}