import type { 
  IPlatformAdapter, 
  PlatformType, 
  PlatformCapabilities 
} from '../adapters/IPlatformAdapter'
import type { 
  PlatformContract, 
  PlatformConfig, 
  PlatformId 
} from '../contracts/PlatformContracts'

/**
 * Factory for creating platform-specific implementations
 * This allows the shared library to work across different platforms
 */
export class PlatformFactory {
  private static registeredPlatforms = new Map<PlatformType, PlatformConstructor>()
  private static defaultConfigs = new Map<PlatformType, Partial<PlatformConfig>>()

  /**
   * Register a platform implementation
   */
  static registerPlatform(
    platformType: PlatformType,
    constructor: PlatformConstructor,
    defaultConfig?: Partial<PlatformConfig>
  ): void {
    this.registeredPlatforms.set(platformType, constructor)
    if (defaultConfig) {
      this.defaultConfigs.set(platformType, defaultConfig)
    }
  }

  /**
   * Create a platform adapter instance
   */
  static async createPlatformAdapter(
    platformType: PlatformType,
    config?: Partial<PlatformConfig>
  ): Promise<IPlatformAdapter> {
    const Constructor = this.registeredPlatforms.get(platformType)
    if (!Constructor) {
      throw new Error(`Platform ${platformType} is not registered`)
    }

    const defaultConfig = this.defaultConfigs.get(platformType) || {}
    const finalConfig = { ...defaultConfig, ...config }

    const adapter = new Constructor(finalConfig)
    await adapter.initialize()
    
    return adapter
  }

  /**
   * Get available platforms
   */
  static getAvailablePlatforms(): PlatformType[] {
    return Array.from(this.registeredPlatforms.keys())
  }

  /**
   * Check if a platform is supported
   */
  static isPlatformSupported(platformType: PlatformType): boolean {
    return this.registeredPlatforms.has(platformType)
  }

  /**
   * Auto-detect current platform
   */
  static detectPlatform(): PlatformType {
    // Check for React Native
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      // Further detect iOS vs Android
      if (typeof window !== 'undefined' && (window as any).DeviceInfo) {
        const platform = (window as any).DeviceInfo.platform
        return platform === 'ios' ? 'ios' : 'android'
      }
      return 'ios' // Default to iOS for React Native
    }

    // Check for Electron
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return 'desktop'
    }

    // Check for Web
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return 'web'
    }

    // Default fallback
    return 'web'
  }

  /**
   * Create platform adapter with auto-detection
   */
  static async createAutoDetectedAdapter(
    config?: Partial<PlatformConfig>
  ): Promise<IPlatformAdapter> {
    const platformType = this.detectPlatform()
    return this.createPlatformAdapter(platformType, config)
  }

  /**
   * Get platform capabilities without creating an instance
   */
  static getPlatformCapabilities(platformType: PlatformType): PlatformCapabilities | null {
    const Constructor = this.registeredPlatforms.get(platformType)
    if (!Constructor || !Constructor.getCapabilities) {
      return null
    }
    return Constructor.getCapabilities()
  }

  /**
   * Validate platform configuration
   */
  static validateConfig(
    platformType: PlatformType, 
    config: Partial<PlatformConfig>
  ): ConfigValidationResult {
    const Constructor = this.registeredPlatforms.get(platformType)
    if (!Constructor) {
      return {
        valid: false,
        errors: [`Platform ${platformType} is not registered`]
      }
    }

    if (Constructor.validateConfig) {
      return Constructor.validateConfig(config)
    }

    return { valid: true, errors: [] }
  }

  /**
   * Get recommended configuration for a platform
   */
  static getRecommendedConfig(
    platformType: PlatformType,
    environment: 'development' | 'staging' | 'production' = 'production'
  ): Partial<PlatformConfig> {
    const Constructor = this.registeredPlatforms.get(platformType)
    if (Constructor && Constructor.getRecommendedConfig) {
      return Constructor.getRecommendedConfig(environment)
    }

    const defaultConfig = this.defaultConfigs.get(platformType) || {}
    return {
      ...defaultConfig,
      environment,
      features: {
        offlineMode: true,
        autoSync: environment !== 'development',
        analytics: environment === 'production',
        crashReporting: environment === 'production'
      }
    }
  }
}

/**
 * Interface for platform constructor functions
 */
export interface PlatformConstructor {
  new (config: Partial<PlatformConfig>): IPlatformAdapter
  
  // Static methods for platform information
  getCapabilities?(): PlatformCapabilities
  validateConfig?(config: Partial<PlatformConfig>): ConfigValidationResult
  getRecommendedConfig?(environment: string): Partial<PlatformConfig>
}

