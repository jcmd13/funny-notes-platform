// Storage adapter interface - types are used in method signatures

/**
 * Generic storage adapter interface for cross-platform compatibility
 * This abstraction allows different storage implementations (IndexedDB, SQLite, etc.)
 */
export interface IStorageAdapter {
  // Generic CRUD operations
  create<T>(table: string, item: T): Promise<T>
  read<T>(table: string, id: string): Promise<T | undefined>
  update<T>(table: string, id: string, updates: Partial<T>): Promise<T>
  delete(table: string, id: string): Promise<void>
  list<T>(table: string, options?: ListOptions): Promise<T[]>
  
  // Bulk operations
  createMany<T>(table: string, items: T[]): Promise<T[]>
  deleteMany(table: string, ids: string[]): Promise<void>
  
  // Search and filtering
  search<T>(table: string, query: SearchQuery): Promise<T[]>
  
  // Media/blob storage
  storeBlob(key: string, blob: Blob): Promise<string> // returns storage URL/key
  getBlob(key: string): Promise<Blob | undefined>
  deleteBlob(key: string): Promise<void>
  
  // Sync queue operations (for offline-first functionality)
  addToSyncQueue(operation: SyncOperation): Promise<void>
  getSyncQueue(): Promise<SyncOperation[]>
  removeSyncOperation(id: string): Promise<void>
  clearSyncQueue(): Promise<void>
  
  // Database management
  initialize(): Promise<void>
  clear(): Promise<void>
  close(): Promise<void>
}

export interface ListOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, any>
}

export interface SearchQuery {
  text?: string
  fields?: string[]
  filters?: Record<string, any>
  limit?: number
}

export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  itemId: string
  data?: any
  timestamp: Date
}

// Table names as constants for type safety
export const TABLES = {
  NOTES: 'notes',
  SETLISTS: 'setlists', 
  VENUES: 'venues',
  CONTACTS: 'contacts',
  REHEARSAL_SESSIONS: 'rehearsal_sessions',
  PERFORMANCES: 'performances',
  SYNC_QUEUE: 'sync_queue',
  BLOBS: 'blobs'
} as const

export type TableName = typeof TABLES[keyof typeof TABLES]