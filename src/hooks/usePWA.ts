import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isOnline: boolean
  isInstallable: boolean
  isUpdateAvailable: boolean
  syncStatus: 'idle' | 'syncing' | 'error'
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isUpdateAvailable: false,
    syncStatus: 'idle'
  })
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setState(prev => ({ ...prev, isInstallable: true }))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          setState(prev => ({ ...prev, isUpdateAvailable: true }))
        }
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstallable: false }))
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    }
  }

  const updateApp = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    }
  }

  const triggerSync = async () => {
    setState(prev => ({ ...prev, syncStatus: 'syncing' }))
    
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 1000))
      setState(prev => ({ ...prev, syncStatus: 'idle' }))
    } catch (error) {
      setState(prev => ({ ...prev, syncStatus: 'error' }))
      setTimeout(() => {
        setState(prev => ({ ...prev, syncStatus: 'idle' }))
      }, 3000)
    }
  }

  return {
    ...state,
    promptInstall,
    updateApp,
    triggerSync
  }
}