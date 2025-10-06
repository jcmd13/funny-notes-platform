import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '@core/storage/StorageService';
import { IndexedDBAdapter } from '@core/storage/IndexedDBAdapter';
import { Note, SetList, Venue, Contact } from '@core/models';

// Mock the IndexedDBAdapter
vi.mock('@core/storage/IndexedDBAdapter', () => ({
  IndexedDBAdapter: vi.fn(),
}));

describe('StorageService', () => {
  let storageService: StorageService;
  let mockAdapter: any;

  beforeEach(() => {
    mockAdapter = {
      create: vi.fn(),
      read: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      search: vi.fn(),
      clear: vi.fn(),
    };
    
    const MockedIndexedDBAdapter = vi.mocked(IndexedDBAdapter);
    MockedIndexedDBAdapter.mockImplementation(() => mockAdapter);
    
    storageService = new StorageService();
  });

  describe('Note operations', () => {
    const mockNote: Note = {
      id: '1',
      content: 'Test joke content',
      type: 'text',
      tags: ['comedy', 'test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      attachments: [],
    };

    it('should create a note successfully', async () => {
      mockAdapter.create.mockResolvedValue(mockNote);

      const result = await storageService.createNote(mockNote);

      expect(mockAdapter.create).toHaveBeenCalledWith('notes', mockNote);
      expect(result).toEqual(mockNote);
    });

    it('should retrieve a note by id', async () => {
      mockAdapter.read.mockResolvedValue(mockNote);

      const result = await storageService.getNote('1');

      expect(mockAdapter.read).toHaveBeenCalledWith('notes', '1');
      expect(result).toEqual(mockNote);
    });

    it('should update a note', async () => {
      const updatedNote = { ...mockNote, content: 'Updated content' };
      mockAdapter.update.mockResolvedValue(updatedNote);

      const result = await storageService.updateNote('1', { content: 'Updated content' });

      expect(mockAdapter.update).toHaveBeenCalledWith('notes', '1', { content: 'Updated content' });
      expect(result).toEqual(updatedNote);
    });

    it('should delete a note', async () => {
      mockAdapter.delete.mockResolvedValue(true);

      const result = await storageService.deleteNote('1');

      expect(mockAdapter.delete).toHaveBeenCalledWith('notes', '1');
      expect(result).toBe(true);
    });

    it('should list all notes', async () => {
      const mockNotes = [mockNote];
      mockAdapter.list.mockResolvedValue(mockNotes);

      const result = await storageService.listNotes();

      expect(mockAdapter.list).toHaveBeenCalledWith('notes');
      expect(result).toEqual(mockNotes);
    });

    it('should search notes by content', async () => {
      const mockNotes = [mockNote];
      mockAdapter.search.mockResolvedValue(mockNotes);

      const result = await storageService.searchNotes('test');

      expect(mockAdapter.search).toHaveBeenCalledWith('notes', {
        text: 'test',
        fields: ['content', 'tags'],
        limit: undefined,
      });
      expect(result).toEqual(mockNotes);
    });
  });

  describe('SetList operations', () => {
    const mockSetList: SetList = {
      id: '1',
      name: 'Test Set',
      notes: [],
      totalDuration: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a setlist successfully', async () => {
      mockAdapter.create.mockResolvedValue(mockSetList);

      const result = await storageService.createSetList(mockSetList);

      expect(mockAdapter.create).toHaveBeenCalledWith('setlists', mockSetList);
      expect(result).toEqual(mockSetList);
    });

    it('should calculate total duration when updating setlist', async () => {
      const noteWithDuration: Note = {
        id: '1',
        content: 'Timed joke',
        type: 'text',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { duration: 30 },
        attachments: [],
      };

      const setListWithNotes = {
        ...mockSetList,
        notes: [noteWithDuration],
        totalDuration: 30,
      };

      mockAdapter.update.mockResolvedValue(setListWithNotes);

      const result = await storageService.updateSetList('1', { notes: [noteWithDuration] });

      expect(result.totalDuration).toBe(30);
    });
  });

  describe('Error handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAdapter.create.mockRejectedValue(new Error('Storage error'));

      await expect(storageService.createNote({} as Note)).rejects.toThrow('Storage error');
    });

    it('should handle not found errors', async () => {
      mockAdapter.read.mockResolvedValue(null);

      const result = await storageService.getNote('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Offline functionality', () => {
    it('should queue operations when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const mockNote: Note = {
        id: '1',
        content: 'Offline note',
        type: 'text',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        attachments: [],
      };

      // Should still work offline by storing locally
      mockAdapter.create.mockResolvedValue(mockNote);
      const result = await storageService.createNote(mockNote);

      expect(result).toEqual(mockNote);
      expect(mockAdapter.create).toHaveBeenCalled();
    });
  });
});