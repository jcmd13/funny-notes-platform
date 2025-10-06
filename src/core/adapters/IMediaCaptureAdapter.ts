/**
 * Cross-platform media capture adapter interface
 * Abstracts camera, microphone, and media processing capabilities
 */
export interface IMediaCaptureAdapter {
  // Camera capabilities
  isCameraAvailable(): Promise<boolean>
  getCameraPermission(): Promise<PermissionResult>
  captureImage(options?: ImageCaptureOptions): Promise<CaptureResult<ImageData>>
  startImageStream(callback: (frame: ImageFrame) => void): Promise<MediaStream>
  stopImageStream(stream: MediaStream): Promise<void>
  
  // Microphone capabilities
  isMicrophoneAvailable(): Promise<boolean>
  getMicrophonePermission(): Promise<PermissionResult>
  startAudioRecording(options?: AudioRecordingOptions): Promise<AudioRecording>
  stopAudioRecording(recording: AudioRecording): Promise<CaptureResult<AudioData>>
  
  // Media processing
  compressImage(imageData: ImageData, options?: CompressionOptions): Promise<ImageData>
  extractTextFromImage(imageData: ImageData): Promise<OCRResult>
  transcribeAudio(audioData: AudioData): Promise<TranscriptionResult>
  
  // Media utilities
  getMediaInfo(data: MediaData): Promise<MediaInfo>
  generateThumbnail(imageData: ImageData, size?: ThumbnailSize): Promise<ImageData>
}

export interface ImageCaptureOptions {
  quality?: number // 0-1
  maxWidth?: number
  maxHeight?: number
  format?: 'jpeg' | 'png' | 'webp'
  facingMode?: 'user' | 'environment'
}

export interface AudioRecordingOptions {
  sampleRate?: number
  channels?: number
  bitRate?: number
  format?: 'wav' | 'mp3' | 'aac' | 'webm'
  maxDuration?: number // seconds
}

export interface CompressionOptions {
  quality?: number // 0-1
  maxWidth?: number
  maxHeight?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface ThumbnailSize {
  width: number
  height: number
}

export interface CaptureResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: CaptureMetadata
}

export interface CaptureMetadata {
  timestamp: Date
  location?: GeolocationCoordinates
  deviceInfo?: DeviceInfo
  settings?: Record<string, any>
}

export interface ImageData {
  blob: Blob
  width: number
  height: number
  format: string
  size: number // bytes
}

export interface AudioData {
  blob: Blob
  duration: number // seconds
  format: string
  sampleRate: number
  channels: number
  size: number // bytes
}

export interface MediaData extends ImageData, AudioData {
  type: 'image' | 'audio'
}

export interface ImageFrame {
  data: ImageData
  timestamp: number
}

export interface AudioRecording {
  id: string
  startTime: Date
  stream: MediaStream
  recorder: any // Platform-specific recorder
}

export interface OCRResult {
  success: boolean
  text: string
  confidence: number
  regions?: TextRegion[]
  error?: string
}

export interface TextRegion {
  text: string
  confidence: number
  boundingBox: BoundingBox
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface TranscriptionResult {
  success: boolean
  text: string
  confidence: number
  segments?: TranscriptionSegment[]
  language?: string
  error?: string
}

export interface TranscriptionSegment {
  text: string
  startTime: number
  endTime: number
  confidence: number
}

export interface MediaInfo {
  type: 'image' | 'audio'
  format: string
  size: number
  duration?: number // for audio
  dimensions?: { width: number; height: number } // for images
  metadata?: Record<string, any>
}

export interface DeviceInfo {
  platform: string
  model?: string
  os?: string
  version?: string
}

export interface PermissionResult {
  granted: boolean
  canRequestAgain: boolean
  reason?: string
}