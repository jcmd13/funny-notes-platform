import { useState, useEffect, useCallback } from 'react'
import { useStorage } from './useStorage'
import type { Performance, CreatePerformanceInput, PerformanceFeedback, PerformanceStats } from '../core/models'

/**
 * Custom hook for managing performances
 * Provides CRUD operations and analytics for performance tracking
 */
export function usePerformances() {
  const { storageService } = useStorage()
  const [performances, setPerformances] = useState<Performance[]>([])
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all performances
  const loadPerformances = useCallback(async (options?: {
    limit?: number
    venueId?: string
    setListId?: string
    status?: Performance['status']
  }) => {
    if (!storageService) return

    setLoading(true)
    setError(null)
    
    try {
      const result = await storageService.listPerformances({
        ...options,
        sortBy: 'date',
        sortOrder: 'desc'
      })
      setPerformances(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performances')
    } finally {
      setLoading(false)
    }
  }, [storageService])

  // Load performance statistics
  const loadStats = useCallback(async () => {
    if (!storageService) return

    try {
      const result = await storageService.getPerformanceStats()
      setStats(result)
    } catch (err) {
      console.error('Failed to load performance stats:', err)
    }
  }, [storageService])

  // Create a new performance
  const createPerformance = useCallback(async (input: CreatePerformanceInput): Promise<Performance> => {
    if (!storageService) {
      throw new Error('Storage service not available')
    }

    setLoading(true)
    setError(null)

    try {
      const performance = await storageService.createPerformance(input)
      setPerformances(prev => [performance, ...prev])
      return performance
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create performance'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [storageService])

  // Update an existing performance
  const updatePerformance = useCallback(async (id: string, updates: Partial<Performance>): Promise<Performance> => {
    if (!storageService) {
      throw new Error('Storage service not available')
    }

    setLoading(true)
    setError(null)

    try {
      const updated = await storageService.updatePerformance(id, updates)
      setPerformances(prev => prev.map(p => p.id === id ? updated : p))
      
      // Reload stats if feedback was updated
      if (updates.feedback) {
        await loadStats()
      }
      
      return updated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update performance'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [storageService, loadStats])

  // Add feedback to a performance
  const addFeedback = useCallback(async (performanceId: string, feedbackData: {
    rating: number
    audienceSize?: number
    audienceResponse?: 'poor' | 'fair' | 'good' | 'great' | 'excellent'
    notes?: string
    highlights?: string[]
    improvements?: string[]
  }): Promise<Performance> => {
    const feedback: PerformanceFeedback = {
      id: crypto.randomUUID(),
      performanceId,
      rating: feedbackData.rating,
      audienceSize: feedbackData.audienceSize,
      audienceResponse: feedbackData.audienceResponse,
      notes: feedbackData.notes,
      highlights: feedbackData.highlights || [],
      improvements: feedbackData.improvements || [],
      materialFeedback: [],
      createdAt: new Date()
    }

    return updatePerformance(performanceId, { 
      feedback,
      status: 'completed',
      endTime: new Date()
    })
  }, [updatePerformance])

  // Delete a performance
  const deletePerformance = useCallback(async (id: string): Promise<void> => {
    if (!storageService) {
      throw new Error('Storage service not available')
    }

    setLoading(true)
    setError(null)

    try {
      await storageService.deletePerformance(id)
      setPerformances(prev => prev.filter(p => p.id !== id))
      await loadStats() // Reload stats after deletion
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete performance'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [storageService, loadStats])

  // Get a single performance by ID
  const getPerformance = useCallback(async (id: string): Promise<Performance | undefined> => {
    if (!storageService) return undefined

    try {
      return await storageService.getPerformance(id)
    } catch (err) {
      console.error('Failed to get performance:', err)
      return undefined
    }
  }, [storageService])

  // Get performances for a specific venue
  const getPerformancesByVenue = useCallback(async (venueId: string): Promise<Performance[]> => {
    if (!storageService) return []

    try {
      return await storageService.listPerformances({ venueId })
    } catch (err) {
      console.error('Failed to get performances by venue:', err)
      return []
    }
  }, [storageService])

  // Get performances for a specific set list
  const getPerformancesBySetList = useCallback(async (setListId: string): Promise<Performance[]> => {
    if (!storageService) return []

    try {
      return await storageService.listPerformances({ setListId })
    } catch (err) {
      console.error('Failed to get performances by set list:', err)
      return []
    }
  }, [storageService])

  // Load initial data
  useEffect(() => {
    if (storageService) {
      loadPerformances()
      loadStats()
    }
  }, [storageService, loadPerformances, loadStats])

  return {
    performances,
    stats,
    loading,
    error,
    createPerformance,
    updatePerformance,
    addFeedback,
    deletePerformance,
    getPerformance,
    getPerformancesByVenue,
    getPerformancesBySetList,
    loadPerformances,
    loadStats
  }
}