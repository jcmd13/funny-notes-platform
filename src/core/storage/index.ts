// Storage interfaces and types
export type { 
  IStorageAdapter, 
  ListOptions, 
  SearchQuery, 
  SyncOperation, 
  TableName 
} from './IStorageAdapter'
export { TABLES } from './IStorageAdapter'

// Storage implementations
export { IndexedDBAdapter } from './IndexedDBAdapter'

// Storage services
export { StorageService } from './StorageService'
export { 
  MediaStorage, 
  MEDIA_TYPES, 
  DEFAULT_VALIDATION,
  type AudioMetadata,
  type ImageMetadata,
  type MediaValidationOptions,
  type MediaValidationResult
} from './MediaStorage'

// Import classes for the factory
import { IndexedDBAdapter } from './IndexedDBAdapter'
import { StorageService } from './StorageService'

// Storage factory for creating storage instances
export class StorageFactory {
  private static instance: StorageService | null = null

  /**
   * Get or create a singleton storage service instance
   */
  static async getInstance(): Promise<StorageService> {
    if (!this.instance) {
      const adapter = new IndexedDBAdapter()
      this.instance = new StorageService(adapter)
      await this.instance.initialize()
    }
    return this.instance
  }

  /**
   * Create a new storage service instance (for testing or multiple databases)
   */
  static async createInstance(): Promise<StorageService> {
    const adapter = new IndexedDBAdapter()
    const service = new StorageService(adapter)
    await service.initialize()
    return service
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null
  }
}