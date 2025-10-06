/**
 * Shared configuration system for cross-platform consistency
 * Provides a unified way to manage configuration across all platforms
 */

export interface SharedConfig {
  // Application metadata
  app: AppConfig
  
  // Platform-specific settings
  platform: PlatformConfig
  
  // Feature flags
  features: FeatureConfig
  
  // API and service configuration
  services: ServicesConfig
  
  // Storage configuration
  storage: StorageConfig
  
  // Sync configuration
  sync: SyncConfig
  
  // Analytics and monitoring
  analytics: AnalyticsConfig
  
  // Security settings
  security: SecurityConfig
  
  // UI/UX preferences
  ui: UIConfig
  
  // Performance settings
  performance: PerformanceConfig
}

export interface AppConfig {
  name: string
  version: string
  buildNumber: string
  environment: 'development' | 'staging' | 'production'
  debugMode: boolean
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace'
}

export interface PlatformConfig {
  type: 'web' | 'ios' | 'android' | 'desktop'
  version: string
  capabilities: string[]
  optimizations: Record<string, any>
}

export interface FeatureConfig {
  // Core features
  offlineMode: boolean
  realTimeSync: boolean
  backgroundSync: boolean
  
  // Capture features
  voiceCapture: boolean
  imageCapture: boolean
  ocrProcessing: boolean
  speechToText: boolean
  
  // AI features
  aiSuggestions: boolean
  contentAnalysis: boolean
  duplicateDetection: boolean
  
  // Social features
  sharing: boolean
  collaboration: boolean
  
  // Advanced features
  biometricAuth: boolean
  pushNotifications: boolean
  systemIntegration: boolean
  
  // Experimental features
  experimental: Record<string, boolean>
}

export interface ServicesConfig {
  // API endpoints
  api: {
    baseUrl: string
    version: string
    timeout: number
    retryAttempts: number
  }
  
  // Authentication
  auth: {
    provider: 'firebase' | 'auth0' | 'custom'
    clientId: string
    redirectUri?: string
    scopes: string[]
  }
  
  // Cloud storage
  cloudStorage: {
    provider: 'firebase' | 'aws' | 'azure' | 'gcp'
    bucket: string
    region: string
  }
  
  // AI services
  ai: {
    ocrProvider: 'tesseract' | 'google' | 'aws' | 'azure'
    speechProvider: 'native' | 'google' | 'aws' | 'azure'
    nlpProvider: 'native' | 'openai' | 'google' | 'aws'
  }
  
  // Analytics
  analytics: {
    provider: 'firebase' | 'mixpanel' | 'amplitude' | 'custom'
    trackingId: string
    enableCrashReporting: boolean
  }
}

export interface StorageConfig {
  // Local storage
  local: {
    adapter: 'indexeddb' | 'sqlite' | 'coredata' | 'room'
    maxSize: number
    encryption: boolean
    compression: boolean
  }
  
  // Cache configuration
  cache: {
    maxSize: number
    ttl: number
    strategy: 'lru' | 'lfu' | 'fifo'
  }
  
  // Backup configuration
  backup: {
    enabled: boolean
    frequency: number
    retention: number
    compression: boolean
  }
}

export interface SyncConfig {
  // Sync behavior
  enabled: boolean
  autoSync: boolean
  interval: number
  batchSize: number
  
  // Conflict resolution
  conflictResolution: 'local' | 'remote' | 'latest' | 'manual'
  
  // Network settings
  network: {
    timeout: number
    retryAttempts: number
    retryDelay: number
    compressionEnabled: boolean
  }
  
  // Entity-specific settings
  entities: Record<string, EntitySyncConfig>
}

export interface EntitySyncConfig {
  enabled: boolean
  priority: number
  conflictResolution?: 'local' | 'remote' | 'latest' | 'manual'
  customFields?: string[]
  excludeFields?: string[]
}

export interface AnalyticsConfig {
  enabled: boolean
  trackingLevel: 'minimal' | 'standard' | 'detailed'
  
