/**
 * Platform-specific contracts and interfaces
 * Defines how different platforms should implement core functionality
 */

// Platform identification and capabilities
export interface PlatformContract {
  readonly platformId: PlatformId
  readonly version: string
  readonly capabilities: PlatformCapabilities
  
  // Lifecycle management
  initialize(config: PlatformConfig): Promise<void>
  shutdown(): Promise<void>
  
  // Feature detection
  isFeatureSupported(feature: PlatformFeature): boolean
  getFeatureImplementation<T>(feature: PlatformFeature): T | null
  
  // Platform-specific optimizations
  getOptimizedConfiguration(): PlatformOptimization
  applyPlatformSpecificSettings(settings: Record<string, any>): void
}

export type PlatformId = 'web' | 'ios' | 'android' | 'desktop' | 'server'

export interface PlatformCapabilities {
  // Core capabilities
  storage: StorageCapabilities
  media: MediaCapabilities
  networking: NetworkingCapabilities
  ui: UICapabilities
  system: SystemCapabilities
  
  // Advanced capabilities
  ai: AICapabilities
  sync: SyncCapabilities
  security: SecurityCapabilities
  performance: PerformanceCapabilities
}

export interface StorageCapabilities {
  persistent: boolean
  encrypted: boolean
  maxSize: number // bytes, -1 for unlimited
  supportedTypes: StorageType[]
  indexing: boolean
  fullTextSearch: boolean
  transactions: boolean
  backup: boolean
}

export interface MediaCapabilities {
  camera: CameraCapabilities
  microphone: MicrophoneCapabilities
  playback: PlaybackCapabilities
  processing: ProcessingCapabilities
}

export interface CameraCapabilities {
  available: boolean
  frontCamera: boolean
  backCamera: boolean
  maxResolution: { width: number; height: number }
  supportedFormats: string[]
  flash: boolean
  zoom: boolean
  focus: boolean
}

export interface MicrophoneCapabilities {
  available: boolean
  maxSampleRate: number
  supportedFormats: string[]
  noiseReduction: boolean
  echoCancellation: boolean
  multiChannel: boolean
}

export interface PlaybackCapabilities {
  audio: boolean
  video: boolean
  supportedFormats: string[]
  backgroundPlayback: boolean
  streaming: boolean
}

export interface ProcessingCapabilities {
  imageProcessing: boolean
  audioProcessing: boolean
  ocr: boolean
  speechToText: boolean
  textToSpeech: boolean
  compression: boolean
}

export interface NetworkingCapabilities {
  http: boolean
  websockets: boolean
  backgroundSync: boolean
  offline: boolean
  maxConcurrentRequests: number
  supportedProtocols: string[]
}

export interface UICapabilities {
  responsive: boolean
  touch: boolean
  keyboard: boolean
  mouse: boolean
  gestures: GestureCapabilities
  accessibility: AccessibilityCapabilities
  theming: ThemingCapabilities
}

export interface GestureCapabilities {
  tap: boolean
  longPress: boolean
  swipe: boolean
  pinch: boolean
  rotate: boolean
  drag: boolean
}

export interface AccessibilityCapabilities {
  screenReader: boolean
  highContrast: boolean
  largeText: boolean
  voiceControl: boolean
  keyboardNavigation: boolean
}

export interface ThemingCapabilities {
  darkMode: boolean
  customColors: boolean
  customFonts: boolean
  animations: boolean
  systemTheme: boolean
}

export interface SystemCapabilities {
  notifications: NotificationCapabilities
  permissions: PermissionCapabilities
  integration: IntegrationCapabilities
  hardware: HardwareCapabilities
}

export interface NotificationCapabilities {
  local: boolean
  push: boolean
  scheduled: boolean
  interactive: boolean
  rich: boolean
  badges: boolean
}

export interface PermissionCapabilities {
  runtime: boolean
  persistent: boolean
  granular: boolean
  revocable: boolean
}

export interface IntegrationCapabilities {
  systemShare: boolean
  systemSearch: boolean
  systemShortcuts: boolean
  systemWidgets: boolean
  systemVoiceCommands: boolean
  systemCalendar: boolean
  systemContacts: boolean
}

export interface HardwareCapabilities {
  biometrics: BiometricCapabilities
  sensors: SensorCapabilities
  connectivity: ConnectivityCapabilities
}

export interface BiometricCapabilities {
  fingerprint: boolean
  face: boolean
  voice: boolean
  iris: boolean
}

export interface SensorCapabilities {
  accelerometer: boolean
  gyroscope: boolean
  magnetometer: boolean
  gps: boolean
  proximity: boolean
  ambient: boolean
}

export interface ConnectivityCapabilities {
  wifi: boolean
  cellular: boolean
  bluetooth: boolean
  nfc: boolean
}

