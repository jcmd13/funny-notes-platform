import type { IPlatformAdapter } from '../adapters/IPlatformAdapter'
import type { StorageService } from '../storage/StorageService'
import type { ContentOrganizationService } from '../services/ContentOrganizationService'
import type { Note, SetList, CreateSetListInput } from '../models'

/**
 * Platform-agnostic content management
 * Handles organization, search, and manipulation of captured content
 */
export class ContentManager {
  constructor(
    private platformAdapter: IPlatformAdapter,
    private storageService: StorageService,
    private organizationService: ContentOrganizationService
  ) {}

  /**
   * Search content across all types
   */
  async searchContent(query: string, options?: SearchOptions): Promise<SearchResults> {
    const results = await this.storageService.globalSearch(query, {
      limit: options?.limit
    })

    // Apply filters if specified
    let filteredNotes = results.notes
    if (options?.filters) {
      filteredNotes = this.applyNoteFilters(results.notes, options.filters)
    }

    // Sort results if specified
    if (options?.sortBy) {
      filteredNotes = this.sortNotes(filteredNotes, options.sortBy, options.sortOrder)
    }

    return {
      notes: filteredNotes,
      setlists: results.setlists,
      venues: results.venues,
      contacts: results.contacts,
      performances: results.performances,
      totalResults: filteredNotes.length + results.setlists.length + 
                   results.venues.length + results.contacts.length + results.performances.length
    }
  }

  /**
   * Get content suggestions based on context
   */
  async getContentSuggestions(context: ContentContext): Promise<ContentSuggestion[]> {
    const suggestions: ContentSuggestion[] = []

    // Get recent notes for context
    const recentNotes = await this.storageService.listNotes({
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })

    // Suggest based on venue
    if (context.venue) {
      const venueNotes = recentNotes.filter(note => note.venue === context.venue)
      if (venueNotes.length > 0) {
        suggestions.push({
          type: 'venue-specific',
          title: `Material for ${context.venue}`,
          notes: venueNotes.slice(0, 10),
          reason: 'Previously performed at this venue'
        })
      }
    }

    // Suggest based on audience type
    if (context.audience) {
      const audienceNotes = recentNotes.filter(note => note.audience === context.audience)
      if (audienceNotes.length > 0) {
        suggestions.push({
          type: 'audience-specific',
          title: `Material for ${context.audience} audience`,
          notes: audienceNotes.slice(0, 10),
          reason: 'Works well with this audience type'
        })
      }
    }

    // Suggest based on tags
    if (context.tags && context.tags.length > 0) {
      const taggedNotes = recentNotes.filter(note => 
        note.tags.some(tag => context.tags!.includes(tag))
      )
      if (taggedNotes.length > 0) {
        suggestions.push({
          type: 'tag-based',
          title: 'Related material',
          notes: taggedNotes.slice(0, 10),
          reason: `Similar themes: ${context.tags.join(', ')}`
        })
      }
    }

    // Suggest popular material
    const popularNotes = await this.getPopularContent(10)
    if (popularNotes.length > 0) {
      suggestions.push({
        type: 'popular',
        title: 'Popular material',
        notes: popularNotes,
        reason: 'Frequently used in sets'
      })
    }

    return suggestions
  }

