/**
 * Cross-platform utility functions
 * Provides consistent behavior across different platforms
 */

/**
 * Platform detection utilities
 */
export class PlatformDetection {
  /**
   * Detect the current platform
   */
  static getCurrentPlatform(): Platform {
    // React Native detection
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return this.getReactNativePlatform()
    }

    // Electron detection
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return {
        type: 'desktop',
        name: 'Electron',
        version: (window as any).electronAPI.version || 'unknown',
        os: this.getOperatingSystem()
      }
    }

    // Web browser detection
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return {
        type: 'web',
        name: this.getBrowserName(),
        version: this.getBrowserVersion(),
        os: this.getOperatingSystem()
      }
    }

    // Node.js/Server detection
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return {
        type: 'server',
        name: 'Node.js',
        version: process.versions.node,
        os: process.platform
      }
    }

    // Fallback
    return {
      type: 'unknown',
      name: 'Unknown',
      version: 'unknown',
      os: 'unknown'
    }
  }

  private static getReactNativePlatform(): Platform {
    // Try to get platform info from React Native
    try {
      const Platform = require('react-native').Platform
      return {
        type: Platform.OS === 'ios' ? 'ios' : 'android',
        name: Platform.OS === 'ios' ? 'iOS' : 'Android',
        version: Platform.Version?.toString() || 'unknown',
        os: Platform.OS
      }
    } catch {
      // Fallback if React Native is not available
      return {
        type: 'mobile',
        name: 'Mobile',
        version: 'unknown',
        os: 'unknown'
      }
    }
  }

  private static getBrowserName(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome')) return 'Chrome'
    if (userAgent.includes('firefox')) return 'Firefox'
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari'
    if (userAgent.includes('edge')) return 'Edge'
    if (userAgent.includes('opera')) return 'Opera'
    
    return 'Unknown Browser'
  }

  private static getBrowserVersion(): string {
    const userAgent = navigator.userAgent
    const match = userAgent.match(/(chrome|firefox|safari|edge|opera)\/(\d+)/i)
    return match ? match[2] : 'unknown'
  }

  private static getOperatingSystem(): string {
    if (typeof navigator === 'undefined') return 'unknown'
    
    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform.toLowerCase()
    
    if (platform.includes('win')) return 'Windows'
    if (platform.includes('mac')) return 'macOS'
    if (platform.includes('linux')) return 'Linux'
    if (userAgent.includes('android')) return 'Android'
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS'
    
    return 'Unknown OS'
  }

  /**
   * Check if running on mobile device
   */
  static isMobile(): boolean {
    const platform = this.getCurrentPlatform()
    return platform.type === 'ios' || platform.type === 'android' || platform.type === 'mobile'
  }

  /**
   * Check if running on desktop
   */
  static isDesktop(): boolean {
    const platform = this.getCurrentPlatform()
    return platform.type === 'desktop' || 
           (platform.type === 'web' && !this.isMobileWeb())
  }

  /**
   * Check if running on web
   */
  static isWeb(): boolean {
    return this.getCurrentPlatform().type === 'web'
  }

  /**
   * Check if running on mobile web
   */
  static isMobileWeb(): boolean {
    if (typeof window === 'undefined') return false
    
    return window.matchMedia('(max-width: 768px)').matches ||
           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * Get device capabilities
   */
  static getDeviceCapabilities(): DeviceCapabilities {
    return {
      touchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      camera: this.hasMediaDevices() && this.hasGetUserMedia(),
      microphone: this.hasMediaDevices() && this.hasGetUserMedia(),
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webAssembly: typeof WebAssembly !== 'undefined',
      localStorage: this.hasLocalStorage(),
      indexedDB: this.hasIndexedDB(),
      webGL: this.hasWebGL(),
      webRTC: this.hasWebRTC()
    }
  }

  private static hasMediaDevices(): boolean {
    return typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator && 
           'getUserMedia' in navigator.mediaDevices
  }

  private static hasGetUserMedia(): boolean {
    return typeof navigator !== 'undefined' && 
           ('getUserMedia' in navigator || 
            'webkitGetUserMedia' in navigator || 
            'mozGetUserMedia' in navigator)
  }

  private static hasLocalStorage(): boolean {
    try {
      return typeof localStorage !== 'undefined' && localStorage !== null
    } catch {
      return false
    }
  }

  private static hasIndexedDB(): boolean {
    return typeof indexedDB !== 'undefined'
  }

  private static hasWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch {
      return false
    }
  }

  private static hasWebRTC(): boolean {
    return typeof RTCPeerConnection !== 'undefined' ||
           typeof (window as any).webkitRTCPeerConnection !== 'undefined' ||
           typeof (window as any).mozRTCPeerConnection !== 'undefined'
  }
}

/**
 * File system utilities that work across platforms
 */