export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Platform registry for easier management
 */
export class PlatformRegistry {
  private static instance: PlatformRegistry
  private platforms = new Map<string, PlatformInfo>()

  static getInstance(): PlatformRegistry {
    if (!this.instance) {
      this.instance = new PlatformRegistry()
    }
    return this.instance
  }

  /**
   * Register platform information
   */
  registerPlatform(info: PlatformInfo): void {
    this.platforms.set(info.id, info)
  }

  /**
   * Get platform information
   */
  getPlatformInfo(id: string): PlatformInfo | undefined {
    return this.platforms.get(id)
  }

  /**
   * List all registered platforms
   */
  listPlatforms(): PlatformInfo[] {
    return Array.from(this.platforms.values())
  }

  /**
   * Find platforms by capability
   */
  findPlatformsByCapability(capability: string): PlatformInfo[] {
    return Array.from(this.platforms.values()).filter(platform =>
      platform.capabilities.includes(capability)
    )
  }
}

export interface PlatformInfo {
  id: string
  name: string
  version: string
  description: string
  capabilities: string[]
  supported: boolean
  constructor: PlatformConstructor
}

/**
 * Utility functions for platform management
 */
export class PlatformUtils {
  /**
   * Check if current environment supports a feature
   */
  static isFeatureSupported(feature: string): boolean {
    const platformType = PlatformFactory.detectPlatform()
    const capabilities = PlatformFactory.getPlatformCapabilities(platformType)
    
    if (!capabilities) return false

    // Check various capability categories
    switch (feature) {
      case 'camera':
        return capabilities.camera
      case 'microphone':
        return capabilities.microphone
      case 'geolocation':
        return capabilities.geolocation
      case 'notifications':
        return capabilities.pushNotifications
      case 'biometrics':
        return capabilities.biometrics
      case 'haptics':
        return capabilities.haptics
      case 'background-sync':
        return capabilities.backgroundProcessing
      case 'file-system':
        return capabilities.fileSystem
      default:
        return false
    }
  }

  /**
   * Get optimal configuration for current platform
   */
  static getOptimalConfig(): Partial<PlatformConfig> {
    const platformType = PlatformFactory.detectPlatform()
    const capabilities = PlatformFactory.getPlatformCapabilities(platformType)
    
    if (!capabilities) {
      return {}
    }

    return {
      performance: {
        cacheSize: capabilities.offlineStorage ? 100 * 1024 * 1024 : 10 * 1024 * 1024, // 100MB vs 10MB
        maxConcurrentOperations: capabilities.backgroundProcessing ? 10 : 3,
        backgroundSyncInterval: capabilities.backgroundProcessing ? 30000 : 300000, // 30s vs 5min
        compressionLevel: capabilities.offlineStorage ? 2 : 1,
        preloadStrategy: capabilities.offlineStorage ? 'aggressive' : 'conservative'
      },
      security: {
        encryptionEnabled: capabilities.offlineStorage,
        biometricAuthEnabled: capabilities.biometrics,
        sessionTimeout: capabilities.backgroundProcessing ? 3600000 : 1800000, // 1h vs 30min
        maxLoginAttempts: 3,
        requireSecureConnection: true
      },
      ui: {
        theme: 'auto',
        animations: true,
        hapticFeedback: capabilities.haptics,
        soundEffects: true,
        accessibility: {
          screenReaderSupport: true,
          highContrastMode: false,
          largeTextMode: false,
          reducedMotion: false
        }
      }
    }
  }

  /**
   * Create a platform-optimized storage configuration
   */
  static getStorageConfig(platformType: PlatformType): StorageConfig {
    switch (platformType) {
      case 'web':
        return {
          adapter: 'indexeddb',
          maxSize: 50 * 1024 * 1024, // 50MB
          compression: true,
          encryption: false
        }
      
      case 'ios':
      case 'android':
        return {
          adapter: 'sqlite',
          maxSize: 500 * 1024 * 1024, // 500MB
          compression: true,
          encryption: true
        }
      
      case 'desktop':
        return {
          adapter: 'sqlite',
          maxSize: 1024 * 1024 * 1024, // 1GB
          compression: false,
          encryption: true
        }
      
      default:
        return {
          adapter: 'memory',
          maxSize: 10 * 1024 * 1024, // 10MB
          compression: false,
          encryption: false
        }
    }
  }
}

export interface StorageConfig {
  adapter: string
  maxSize: number
  compression: boolean
  encryption: boolean
}