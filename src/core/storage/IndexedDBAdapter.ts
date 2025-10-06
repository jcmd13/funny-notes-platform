import Dexie, { type Table } from 'dexie'
import type { 
  IStorageAdapter, 
  ListOptions, 
  SearchQuery, 
  SyncOperation
} from './IStorageAdapter'
import { TABLES } from './IStorageAdapter'
import type { Note, SetList, Venue, Contact, RehearsalSession, Performance } from '../models'

// Database schema interface
interface FunnyNotesDB extends Dexie {
  notes: Table<Note>
  setlists: Table<SetList>
  venues: Table<Venue>
  contacts: Table<Contact>
  rehearsal_sessions: Table<RehearsalSession>
  performances: Table<Performance>
  sync_queue: Table<SyncOperation>
  blobs: Table<BlobRecord>
}

interface BlobRecord {
  key: string
  blob: Blob
  mimeType: string
  size: number
  createdAt: Date
}

/**
 * IndexedDB implementation of the storage adapter using Dexie
 * Provides offline-first storage with automatic sync queuing
 */
export class IndexedDBAdapter implements IStorageAdapter {
  private db: FunnyNotesDB

  constructor() {
    this.db = new Dexie('FunnyNotesDB') as FunnyNotesDB
    
    // Define database schema
    this.db.version(1).stores({
      notes: 'id, content, type, *tags, createdAt, updatedAt',
      setlists: 'id, name, createdAt, updatedAt, venue, performanceDate',
      venues: 'id, name, location, createdAt, updatedAt',
      contacts: 'id, name, role, venue, createdAt, updatedAt',
      sync_queue: 'id, type, table, itemId, timestamp',
      blobs: 'key, mimeType, size, createdAt'
    })

    // Version 2: Update notes schema to use captureMethod and add new fields
    this.db.version(2).stores({
      notes: 'id, content, captureMethod, *tags, venue, audience, estimatedDuration, createdAt, updatedAt',
      setlists: 'id, name, createdAt, updatedAt, venue, performanceDate',
      venues: 'id, name, location, createdAt, updatedAt',
      contacts: 'id, name, role, venue, createdAt, updatedAt',
      sync_queue: 'id, type, table, itemId, timestamp',
      blobs: 'key, mimeType, size, createdAt'
    }).upgrade(tx => {
      // Migrate existing notes from type to captureMethod
      return tx.table('notes').toCollection().modify(note => {
        if (note.type) {
          note.captureMethod = note.type;
          delete note.type;
        }
        // Initialize new optional fields
        if (!note.venue) note.venue = undefined;
        if (!note.audience) note.audience = undefined;
        if (!note.estimatedDuration) note.estimatedDuration = undefined;
      });
    })

    // Version 3: Add rehearsal sessions table
    this.db.version(3).stores({
      notes: 'id, content, captureMethod, *tags, venue, audience, estimatedDuration, createdAt, updatedAt',
      setlists: 'id, name, createdAt, updatedAt, venue, performanceDate',
      venues: 'id, name, location, createdAt, updatedAt',
      contacts: 'id, name, role, venue, createdAt, updatedAt',
      rehearsal_sessions: 'id, setListId, startTime, endTime, isCompleted, createdAt, updatedAt',
      sync_queue: 'id, type, table, itemId, timestamp',
      blobs: 'key, mimeType, size, createdAt'
    })

    // Version 4: Add performances table
    this.db.version(4).stores({
      notes: 'id, content, captureMethod, *tags, venue, audience, estimatedDuration, createdAt, updatedAt',
      setlists: 'id, name, createdAt, updatedAt, venue, performanceDate',
      venues: 'id, name, location, createdAt, updatedAt',
      contacts: 'id, name, role, venue, createdAt, updatedAt',
      rehearsal_sessions: 'id, setListId, startTime, endTime, isCompleted, createdAt, updatedAt',
      performances: 'id, setListId, venueId, date, status, createdAt, updatedAt',
      sync_queue: 'id, type, table, itemId, timestamp',
      blobs: 'key, mimeType, size, createdAt'
    })
  }

  async initialize(): Promise<void> {
    try {
      await this.db.open()
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      throw new Error('Storage initialization failed')
    }
  }

