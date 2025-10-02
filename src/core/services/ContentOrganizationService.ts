import type { Note, SetList, Venue, Contact } from '../models'
import type { StorageService } from '../storage/StorageService'
import { estimateNoteDuration, categorizeDuration } from '../utils/modelUtils'

export interface DuplicateMatch {
  note: Note
  similarity: number
  reasons: string[]
}

export interface ContentSimilarity {
  originalNote: Note
  duplicates: DuplicateMatch[]
}

export interface BulkOperationResult {
  success: boolean
  processedCount: number
  errors: string[]
}

export interface ExportData {
  notes: Note[]
  setlists: SetList[]
  venues: Venue[]
  contacts: Contact[]
  exportedAt: string
  version: string
}

export interface ImportResult {
  success: boolean
  imported: {
    notes: number
    setlists: number
    venues: number
    contacts: number
  }
  errors: string[]
  duplicatesFound: number
}

/**
 * Service for content organization, duplicate detection, and bulk operations
 */
export class ContentOrganizationService {
  private storageService: StorageService

  constructor(storageService: StorageService) {
    this.storageService = storageService
  }

  /**
   * Detect duplicate content using similarity algorithms
   */
  async detectDuplicates(threshold: number = 0.8): Promise<ContentSimilarity[]> {
    const notes = await this.storageService.listNotes()
    const similarities: ContentSimilarity[] = []

    for (let i = 0; i < notes.length; i++) {
      const originalNote = notes[i]
      const duplicates: DuplicateMatch[] = []

      for (let j = i + 1; j < notes.length; j++) {
        const compareNote = notes[j]
        const similarity = this.calculateContentSimilarity(originalNote, compareNote)

        if (similarity >= threshold) {
          const reasons = this.getSimilarityReasons(originalNote, compareNote)
          duplicates.push({
            note: compareNote,
            similarity,
            reasons
          })
        }
      }

      if (duplicates.length > 0) {
        similarities.push({
          originalNote,
          duplicates
        })
      }
    }

    return similarities
  }

  /**
   * Calculate similarity between two notes using multiple algorithms
   */
  private calculateContentSimilarity(note1: Note, note2: Note): number {
    const contentSimilarity = this.calculateTextSimilarity(note1.content, note2.content)
    const tagSimilarity = this.calculateTagSimilarity(note1.tags, note2.tags)
    const durationSimilarity = this.calculateDurationSimilarity(note1, note2)

    // Weighted average: content is most important
    return (contentSimilarity * 0.7) + (tagSimilarity * 0.2) + (durationSimilarity * 0.1)
  }

  /**
   * Calculate text similarity using Jaccard similarity on word sets
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(word => word.length > 2))
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(word => word.length > 2))

    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])

    return union.size === 0 ? 0 : intersection.size / union.size
  }

  /**
   * Calculate tag similarity using Jaccard similarity
   */
  private calculateTagSimilarity(tags1: string[], tags2: string[]): number {
    const set1 = new Set(tags1.map(tag => tag.toLowerCase()))
    const set2 = new Set(tags2.map(tag => tag.toLowerCase()))

    const intersection = new Set([...set1].filter(tag => set2.has(tag)))
    const union = new Set([...set1, ...set2])

    return union.size === 0 ? 0 : intersection.size / union.size
  }

  /**
   * Calculate duration similarity
   */
  private calculateDurationSimilarity(note1: Note, note2: Note): number {
    const duration1 = note1.estimatedDuration || estimateNoteDuration(note1.content)
    const duration2 = note2.estimatedDuration || estimateNoteDuration(note2.content)

    const maxDuration = Math.max(duration1, duration2)
    const minDuration = Math.min(duration1, duration2)

    return maxDuration === 0 ? 1 : minDuration / maxDuration
  }

  /**
   * Get reasons why two notes are considered similar
   */
  private getSimilarityReasons(note1: Note, note2: Note): string[] {
    const reasons: string[] = []

    const contentSimilarity = this.calculateTextSimilarity(note1.content, note2.content)
    if (contentSimilarity > 0.6) {
      reasons.push(`Similar content (${Math.round(contentSimilarity * 100)}% match)`)
    }

    const tagSimilarity = this.calculateTagSimilarity(note1.tags, note2.tags)
    if (tagSimilarity > 0.5) {
      reasons.push(`Similar tags (${Math.round(tagSimilarity * 100)}% match)`)
    }

    if (note1.venue && note2.venue && note1.venue === note2.venue) {
      reasons.push('Same venue')
    }

    if (note1.audience && note2.audience && note1.audience === note2.audience) {
      reasons.push('Same audience type')
    }

    const timeDiff = Math.abs(note1.createdAt.getTime() - note2.createdAt.getTime())
    if (timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
      reasons.push('Created within 24 hours')
    }

    return reasons
  }

