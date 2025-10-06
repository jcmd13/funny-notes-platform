import type { IPlatformAdapter } from '../adapters/IPlatformAdapter'
import type { Note, CreateNoteInput } from '../models'
import type { StorageService } from '../storage/StorageService'
import type { 
  ImageCaptureOptions, 
  AudioRecordingOptions, 
  CaptureResult, 
  ImageData, 
  AudioData 
} from '../adapters/IMediaCaptureAdapter'

/**
 * Platform-agnostic capture manager
 * Handles all content capture workflows using platform adapters
 */
export class CaptureManager {
  constructor(
    private platformAdapter: IPlatformAdapter,
    private storageService: StorageService
  ) {}

  /**
   * Capture text note with optional metadata
   */
  async captureText(content: string, options?: {
    tags?: string[]
    venue?: string
    audience?: string
    location?: boolean
  }): Promise<Note> {
    let location: GeolocationCoordinates | undefined

    // Get location if requested and available
    if (options?.location && this.platformAdapter.getFeatureSupport('geolocation')) {
      const locationResult = await this.platformAdapter.device.getCurrentLocation({
        accuracy: 'medium',
        timeout: 5000
      })
      if (locationResult.success) {
        location = locationResult.location
      }
    }

    const noteInput: CreateNoteInput = {
      content,
      captureMethod: 'text',
      tags: options?.tags || [],
      venue: options?.venue,
      audience: options?.audience,
      metadata: {
        location,
        capturedAt: new Date(),
        platform: this.platformAdapter.platform
      },
      attachments: []
    }

    return await this.storageService.createNote(noteInput)
  }

  /**
   * Capture image with OCR processing
   */
  async captureImage(options?: ImageCaptureOptions & {
    extractText?: boolean
    tags?: string[]
    venue?: string
    audience?: string
  }): Promise<Note> {
    // Check camera permission
    const permission = await this.platformAdapter.mediaCapture.getCameraPermission()
    if (!permission.granted) {
      throw new Error('Camera permission not granted')
    }

    // Capture image
    const captureResult = await this.platformAdapter.mediaCapture.captureImage(options)
    if (!captureResult.success || !captureResult.data) {
      throw new Error(captureResult.error || 'Failed to capture image')
    }

    const imageData = captureResult.data
    let extractedText = ''

    // Extract text if requested
    if (options?.extractText !== false) {
      try {
        const ocrResult = await this.platformAdapter.mediaCapture.extractTextFromImage(imageData)
        if (ocrResult.success) {
          extractedText = ocrResult.text
        }
      } catch (error) {
        console.warn('OCR failed:', error)
      }
    }

    // Store image
    const imageUrl = await this.storageService.storeImageBlob(imageData.blob, {
      maxWidth: 1920,
      quality: 0.8
    })

    // Generate thumbnail
    const thumbnailData = await this.platformAdapter.mediaCapture.generateThumbnail(
      imageData, 
      { width: 200, height: 200 }
    )
    const thumbnailUrl = await this.storageService.storeImageBlob(thumbnailData.blob, {
      quality: 0.6
    })

    const noteInput: CreateNoteInput = {
      content: extractedText || 'Image captured',
      captureMethod: 'image',
      tags: options?.tags || [],
      venue: options?.venue,
      audience: options?.audience,
      metadata: {
        location: captureResult.metadata?.location,
        capturedAt: new Date(),
        platform: this.platformAdapter.platform,
        imageInfo: {
          width: imageData.width,
          height: imageData.height,
          format: imageData.format,
          size: imageData.size
        }
      },
      attachments: [{
        id: crypto.randomUUID(),
        type: 'image',
        url: imageUrl,
        thumbnailUrl,
        metadata: {
          width: imageData.width,
          height: imageData.height,
          format: imageData.format,
          size: imageData.size
        }
      }]
    }

    return await this.storageService.createNote(noteInput)
  }

