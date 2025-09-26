import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MediaStorage, DEFAULT_VALIDATION, MEDIA_TYPES } from '../MediaStorage'
import type { IStorageAdapter } from '../IStorageAdapter'

// Mock storage adapter
const mockStorageAdapter: IStorageAdapter = {
  create: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  createMany: vi.fn(),
  deleteMany: vi.fn(),
  search: vi.fn(),
  storeBlob: vi.fn(),
  getBlob: vi.fn(),
  deleteBlob: vi.fn(),
  addToSyncQueue: vi.fn(),
  getSyncQueue: vi.fn(),
  removeSyncOperation: vi.fn(),
  clearSyncQueue: vi.fn(),
  initialize: vi.fn(),
  clear: vi.fn(),
  close: vi.fn()
}

// Mock Canvas API for image compression
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn()
  })),
  toBlob: vi.fn()
}

const mockImage = {
  width: 1920,
  height: 1080,
  onload: null as any,
  onerror: null as any,
  src: ''
}

// Mock DOM APIs
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn((tag: string) => {
      if (tag === 'canvas') return mockCanvas
      if (tag === 'img') return mockImage
      return {}
    })
  }
})

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn()
  }
})

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid')
  }
})

describe('MediaStorage', () => {
  let mediaStorage: MediaStorage

  beforeEach(() => {
    vi.clearAllMocks()
    mediaStorage = new MediaStorage(mockStorageAdapter)
  })

  describe('Audio Storage', () => {
    it('should store audio blob with metadata', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/mpeg' })
      const metadata = { duration: 60, sampleRate: 44100 }
      const expectedKey = 'audio_mock-uuid_' + Date.now()

      vi.mocked(mockStorageAdapter.storeBlob).mockResolvedValue(expectedKey)

      const result = await mediaStorage.storeAudio(audioBlob, metadata)

      expect(result).toMatch(/^audio_mock-uuid_\d+$/)
      expect(mockStorageAdapter.storeBlob).toHaveBeenCalledWith(
        expect.stringMatching(/^audio_mock-uuid_\d+$/),
        audioBlob
      )
    })

    it('should retrieve audio blob', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/mpeg' })
      const key = 'audio_test_key'

      vi.mocked(mockStorageAdapter.getBlob).mockResolvedValue(audioBlob)

      const result = await mediaStorage.getMedia(key)

      expect(result).toBe(audioBlob)
      expect(mockStorageAdapter.getBlob).toHaveBeenCalledWith(key)
    })
  })

  describe('Image Storage', () => {
    it('should store image blob', async () => {
      const imageBlob = new Blob(['image data'], { type: 'image/jpeg' })
      const metadata = { maxWidth: 1920, quality: 0.8 }

      // Mock the compressImage method to avoid DOM API issues in tests
      const compressImageSpy = vi.spyOn(mediaStorage as any, 'compressImage')
      compressImageSpy.mockResolvedValue(imageBlob)

      vi.mocked(mockStorageAdapter.storeBlob).mockResolvedValue('image_key')

      const result = await mediaStorage.storeImage(imageBlob, metadata)

      expect(result).toMatch(/^image_mock-uuid_\d+$/)
      expect(mockStorageAdapter.storeBlob).toHaveBeenCalledWith(
        expect.stringMatching(/^image_mock-uuid_\d+$/),
        imageBlob
      )
    })
  })

  describe('Blob URL Management', () => {
    it('should create and revoke blob URLs', () => {
      const blob = new Blob(['test data'])
      
      const url = mediaStorage.createBlobUrl(blob)
      expect(url).toBe('blob:mock-url')
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob)

      mediaStorage.revokeBlobUrl(url)
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
    })
  })

  describe('File Size Formatting', () => {
    it('should format file sizes correctly', () => {
      expect(mediaStorage.formatFileSize(0)).toBe('0 Bytes')
      expect(mediaStorage.formatFileSize(1024)).toBe('1 KB')
      expect(mediaStorage.formatFileSize(1048576)).toBe('1 MB')
      expect(mediaStorage.formatFileSize(1073741824)).toBe('1 GB')
      expect(mediaStorage.formatFileSize(1536)).toBe('1.5 KB')
    })
  })

  describe('File Validation', () => {
    it('should validate file size', () => {
      const file = new File(['test content'], 'test.mp3', { 
        type: 'audio/mpeg' 
      })
      
      // Mock file size
      Object.defineProperty(file, 'size', { value: 1000 })

      const result = mediaStorage.validateMediaFile(file, {
        maxSize: 500,
        allowedTypes: [MEDIA_TYPES.AUDIO.MP3]
      })

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('exceeds maximum allowed size')
    })

    it('should validate file type', () => {
      const file = new File(['test content'], 'test.txt', { 
        type: 'text/plain' 
      })

      const result = mediaStorage.validateMediaFile(file, {
        maxSize: 1000000,
        allowedTypes: [MEDIA_TYPES.AUDIO.MP3]
      })

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('File type text/plain is not allowed')
    })

    it('should pass validation for valid files', () => {
      const file = new File(['test content'], 'test.mp3', { 
        type: 'audio/mpeg' 
      })
      
      Object.defineProperty(file, 'size', { value: 1000 })

      const result = mediaStorage.validateMediaFile(file, {
        maxSize: 10000,
        allowedTypes: [MEDIA_TYPES.AUDIO.MP3]
      })

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Default Validation Options', () => {
    it('should have correct default audio validation', () => {
      expect(DEFAULT_VALIDATION.AUDIO.maxSize).toBe(50 * 1024 * 1024) // 50MB
      expect(DEFAULT_VALIDATION.AUDIO.allowedTypes).toContain(MEDIA_TYPES.AUDIO.MP3)
      expect(DEFAULT_VALIDATION.AUDIO.allowedTypes).toContain(MEDIA_TYPES.AUDIO.WAV)
    })

    it('should have correct default image validation', () => {
      expect(DEFAULT_VALIDATION.IMAGE.maxSize).toBe(10 * 1024 * 1024) // 10MB
      expect(DEFAULT_VALIDATION.IMAGE.allowedTypes).toContain(MEDIA_TYPES.IMAGE.JPEG)
      expect(DEFAULT_VALIDATION.IMAGE.allowedTypes).toContain(MEDIA_TYPES.IMAGE.PNG)
    })
  })
})