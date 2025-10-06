import type { IStorageAdapter } from './IStorageAdapter'
import { TABLES } from './IStorageAdapter'
import type { Note, SetList, Venue, Contact, RehearsalSession, Performance, CreateNoteInput, CreateSetListInput, CreateVenueInput, CreateContactInput, CreateRehearsalSessionInput, CreatePerformanceInput, PerformanceStats, Interaction, Reminder } from '../models'
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

  // Contact interaction operations
  async addInteractionToContact(contactId: string, interaction: Omit<Interaction, 'id' | 'createdAt'>): Promise<Contact> {
    const contact = await this.getContact(contactId)
    if (!contact) {
      throw new Error('Contact not found')
    }

    const newInteraction: Interaction = {
      id: crypto.randomUUID(),
      ...interaction,
      createdAt: new Date()
    }

    const updatedContact = {
      ...contact,
      interactions: [...contact.interactions, newInteraction],
      updatedAt: new Date()
    }

    return await this.storageAdapter.update<Contact>(TABLES.CONTACTS, contactId, updatedContact)
  }

  // Contact reminder operations
  async addReminderToContact(contactId: string, reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<Contact> {
    const contact = await this.getContact(contactId)
    if (!contact) {
      throw new Error('Contact not found')
    }

    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      ...reminder,
      createdAt: new Date()
    }

    const updatedContact = {
      ...contact,
      reminders: [...contact.reminders, newReminder],
      updatedAt: new Date()
    }

    return await this.storageAdapter.update<Contact>(TABLES.CONTACTS, contactId, updatedContact)
  }

  async completeContactReminder(contactId: string, reminderId: string): Promise<Contact> {
    const contact = await this.getContact(contactId)
    if (!contact) {
      throw new Error('Contact not found')
    }

    const updatedReminders = contact.reminders.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, completed: true }
        : reminder
    )

    const updatedContact = {
      ...contact,
      reminders: updatedReminders,
      updatedAt: new Date()
    }

    return await this.storageAdapter.update<Contact>(TABLES.CONTACTS, contactId, updatedContact)
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

  // Rehearsal Session operations
  async createRehearsalSession(input: CreateRehearsalSessionInput): Promise<RehearsalSession> {
    const now = new Date()
    const session: RehearsalSession = {
      id: input.id || crypto.randomUUID(),
      setListId: input.setListId,
      startTime: input.startTime,
      endTime: input.endTime,
      totalDuration: input.totalDuration,
      currentNoteIndex: input.currentNoteIndex,
      noteTimings: input.noteTimings,
      isCompleted: input.isCompleted,
      createdAt: now,
      updatedAt: now
    }

    return await this.storageAdapter.create(TABLES.REHEARSAL_SESSIONS, session)
  }

  async getRehearsalSession(id: string): Promise<RehearsalSession | undefined> {
    return await this.storageAdapter.read<RehearsalSession>(TABLES.REHEARSAL_SESSIONS, id)
  }

  async updateRehearsalSession(id: string, updates: Partial<RehearsalSession>): Promise<RehearsalSession> {
    return await this.storageAdapter.update<RehearsalSession>(TABLES.REHEARSAL_SESSIONS, id, updates)
  }

  async deleteRehearsalSession(id: string): Promise<void> {
    await this.storageAdapter.delete(TABLES.REHEARSAL_SESSIONS, id)
  }

  async listRehearsalSessions(options?: {
    limit?: number
    offset?: number
    setListId?: string
    isCompleted?: boolean
    sortBy?: 'createdAt' | 'updatedAt' | 'startTime'
    sortOrder?: 'asc' | 'desc'
  }): Promise<RehearsalSession[]> {
    const filter: Record<string, any> = {}
    
    if (options?.setListId) {
      filter.setListId = options.setListId
    }
    if (options?.isCompleted !== undefined) {
      filter.isCompleted = options.isCompleted
    }
    
    return await this.storageAdapter.list<RehearsalSession>(TABLES.REHEARSAL_SESSIONS, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy || 'startTime',
      sortOrder: options?.sortOrder || 'desc',
      filter
    })
  }

  // Performance operations
  async createPerformance(input: CreatePerformanceInput): Promise<Performance> {
    const now = new Date()
    const performance: Performance = {
      id: input.id || crypto.randomUUID(),
      setListId: input.setListId,
      venueId: input.venueId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes,
      status: input.status || 'scheduled',
      createdAt: now,
      updatedAt: now
    }

    return await this.storageAdapter.create(TABLES.PERFORMANCES, performance)
  }

  async getPerformance(id: string): Promise<Performance | undefined> {
    return await this.storageAdapter.read<Performance>(TABLES.PERFORMANCES, id)
  }

  async updatePerformance(id: string, updates: Partial<Performance>): Promise<Performance> {
    return await this.storageAdapter.update<Performance>(TABLES.PERFORMANCES, id, updates)
  }

  async deletePerformance(id: string): Promise<void> {
    await this.storageAdapter.delete(TABLES.PERFORMANCES, id)
  }

  async listPerformances(options?: {
    limit?: number
    offset?: number
    venueId?: string
    setListId?: string
    status?: Performance['status']
    sortBy?: 'createdAt' | 'updatedAt' | 'date'
    sortOrder?: 'asc' | 'desc'
  }): Promise<Performance[]> {
    const filter: Record<string, any> = {}
    
    if (options?.venueId) {
      filter.venueId = options.venueId
    }
    if (options?.setListId) {
      filter.setListId = options.setListId
    }
    if (options?.status) {
      filter.status = options.status
    }
    
    return await this.storageAdapter.list<Performance>(TABLES.PERFORMANCES, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy || 'date',
      sortOrder: options?.sortOrder || 'desc',
      filter
    })
  }

  // Link performance to venue by adding it to venue's performance history
  async linkPerformanceToVenue(performanceId: string, venueId: string): Promise<void> {
    const performance = await this.getPerformance(performanceId)
    const venue = await this.getVenue(venueId)
    
    if (!performance || !venue) {
      throw new Error('Performance or venue not found')
    }

    // Create a simplified performance record for venue history
    const venuePerformance = {
      id: performance.id,
      setListId: performance.setListId,
      date: performance.date,
      duration: performance.actualDuration || 0,
      audienceSize: performance.feedback?.audienceSize,
      rating: performance.feedback?.rating,
      notes: performance.notes,
      createdAt: performance.createdAt
    }

    // Add to venue's performance history if not already present
    const existingIndex = venue.performanceHistory.findIndex(p => p.id === performanceId)
    if (existingIndex === -1) {
      venue.performanceHistory.push(venuePerformance)
      await this.updateVenue(venueId, { performanceHistory: venue.performanceHistory })
    }
  }

  // Remove performance from venue's history
  async unlinkPerformanceFromVenue(performanceId: string, venueId: string): Promise<void> {
    const venue = await this.getVenue(venueId)
    
    if (!venue) {
      throw new Error('Venue not found')
    }

    const updatedHistory = venue.performanceHistory.filter(p => p.id !== performanceId)
    await this.updateVenue(venueId, { performanceHistory: updatedHistory })
  }

  async getPerformanceStats(): Promise<PerformanceStats> {
    const performances = await this.listPerformances()
    const completedPerformances = performances.filter(p => p.status === 'completed' && p.feedback)
    
    if (completedPerformances.length === 0) {
      return {
        totalPerformances: 0,
        averageRating: 0,
        totalStageTime: 0,
        topMaterial: [],
        recentTrend: {
          direction: 'stable',
          ratingChange: 0
        },
        monthlyBreakdown: []
      }
    }

    // Calculate basic stats
    const totalPerformances = completedPerformances.length
    const averageRating = completedPerformances.reduce((sum, p) => 
      sum + (p.feedback?.rating || 0), 0) / totalPerformances
    const totalStageTime = completedPerformances.reduce((sum, p) => 
      sum + (p.actualDuration || 0), 0)

    // Find best venue
    const venueStats = new Map<string, { count: number, totalRating: number, name: string }>()
    for (const performance of completedPerformances) {
      const venue = await this.getVenue(performance.venueId)
      if (venue && performance.feedback) {
        const existing = venueStats.get(performance.venueId) || { count: 0, totalRating: 0, name: venue.name }
        existing.count++
        existing.totalRating += performance.feedback.rating
        venueStats.set(performance.venueId, existing)
      }
    }

    let bestVenue: PerformanceStats['bestVenue']
    if (venueStats.size > 0) {
      const [venueId, stats] = Array.from(venueStats.entries())
        .reduce((best, [id, stats]) => {
          const avgRating = stats.totalRating / stats.count
          const bestAvg = best[1].totalRating / best[1].count
          return avgRating > bestAvg ? [id, stats] : best
        })
      
      bestVenue = {
        venueId,
        venueName: stats.name,
        averageRating: stats.totalRating / stats.count,
        performanceCount: stats.count
      }
    }

    // Calculate material performance
    const materialStats = new Map<string, { count: number, totalRating: number, content: string }>()
    for (const performance of completedPerformances) {
      const setList = await this.getSetList(performance.setListId)
      if (setList && performance.feedback?.materialFeedback) {
        for (const materialFeedback of performance.feedback.materialFeedback) {
          const note = setList.notes.find(n => n.id === materialFeedback.noteId)
          if (note) {
            const existing = materialStats.get(materialFeedback.noteId) || 
              { count: 0, totalRating: 0, content: note.content.substring(0, 100) }
            existing.count++
            existing.totalRating += materialFeedback.rating
            materialStats.set(materialFeedback.noteId, existing)
          }
        }
      }
    }

    const topMaterial = Array.from(materialStats.entries())
      .map(([noteId, stats]) => ({
        noteId,
        noteContent: stats.content,
        timesPerformed: stats.count,
        averageRating: stats.totalRating / stats.count
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10)

    // Calculate recent trend (last 5 performances vs previous 5)
    const sortedPerformances = completedPerformances
      .sort((a, b) => b.date.getTime() - a.date.getTime())
    
    let recentTrend: { direction: 'improving' | 'declining' | 'stable', ratingChange: number } = { 
      direction: 'stable', 
      ratingChange: 0 
    }
    if (sortedPerformances.length >= 5) {
      const recent5 = sortedPerformances.slice(0, 5)
      const recentAvg = recent5.reduce((sum, p) => sum + (p.feedback?.rating || 0), 0) / 5
      
      if (sortedPerformances.length >= 10) {
        const previous5 = sortedPerformances.slice(5, 10)
        const previousAvg = previous5.reduce((sum, p) => sum + (p.feedback?.rating || 0), 0) / 5
        const change = recentAvg - previousAvg
        
        recentTrend = {
          direction: change > 0.2 ? 'improving' : change < -0.2 ? 'declining' : 'stable',
          ratingChange: change
        }
      }
    }

    // Monthly breakdown
    const monthlyStats = new Map<string, { count: number, totalRating: number, totalDuration: number }>()
    for (const performance of completedPerformances) {
      const monthKey = performance.date.toISOString().substring(0, 7) // YYYY-MM
      const existing = monthlyStats.get(monthKey) || { count: 0, totalRating: 0, totalDuration: 0 }
      existing.count++
      existing.totalRating += performance.feedback?.rating || 0
      existing.totalDuration += performance.actualDuration || 0
      monthlyStats.set(monthKey, existing)
    }

    const monthlyBreakdown = Array.from(monthlyStats.entries())
      .map(([month, stats]) => ({
        month,
        performanceCount: stats.count,
        averageRating: stats.totalRating / stats.count,
        totalDuration: stats.totalDuration
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      totalPerformances,
      averageRating,
      totalStageTime,
      bestVenue,
      topMaterial,
      recentTrend,
      monthlyBreakdown
    }
  }

  // Advanced search across all content
  async globalSearch(query: string, options?: { limit?: number }): Promise<{
    notes: Note[]
    setlists: SetList[]
    venues: Venue[]
    contacts: Contact[]
    performances: Performance[]
  }> {
    const [notes, setlists, venues, contacts, performances] = await Promise.all([
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
      }),
      this.storageAdapter.search<Performance>(TABLES.PERFORMANCES, {
        text: query,
        fields: ['notes'],
        limit: options?.limit
      })
    ])

    return { notes, setlists, venues, contacts, performances }
  }
}