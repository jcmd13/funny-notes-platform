import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStorage } from '../useStorage'
import { StorageFactory } from '@core/storage'

// Mock the StorageFactory
vi.mock('@core/storage', () => ({
  StorageFactory: {
    getInstance: vi.fn(),
  },
}))

const mockStorageFactory = vi.mocked(StorageFactory)

describe('useStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize storage service successfully', async () => {
    const mockStorageService = { initialized: true }
    mockStorageFactory.getInstance.mockResolvedValue(mockStorageService as any)

    const { result } = renderHook(() => useStorage())

    expect(result.current.isInitialized).toBe(false)
    expect(result.current.storageService).toBe(null)
    expect(result.current.error).toBe(null)

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.storageService).toBe(mockStorageService)
    expect(result.current.error).toBe(null)
  })

  it('should handle initialization errors', async () => {
    const mockError = new Error('Storage initialization failed')
    mockStorageFactory.getInstance.mockRejectedValue(mockError)

    const { result } = renderHook(() => useStorage())

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError)
    })

    expect(result.current.isInitialized).toBe(false)
    expect(result.current.storageService).toBe(null)
  })

  it('should handle non-Error exceptions', async () => {
    mockStorageFactory.getInstance.mockRejectedValue('String error')

    const { result } = renderHook(() => useStorage())

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error)
    })

    expect(result.current.error?.message).toBe('Failed to initialize storage')
    expect(result.current.isInitialized).toBe(false)
  })
})