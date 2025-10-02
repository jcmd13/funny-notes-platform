import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotes } from '../useNotes'
import { useStorage } from '../useStorage'
import type { Note } from '@core/models'

// Mock the useStorage hook
vi.mock('../useStorage')
const mockUseStorage = vi.mocked(useStorage)

describe('useNotes', () => {
  const mockStorageService = {
    listNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    searchNotes: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockReturnValue({
      storageService: mockStorageService as any,
      isInitialized: true,
      error: null,
    })
  })

  it('should load notes on initialization', async () => {
    const mockNotes: Note[] = [
      {
        id: '1',
        content: 'Test note',
        captureMethod: 'text',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
      },
    ]

    mockStorageService.listNotes.mockResolvedValue(mockNotes)

    const { result } = renderHook(() => useNotes())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.notes).toEqual(mockNotes)
    expect(result.current.error).toBe(null)
    expect(mockStorageService.listNotes).toHaveBeenCalledWith({})
  })

  it('should provide CRUD functions', () => {
    mockStorageService.listNotes.mockResolvedValue([])

    const { result } = renderHook(() => useNotes())

    expect(typeof result.current.createNote).toBe('function')
    expect(typeof result.current.updateNote).toBe('function')
    expect(typeof result.current.deleteNote).toBe('function')
    expect(typeof result.current.searchNotes).toBe('function')
    expect(typeof result.current.refreshNotes).toBe('function')
  })

  it('should handle storage service not available', () => {
    mockUseStorage.mockReturnValue({
      storageService: null,
      isInitialized: false,
      error: null,
    })

    const { result } = renderHook(() => useNotes())

    expect(result.current.notes).toEqual([])
    expect(result.current.loading).toBe(true)
  })
})