export class FileSystemUtils {
  /**
   * Read file as text
   */
  static async readFileAsText(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  /**
   * Read file as data URL
   */
  static async readFileAsDataURL(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  /**
   * Read file as array buffer
   */
  static async readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Download file (web only)
   */
  static downloadFile(data: string | Blob, filename: string, mimeType?: string): void {
    if (PlatformDetection.isWeb()) {
      const blob = typeof data === 'string' 
        ? new Blob([data], { type: mimeType || 'text/plain' })
        : data

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : ''
  }

  /**
   * Get MIME type from file extension
   */
  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      
      // Video
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      
      // Documents
      pdf: 'application/pdf',
      txt: 'text/plain',
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml'
    }

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

/**
 * Network utilities for cross-platform networking
 */
export class NetworkUtils {
  /**
   * Check if online
   */
  static isOnline(): boolean {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine
    }
    return true // Assume online if can't detect
  }

  /**
   * Get connection type (if available)
   */
  static getConnectionType(): ConnectionType {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return connection.effectiveType || connection.type || 'unknown'
    }
    return 'unknown'
  }

  /**
   * Estimate connection speed
   */
  static async estimateConnectionSpeed(): Promise<number> {
    if (!this.isOnline()) return 0

    try {
      const startTime = performance.now()
      const response = await fetch('/favicon.ico', { cache: 'no-cache' })
      const endTime = performance.now()
      
      if (response.ok) {
        const duration = endTime - startTime
        const bytes = parseInt(response.headers.get('content-length') || '1024')
        return (bytes * 8) / (duration / 1000) // bits per second
      }
    } catch {
      // Ignore errors
    }

    return -1 // Unknown speed
  }

  /**
   * Create fetch with timeout
   */
  static fetchWithTimeout(
    url: string, 
    options: RequestInit = {}, 
    timeout: number = 30000
  ): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ])
  }

  /**
   * Retry fetch with exponential backoff
   */
  static async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<Response> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)
        if (response.ok) {
          return response
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt)
          await this.delay(delay)
        }
      }
    }

    throw lastError!
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Storage utilities for cross-platform data persistence
 */
export class StorageUtils {
  /**
   * Get available storage quota (web only)
   */
  static async getStorageQuota(): Promise<StorageQuota | null> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        }
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * Check if persistent storage is available
   */
  static async isPersistentStorageAvailable(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'persist' in navigator.storage) {
      try {
        return await navigator.storage.persist()
      } catch {
        return false
      }
    }
    return false
  }

  /**
   * Clear all storage (web only)
   */
  static async clearAllStorage(): Promise<void> {
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }

    // Clear sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }

    // Clear IndexedDB
    if (typeof indexedDB !== 'undefined') {
      try {
        const databases = await indexedDB.databases()
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!)
                deleteReq.onsuccess = () => resolve()
                deleteReq.onerror = () => reject(deleteReq.error)
              })
            }
          })
        )
      } catch {
        // Ignore errors
      }
    }

    // Clear cache storage
    if (typeof caches !== 'undefined') {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      } catch {
        // Ignore errors
      }
    }
  }
}

/**
 * Date and time utilities for cross-platform consistency
 */
export class DateTimeUtils {
  /**
   * Format date for display
   */
  static formatDate(date: Date, format: DateFormat = 'short'): string {
    const options: Intl.DateTimeFormatOptions = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    }[format]

    return new Intl.DateTimeFormat(undefined, options).format(date)
  }

  /**
   * Format time for display
   */
  static formatTime(date: Date, format: TimeFormat = 'short'): string {
    const options: Intl.DateTimeFormatOptions = {
      short: { hour: 'numeric', minute: '2-digit' },
      long: { hour: 'numeric', minute: '2-digit', second: '2-digit' }
    }[format]

    return new Intl.DateTimeFormat(undefined, options).format(date)
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
    
    return this.formatDate(date)
  }

  /**
   * Get timezone offset
   */
  static getTimezoneOffset(): number {
    return new Date().getTimezoneOffset()
  }

  /**
   * Convert to UTC
   */
  static toUTC(date: Date): Date {
    return new Date(date.getTime() + (date.getTimezoneOffset() * 60000))
  }

  /**
   * Convert from UTC
   */
  static fromUTC(date: Date): Date {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
  }
}

/**
 * Performance utilities for cross-platform optimization
 */
export class PerformanceUtils {
  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | number | undefined

    return (...args: Parameters<T>) => {
      clearTimeout(timeout as any)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  /**
   * Measure execution time
   */
  static async measureTime<T>(
    operation: () => Promise<T> | T,
    label?: string
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await operation()
    const duration = performance.now() - start

    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`)
    }

    return { result, duration }
  }

  /**
   * Request animation frame (cross-platform)
   */
  static requestAnimationFrame(callback: () => void): number {
    if (typeof requestAnimationFrame !== 'undefined') {
      return requestAnimationFrame(callback)
    } else {
      return setTimeout(callback, 16) as any // ~60fps fallback
    }
  }

  /**
   * Cancel animation frame (cross-platform)
   */
  static cancelAnimationFrame(id: number): void {
    if (typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(id)
    } else {
      clearTimeout(id)
    }
  }
}

// Type definitions
export interface Platform {
  type: 'web' | 'ios' | 'android' | 'desktop' | 'server' | 'mobile' | 'unknown'
  name: string
  version: string
  os: string
}

export interface DeviceCapabilities {
  touchScreen: boolean
  camera: boolean
  microphone: boolean
  geolocation: boolean
  notifications: boolean
  serviceWorker: boolean
  webAssembly: boolean
  localStorage: boolean
  indexedDB: boolean
  webGL: boolean
  webRTC: boolean
}

export interface StorageQuota {
  quota: number
  usage: number
  available: number
}

export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'ethernet' | 'unknown'
export type DateFormat = 'short' | 'long' | 'full'
export type TimeFormat = 'short' | 'long'