  // Event tracking
  events: {
    userActions: boolean
    performance: boolean
    errors: boolean
    crashes: boolean
  }
  
  // Privacy settings
  privacy: {
    anonymizeData: boolean
    respectDoNotTrack: boolean
    dataRetention: number
  }
  
  // Custom properties
  customProperties: Record<string, any>
}

export interface SecurityConfig {
  // Authentication
  auth: {
    biometricEnabled: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    passwordPolicy: PasswordPolicy
  }
  
  // Encryption
  encryption: {
    algorithm: string
    keySize: number
    atRest: boolean
    inTransit: boolean
  }
  
  // Network security
  network: {
    certificatePinning: boolean
    requireHttps: boolean
    allowSelfSigned: boolean
  }
  
  // Data protection
  dataProtection: {
    screenRecordingProtection: boolean
    screenshotProtection: boolean
    copyPasteProtection: boolean
  }
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSymbols: boolean
  maxAge: number
}

export interface UIConfig {
  // Theme settings
  theme: {
    mode: 'light' | 'dark' | 'auto'
    primaryColor: string
    accentColor: string
    customThemes: Record<string, ThemeDefinition>
  }
  
  // Layout preferences
  layout: {
    density: 'compact' | 'comfortable' | 'spacious'
    fontSize: 'small' | 'medium' | 'large'
    animations: boolean
    transitions: boolean
  }
  
  // Accessibility
  accessibility: {
    screenReader: boolean
    highContrast: boolean
    reducedMotion: boolean
    largeText: boolean
    colorBlindSupport: boolean
  }
  
  // Interaction
  interaction: {
    hapticFeedback: boolean
    soundEffects: boolean
    gestureNavigation: boolean
    keyboardShortcuts: boolean
  }
}

export interface ThemeDefinition {
  name: string
  colors: Record<string, string>
  fonts: Record<string, string>
  spacing: Record<string, number>
  borderRadius: Record<string, number>
}

export interface PerformanceConfig {
  // Memory management
  memory: {
    maxHeapSize: number
    gcThreshold: number
    imageCache: number
    audioCache: number
  }
  
  // Network optimization
  network: {
    connectionPoolSize: number
    requestTimeout: number
    maxConcurrentRequests: number
    compressionLevel: number
  }
  
  // Rendering optimization
  rendering: {
    frameRate: number
    vsync: boolean
    hardwareAcceleration: boolean
    textureCompression: boolean
  }
  
  // Background processing
  background: {
    maxConcurrentTasks: number
    taskTimeout: number
    priorityLevels: number
  }
}

/**
 * Configuration manager for handling shared configuration
 */
export class ConfigManager {
  private static instance: ConfigManager
  private config: SharedConfig
  private listeners: ConfigListener[] = []

  private constructor(initialConfig: Partial<SharedConfig> = {}) {
    this.config = this.mergeWithDefaults(initialConfig)
  }

  static getInstance(initialConfig?: Partial<SharedConfig>): ConfigManager {
    if (!this.instance) {
      this.instance = new ConfigManager(initialConfig)
    }
    return this.instance
  }

  /**
   * Get the complete configuration
   */
  getConfig(): SharedConfig {
    return { ...this.config }
  }

  /**
   * Get a specific configuration section
   */
  getSection<K extends keyof SharedConfig>(section: K): SharedConfig[K] {
    return { ...this.config[section] }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SharedConfig>): void {
    const oldConfig = { ...this.config }
    this.config = this.deepMerge(this.config, updates)
    
    // Notify listeners of changes
    this.notifyListeners(oldConfig, this.config)
  }

  /**
   * Update a specific configuration section
   */
  updateSection<K extends keyof SharedConfig>(
    section: K, 
    updates: Partial<SharedConfig[K]>
  ): void {
    const oldConfig = { ...this.config }
    this.config[section] = this.deepMerge(this.config[section], updates)
    
    // Notify listeners of changes
    this.notifyListeners(oldConfig, this.config)
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    const oldConfig = { ...this.config }
    this.config = this.getDefaultConfig()
    
    // Notify listeners of changes
    this.notifyListeners(oldConfig, this.config)
  }

