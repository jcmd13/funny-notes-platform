import type { IStorageAdapter } from './IStorageAdapter'
import { TABLES } from './IStorageAdapter'
import type { Note, SetList, Venue, Contact, CreateNoteInput, CreateSetListInput, CreateVenueInput, CreateContactInput } from '../models'
import { MediaStorage } from './MediaStorage'

/**
 * High-level storage service that provides business logic on top of the storage adapter
 * This service handles data validation, relationships, and business rules
 */
export class StorageService {
  private storageAdapter: IStorageAdapter
  private mediaStorage: MediaStorage

  constructor(storageAdapter: IStorageAdapter) {
    this.storageAdapter = storageAdapter
    this.mediaStorage = new MediaStorage(storageAdapter)
  }

  async initialize(): Promise<void> {
    await this.storageAdapter.initialize()
  }

  // Note operations
  async createNote(input: CreateNoteInput): Promise<Note> {
    const now = new Date()
    const note: Note = {
      id: input.id || crypto.randomUUID(),
      content: input.content,
      captureMethod: input.captureMethod,
      tags: input.tags,
      venue: input.venue,
      audience: input.audience,
      estimatedDuration: input.estimatedDuration,
      metadata: input.metadata,
      attachments: input.attachments,
      createdAt: (input as any).createdAt || now,
      updatedAt: (input as any).updatedAt || now
    }

    return await this.storageAdapter.create(TABLES.NOTES, note)
  }

  async getNote(id: string): Promise<Note | undefined> {
    return await this.storageAdapter.read<Note>(TABLES.NOTES, id)
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    return await this.storageAdapter.update<Note>(TABLES.NOTES, id, updates)
  }

  async deleteNote(id: string): Promise<void> {
    // Get note to check for attachments
    const note = await this.getNote(id)
    if (note?.attachments) {
      // Delete associated media files
      for (const attachment of note.attachments) {
        if (attachment.url) {
          await this.mediaStorage.deleteMedia(attachment.url)
        }
      }
    }
    
    await this.storageAdapter.delete(TABLES.NOTES, id)
  }