  async create<T>(table: string, item: T): Promise<T> {
    try {
      const typedItem = item as any
      
      // Ensure timestamps are set
      if (!typedItem.createdAt) {
        typedItem.createdAt = new Date()
      }
      if (!typedItem.updatedAt) {
        typedItem.updatedAt = new Date()
      }
      
      // Generate ID if not provided
      if (!typedItem.id) {
        typedItem.id = crypto.randomUUID()
      }

      await this.getTable(table).add(typedItem)
      
      // Add to sync queue for future backend sync
      await this.addToSyncQueue({
        id: crypto.randomUUID(),
        type: 'create',
        table,
        itemId: typedItem.id,
        data: typedItem,
        timestamp: new Date()
      })
      
      return typedItem
    } catch (error) {
      console.error(`Failed to create item in ${table}:`, error)
      throw error
    }
  }

  async read<T>(table: string, id: string): Promise<T | undefined> {
    try {
      return await this.getTable(table).get(id)
    } catch (error) {
      console.error(`Failed to read item from ${table}:`, error)
      throw error
    }
  }

  async update<T>(table: string, id: string, updates: Partial<T>): Promise<T> {
    try {
      const typedUpdates = updates as any
      typedUpdates.updatedAt = new Date()
      
      await this.getTable(table).update(id, typedUpdates)
      const updated = await this.read<T>(table, id)
      
      if (!updated) {
        throw new Error(`Item with id ${id} not found in ${table}`)
      }
      
      // Add to sync queue
      await this.addToSyncQueue({
        id: crypto.randomUUID(),
        type: 'update',
        table,
        itemId: id,
        data: typedUpdates,
        timestamp: new Date()
      })
      
      return updated
    } catch (error) {
      console.error(`Failed to update item in ${table}:`, error)
      throw error
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      await this.getTable(table).delete(id)
      
      // Add to sync queue
      await this.addToSyncQueue({
        id: crypto.randomUUID(),
        type: 'delete',
        table,
        itemId: id,
        timestamp: new Date()
      })
    } catch (error) {
      console.error(`Failed to delete item from ${table}:`, error)
      throw error
    }
  }

  async list<T>(table: string, options: ListOptions = {}): Promise<T[]> {
    try {
      let query = this.getTable(table).orderBy(options.sortBy || 'createdAt')
      
      if (options.sortOrder === 'asc') {
        query = query.reverse()
      }
      
      if (options.filter) {
        query = query.filter(item => {
          return Object.entries(options.filter!).every(([key, value]) => {
            const itemValue = (item as any)[key]
            if (Array.isArray(itemValue)) {
              return itemValue.includes(value)
            }
            return itemValue === value
          })
        })
      }
      
      if (options.offset) {
        query = query.offset(options.offset)
      }
      
      if (options.limit) {
        query = query.limit(options.limit)
      }
      
      return await query.toArray()
    } catch (error) {
      console.error(`Failed to list items from ${table}:`, error)
      throw error
    }
  }  
async createMany<T>(table: string, items: T[]): Promise<T[]> {
    try {
      const processedItems = items.map(item => {
        const typedItem = item as any
        if (!typedItem.createdAt) {
          typedItem.createdAt = new Date()
        }
        if (!typedItem.updatedAt) {
          typedItem.updatedAt = new Date()
        }
        if (!typedItem.id) {
          typedItem.id = crypto.randomUUID()
        }
        return typedItem
      })
      
      await this.getTable(table).bulkAdd(processedItems)
      
      // Add all to sync queue
      const syncOperations = processedItems.map(item => ({
        id: crypto.randomUUID(),
        type: 'create' as const,
        table,
        itemId: item.id,
        data: item,
        timestamp: new Date()
      }))
      
      await this.db.sync_queue.bulkAdd(syncOperations)
      
      return processedItems
    } catch (error) {
      console.error(`Failed to create many items in ${table}:`, error)
      throw error
    }
  }

  async deleteMany(table: string, ids: string[]): Promise<void> {
    try {
      await this.getTable(table).bulkDelete(ids)
      
      // Add all to sync queue
      const syncOperations = ids.map(id => ({
        id: crypto.randomUUID(),
        type: 'delete' as const,
        table,
        itemId: id,
        timestamp: new Date()
      }))
      
      await this.db.sync_queue.bulkAdd(syncOperations)
    } catch (error) {
      console.error(`Failed to delete many items from ${table}:`, error)
      throw error
    }
  }

