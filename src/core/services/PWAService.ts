/**
 * PWA Service for managing installation, updates, and offline functionality
 */

export interface PWAInstallPrompt {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PWAServiceState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  isUpdateAvailable: boolean
  syncStatus: 'idle' | 'syncing' | 'error'
  lastSyncTime?: Date
}

export class PWAService {
  private installPrompt: PWAInstallPrompt | null = null
  private state: PWAServiceState = {
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    isUpdateAvailable: false,
    syncStatus: 'idle'
  }
  private listeners: Set<(state: PWAServiceState) => void> = new Set()

  constructor() {
    this.initializeEventListeners()
    this.checkInstallationStatus()
  }

  /**
   * Initialize PWA event listeners
   */
  private initializeEventListeners() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.installPrompt = e as any
      this.updateState({ isInstallable: true })
    })

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null
      this.updateState({ 
        isInstalled: true, 
        isInstallable: false 
      })
    })

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.updateState({ isOnline: true })
      this.triggerBackgroundSync()
    })

    window.addEventListener('offline', () => {
      this.updateState({ isOnline: false })
    })

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          this.updateState({ isUpdateAvailable: true })
        }
      })
    }
  }

  /**
   * Check if app is already installed
   */
  private checkInstallationStatus() {
    try {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      if (isStandalone || isIOSStandalone) {
        this.updateState({ isInstalled: true })
      }
    } catch (error) {
      // Gracefully handle environments where matchMedia is not available
      console.debug('matchMedia not available:', error)
    }
  }

  /**
   * Prompt user to install the PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      return false
    }

    try {
      await this.installPrompt.prompt()
      const choiceResult = await this.installPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        this.installPrompt = null
        this.updateState({ isInstallable: false })
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error prompting for install:', error)
      return false
    }
  }

  /**
   * Trigger background sync for offline data
   */
  async triggerBackgroundSync() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return
    }

    try {
      this.updateState({ syncStatus: 'syncing' })
      
      // Send message to service worker to trigger sync
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_SYNC',
        timestamp: Date.now()
      })

      // Update last sync time
      this.updateState({ 
        syncStatus: 'idle',
        lastSyncTime: new Date()
      })
    } catch (error) {
      console.error('Background sync failed:', error)
      this.updateState({ syncStatus: 'error' })
    }
  }

  /**
   * Update service worker and reload app
   */
  async updateApp() {
    if (!('serviceWorker' in navigator)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating app:', error)
    }
  }

  /**
   * Get current PWA state
   */
  getState(): PWAServiceState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: PWAServiceState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<PWAServiceState>) {
    this.state = { ...this.state, ...updates }
    this.listeners.forEach(listener => listener(this.state))
  }

  /**
   * Check if push notifications are supported and get permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission()
    }

    return Notification.permission
  }

  /**
   * Register for push notifications (foundation for future backend integration)
   */
  async registerPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        return null
      }

      const permission = await this.requestNotificationPermission()
      if (permission !== 'granted') {
        return null
      }

      // This would need a VAPID key from your backend
      // For now, we're just setting up the foundation
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
      })

      return subscription
    } catch (error) {
      console.error('Error registering push notifications:', error)
      return null
    }
  }
}

// Singleton instance
export const pwaService = new PWAService()