export interface AICapabilities {
  onDevice: boolean
  cloud: boolean
  naturalLanguage: boolean
  imageRecognition: boolean
  speechRecognition: boolean
  textAnalysis: boolean
  recommendations: boolean
}

export interface SyncCapabilities {
  realtime: boolean
  offline: boolean
  conflictResolution: boolean
  partialSync: boolean
  compression: boolean
  encryption: boolean
}

export interface SecurityCapabilities {
  encryption: EncryptionCapabilities
  authentication: AuthenticationCapabilities
  authorization: AuthorizationCapabilities
  privacy: PrivacyCapabilities
}

export interface EncryptionCapabilities {
  atRest: boolean
  inTransit: boolean
  endToEnd: boolean
  keyManagement: boolean
  algorithms: string[]
}

export interface AuthenticationCapabilities {
  local: boolean
  biometric: boolean
  oauth: boolean
  sso: boolean
  multifactor: boolean
}

export interface AuthorizationCapabilities {
  roleBase: boolean
  attributeBased: boolean
  resourceBased: boolean
  finegrained: boolean
}

export interface PrivacyCapabilities {
  dataMinimization: boolean
  anonymization: boolean
  rightToDelete: boolean
  dataPortability: boolean
  consentManagement: boolean
}

export interface PerformanceCapabilities {
  backgroundProcessing: boolean
  multiThreading: boolean
  caching: boolean
  preloading: boolean
  lazyLoading: boolean
  memoryManagement: boolean
}

// Platform configuration
export interface PlatformConfig {
  environment: 'development' | 'staging' | 'production'
  apiEndpoints: Record<string, string>
  features: FeatureFlags
  performance: PerformanceConfig
  security: SecurityConfig
  ui: UIConfig
}

export interface FeatureFlags {
  [key: string]: boolean | string | number
}

export interface PerformanceConfig {
  cacheSize: number
  maxConcurrentOperations: number
  backgroundSyncInterval: number
  compressionLevel: number
  preloadStrategy: 'aggressive' | 'conservative' | 'adaptive'
}

export interface SecurityConfig {
  encryptionEnabled: boolean
  biometricAuthEnabled: boolean
  sessionTimeout: number
  maxLoginAttempts: number
  requireSecureConnection: boolean
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto'
  animations: boolean
  hapticFeedback: boolean
  soundEffects: boolean
  accessibility: AccessibilityConfig
}

export interface AccessibilityConfig {
  screenReaderSupport: boolean
  highContrastMode: boolean
  largeTextMode: boolean
  reducedMotion: boolean
}

// Platform optimization
export interface PlatformOptimization {
  storage: StorageOptimization
  networking: NetworkingOptimization
  ui: UIOptimization
  performance: PerformanceOptimization
}

export interface StorageOptimization {
  preferredAdapter: string
  indexingStrategy: 'eager' | 'lazy' | 'adaptive'
  compressionEnabled: boolean
  encryptionLevel: 'none' | 'basic' | 'advanced'
}

export interface NetworkingOptimization {
  requestBatching: boolean
  connectionPooling: boolean
  compressionEnabled: boolean
  retryStrategy: RetryStrategy
}

export interface RetryStrategy {
  maxAttempts: number
  backoffMultiplier: number
  maxDelay: number
}

export interface UIOptimization {
  renderingStrategy: 'immediate' | 'batched' | 'deferred'
  animationPerformance: 'high' | 'medium' | 'low'
  memoryManagement: 'aggressive' | 'balanced' | 'conservative'
}

export interface PerformanceOptimization {
  backgroundProcessing: boolean
  preloadingEnabled: boolean
  cachingStrategy: 'aggressive' | 'balanced' | 'minimal'
  memoryThreshold: number
}

// Platform-specific implementations
export interface WebPlatformContract extends PlatformContract {
  // Web-specific methods
  registerServiceWorker(): Promise<void>
  enablePWAFeatures(): Promise<void>
  handleInstallPrompt(): Promise<boolean>
  
  // Browser-specific optimizations
  optimizeForBrowser(browser: BrowserType): void
  enableWebAssembly(): boolean
}

export interface MobilePlatformContract extends PlatformContract {
  // Mobile-specific methods
  requestPermissions(permissions: MobilePermission[]): Promise<PermissionResult[]>
  enableBackgroundSync(): Promise<void>
  registerForPushNotifications(): Promise<string>
  
  // Mobile-specific optimizations
  optimizeForDevice(device: DeviceType): void
  enableBatteryOptimization(): void
}

export interface IOSPlatformContract extends MobilePlatformContract {
  // iOS-specific methods
  configureSiriShortcuts(): Promise<void>
  enableApplePencilSupport(): void
  integrateWithSpotlight(): Promise<void>
  setupWidgets(): Promise<void>
  
  // iOS-specific features
  enableHandoff(): Promise<void>
  configureWatchApp(): Promise<void>
}