  /**
   * Load configuration from storage
   */
  async loadFromStorage(storage: ConfigStorage): Promise<void> {
    try {
      const storedConfig = await storage.load()
      if (storedConfig) {
        this.updateConfig(storedConfig)
      }
    } catch (error) {
      console.warn('Failed to load configuration from storage:', error)
    }
  }

  /**
   * Save configuration to storage
   */
  async saveToStorage(storage: ConfigStorage): Promise<void> {
    try {
      await storage.save(this.config)
    } catch (error) {
      console.error('Failed to save configuration to storage:', error)
    }
  }

  /**
   * Add configuration change listener
   */
  addListener(listener: ConfigListener): void {
    this.listeners.push(listener)
  }

  /**
   * Remove configuration change listener
   */
  removeListener(listener: ConfigListener): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Validate configuration
   */
  validate(): ConfigValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate app config
    if (!this.config.app.name) {
      errors.push('App name is required')
    }
    if (!this.config.app.version) {
      errors.push('App version is required')
    }

    // Validate services config
    if (!this.config.services.api.baseUrl) {
      errors.push('API base URL is required')
    }

    // Validate storage config
    if (this.config.storage.local.maxSize <= 0) {
      errors.push('Storage max size must be positive')
    }

    // Add warnings for potentially problematic settings
    if (this.config.performance.memory.maxHeapSize > 1024 * 1024 * 1024) {
      warnings.push('Large heap size may cause performance issues')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(environment: string): Partial<SharedConfig> {
    const envConfigs: Record<string, Partial<SharedConfig>> = {
      development: {
        app: {
          debugMode: true,
          logLevel: 'debug'
        },
        features: {
          experimental: { all: true }
        },
        analytics: {
          enabled: false
        }
      },
      staging: {
        app: {
          debugMode: true,
          logLevel: 'info'
        },
        analytics: {
          enabled: true,
          trackingLevel: 'standard'
        }
      },
      production: {
        app: {
          debugMode: false,
          logLevel: 'warn'
        },
        analytics: {
          enabled: true,
          trackingLevel: 'detailed'
        },
        security: {
          network: {
            requireHttps: true,
            allowSelfSigned: false
          }
        }
      }
    }

    return envConfigs[environment] || {}
  }

  // Private helper methods

  private mergeWithDefaults(config: Partial<SharedConfig>): SharedConfig {
    const defaults = this.getDefaultConfig()
    return this.deepMerge(defaults, config)
  }

  private getDefaultConfig(): SharedConfig {
    return {
      app: {
        name: 'Funny Notes',
        version: '1.0.0',
        buildNumber: '1',
        environment: 'production',
        debugMode: false,
        logLevel: 'warn'
      },
      platform: {
        type: 'web',
        version: '1.0.0',
        capabilities: [],
        optimizations: {}
      },
      features: {
        offlineMode: true,
        realTimeSync: false,
        backgroundSync: true,
        voiceCapture: true,
        imageCapture: true,
        ocrProcessing: true,
        speechToText: true,
        aiSuggestions: false,
        contentAnalysis: true,
        duplicateDetection: true,
        sharing: true,
        collaboration: false,
        biometricAuth: false,
        pushNotifications: true,
        systemIntegration: false,
        experimental: {}
      },
      services: {
        api: {
          baseUrl: 'https://api.funnynotes.app',
          version: 'v1',
          timeout: 30000,
          retryAttempts: 3
        },
        auth: {
          provider: 'firebase',
          clientId: '',
          scopes: ['profile', 'email']
        },
        cloudStorage: {
          provider: 'firebase',
          bucket: 'funnynotes-storage',
          region: 'us-central1'
        },
        ai: {
          ocrProvider: 'tesseract',
          speechProvider: 'native',
          nlpProvider: 'native'
        },
        analytics: {
          provider: 'firebase',
          trackingId: '',
          enableCrashReporting: true
        }
      },
      storage: {
        local: {
          adapter: 'indexeddb',
          maxSize: 100 * 1024 * 1024, // 100MB
          encryption: false,
          compression: true
        },
        cache: {
          maxSize: 50 * 1024 * 1024, // 50MB
          ttl: 3600000, // 1 hour
          strategy: 'lru'
        },
        backup: {
          enabled: true,
          frequency: 86400000, // 24 hours
          retention: 7, // 7 days
          compression: true
        }
      },
      sync: {
        enabled: true,
        autoSync: true,
        interval: 30000, // 30 seconds
        batchSize: 50,
        conflictResolution: 'latest',
        network: {
          timeout: 15000,
          retryAttempts: 3,
          retryDelay: 1000,
          compressionEnabled: true
        },
        entities: {}
      },
      analytics: {
        enabled: true,
        trackingLevel: 'standard',
        events: {
          userActions: true,
          performance: true,
          errors: true,
          crashes: true
        },
        privacy: {
          anonymizeData: true,
          respectDoNotTrack: true,
          dataRetention: 90 // 90 days
        },
        customProperties: {}
      },
      security: {
        auth: {
          biometricEnabled: false,
          sessionTimeout: 3600000, // 1 hour
          maxLoginAttempts: 3,
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: false,
            maxAge: 7776000000 // 90 days
          }
        },
        encryption: {
          algorithm: 'AES-256-GCM',
          keySize: 256,
          atRest: false,
          inTransit: true
        },
        network: {
          certificatePinning: false,
          requireHttps: true,
          allowSelfSigned: false
        },
        dataProtection: {
          screenRecordingProtection: false,
          screenshotProtection: false,
          copyPasteProtection: false
        }
      },
      ui: {
        theme: {
          mode: 'auto',
          primaryColor: '#6366f1',
          accentColor: '#f59e0b',
          customThemes: {}
        },
        layout: {
          density: 'comfortable',
          fontSize: 'medium',
          animations: true,
          transitions: true
        },
        accessibility: {
          screenReader: false,
          highContrast: false,
          reducedMotion: false,
          largeText: false,
          colorBlindSupport: false
        },
        interaction: {
          hapticFeedback: true,
          soundEffects: false,
          gestureNavigation: true,
          keyboardShortcuts: true
        }
      },
      performance: {
        memory: {
          maxHeapSize: 256 * 1024 * 1024, // 256MB
          gcThreshold: 0.8,
          imageCache: 50 * 1024 * 1024, // 50MB
          audioCache: 25 * 1024 * 1024 // 25MB
        },
        network: {
          connectionPoolSize: 10,
          requestTimeout: 30000,
          maxConcurrentRequests: 6,
          compressionLevel: 6
        },
        rendering: {
          frameRate: 60,
          vsync: true,
          hardwareAcceleration: true,
          textureCompression: true
        },
        background: {
          maxConcurrentTasks: 3,
          taskTimeout: 300000, // 5 minutes
          priorityLevels: 3
        }
      }
    }
  }

  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target }
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key]
        const targetValue = result[key]
        
        if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
          result[key] = this.deepMerge(targetValue, sourceValue)
        } else {
          result[key] = sourceValue as any
        }
      }
    }
    
    return result
  }

  private notifyListeners(oldConfig: SharedConfig, newConfig: SharedConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(newConfig, oldConfig)
      } catch (error) {
        console.error('Error in config listener:', error)
      }
    })
  }
}

// Types and interfaces
export type ConfigListener = (newConfig: SharedConfig, oldConfig: SharedConfig) => void

export interface ConfigStorage {
  load(): Promise<Partial<SharedConfig> | null>
  save(config: SharedConfig): Promise<void>
}

export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}