  async search<T>(table: string, query: SearchQuery): Promise<T[]> {
    try {
      let collection = this.getTable(table).toCollection()
      
      // Apply filters first
      if (query.filters) {
        collection = collection.filter(item => {
          return Object.entries(query.filters!).every(([key, value]) => {
            const itemValue = (item as any)[key]
            if (Array.isArray(itemValue)) {
              return itemValue.includes(value)
            }
            return itemValue === value
          })
        })
      }
      
      // Apply text search if provided
      if (query.text && query.fields) {
        const searchText = query.text.toLowerCase()
        collection = collection.filter(item => {
          return query.fields!.some(field => {
            const fieldValue = (item as any)[field]
            if (typeof fieldValue === 'string') {
              return fieldValue.toLowerCase().includes(searchText)
            }
            if (Array.isArray(fieldValue)) {
              return fieldValue.some(val => 
                typeof val === 'string' && val.toLowerCase().includes(searchText)
              )
            }
            return false
          })
        })
      }
      
      // Apply limit
      if (query.limit) {
        collection = collection.limit(query.limit)
      }
      
      return await collection.toArray()
    } catch (error) {
      console.error(`Failed to search in ${table}:`, error)
      throw error
    }
  }

  async storeBlob(key: string, blob: Blob): Promise<string> {
    try {
      const blobRecord: BlobRecord = {
        key,
        blob,
        mimeType: blob.type,
        size: blob.size,
        createdAt: new Date()
      }
      
      await this.db.blobs.put(blobRecord)
      return key
    } catch (error) {
      console.error('Failed to store blob:', error)
      throw error
    }
  }

  async getBlob(key: string): Promise<Blob | undefined> {
    try {
      const record = await this.db.blobs.get(key)
      return record?.blob
    } catch (error) {
      console.error('Failed to get blob:', error)
      throw error
    }
  }

  async deleteBlob(key: string): Promise<void> {
    try {
      await this.db.blobs.delete(key)
    } catch (error) {
      console.error('Failed to delete blob:', error)
      throw error
    }
  }

  async addToSyncQueue(operation: SyncOperation): Promise<void> {
    try {
      await this.db.sync_queue.add(operation)
    } catch (error) {
      console.error('Failed to add to sync queue:', error)
      // Don't throw here as sync queue failures shouldn't break main operations
    }
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    try {
      return await this.db.sync_queue.orderBy('timestamp').toArray()
    } catch (error) {
      console.error('Failed to get sync queue:', error)
      return []
    }
  }

  async removeSyncOperation(id: string): Promise<void> {
    try {
      await this.db.sync_queue.delete(id)
    } catch (error) {
      console.error('Failed to remove sync operation:', error)
      throw error
    }
  }

  async clearSyncQueue(): Promise<void> {
    try {
      await this.db.sync_queue.clear()
    } catch (error) {
      console.error('Failed to clear sync queue:', error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      await Promise.all([
        this.db.notes.clear(),
        this.db.setlists.clear(),
        this.db.venues.clear(),
        this.db.contacts.clear(),
        this.db.rehearsal_sessions.clear(),
        this.db.performances.clear(),
        this.db.sync_queue.clear(),
        this.db.blobs.clear()
      ])
    } catch (error) {
      console.error('Failed to clear database:', error)
      throw error
    }
  }

  async close(): Promise<void> {
    try {
      this.db.close()
    } catch (error) {
      console.error('Failed to close database:', error)
      throw error
    }
  }

  private getTable(tableName: string): Table {
    switch (tableName) {
      case TABLES.NOTES:
        return this.db.notes
      case TABLES.SETLISTS:
        return this.db.setlists
      case TABLES.VENUES:
        return this.db.venues
      case TABLES.CONTACTS:
        return this.db.contacts
      case TABLES.REHEARSAL_SESSIONS:
        return this.db.rehearsal_sessions
      case TABLES.PERFORMANCES:
        return this.db.performances
      case TABLES.SYNC_QUEUE:
        return this.db.sync_queue
      case TABLES.BLOBS:
        return this.db.blobs
      default:
        throw new Error(`Unknown table: ${tableName}`)
    }
  }
}