/**
 * Cross-platform device adapter interface
 * Abstracts device capabilities, sensors, and system integration
 */
export interface IDeviceAdapter {
  // Device information
  getDeviceInfo(): Promise<DeviceInfo>
  getPlatformInfo(): Promise<PlatformInfo>
  getNetworkInfo(): Promise<NetworkInfo>
  getBatteryInfo(): Promise<BatteryInfo>
  
  // Location services
  getCurrentLocation(options?: LocationOptions): Promise<LocationResult>
  watchLocation(callback: (location: LocationResult) => void, options?: LocationOptions): Promise<LocationWatcher>
  
  // Biometric authentication
  isBiometricAvailable(): Promise<BiometricAvailability>
  authenticateWithBiometric(options?: BiometricOptions): Promise<BiometricResult>
  
  // Haptic feedback
  isHapticAvailable(): Promise<boolean>
  triggerHaptic(type: HapticType): Promise<void>
  
  // System integration
  openURL(url: string): Promise<boolean>
  canOpenURL(url: string): Promise<boolean>
  shareContent(content: ShareContent): Promise<ShareResult>
  
  // Keyboard and input
  showKeyboard(): Promise<void>
  hideKeyboard(): Promise<void>
  isKeyboardVisible(): Promise<boolean>
  
  // Screen and display
  getScreenInfo(): Promise<ScreenInfo>
  setScreenOrientation(orientation: ScreenOrientation): Promise<void>
  keepScreenOn(enabled: boolean): Promise<void>
  
  // System events
  onAppStateChange(callback: (state: AppState) => void): void
  onNetworkStateChange(callback: (state: NetworkInfo) => void): void
  onBatteryStateChange(callback: (state: BatteryInfo) => void): void
  
  // Voice and speech
  isVoiceRecognitionAvailable(): Promise<boolean>
  startVoiceRecognition(options?: VoiceRecognitionOptions): Promise<VoiceRecognitionResult>
  isSpeechSynthesisAvailable(): Promise<boolean>
  speakText(text: string, options?: SpeechOptions): Promise<void>
}

export interface DeviceInfo {
  id: string
  model: string
  manufacturer: string
  platform: string
  version: string
  isPhysicalDevice: boolean
  supportedAbis?: string[]
}

export interface PlatformInfo {
  name: string
  version: string
  buildNumber?: string
  isDebug: boolean
}

export interface NetworkInfo {
  isConnected: boolean
  connectionType: ConnectionType
  isWiFi: boolean
  isCellular: boolean
  isMetered: boolean
  strength?: number // 0-100
}

export interface BatteryInfo {
  level: number // 0-1
  isCharging: boolean
  chargingTime?: number // minutes
  dischargingTime?: number // minutes
}

export interface LocationResult {
  success: boolean
  location?: GeolocationCoordinates
  error?: string
}

export interface LocationWatcher {
  id: string
  stop(): void
}

export interface LocationOptions {
  accuracy: 'low' | 'medium' | 'high' | 'best'
  timeout?: number
  maximumAge?: number
  distanceFilter?: number
}

export interface GeolocationCoordinates {
  latitude: number
  longitude: number
  altitude?: number
  accuracy: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: Date
}

export interface BiometricAvailability {
  available: boolean
  biometryType?: BiometricType
  error?: string
}

export interface BiometricOptions {
  reason?: string
  fallbackTitle?: string
  cancelTitle?: string
}

export interface BiometricResult {
  success: boolean
  error?: string
  biometryType?: BiometricType
}

export interface ShareContent {
  title?: string
  message?: string
  url?: string
  files?: string[]
}

export interface ShareResult {
  success: boolean
  activityType?: string
  error?: string
}

export interface ScreenInfo {
  width: number
  height: number
  scale: number
  orientation: ScreenOrientation
  brightness?: number
}

export interface VoiceRecognitionOptions {
  language?: string
  maxResults?: number
  partialResults?: boolean
  timeout?: number
}

export interface VoiceRecognitionResult {
  success: boolean
  results?: string[]
  confidence?: number[]
  error?: string
}

export interface SpeechOptions {
  language?: string
  rate?: number // 0-1
  pitch?: number // 0-2
  volume?: number // 0-1
}

export type ConnectionType = 
  | 'none'
  | 'wifi'
  | 'cellular'
  | 'ethernet'
  | 'bluetooth'
  | 'unknown'

export type BiometricType = 
  | 'fingerprint'
  | 'face'
  | 'iris'
  | 'voice'
  | 'none'

export type HapticType = 
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'

export type ScreenOrientation = 
  | 'portrait'
  | 'landscape'
  | 'portrait-upside-down'
  | 'landscape-left'
  | 'landscape-right'

export type AppState = 
  | 'active'
  | 'background'
  | 'inactive'
  | 'unknown'