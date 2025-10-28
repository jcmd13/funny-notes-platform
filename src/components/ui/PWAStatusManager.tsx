import { usePWA } from '../../hooks/usePWA'
import { useToast } from '../../hooks/useToast'
import { useEffect } from 'react'

export function PWAStatusManager() {
  const { isOnline, isUpdateAvailable } = usePWA()
  const { info, warning } = useToast()

  // Show update notification
  useEffect(() => {
    if (isUpdateAvailable) {
      info('Update Available', 'A new version of the app is ready to install.')
    }
  }, [isUpdateAvailable, info])

  // Show offline notification
  useEffect(() => {
    if (!isOnline) {
      warning('You\'re Offline', 'Working in offline mode. Changes will sync when connection is restored.')
    }
  }, [isOnline, warning])

  return null // This component only manages notifications
}