  /**
   * Auto-organize content using AI and patterns
   */
  async autoOrganizeContent(options?: OrganizationOptions): Promise<OrganizationResult> {
    const result: OrganizationResult = {
      categorized: new Map(),
      duplicatesFound: [],
      tagsAdded: new Map(),
      errors: []
    }

    try {
      // Detect duplicates
      const duplicates = await this.organizationService.detectDuplicates(
        options?.duplicateThreshold || 0.8
      )
      result.duplicatesFound = duplicates

      // Categorize by duration
      const categorized = await this.organizationService.categorizeByDuration()
      result.categorized.set('short', categorized.short)
      result.categorized.set('medium', categorized.medium)
      result.categorized.set('long', categorized.long)

      // Auto-tag content (if AI features are available)
      if (this.platformAdapter.getFeatureSupport('system-integration')) {
        await this.autoTagContent(result)
      }

    } catch (error) {
      result.errors.push(`Organization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Create optimized set list
   */
  async createOptimizedSetList(input: OptimizedSetListInput): Promise<SetList> {
    const { name, targetDuration, venue, audience, preferences } = input

    // Get candidate notes
    let candidateNotes = await this.storageService.listNotes()

    // Filter by venue/audience if specified
    if (venue) {
      candidateNotes = candidateNotes.filter(note => 
        !note.venue || note.venue === venue
      )
    }

    if (audience) {
      candidateNotes = candidateNotes.filter(note => 
        !note.audience || note.audience === audience
      )
    }

    // Apply preferences
    if (preferences?.includeTags) {
      candidateNotes = candidateNotes.filter(note =>
        note.tags.some(tag => preferences.includeTags!.includes(tag))
      )
    }

    if (preferences?.excludeTags) {
      candidateNotes = candidateNotes.filter(note =>
        !note.tags.some(tag => preferences.excludeTags!.includes(tag))
      )
    }

    // Optimize selection
    const selectedNotes = this.optimizeNoteSelection(
      candidateNotes,
      targetDuration,
      preferences
    )

    // Create set list
    const setListInput: CreateSetListInput = {
      name,
      notes: selectedNotes,
      venue,
      performanceDate: input.performanceDate
    }

    return await this.storageService.createSetList(setListInput)
  }

  /**
   * Get content analytics
   */
  async getContentAnalytics(): Promise<ContentAnalytics> {
    const [notes, setlists] = await Promise.all([
      this.storageService.listNotes(),
      this.storageService.listSetLists()
    ])

    // Calculate basic stats
    const totalNotes = notes.length
    const totalDuration = notes.reduce((sum, note) => 
      sum + (note.estimatedDuration || 0), 0
    )

    // Analyze capture methods
    const captureMethodStats = new Map<string, number>()
    notes.forEach(note => {
      const count = captureMethodStats.get(note.captureMethod) || 0
      captureMethodStats.set(note.captureMethod, count + 1)
    })

    // Analyze tags
    const tagStats = new Map<string, number>()
    notes.forEach(note => {
      note.tags.forEach(tag => {
        const count = tagStats.get(tag) || 0
        tagStats.set(tag, count + 1)
      })
    })

    // Find most used content
    const noteUsage = new Map<string, number>()
    setlists.forEach(setlist => {
      setlist.notes.forEach(note => {
        const count = noteUsage.get(note.id) || 0
        noteUsage.set(note.id, count + 1)
      })
    })

    const mostUsedNotes = Array.from(noteUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([noteId, count]) => ({
        note: notes.find(n => n.id === noteId)!,
        usageCount: count
      }))
      .filter(item => item.note)

    return {
      totalNotes,
      totalDuration,
      averageNoteDuration: totalNotes > 0 ? totalDuration / totalNotes : 0,
      captureMethodBreakdown: Object.fromEntries(captureMethodStats),
      topTags: Array.from(tagStats.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20),
      mostUsedContent: mostUsedNotes,
      contentGrowth: await this.calculateContentGrowth(notes),
      duplicateRate: await this.calculateDuplicateRate()
    }
  }

  // Private helper methods

  private applyNoteFilters(notes: Note[], filters: SearchFilters): Note[] {
    let filtered = notes

    if (filters.captureMethod) {
      filtered = filtered.filter(note => 
        filters.captureMethod!.includes(note.captureMethod)
      )
    }

    if (filters.tags) {
      filtered = filtered.filter(note =>
        note.tags.some(tag => filters.tags!.includes(tag))
      )
    }

    if (filters.venue) {
      filtered = filtered.filter(note => note.venue === filters.venue)
    }

    if (filters.audience) {
      filtered = filtered.filter(note => note.audience === filters.audience)
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(note => {
        const noteDate = note.createdAt
        return noteDate >= start && noteDate <= end
      })
    }

    if (filters.durationRange) {
      const { min, max } = filters.durationRange
      filtered = filtered.filter(note => {
        const duration = note.estimatedDuration || 0
        return duration >= min && duration <= max
      })
    }

    return filtered
  }

  private sortNotes(notes: Note[], sortBy: SortField, order: SortOrder = 'desc'): Note[] {
    return notes.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'updatedAt':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
          break
        case 'content':
          comparison = a.content.localeCompare(b.content)
          break
        case 'duration':
          comparison = (a.estimatedDuration || 0) - (b.estimatedDuration || 0)
          break
        case 'relevance':
          // For relevance, maintain original order (search results are pre-sorted)
          return 0
      }

      return order === 'asc' ? comparison : -comparison
    })
  }

  private optimizeNoteSelection(
    candidates: Note[],
    targetDuration: number,
    preferences?: SetListPreferences
  ): Note[] {
    // Simple greedy algorithm for now
    // In a real implementation, this could use more sophisticated optimization
    
    const selected: Note[] = []
    let currentDuration = 0
    const tolerance = targetDuration * 0.1 // 10% tolerance

    // Sort candidates by preference
    const sortedCandidates = candidates.sort((a, b) => {
      // Prefer notes with higher estimated duration accuracy
      const aHasDuration = a.estimatedDuration ? 1 : 0
      const bHasDuration = b.estimatedDuration ? 1 : 0
      
      if (aHasDuration !== bHasDuration) {
        return bHasDuration - aHasDuration
      }

      // Prefer more recent content
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    for (const note of sortedCandidates) {
      const noteDuration = note.estimatedDuration || 60 // Default 1 minute
      
      if (currentDuration + noteDuration <= targetDuration + tolerance) {
        selected.push(note)
        currentDuration += noteDuration
        
        if (currentDuration >= targetDuration - tolerance) {
          break
        }
      }
    }

    return selected
  }

  private async autoTagContent(result: OrganizationResult): Promise<void> {
    // This would integrate with AI services for auto-tagging
    // For now, implement basic keyword-based tagging
    
    const notes = await this.storageService.listNotes({ limit: 100 })
    const commonKeywords = new Map<string, string[]>()

    // Define keyword patterns
    const patterns = {
      'observational': ['notice', 'see', 'watch', 'look', 'observe'],
      'relationship': ['wife', 'husband', 'girlfriend', 'boyfriend', 'marriage', 'dating'],
      'work': ['job', 'boss', 'office', 'work', 'career', 'meeting'],
      'family': ['mom', 'dad', 'parent', 'child', 'kid', 'family'],
      'technology': ['phone', 'computer', 'internet', 'app', 'social media'],
      'food': ['eat', 'restaurant', 'cook', 'food', 'hungry', 'diet']
    }

    for (const note of notes) {
      const content = note.content.toLowerCase()
      const suggestedTags: string[] = []

      for (const [tag, keywords] of Object.entries(patterns)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          suggestedTags.push(tag)
        }
      }

      if (suggestedTags.length > 0) {
        result.tagsAdded.set(note.id, suggestedTags)
      }
    }
  }

  private async getPopularContent(limit: number): Promise<Note[]> {
    // Get notes that appear in multiple set lists
    const setlists = await this.storageService.listSetLists()
    const noteUsage = new Map<string, number>()

    setlists.forEach(setlist => {
      setlist.notes.forEach(note => {
        const count = noteUsage.get(note.id) || 0
        noteUsage.set(note.id, count + 1)
      })
    })

    const popularNoteIds = Array.from(noteUsage.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([noteId]) => noteId)

    const notes = await Promise.all(
      popularNoteIds.map(id => this.storageService.getNote(id))
    )

    return notes.filter((note): note is Note => note !== undefined)
  }

  private async calculateContentGrowth(notes: Note[]): Promise<ContentGrowth[]> {
    const monthlyGrowth = new Map<string, number>()

    notes.forEach(note => {
      const monthKey = note.createdAt.toISOString().substring(0, 7) // YYYY-MM
      const count = monthlyGrowth.get(monthKey) || 0
      monthlyGrowth.set(monthKey, count + 1)
    })

    return Array.from(monthlyGrowth.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private async calculateDuplicateRate(): Promise<number> {
    const duplicates = await this.organizationService.detectDuplicates(0.8)
    const totalNotes = await this.storageService.listNotes()
    
    const duplicateCount = duplicates.reduce((sum, similarity) => 
      sum + similarity.duplicates.length, 0
    )

    return totalNotes.length > 0 ? duplicateCount / totalNotes.length : 0
  }
}

// Types and interfaces

export interface SearchOptions {
  limit?: number
  filters?: SearchFilters
  sortBy?: SortField
  sortOrder?: SortOrder
}

export interface SearchFilters {
  captureMethod?: string[]
  tags?: string[]
  venue?: string
  audience?: string
  dateRange?: { start: Date; end: Date }
  durationRange?: { min: number; max: number }
}

export interface SearchResults {
  notes: Note[]
  setlists: SetList[]
  venues: any[]
  contacts: any[]
  performances: any[]
  totalResults: number
}

export interface ContentContext {
  venue?: string
  audience?: string
  tags?: string[]
  performanceDate?: Date
}

export interface ContentSuggestion {
  type: 'venue-specific' | 'audience-specific' | 'tag-based' | 'popular' | 'recent'
  title: string
  notes: Note[]
  reason: string
}

export interface OrganizationOptions {
  duplicateThreshold?: number
  autoTag?: boolean
  categorize?: boolean
}

export interface OrganizationResult {
  categorized: Map<string, Note[]>
  duplicatesFound: any[]
  tagsAdded: Map<string, string[]>
  errors: string[]
}

export interface OptimizedSetListInput {
  name: string
  targetDuration: number
  venue?: string
  audience?: string
  performanceDate?: Date
  preferences?: SetListPreferences
}

export interface SetListPreferences {
  includeTags?: string[]
  excludeTags?: string[]
  preferRecent?: boolean
  balanceTypes?: boolean
}

export interface ContentAnalytics {
  totalNotes: number
  totalDuration: number
  averageNoteDuration: number
  captureMethodBreakdown: Record<string, number>
  topTags: [string, number][]
  mostUsedContent: { note: Note; usageCount: number }[]
  contentGrowth: ContentGrowth[]
  duplicateRate: number
}

export interface ContentGrowth {
  month: string
  count: number
}

export type SortField = 'createdAt' | 'updatedAt' | 'content' | 'duration' | 'relevance'
export type SortOrder = 'asc' | 'desc'