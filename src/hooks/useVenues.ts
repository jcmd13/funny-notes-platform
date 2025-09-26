import { useState, useEffect, useCallback } from 'react'
import { useStorage } from './useStorage'
import type { Venue, CreateVenueInput } from '@core/models'

interface UseVenuesOptions {
  limit?: number
  location?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'location'
  sortOrder?: 'asc' | 'desc'
}

interface UseVenuesReturn {
  venues: Venue[]
  loading: boolean
  error: Error | null
  createVenue: (input: CreateVenueInput) => Promise<Venue | null>
  updateVenue: (id: string, updates: Partial<Venue>) => Promise<Venue | null>
  deleteVenue: (id: string) => Promise<boolean>
  refreshVenues: () => Promise<void>
  getVenue: (id: string) => Promise<Venue | null>
}

/**
 * Hook for managing venues with CRUD operations and caching
 */
export function useVenues(options: UseVenuesOptions = {}): UseVenuesReturn {
  const { storageService, isInitialized } = useStorage()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load venues from storage
  const loadVenues = useCallback(async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedVenues = await storageService.listVenues(options)
      setVenues(loadedVenues)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load venues'))
    } finally {
      setLoading(false)
    }
  }, [storageService, isInitialized, options])

  // Load venues when storage is ready or options change
  useEffect(() => {
    loadVenues()
  }, [loadVenues])

  // Create a new venue with optimistic updates
  const createVenue = useCallback(async (input: CreateVenueInput): Promise<Venue | null> => {
    if (!storageService) return null

    try {
      const newVenue = await storageService.createVenue(input)
      
      // Optimistic update - add to local state immediately
      setVenues(prev => [newVenue, ...prev])
      
      return newVenue
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create venue'))
      return null
    }
  }, [storageService])

  // Update an existing venue with optimistic updates
  const updateVenue = useCallback(async (id: string, updates: Partial<Venue>): Promise<Venue | null> => {
    if (!storageService) return null

    try {
      // Optimistic update - update local state immediately
      setVenues(prev => prev.map(venue => 
        venue.id === id ? { ...venue, ...updates, updatedAt: new Date() } : venue
      ))

      const updatedVenue = await storageService.updateVenue(id, updates)
      
      // Update with actual data from storage
      setVenues(prev => prev.map(venue => 
        venue.id === id ? updatedVenue : venue
      ))
      
      return updatedVenue
    } catch (err) {
      // Revert optimistic update on error
      await loadVenues()
      setError(err instanceof Error ? err : new Error('Failed to update venue'))
      return null
    }
  }, [storageService, loadVenues])

  // Delete a venue with optimistic updates
  const deleteVenue = useCallback(async (id: string): Promise<boolean> => {
    if (!storageService) return false

    try {
      // Optimistic update - remove from local state immediately
      setVenues(prev => prev.filter(venue => venue.id !== id))

      await storageService.deleteVenue(id)
      return true
    } catch (err) {
      // Revert optimistic update on error - reload venues
      await loadVenues()
      setError(err instanceof Error ? err : new Error('Failed to delete venue'))
      return false
    }
  }, [storageService, venues])

  // Get a specific venue by ID
  const getVenue = useCallback(async (id: string): Promise<Venue | null> => {
    if (!storageService) return null

    try {
      const venue = await storageService.getVenue(id)
      return venue || null
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get venue'))
      return null
    }
  }, [storageService])

  // Refresh venues from storage
  const refreshVenues = useCallback(async () => {
    await loadVenues()
  }, [loadVenues])

  return {
    venues,
    loading,
    error,
    createVenue,
    updateVenue,
    deleteVenue,
    refreshVenues,
    getVenue,
  }
}