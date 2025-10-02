import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ContentOrganizationService } from '../ContentOrganizationService'
import type { StorageService } from '../../storage/StorageService'
import type { Note } from '../../models'

// Mock StorageService
const mockStorageService = {
  listNotes: vi.fn(),
  getNote: vi.fn(),
  updateNote: vi.fn(),
  deleteManyNotes: vi.fn(),
  createNote: vi.fn(),
  listSetLists: vi.fn(),
  listVenues: vi.fn(),
  listContacts: vi.fn(),
  createVenue: vi.fn(),
  createContact: vi.fn(),
  createSetList: vi.fn(),
  searchNotes: vi.fn()
} as unknown as StorageService

describe('ContentOrganizationService', () => {
  let service: ContentOrganizationService
  
  beforeEach(() => {
    service = new ContentOrganizationService(mockStorageService)
    vi.clearAllMocks()
  })

  describe('Duplicate Detection', () => {
    it('should detect similar notes based on content', async () => {
      const mockNotes: Note[] = [
        {
          id: '1',
          content: 'Why did the chicken cross the road?',
          captureMethod: 'text',
          tags: ['classic', 'setup'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {},
          attachments: []
        },
        {
          id: '2',
          content: 'Why did the chicken cross the road? To get to the other side!',
          captureMethod: 'text',
          tags: ['classic', 'punchline'],
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          metadata: {},
          attachments: []
        },
        {
          id: '3',
          content: 'What is the meaning of life?',
          captureMethod: 'text',
          tags: ['philosophical'],
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          metadata: {},
          attachments: []
        }
      ]

      vi.mocked(mockStorageService.listNotes).mockResolvedValue(mockNotes)

      const duplicates = await service.detectDuplicates(0.5)

      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].originalNote.id).toBe('1')
      expect(duplicates[0].duplicates).toHaveLength(1)
      expect(duplicates[0].duplicates[0].note.id).toBe('2')
      expect(duplicates[0].duplicates[0].similarity).toBeGreaterThan(0.5)
    })

    it('should not detect duplicates when similarity is below threshold', async () => {
      const mockNotes: Note[] = [
        {
          id: '1',
          content: 'Why did the chicken cross the road?',
          captureMethod: 'text',
          tags: ['classic'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: {},
          attachments: []
        },
        {
          id: '2',
          content: 'What is the meaning of life?',
          captureMethod: 'text',
          tags: ['philosophical'],
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          metadata: {},
          attachments: []
        }
      ]

      vi.mocked(mockStorageService.listNotes).mockResolvedValue(mockNotes)

      const duplicates = await service.detectDuplicates(0.8)

      expect(duplicates).toHaveLength(0)
    })
  })

  describe('Content Categorization', () => {
    it('should categorize notes by duration', async () => {
      const mockNotes: Note[] = [
        {
          id: '1',
          content: 'Short joke',
          captureMethod: 'text',
          tags: [],
          estimatedDuration: 30, // short
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
          attachments: []
        },
        {
          id: '2',
          content: 'Medium length story that takes a bit more time to tell',
          captureMethod: 'text',
          tags: [],
          estimatedDuration: 180, // medium (between 120-300)
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
          attachments: []
        },
        {
          id: '3',
          content: 'Very long story that goes on and on with lots of details and takes a very long time to tell properly',
          captureMethod: 'text',
          tags: [],
          estimatedDuration: 400, // long (over 300)
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
          attachments: []
        }
      ]

      vi.mocked(mockStorageService.listNotes).mockResolvedValue(mockNotes)

      const categorized = await service.categorizeByDuration()

      expect(categorized.short).toHaveLength(1)
      expect(categorized.medium).toHaveLength(1)
      expect(categorized.long).toHaveLength(1)
      expect(categorized.short[0].id).toBe('1')
      expect(categorized.medium[0].id).toBe('2')
      expect(categorized.long[0].id).toBe('3')
    })
  })

  describe('Bulk Operations', () => {
    it('should bulk delete notes', async () => {
      const noteIds = ['1', '2', '3']
      vi.mocked(mockStorageService.deleteManyNotes).mockResolvedValue()

      const result = await service.bulkDeleteNotes(noteIds)

      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(3)
      expect(result.errors).toHaveLength(0)
      expect(mockStorageService.deleteManyNotes).toHaveBeenCalledWith(noteIds)
    })

    it('should bulk add tags to notes', async () => {
      const noteIds = ['1', '2']
      const tagsToAdd = ['funny', 'new']
      const mockNote = {
        id: '1',
        content: 'Test note',
        captureMethod: 'text' as const,
        tags: ['existing'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: []
      }

      vi.mocked(mockStorageService.getNote).mockResolvedValue(mockNote)
      vi.mocked(mockStorageService.updateNote).mockResolvedValue({
        ...mockNote,
        tags: ['existing', 'funny', 'new']
      })

      const result = await service.bulkAddTags(noteIds, tagsToAdd)

      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(2)
      expect(mockStorageService.updateNote).toHaveBeenCalledTimes(2)
    })
  })

  describe('Export/Import', () => {
    it('should export data to JSON format', async () => {
      const mockNotes: Note[] = [{
        id: '1',
        content: 'Test note',
        captureMethod: 'text',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: []
      }]

      vi.mocked(mockStorageService.listNotes).mockResolvedValue(mockNotes)
      vi.mocked(mockStorageService.listSetLists).mockResolvedValue([])
      vi.mocked(mockStorageService.listVenues).mockResolvedValue([])
      vi.mocked(mockStorageService.listContacts).mockResolvedValue([])

      const exportData = await service.exportToJSON()

      expect(exportData.notes).toEqual(mockNotes)
      expect(exportData.setlists).toEqual([])
      expect(exportData.venues).toEqual([])
      expect(exportData.contacts).toEqual([])
      expect(exportData.version).toBe('1.0.0')
      expect(exportData.exportedAt).toBeDefined()
    })

    it('should export notes to CSV format', async () => {
      const mockNotes: Note[] = [{
        id: '1',
        content: 'Test note with "quotes"',
        captureMethod: 'text',
        tags: ['test', 'csv'],
        venue: 'Test Venue',
        audience: 'Test Audience',
        estimatedDuration: 60,
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
        metadata: {},
        attachments: []
      }]

      vi.mocked(mockStorageService.listNotes).mockResolvedValue(mockNotes)

      const csvContent = await service.exportToCSV('notes')

      expect(csvContent).toContain('ID,Content,Capture Method,Tags,Venue,Audience,Estimated Duration,Created At,Updated At')
      expect(csvContent).toContain('1,"Test note with ""quotes""",text,"test, csv",Test Venue,Test Audience,60,2024-01-01T12:00:00.000Z,2024-01-01T12:00:00.000Z')
    })
  })

  describe('File Download', () => {
    it('should create download link for file', () => {
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      const mockCreateElement = vi.fn().mockReturnValue(mockLink)
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url')
      const mockRevokeObjectURL = vi.fn()

      // Setup DOM mocks
      Object.defineProperty(document, 'createElement', { value: mockCreateElement })
      Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild })
      Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild })
      Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL })
      Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL })

      service.downloadFile('test content', 'test.txt', 'text/plain')

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockLink.download).toBe('test.txt')
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink)
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink)
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    })
  })
})