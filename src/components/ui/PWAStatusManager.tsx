import { useEffect } from 'react'
import { usePWA } from '../../hooks/usePWA'
import { useToast } from './Toast'

/**
 * Manages PWA status notifications and updates
 */
export function PWAStatusManager() {
  const { 
    isOnline, 
    isUpdateAvailable, 
    syncStatus, 
    lastSyncTime 
  } = usePWA()
  
  const { success, info, warning, error } = useToast()

  // Handle online/offline status changes
  useEffect(() => {
    if (isOnline) {
      success('Back online', 'Your data will sync automatically')
    } else {
      warning('You\'re offline', 'Don\'t worry, you can still capture ideas')
    }
  }, [isOnline, success, warning])

  // Handle app updates
  useEffect(() => {
    if (isUpdateAvailable) {
      info(
        'Update available', 
        'Click the update icon in the header to get the latest features'
      )
    }
  }, [isUpdateAvailable, info])

  // Handle sync status changes
  useEffect(() => {
    if (syncStatus === 'syncing') {
      info('Syncing data...', 'Your offline changes are being saved')
    } else if (syncStatus === 'error') {
      error('Sync failed', 'We\'ll try again when you\'re back online')
    }
  }, [syncStatus, info, error])

  // Handle successful sync
  useEffect(() => {
    if (lastSyncTime && syncStatus === 'idle') {
      const now = new Date()
      const timeDiff = now.getTime() - lastSyncTime.getTime()
      
      // Only show success message if sync happened recently (within 5 seconds)
      if (timeDiff < 5000) {
        success('Data synced', 'All your changes are saved')
      }
    }
  }, [lastSyncTime, syncStatus, success])

  // This component doesn't render anything visible
  return null
}