export interface AndroidPlatformContract extends MobilePlatformContract {
  // Android-specific methods
  configureAssistantIntegration(): Promise<void>
  enableSPenSupport(): void
  setupQuickSettings(): Promise<void>
  configureAutoFill(): Promise<void>
  
  // Android-specific features
  enableAdaptiveIcons(): void
  configureWearOSApp(): Promise<void>
}

export interface DesktopPlatformContract extends PlatformContract {
  // Desktop-specific methods
  setupMenuBar(): void
  configureSystemTray(): void
  enableGlobalShortcuts(): Promise<void>
  setupFileAssociations(): Promise<void>
  
  // Desktop-specific features
  enableAutoUpdater(): Promise<void>
  configureWindowManagement(): void
}

// Platform detection and factory
export interface PlatformDetector {
  detectPlatform(): PlatformId
  getPlatformInfo(): PlatformInfo
  isSupported(platform: PlatformId): boolean
}

export interface PlatformInfo {
  id: PlatformId
  name: string
  version: string
  userAgent?: string
  deviceModel?: string
  osVersion?: string
  architecture?: string
}

export interface PlatformFactory {
  createPlatform(id: PlatformId, config: PlatformConfig): Promise<PlatformContract>
  getSupportedPlatforms(): PlatformId[]
  getDefaultConfig(platform: PlatformId): PlatformConfig
}

// Platform-specific types
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'other'
export type DeviceType = 'phone' | 'tablet' | 'desktop' | 'tv' | 'watch' | 'other'
export type StorageType = 'indexeddb' | 'localstorage' | 'sqlite' | 'coredata' | 'room' | 'file'

export type MobilePermission = 
  | 'camera'
  | 'microphone'
  | 'location'
  | 'notifications'
  | 'contacts'
  | 'calendar'
  | 'photos'
  | 'storage'

export interface PermissionResult {
  permission: MobilePermission
  granted: boolean
  canRequestAgain: boolean
  reason?: string
}

export type PlatformFeature = 
  | 'offline-storage'
  | 'background-sync'
  | 'push-notifications'
  | 'biometric-auth'
  | 'camera-capture'
  | 'voice-recording'
  | 'file-system'
  | 'system-integration'
  | 'ai-processing'
  | 'real-time-sync'

// Platform testing contracts
export interface PlatformTester {
  testCapabilities(platform: PlatformContract): Promise<CapabilityTestResult[]>
  testPerformance(platform: PlatformContract): Promise<PerformanceTestResult>
  testCompatibility(platform: PlatformContract): Promise<CompatibilityTestResult>
}

export interface CapabilityTestResult {
  capability: string
  supported: boolean
  performance?: number
  limitations?: string[]
  recommendations?: string[]
}

export interface PerformanceTestResult {
  overall: number // 0-100 score
  storage: number
  networking: number
  ui: number
  processing: number
  memory: number
  battery?: number
}

export interface CompatibilityTestResult {
  compatible: boolean
  version: string
  issues: CompatibilityIssue[]
  recommendations: string[]
}

export interface CompatibilityIssue {
  severity: 'error' | 'warning' | 'info'
  component: string
  description: string
  workaround?: string
}

// Platform migration contracts
export interface PlatformMigrator {
  canMigrate(from: PlatformId, to: PlatformId): boolean
  migrate(from: PlatformContract, to: PlatformContract): Promise<MigrationResult>
  getMigrationPlan(from: PlatformId, to: PlatformId): MigrationPlan
}

export interface MigrationResult {
  success: boolean
  migratedData: Record<string, number>
  errors: MigrationError[]
  warnings: string[]
  duration: number
}

export interface MigrationError {
  component: string
  error: string
  data?: any
}

export interface MigrationPlan {
  steps: MigrationStep[]
  estimatedDuration: number
  dataLoss: boolean
  reversible: boolean
}

export interface MigrationStep {
  name: string
  description: string
  required: boolean
  estimatedDuration: number
  dependencies: string[]
}

// Platform monitoring contracts
export interface PlatformMonitor {
  startMonitoring(platform: PlatformContract): void
  stopMonitoring(): void
  getMetrics(): PlatformMetrics
  onMetricThreshold(callback: (metric: string, value: number) => void): void
}

export interface PlatformMetrics {
  performance: PerformanceMetrics
  usage: UsageMetrics
  errors: ErrorMetrics
  resources: ResourceMetrics
}

export interface PerformanceMetrics {
  responseTime: number
  throughput: number
  errorRate: number
  availability: number
}

export interface UsageMetrics {
  activeUsers: number
  sessionDuration: number
  featureUsage: Record<string, number>
  platformDistribution: Record<PlatformId, number>
}

export interface ErrorMetrics {
  totalErrors: number
  errorRate: number
  errorsByType: Record<string, number>
  criticalErrors: number
}

export interface ResourceMetrics {
  memoryUsage: number
  cpuUsage: number
  storageUsage: number
  networkUsage: number
  batteryUsage?: number
}