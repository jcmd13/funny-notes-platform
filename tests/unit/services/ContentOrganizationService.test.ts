import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentOrganizationService } from '@core/services/ContentOrganizationService';
import { Note } from '@core/models';

// Mock the StorageService
const mockStorageService = {
  listNotes: vi.fn(),
  getNote: vi.fn(),
  updateNote: vi.fn(),
  deleteManyNotes: vi.fn(),
  listSetLists: vi.fn(),
  listVenues: vi.fn(),
  listContacts: vi.fn(),
  createNote: vi.fn(),
  createVenue: vi.fn(),
  createContact: vi.fn(),
  createSetList: vi.fn(),
  searchNotes: vi.fn(),
};

describe('ContentOrganizationService', () => {
  let service: ContentOrganizationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ContentOrganizationService(mockStorageService as any);
  });

  describe('Duplicate detection', () => {
    const note1: Note = {
      id: '1',
      content: 'Why did the chicken cross the road?',
      captureMethod: 'text',
      tags: ['comedy'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      metadata: {},
      attachments: [],
    };

    const note2: Note = {
      id: '2',
      content: 'Why did the chicken cross the road? To get to the other side!',
      captureMethod: 'text',
      tags: ['comedy', 'classic'],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      metadata: {},
      attachments: [],
    };

    const note3: Note = {
      id: '3',
      content: 'Completely different joke about cats',
      captureMethod: 'text',
      tags: ['comedy', 'animals'],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      metadata: {},
      attachments: [],
    };

    it('should detect similar content', async () => {
      mockStorageService.listNotes.mockResolvedValue([note1, note2, note3]);
      
      const duplicates = await service.detectDuplicates(0.5); // Lower threshold for test

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].originalNote).toEqual(note1);
      expect(duplicates[0].duplicates).toHaveLength(1);
      expect(duplicates[0].duplicates[0].note).toEqual(note2);
      expect(duplicates[0].duplicates[0].similarity).toBeGreaterThan(0.5);
    });

    it('should not detect dissimilar content as duplicates', async () => {
      mockStorageService.listNotes.mockResolvedValue([note1, note3]);
      
      const duplicates = await service.detectDuplicates(0.8);

      expect(duplicates).toHaveLength(0);
    });

    it('should handle empty notes array', async () => {
      mockStorageService.listNotes.mockResolvedValue([]);
      
      const duplicates = await service.detectDuplicates();
      expect(duplicates).toHaveLength(0);
    });

    it('should handle single note', async () => {
      mockStorageService.listNotes.mockResolvedValue([note1]);
      
      const duplicates = await service.detectDuplicates();
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('Content categorization', () => {
    it('should categorize notes by duration', async () => {
      const shortNote: Note = {
        id: '1',
        content: 'Quick joke',
        captureMethod: 'text',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
        estimatedDuration: 15,
      };

      const longNote: Note = {
        id: '2',
        content: 'This is a much longer story that would take several minutes to tell properly with all the setup and punchlines',
        captureMethod: 'text',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
        estimatedDuration: 180,
      };

      mockStorageService.listNotes.mockResolvedValue([shortNote, longNote]);

      const categories = await service.categorizeByDuration();

      expect(categories).toHaveProperty('short');
      expect(categories).toHaveProperty('medium');
      expect(categories).toHaveProperty('long');
      expect(Array.isArray(categories.short)).toBe(true);
      expect(Array.isArray(categories.long)).toBe(true);
    });
  });

  describe('Bulk operations', () => {
    it('should bulk delete notes', async () => {
      mockStorageService.deleteManyNotes.mockResolvedValue(undefined);

      const result = await service.bulkDeleteNotes(['1', '2', '3']);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(3);
      expect(result.errors).toHaveLength(0);
      expect(mockStorageService.deleteManyNotes).toHaveBeenCalledWith(['1', '2', '3']);
    });

    it('should bulk add tags to notes', async () => {
      const mockNote = {
        id: '1',
        content: 'Test note',
        captureMethod: 'text',
        tags: ['existing'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
      };

      mockStorageService.getNote.mockResolvedValue(mockNote);
      mockStorageService.updateNote.mockResolvedValue(undefined);

      const result = await service.bulkAddTags(['1'], ['new-tag']);

      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(mockStorageService.updateNote).toHaveBeenCalledWith('1', {
        tags: ['existing', 'new-tag'],
        updatedAt: expect.any(Date),
      });
    });

    it('should handle bulk operation errors', async () => {
      mockStorageService.deleteManyNotes.mockRejectedValue(new Error('Delete failed'));

      const result = await service.bulkDeleteNotes(['1', '2']);

      expect(result.success).toBe(false);
      expect(result.processedCount).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Delete failed');
    });
  });

  describe('Export functionality', () => {
    it('should export data to JSON', async () => {
      const mockNotes = [{ id: '1', content: 'Test note' }];
      const mockSetLists = [{ id: '1', name: 'Test set' }];
      const mockVenues = [{ id: '1', name: 'Test venue' }];
      const mockContacts = [{ id: '1', name: 'Test contact' }];

      mockStorageService.listNotes.mockResolvedValue(mockNotes);
      mockStorageService.listSetLists.mockResolvedValue(mockSetLists);
      mockStorageService.listVenues.mockResolvedValue(mockVenues);
      mockStorageService.listContacts.mockResolvedValue(mockContacts);

      const exportData = await service.exportToJSON();

      expect(exportData.notes).toEqual(mockNotes);
      expect(exportData.setlists).toEqual(mockSetLists);
      expect(exportData.venues).toEqual(mockVenues);
      expect(exportData.contacts).toEqual(mockContacts);
      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.version).toBe('1.0.0');
    });

    it('should export notes to CSV', async () => {
      const mockNotes = [{
        id: '1',
        content: 'Test note content',
        captureMethod: 'text',
        tags: ['comedy', 'test'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        metadata: {},
        attachments: [],
      }];

      mockStorageService.listNotes.mockResolvedValue(mockNotes);

      const csv = await service.exportToCSV('notes');

      expect(csv).toContain('ID,Content,Capture Method,Tags');
      expect(csv).toContain('1,"Test note content",text,"comedy, test"');
    });
  });
});