  /**
   * Capture voice recording with transcription
   */
  async captureVoice(options?: AudioRecordingOptions & {
    transcribe?: boolean
    tags?: string[]
    venue?: string
    audience?: string
  }): Promise<{
    note: Note
    recording: VoiceRecording
  }> {
    // Check microphone permission
    const permission = await this.platformAdapter.mediaCapture.getMicrophonePermission()
    if (!permission.granted) {
      throw new Error('Microphone permission not granted')
    }

    // Start recording
    const recording = await this.platformAdapter.mediaCapture.startAudioRecording(options)
    
    return {
      note: await this.createPlaceholderNote(options),
      recording: {
        id: recording.id,
        startTime: recording.startTime,
        stop: async () => {
          const result = await this.platformAdapter.mediaCapture.stopAudioRecording(recording)
          if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to stop recording')
          }

          return await this.processVoiceRecording(result.data, options)
        }
      }
    }
  }

  /**
   * Process completed voice recording
   */
  private async processVoiceRecording(
    audioData: AudioData, 
    options?: {
      transcribe?: boolean
      tags?: string[]
      venue?: string
      audience?: string
    }
  ): Promise<Note> {
    let transcribedText = ''

    // Transcribe audio if requested
    if (options?.transcribe !== false) {
      try {
        const transcriptionResult = await this.platformAdapter.mediaCapture.transcribeAudio(audioData)
        if (transcriptionResult.success) {
          transcribedText = transcriptionResult.text
        }
      } catch (error) {
        console.warn('Transcription failed:', error)
      }
    }

    // Store audio
    const audioUrl = await this.storageService.storeAudioBlob(audioData.blob, {
      duration: audioData.duration
    })

    const noteInput: CreateNoteInput = {
      content: transcribedText || 'Voice recording',
      captureMethod: 'voice',
      tags: options?.tags || [],
      venue: options?.venue,
      audience: options?.audience,
      estimatedDuration: audioData.duration,
      metadata: {
        capturedAt: new Date(),
        platform: this.platformAdapter.platform,
        audioInfo: {
          duration: audioData.duration,
          format: audioData.format,
          sampleRate: audioData.sampleRate,
          channels: audioData.channels,
          size: audioData.size
        }
      },
      attachments: [{
        id: crypto.randomUUID(),
        type: 'audio',
        url: audioUrl,
        metadata: {
          duration: audioData.duration,
          format: audioData.format,
          sampleRate: audioData.sampleRate,
          channels: audioData.channels,
          size: audioData.size
        }
      }]
    }

    return await this.storageService.createNote(noteInput)
  }

  /**
   * Create placeholder note during recording
   */
  private async createPlaceholderNote(options?: {
    tags?: string[]
    venue?: string
    audience?: string
  }): Promise<Note> {
    const noteInput: CreateNoteInput = {
      content: 'Recording in progress...',
      captureMethod: 'voice',
      tags: options?.tags || [],
      venue: options?.venue,
      audience: options?.audience,
      metadata: {
        capturedAt: new Date(),
        platform: this.platformAdapter.platform,
        isPlaceholder: true
      },
      attachments: []
    }

    return await this.storageService.createNote(noteInput)
  }

  /**
   * Quick capture with automatic method detection
   */
  async quickCapture(input: QuickCaptureInput): Promise<Note> {
    switch (input.type) {
      case 'text':
        return await this.captureText(input.content, input.options)
      
      case 'image':
        return await this.captureImage(input.options)
      
      case 'voice':
        const result = await this.captureVoice(input.options)
        return result.note
      
      default:
        throw new Error(`Unsupported capture type: ${(input as any).type}`)
    }
  }

  /**
   * Get available capture methods based on platform capabilities
   */
  getAvailableCaptureMethods(): CaptureMethod[] {
    const methods: CaptureMethod[] = ['text'] // Always available

    if (this.platformAdapter.getFeatureSupport('camera')) {
      methods.push('image')
    }

    if (this.platformAdapter.getFeatureSupport('microphone')) {
      methods.push('voice')
    }

    return methods
  }

  /**
   * Check if specific capture method is available
   */
  isCaptureMethodAvailable(method: CaptureMethod): boolean {
    switch (method) {
      case 'text':
        return true
      case 'image':
        return this.platformAdapter.getFeatureSupport('camera')
      case 'voice':
        return this.platformAdapter.getFeatureSupport('microphone')
      default:
        return false
    }
  }
}

export interface VoiceRecording {
  id: string
  startTime: Date
  stop(): Promise<Note>
}

export interface QuickCaptureInput {
  type: CaptureMethod
  content?: string
  options?: {
    tags?: string[]
    venue?: string
    audience?: string
    extractText?: boolean
    transcribe?: boolean
  }
}

export type CaptureMethod = 'text' | 'image' | 'voice'

// Re-export types
import type { GeolocationCoordinates } from '../adapters/IDeviceAdapter'