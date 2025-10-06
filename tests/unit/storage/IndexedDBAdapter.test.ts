import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBAdapter } from '@core/storage/IndexedDBAdapter';
import Dexie from 'dexie';

// Mock Dexie
vi.mock('dexie', () => ({
  default: vi.fn(),
}));

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      notes: {
        add: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        toArray: vi.fn(),
        where: vi.fn().mockReturnThis(),
        anyOfIgnoreCase: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        toArray: vi.fn(),
      },
      setlists: {
        add: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        toArray: vi.fn(),
      },
      venues: {
        add: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        toArray: vi.fn(),
      },
      contacts: {
        add: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        toArray: vi.fn(),
      },
      version: vi.fn().mockReturnThis(),
      stores: vi.fn().mockReturnThis(),
      upgrade: vi.fn().mockReturnThis(),
      open: vi.fn().mockResolvedValue(undefined),
    };

    const MockedDexie = vi.mocked(Dexie);
    MockedDexie.mockImplementation(() => mockDb);
    
    adapter = new IndexedDBAdapter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CRUD operations', () => {
    const mockNote = {
      id: '1',
      content: 'Test note',
      type: 'text',
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      attachments: [],
    };

    it('should create a record', async () => {
      mockDb.notes.add.mockResolvedValue('1');
      mockDb.notes.get.mockResolvedValue(mockNote);

      const result = await adapter.create('notes', mockNote);

      expect(mockDb.notes.add).toHaveBeenCalledWith(mockNote);
      expect(result).toEqual(mockNote);
    });

    it('should read a record by id', async () => {
      mockDb.notes.get.mockResolvedValue(mockNote);

      const result = await adapter.read('notes', '1');

      expect(mockDb.notes.get).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockNote);
    });

    it('should update a record', async () => {
      const updatedNote = { ...mockNote, content: 'Updated content' };
      mockDb.notes.put.mockResolvedValue(1);
      mockDb.notes.get.mockResolvedValue(updatedNote);

      const result = await adapter.update('notes', '1', { content: 'Updated content' });

      expect(mockDb.notes.put).toHaveBeenCalled();
      expect(result).toEqual(updatedNote);
    });

    it('should delete a record', async () => {
      mockDb.notes.delete.mockResolvedValue(1);

      const result = await adapter.delete('notes', '1');

      expect(mockDb.notes.delete).toHaveBeenCalledWith('1');
      expect(result).toBe(true);
    });

    it('should list all records', async () => {
      const mockNotes = [mockNote];
      mockDb.notes.toArray.mockResolvedValue(mockNotes);

      const result = await adapter.list('notes');

      expect(mockDb.notes.toArray).toHaveBeenCalled();
      expect(result).toEqual(mockNotes);
    });
  });

  describe('Search functionality', () => {
    it('should search records by content', async () => {
      const mockNotes = [
        {
          id: '1',
          content: 'Funny joke about chickens',
          type: 'text',
          tags: ['comedy'],
        },
      ];

      mockDb.notes.where.mockReturnValue({
        anyOfIgnoreCase: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(mockNotes),
          }),
        }),
      });

      const result = await adapter.search('notes', 'chicken');

      expect(result).toEqual(mockNotes);
    });

    it('should return empty array when no matches found', async () => {
      mockDb.notes.where.mockReturnValue({
        anyOfIgnoreCase: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await adapter.search('notes', 'nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.open.mockRejectedValue(new Error('Database connection failed'));

      // The adapter should handle this gracefully
      await expect(adapter.create('notes', {} as any)).rejects.toThrow();
    });

    it('should handle transaction errors', async () => {
      mockDb.notes.add.mockRejectedValue(new Error('Transaction failed'));

      await expect(adapter.create('notes', {} as any)).rejects.toThrow('Transaction failed');
    });
  });
});