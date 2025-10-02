import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageService, IndexedDBAdapter } from '../index'
import type { CreateNoteInput, CreateSetListInput } from '../../models'

// Mock IndexedDB for testing (not used directly but kept for future use)

// Mock Dexie
vi.mock('dexie', () => {
  return {
    default: class MockDexie {
      version = vi.fn().mockReturnThis()
      stores = vi.fn().mockReturnThis()
      open = vi.fn().mockResolvedValue(undefined)
      close = vi.fn()
      
      notes = {
        add: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        bulkDelete: vi.fn(),
        orderBy: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
        toCollection: vi.fn().mockReturnThis()
      }
      
      setlists = {
        add: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        bulkDelete: vi.fn(),
        orderBy: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
        toCollection: vi.fn().mockReturnThis()
      }
      
      venues = {
        add: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        bulkDelete: vi.fn(),
        orderBy: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
        toCollection: vi.fn().mockReturnThis()
      }
      
      contacts = {
        add: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        bulkDelete: vi.fn(),
        orderBy: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
        toCollection: vi.fn().mockReturnThis()
      }
      
      sync_queue = {
        add: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        bulkDelete: vi.fn(),
        orderBy: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
        toCollection: vi.fn().mockReturnThis()
      }
      
      blobs = {
        add: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        bulkDelete: vi.fn(),
        orderBy: vi.fn().mockReturnThis(),
        reverse: vi.fn().mockReturnThis(),
        filter: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([]),
        toCollection: vi.fn().mockReturnThis()
      }
    }
  }
})

describe('StorageService', () => {
  let storageService: StorageService
  let adapter: IndexedDBAdapter

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create fresh instances
    adapter = new IndexedDBAdapter()
    storageService = new StorageService(adapter)
    await storageService.initialize()
  })

  afterEach(async () => {
    await storageService.close()
  })

  describe('Note Operations', () => {
    it('should create a note with generated ID and timestamps', async () => {
      const noteInput: CreateNoteInput = {
        content: 'Why did the chicken cross the road?',
        captureMethod: 'text',
        tags: ['classic', 'setup'],
        metadata: {},
        attachments: []
      }

      const mockNote = {
        ...noteInput,
        id: 'test-id',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock the adapter's create method
      vi.spyOn(adapter, 'create').mockResolvedValue(mockNote)

      const result = await storageService.createNote(noteInput)

      expect(result).toEqual(mockNote)
      expect(adapter.create).toHaveBeenCalledWith('notes', expect.objectContaining({
        content: noteInput.content,
        captureMethod: noteInput.captureMethod,
        tags: noteInput.tags,
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }))
    })

    it('should get a note by ID', async () => {
      const mockNote = {
        id: 'test-id',
        content: 'Test note',
        type: 'text' as const,
        tags: [],
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.spyOn(adapter, 'read').mockResolvedValue(mockNote)

      const result = await storageService.getNote('test-id')

      expect(result).toEqual(mockNote)
      expect(adapter.read).toHaveBeenCalledWith('notes', 'test-id')
    })

    it('should update a note', async () => {
      const updates = { content: 'Updated content' }
      const mockUpdatedNote = {
        id: 'test-id',
        content: 'Updated content',
        type: 'text' as const,
        tags: [],
        metadata: {},
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.spyOn(adapter, 'update').mockResolvedValue(mockUpdatedNote)

      const result = await storageService.updateNote('test-id', updates)

      expect(result).toEqual(mockUpdatedNote)
      expect(adapter.update).toHaveBeenCalledWith('notes', 'test-id', updates)
    })

    it('should delete a note and its attachments', async () => {
      const mockNote = {
        id: 'test-id',
        content: 'Test note',
        type: 'voice' as const,
        tags: [],
        metadata: {},
        attachments: [
          {
            id: 'attachment-1',
            type: 'audio' as const,
            filename: 'test.mp3',
            size: 1000,
            mimeType: 'audio/mpeg',
            url: 'audio_test_key'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.spyOn(adapter, 'read').mockResolvedValue(mockNote)
      vi.spyOn(adapter, 'delete').mockResolvedValue(undefined)
      vi.spyOn(adapter, 'deleteBlob').mockResolvedValue(undefined)

      await storageService.deleteNote('test-id')

      expect(adapter.delete).toHaveBeenCalledWith('notes', 'test-id')
      expect(adapter.deleteBlob).toHaveBeenCalledWith('audio_test_key')
    })

    it('should search notes by content and tags', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          content: 'Funny joke about chickens',
          type: 'text' as const,
          tags: ['animals', 'classic'],
          metadata: {},
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.spyOn(adapter, 'search').mockResolvedValue(mockNotes)

      const result = await storageService.searchNotes('chicken')

      expect(result).toEqual(mockNotes)
      expect(adapter.search).toHaveBeenCalledWith('notes', {
        text: 'chicken',
        fields: ['content', 'tags'],
        limit: undefined
      })
    })
  })

  describe('SetList Operations', () => {
    it('should create a setlist with calculated duration', async () => {
      const notes = [
        {
          id: 'note-1',
          content: 'Joke 1',
          captureMethod: 'text' as const,
          tags: [],
          metadata: { duration: 30 },
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'note-2',
          content: 'Joke 2',
          captureMethod: 'text' as const,
          tags: [],
          metadata: { duration: 45 },
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      const setListInput: CreateSetListInput = {
        name: 'Comedy Night Set',
        notes,
        venue: 'venue-1'
      }

      const mockSetList = {
        ...setListInput,
        id: 'setlist-id',
        totalDuration: 75, // 30 + 45
        feedback: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.spyOn(adapter, 'create').mockResolvedValue(mockSetList)

      const result = await storageService.createSetList(setListInput)

      expect(result.totalDuration).toBe(75)
      expect(adapter.create).toHaveBeenCalledWith('setlists', expect.objectContaining({
        name: setListInput.name,
        notes: setListInput.notes,
        totalDuration: 75,
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }))
    })
  })

  describe('Media Operations', () => {
    it('should store and retrieve audio blob', async () => {
      const audioBlob = new Blob(['audio data'], { type: 'audio/mpeg' })

      vi.spyOn(adapter, 'storeBlob').mockResolvedValue('stored_key')
      vi.spyOn(adapter, 'getBlob').mockResolvedValue(audioBlob)

      const key = await storageService.storeAudioBlob(audioBlob, { duration: 60 })
      expect(key).toMatch(/^audio_.+_\d+$/)

      const retrievedBlob = await storageService.getMediaBlob(key)
      expect(retrievedBlob).toBe(audioBlob)
    })
  })

  describe('Global Search', () => {
    it('should search across all content types', async () => {
      const mockResults = {
        notes: [],
        setlists: [],
        venues: [],
        contacts: []
      }

      vi.spyOn(adapter, 'search')
        .mockResolvedValueOnce([]) // notes
        .mockResolvedValueOnce([]) // setlists
        .mockResolvedValueOnce([]) // venues
        .mockResolvedValueOnce([]) // contacts

      const result = await storageService.globalSearch('test query')

      expect(result).toEqual(mockResults)
      expect(adapter.search).toHaveBeenCalledTimes(4)
    })
  })
})