/**
 * Main platform adapter interface that aggregates all platform-specific capabilities
 * This is the primary interface that platform implementations will implement
 */
export interface IPlatformAdapter {
  readonly platform: PlatformType
  readonly capabilities: PlatformCapabilities
  
  // Core adapters
  storage: IStorageAdapter
  mediaCapture: IMediaCaptureAdapter
  notifications: INotificationAdapter
  fileSystem: IFileSystemAdapter
  device: IDeviceAdapter
  
  // Platform lifecycle
  initialize(): Promise<void>
  dispose(): Promise<void>
  
  // Platform-specific features
  getFeatureSupport(feature: PlatformFeature): boolean
  requestPermission(permission: PlatformPermission): Promise<PermissionResult>
}

export type PlatformType = 'web' | 'ios' | 'android' | 'desktop'

export interface PlatformCapabilities {
  // Storage capabilities
  offlineStorage: boolean
  cloudSync: boolean
  fileSystem: boolean
  
  // Media capabilities
  camera: boolean
  microphone: boolean
  voiceRecognition: boolean
  
  // Device capabilities
  geolocation: boolean
  biometrics: boolean
  haptics: boolean
  
  // Integration capabilities
  systemIntegration: boolean
  backgroundProcessing: boolean
  pushNotifications: boolean
}

export type PlatformFeature = 
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'biometrics'
  | 'haptics'
  | 'background-sync'
  | 'file-system'
  | 'voice-recognition'
  | 'system-integration'

export type PlatformPermission = 
  | 'camera'
  | 'microphone'
  | 'location'
  | 'notifications'
  | 'storage'
  | 'biometrics'

export interface PermissionResult {
  granted: boolean
  canRequestAgain: boolean
  reason?: string
}

// Re-export storage adapter interface
import type { IStorageAdapter } from '../storage/IStorageAdapter'
import type { IMediaCaptureAdapter } from './IMediaCaptureAdapter'
import type { INotificationAdapter } from './INotificationAdapter'
import type { IFileSystemAdapter } from './IFileSystemAdapter'
import type { IDeviceAdapter } from './IDeviceAdapter'

export type { IStorageAdapter }