  async listNotes(options?: { 
    limit?: number
    offset?: number
    tags?: string[]
    captureMethod?: Note['captureMethod']
    sortBy?: 'createdAt' | 'updatedAt' | 'content'
    sortOrder?: 'asc' | 'desc'
  }): Promise<Note[]> {
    const filter: Record<string, any> = {}
    
    if (options?.captureMethod) {
      filter.captureMethod = options.captureMethod
    }
    
    return await this.storageAdapter.list<Note>(TABLES.NOTES, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy || 'createdAt',
      sortOrder: options?.sortOrder || 'desc',
      filter
    })
  }

  async searchNotes(query: string, options?: { limit?: number }): Promise<Note[]> {
    return await this.storageAdapter.search<Note>(TABLES.NOTES, {
      text: query,
      fields: ['content', 'tags'],
      limit: options?.limit
    })
  }

  // SetList operations
  async createSetList(input: CreateSetListInput): Promise<SetList> {
    // Calculate total duration from notes
    const totalDuration = input.notes.reduce((sum, note) => {
      return sum + (note.metadata.duration || 0)
    }, 0)

    const setList: SetList = {
      id: input.id || crypto.randomUUID(),
      name: input.name,
      notes: input.notes,
      totalDuration,
      venue: input.venue,
      performanceDate: input.performanceDate,
      feedback: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return await this.storageAdapter.create(TABLES.SETLISTS, setList)
  }

  async getSetList(id: string): Promise<SetList | undefined> {
    return await this.storageAdapter.read<SetList>(TABLES.SETLISTS, id)
  }

  async updateSetList(id: string, updates: Partial<SetList>): Promise<SetList> {
    // Recalculate duration if notes were updated
    if (updates.notes) {
      updates.totalDuration = updates.notes.reduce((sum, note) => {
        return sum + (note.metadata.duration || 0)
      }, 0)
    }
    
    return await this.storageAdapter.update<SetList>(TABLES.SETLISTS, id, updates)
  }

  async deleteSetList(id: string): Promise<void> {
    await this.storageAdapter.delete(TABLES.SETLISTS, id)
  }

  async listSetLists(options?: {
    limit?: number
    offset?: number
    venue?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'performanceDate'
    sortOrder?: 'asc' | 'desc'
  }): Promise<SetList[]> {
    const filter: Record<string, any> = {}
    
    if (options?.venue) {
      filter.venue = options.venue
    }
    
    return await this.storageAdapter.list<SetList>(TABLES.SETLISTS, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy || 'createdAt',
      sortOrder: options?.sortOrder || 'desc',
      filter
    })
  }

  // Venue operations
  async createVenue(input: CreateVenueInput): Promise<Venue> {
    const venue: Venue = {
      id: input.id || crypto.randomUUID(),
      name: input.name,
      location: input.location,
      characteristics: input.characteristics,
      contacts: [],
      performanceHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return await this.storageAdapter.create(TABLES.VENUES, venue)
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    return await this.storageAdapter.read<Venue>(TABLES.VENUES, id)
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue> {
    return await this.storageAdapter.update<Venue>(TABLES.VENUES, id, updates)
  }

  async deleteVenue(id: string): Promise<void> {
    await this.storageAdapter.delete(TABLES.VENUES, id)
  }

  async listVenues(options?: {
    limit?: number
    offset?: number
    location?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'location'
    sortOrder?: 'asc' | 'desc'
  }): Promise<Venue[]> {
    const filter: Record<string, any> = {}
    
    if (options?.location) {
      filter.location = options.location
    }
    
    return await this.storageAdapter.list<Venue>(TABLES.VENUES, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy || 'name',
      sortOrder: options?.sortOrder || 'asc',
      filter
    })
  }

  // Contact operations
  async createContact(input: CreateContactInput): Promise<Contact> {
    const contact: Contact = {
      id: input.id || crypto.randomUUID(),
      name: input.name,
      role: input.role,
      venue: input.venue,
      contactInfo: input.contactInfo,
      interactions: [],
      reminders: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return await this.storageAdapter.create(TABLES.CONTACTS, contact)
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return await this.storageAdapter.read<Contact>(TABLES.CONTACTS, id)
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    return await this.storageAdapter.update<Contact>(TABLES.CONTACTS, id, updates)
  }

  async deleteContact(id: string): Promise<void> {
    await this.storageAdapter.delete(TABLES.CONTACTS, id)
  }

  async listContacts(options?: {
    limit?: number
    offset?: number
    venue?: string
    role?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'role'
    sortOrder?: 'asc' | 'desc'
  }): Promise<Contact[]> {
    const filter: Record<string, any> = {}
    
    if (options?.venue) {
      filter.venue = options.venue
    }
    if (options?.role) {
      filter.role = options.role
    }
    
    return await this.storageAdapter.list<Contact>(TABLES.CONTACTS, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy || 'name',
      sortOrder: options?.sortOrder || 'asc',
      filter
    })
  }

  // Media operations
  async storeAudioBlob(blob: Blob, metadata?: { duration?: number }): Promise<string> {
    return await this.mediaStorage.storeAudio(blob, metadata || {})
  }

  async storeImageBlob(blob: Blob, metadata?: { maxWidth?: number; quality?: number }): Promise<string> {
    return await this.mediaStorage.storeImage(blob, metadata || {})
  }

  async getMediaBlob(key: string): Promise<Blob | undefined> {
    return await this.mediaStorage.getMedia(key)
  }

  async deleteMediaBlob(key: string): Promise<void> {
    await this.mediaStorage.deleteMedia(key)
  }

  // Sync operations
  async getSyncQueue() {
    return await this.storageAdapter.getSyncQueue()
  }

  async clearSyncQueue(): Promise<void> {
    await this.storageAdapter.clearSyncQueue()
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    await this.storageAdapter.clear()
  }

  async close(): Promise<void> {
    await this.storageAdapter.close()
  }

  // Bulk operations
  async createManyNotes(notes: CreateNoteInput[]): Promise<Note[]> {
    const processedNotes = notes.map(input => ({
      id: input.id || crypto.randomUUID(),
      content: input.content,
      captureMethod: input.captureMethod,
      tags: input.tags,
      venue: input.venue,
      audience: input.audience,
      estimatedDuration: input.estimatedDuration,
      metadata: input.metadata,
      attachments: input.attachments,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    return await this.storageAdapter.createMany(TABLES.NOTES, processedNotes)
  }

  async deleteManyNotes(ids: string[]): Promise<void> {
    // Clean up associated media files
    for (const id of ids) {
      const note = await this.getNote(id)
      if (note?.attachments) {
        for (const attachment of note.attachments) {
          if (attachment.url) {
            await this.mediaStorage.deleteMedia(attachment.url)
          }
        }
      }
    }
    
    await this.storageAdapter.deleteMany(TABLES.NOTES, ids)
  }

  // Advanced search across all content
  async globalSearch(query: string, options?: { limit?: number }): Promise<{
    notes: Note[]
    setlists: SetList[]
    venues: Venue[]
    contacts: Contact[]
  }> {
    const [notes, setlists, venues, contacts] = await Promise.all([
      this.storageAdapter.search<Note>(TABLES.NOTES, {
        text: query,
        fields: ['content', 'tags'],
        limit: options?.limit
      }),
      this.storageAdapter.search<SetList>(TABLES.SETLISTS, {
        text: query,
        fields: ['name'],
        limit: options?.limit
      }),
      this.storageAdapter.search<Venue>(TABLES.VENUES, {
        text: query,
        fields: ['name', 'location'],
        limit: options?.limit
      }),
      this.storageAdapter.search<Contact>(TABLES.CONTACTS, {
        text: query,
        fields: ['name', 'role'],
        limit: options?.limit
      })
    ])

    return { notes, setlists, venues, contacts }
  }
}