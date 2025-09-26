import type { IStorageAdapter } from './IStorageAdapter'

/**
 * Utility class for handling media file storage and compression
 * Provides methods for storing, retrieving, and managing audio/image blobs
 */
export class MediaStorage {
  private storageAdapter: IStorageAdapter

  constructor(storageAdapter: IStorageAdapter) {
    this.storageAdapter = storageAdapter
  }

  /**
   * Store an audio blob with metadata
   */
  async storeAudio(audioBlob: Blob, _metadata: AudioMetadata): Promise<string> {
    const key = `audio_${crypto.randomUUID()}_${Date.now()}`
    
    try {
      // Store the blob
      await this.storageAdapter.storeBlob(key, audioBlob)
      
      // Store metadata separately if needed for indexing
      // This could be extended to store in a separate metadata table
      
      return key
    } catch (error) {
      console.error('Failed to store audio:', error)
      throw new Error('Audio storage failed')
    }
  }

  /**
   * Store an image blob with compression
   */
  async storeImage(imageBlob: Blob, metadata: ImageMetadata): Promise<string> {
    const key = `image_${crypto.randomUUID()}_${Date.now()}`
    
    try {
      // Compress image if it's too large
      const compressedBlob = await this.compressImage(imageBlob, metadata.maxWidth, metadata.quality)
      
      // Store the compressed blob
      await this.storageAdapter.storeBlob(key, compressedBlob)
      
      return key
    } catch (error) {
      console.error('Failed to store image:', error)
      throw new Error('Image storage failed')
    }
  }

  /**
   * Retrieve a media blob by key
   */
  async getMedia(key: string): Promise<Blob | undefined> {
    try {
      return await this.storageAdapter.getBlob(key)
    } catch (error) {
      console.error('Failed to retrieve media:', error)
      return undefined
    }
  }

  /**
   * Delete a media blob by key
   */
  async deleteMedia(key: string): Promise<void> {
    try {
      await this.storageAdapter.deleteBlob(key)
    } catch (error) {
      console.error('Failed to delete media:', error)
      throw error
    }
  }

  /**
   * Create a blob URL for displaying media
   */
  createBlobUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
  }

  /**
   * Revoke a blob URL to free memory
   */
  revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url)
  }

  /**
   * Compress an image using Canvas API
   */
  private async compressImage(
    imageBlob: Blob, 
    maxWidth: number = 1920, 
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        // Set canvas dimensions
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              resolve(compressedBlob)
            } else {
              reject(new Error('Image compression failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(imageBlob)
    })
  }

  /**
   * Get media file size in a human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Validate media file type and size
   */
  validateMediaFile(file: File, options: MediaValidationOptions): MediaValidationResult {
    const errors: string[] = []
    
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(options.maxSize)})`)
    }
    
    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export interface AudioMetadata {
  duration?: number
  sampleRate?: number
  channels?: number
}

export interface ImageMetadata {
  maxWidth?: number
  quality?: number
  originalWidth?: number
  originalHeight?: number
}

export interface MediaValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
}

export interface MediaValidationResult {
  isValid: boolean
  errors: string[]
}

// Common media type constants
export const MEDIA_TYPES = {
  AUDIO: {
    MP3: 'audio/mpeg',
    WAV: 'audio/wav',
    M4A: 'audio/mp4',
    WEBM: 'audio/webm'
  },
  IMAGE: {
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    WEBP: 'image/webp'
  }
} as const

// Default validation options
export const DEFAULT_VALIDATION = {
  AUDIO: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: Object.values(MEDIA_TYPES.AUDIO)
  },
  IMAGE: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: Object.values(MEDIA_TYPES.IMAGE)
  }
} as const