  /**
   * Categorize notes by estimated performance duration
   */
  async categorizeByDuration(): Promise<{
    short: Note[]
    medium: Note[]
    long: Note[]
  }> {
    const notes = await this.storageService.listNotes()
    const categorized = {
      short: [] as Note[],
      medium: [] as Note[],
      long: [] as Note[]
    }

    for (const note of notes) {
      const duration = note.estimatedDuration || estimateNoteDuration(note.content)
      const category = categorizeDuration(duration)
      categorized[category].push(note)
    }

    return categorized
  }

  /**
   * Bulk delete notes
   */
  async bulkDeleteNotes(noteIds: string[]): Promise<BulkOperationResult> {
    const errors: string[] = []
    let processedCount = 0

    try {
      await this.storageService.deleteManyNotes(noteIds)
      processedCount = noteIds.length
    } catch (error) {
      errors.push(`Failed to delete notes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      success: errors.length === 0,
      processedCount,
      errors
    }
  }

  /**
   * Bulk add tags to notes
   */
  async bulkAddTags(noteIds: string[], tags: string[]): Promise<BulkOperationResult> {
    const errors: string[] = []
    let processedCount = 0

    for (const noteId of noteIds) {
      try {
        const note = await this.storageService.getNote(noteId)
        if (note) {
          const existingTags = new Set(note.tags)
          const newTags = [...existingTags, ...tags.filter(tag => !existingTags.has(tag))]
          
          await this.storageService.updateNote(noteId, { 
            tags: newTags,
            updatedAt: new Date()
          })
          processedCount++
        }
      } catch (error) {
        errors.push(`Failed to update note ${noteId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: errors.length === 0,
      processedCount,
      errors
    }
  }

  /**
   * Bulk remove tags from notes
   */
  async bulkRemoveTags(noteIds: string[], tags: string[]): Promise<BulkOperationResult> {
    const errors: string[] = []
    let processedCount = 0

    for (const noteId of noteIds) {
      try {
        const note = await this.storageService.getNote(noteId)
        if (note) {
          const tagsToRemove = new Set(tags)
          const newTags = note.tags.filter(tag => !tagsToRemove.has(tag))
          
          await this.storageService.updateNote(noteId, { 
            tags: newTags,
            updatedAt: new Date()
          })
          processedCount++
        }
      } catch (error) {
        errors.push(`Failed to update note ${noteId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: errors.length === 0,
      processedCount,
      errors
    }
  }

  /**
   * Export all data to JSON format
   */
  async exportToJSON(): Promise<ExportData> {
    const [notes, setlists, venues, contacts] = await Promise.all([
      this.storageService.listNotes(),
      this.storageService.listSetLists(),
      this.storageService.listVenues(),
      this.storageService.listContacts()
    ])

    return {
      notes,
      setlists,
      venues,
      contacts,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(type: 'notes' | 'setlists' | 'venues' | 'contacts'): Promise<string> {
    switch (type) {
      case 'notes':
        return this.exportNotesToCSV()
      case 'setlists':
        return this.exportSetListsToCSV()
      case 'venues':
        return this.exportVenuesToCSV()
      case 'contacts':
        return this.exportContactsToCSV()
      default:
        throw new Error(`Unsupported export type: ${type}`)
    }
  }

  private async exportNotesToCSV(): Promise<string> {
    const notes = await this.storageService.listNotes()
    const headers = ['ID', 'Content', 'Capture Method', 'Tags', 'Venue', 'Audience', 'Estimated Duration', 'Created At', 'Updated At']
    
    const rows = notes.map(note => [
      note.id,
      `"${note.content.replace(/"/g, '""')}"`, // Escape quotes
      note.captureMethod,
      `"${note.tags.join(', ')}"`,
      note.venue || '',
      note.audience || '',
      note.estimatedDuration?.toString() || '',
      note.createdAt.toISOString(),
      note.updatedAt.toISOString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private async exportSetListsToCSV(): Promise<string> {
    const setlists = await this.storageService.listSetLists()
    const headers = ['ID', 'Name', 'Total Duration', 'Note Count', 'Venue', 'Performance Date', 'Created At']
    
    const rows = setlists.map(setlist => [
      setlist.id,
      `"${setlist.name.replace(/"/g, '""')}"`,
      setlist.totalDuration.toString(),
      setlist.notes.length.toString(),
      setlist.venue || '',
      setlist.performanceDate?.toISOString() || '',
      setlist.createdAt.toISOString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private async exportVenuesToCSV(): Promise<string> {
    const venues = await this.storageService.listVenues()
    const headers = ['ID', 'Name', 'Location', 'Audience Size', 'Audience Type', 'Acoustics', 'Lighting', 'Created At']
    
    const rows = venues.map(venue => [
      venue.id,
      `"${venue.name.replace(/"/g, '""')}"`,
      `"${venue.location.replace(/"/g, '""')}"`,
      venue.characteristics.audienceSize?.toString() || '',
      venue.characteristics.audienceType || '',
      venue.characteristics.acoustics || '',
      venue.characteristics.lighting || '',
      venue.createdAt.toISOString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private async exportContactsToCSV(): Promise<string> {
    const contacts = await this.storageService.listContacts()
    const headers = ['ID', 'Name', 'Role', 'Venue', 'Email', 'Phone', 'Created At']
    
    const rows = contacts.map(contact => [
      contact.id,
      `"${contact.name.replace(/"/g, '""')}"`,
      contact.role,
      contact.venue || '',
      contact.contactInfo.email || '',
      contact.contactInfo.phone || '',
      contact.createdAt.toISOString()
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  /**
   * Import data from JSON format
   */
  async importFromJSON(data: ExportData, options?: {
    skipDuplicates?: boolean
    mergeStrategy?: 'skip' | 'overwrite' | 'merge'
  }): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: { notes: 0, setlists: 0, venues: 0, contacts: 0 },
      errors: [],
      duplicatesFound: 0
    }

    try {
      // Import notes
      if (data.notes?.length > 0) {
        const noteResult = await this.importNotes(data.notes, options)
        result.imported.notes = noteResult.imported
        result.duplicatesFound += noteResult.duplicatesFound
        result.errors.push(...noteResult.errors)
      }

      // Import venues (before setlists that might reference them)
      if (data.venues?.length > 0) {
        const venueResult = await this.importVenues(data.venues, options)
        result.imported.venues = venueResult.imported
        result.duplicatesFound += venueResult.duplicatesFound
        result.errors.push(...venueResult.errors)
      }

      // Import contacts
      if (data.contacts?.length > 0) {
        const contactResult = await this.importContacts(data.contacts, options)
        result.imported.contacts = contactResult.imported
        result.duplicatesFound += contactResult.duplicatesFound
        result.errors.push(...contactResult.errors)
      }

      // Import setlists (after notes and venues)
      if (data.setlists?.length > 0) {
        const setlistResult = await this.importSetLists(data.setlists, options)
        result.imported.setlists = setlistResult.imported
        result.duplicatesFound += setlistResult.duplicatesFound
        result.errors.push(...setlistResult.errors)
      }

    } catch (error) {
      result.success = false
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    result.success = result.errors.length === 0

    return result
  }

  private async importNotes(notes: Note[], options?: { skipDuplicates?: boolean }): Promise<{
    imported: number
    duplicatesFound: number
    errors: string[]
  }> {
    const result = { imported: 0, duplicatesFound: 0, errors: [] as string[] }
    
    for (const note of notes) {
      try {
        // Check for duplicates if requested
        if (options?.skipDuplicates) {
          const existingNotes = await this.storageService.searchNotes(note.content.substring(0, 50))
          const isDuplicate = existingNotes.some(existing => 
            this.calculateTextSimilarity(existing.content, note.content) > 0.9
          )
          
          if (isDuplicate) {
            result.duplicatesFound++
            continue
          }
        }

        await this.storageService.createNote({
          content: note.content,
          captureMethod: note.captureMethod,
          tags: note.tags,
          venue: note.venue,
          audience: note.audience,
          estimatedDuration: note.estimatedDuration,
          metadata: note.metadata,
          attachments: note.attachments
        })
        result.imported++
      } catch (error) {
        result.errors.push(`Failed to import note: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private async importVenues(venues: Venue[], options?: { skipDuplicates?: boolean }): Promise<{
    imported: number
    duplicatesFound: number
    errors: string[]
  }> {
    const result = { imported: 0, duplicatesFound: 0, errors: [] as string[] }
    
    for (const venue of venues) {
      try {
        if (options?.skipDuplicates) {
          const existingVenues = await this.storageService.listVenues()
          const isDuplicate = existingVenues.some(existing => 
            existing.name.toLowerCase() === venue.name.toLowerCase() &&
            existing.location.toLowerCase() === venue.location.toLowerCase()
          )
          
          if (isDuplicate) {
            result.duplicatesFound++
            continue
          }
        }

        await this.storageService.createVenue({
          name: venue.name,
          location: venue.location,
          characteristics: venue.characteristics
        })
        result.imported++
      } catch (error) {
        result.errors.push(`Failed to import venue: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private async importContacts(contacts: Contact[], options?: { skipDuplicates?: boolean }): Promise<{
    imported: number
    duplicatesFound: number
    errors: string[]
  }> {
    const result = { imported: 0, duplicatesFound: 0, errors: [] as string[] }
    
    for (const contact of contacts) {
      try {
        if (options?.skipDuplicates) {
          const existingContacts = await this.storageService.listContacts()
          const isDuplicate = existingContacts.some(existing => 
            existing.name.toLowerCase() === contact.name.toLowerCase() &&
            existing.contactInfo.email === contact.contactInfo.email
          )
          
          if (isDuplicate) {
            result.duplicatesFound++
            continue
          }
        }

        await this.storageService.createContact({
          name: contact.name,
          role: contact.role,
          venue: contact.venue,
          contactInfo: contact.contactInfo
        })
        result.imported++
      } catch (error) {
        result.errors.push(`Failed to import contact: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  private async importSetLists(setlists: SetList[], options?: { skipDuplicates?: boolean }): Promise<{
    imported: number
    duplicatesFound: number
    errors: string[]
  }> {
    const result = { imported: 0, duplicatesFound: 0, errors: [] as string[] }
    
    for (const setlist of setlists) {
      try {
        if (options?.skipDuplicates) {
          const existingSetLists = await this.storageService.listSetLists()
          const isDuplicate = existingSetLists.some(existing => 
            existing.name.toLowerCase() === setlist.name.toLowerCase()
          )
          
          if (isDuplicate) {
            result.duplicatesFound++
            continue
          }
        }

        // Note: This assumes notes are already imported or exist
        await this.storageService.createSetList({
          name: setlist.name,
          notes: setlist.notes,
          venue: setlist.venue,
          performanceDate: setlist.performanceDate
        })
        result.imported++
      } catch (error) {
        result.errors.push(`Failed to import setlist: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return result
  }

  /**
   * Download file helper for exports
   */
  downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  /**
   * Merge duplicate notes
   */
  async mergeDuplicateNotes(originalId: string, duplicateIds: string[]): Promise<Note | null> {
    try {
      const originalNote = await this.storageService.getNote(originalId)
      if (!originalNote) {
        throw new Error('Original note not found')
      }

      const duplicates = await Promise.all(
        duplicateIds.map(id => this.storageService.getNote(id))
      )

      // Merge content, tags, and attachments
      const allTags = new Set(originalNote.tags)
      const allAttachments = [...originalNote.attachments]
      let mergedContent = originalNote.content

      for (const duplicate of duplicates) {
        if (duplicate) {
          // Add unique tags
          duplicate.tags.forEach(tag => allTags.add(tag))
          
          // Add unique attachments
          duplicate.attachments.forEach(attachment => {
            if (!allAttachments.some(existing => existing.id === attachment.id)) {
              allAttachments.push(attachment)
            }
          })

          // Append content if significantly different
          const similarity = this.calculateTextSimilarity(originalNote.content, duplicate.content)
          if (similarity < 0.8) {
            mergedContent += `\n\n--- Merged from duplicate ---\n${duplicate.content}`
          }
        }
      }

      // Update original note with merged data
      const updatedNote = await this.storageService.updateNote(originalId, {
        content: mergedContent,
        tags: Array.from(allTags),
        attachments: allAttachments,
        updatedAt: new Date()
      })

      // Delete duplicate notes
      await this.storageService.deleteManyNotes(duplicateIds)

      return updatedNote
    } catch (error) {
      throw new Error(`Failed to merge notes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}