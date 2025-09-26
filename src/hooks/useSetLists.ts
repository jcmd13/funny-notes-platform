import { useState, useEffect, useCallback } from 'react'
import { useStorage } from './useStorage'
import type { SetList, CreateSetListInput } from '@core/models'

interface UseSetListsOptions {
  limit?: number
  venue?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'performanceDate'
  sortOrder?: 'asc' | 'desc'
}

interface UseSetListsReturn {
  setLists: SetList[]
  loading: boolean
  error: Error | null
  createSetList: (input: CreateSetListInput) => Promise<SetList | null>
  updateSetList: (id: string, updates: Partial<SetList>) => Promise<SetList | null>
  deleteSetList: (id: string) => Promise<boolean>
  refreshSetLists: () => Promise<void>
  getSetList: (id: string) => Promise<SetList | null>
}

/**
 * Hook for managing set lists with CRUD operations and caching
 */
export function useSetLists(options: UseSetListsOptions = {}): UseSetListsReturn {
  const { storageService, isInitialized } = useStorage()
  const [setLists, setSetLists] = useState<SetList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load set lists from storage
  const loadSetLists = useCallback(async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedSetLists = await storageService.listSetLists(options)
      setSetLists(loadedSetLists)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load set lists'))
    } finally {
      setLoading(false)
    }
  }, [storageService, isInitialized, options])

  // Load set lists when storage is ready or options change
  useEffect(() => {
    loadSetLists()
  }, [loadSetLists])

  // Create a new set list with optimistic updates
  const createSetList = useCallback(async (input: CreateSetListInput): Promise<SetList | null> => {
    if (!storageService) return null

    try {
      const newSetList = await storageService.createSetList(input)
      
      // Optimistic update - add to local state immediately
      setSetLists(prev => [newSetList, ...prev])
      
      return newSetList
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create set list'))
      return null
    }
  }, [storageService])

  // Update an existing set list with optimistic updates
  const updateSetList = useCallback(async (id: string, updates: Partial<SetList>): Promise<SetList | null> => {
    if (!storageService) return null

    try {
      // Optimistic update - update local state immediately
      setSetLists(prev => prev.map(setList => 
        setList.id === id ? { ...setList, ...updates, updatedAt: new Date() } : setList
      ))

      const updatedSetList = await storageService.updateSetList(id, updates)
      
      // Update with actual data from storage
      setSetLists(prev => prev.map(setList => 
        setList.id === id ? updatedSetList : setList
      ))
      
      return updatedSetList
    } catch (err) {
      // Revert optimistic update on error
      await loadSetLists()
      setError(err instanceof Error ? err : new Error('Failed to update set list'))
      return null
    }
  }, [storageService, loadSetLists])

  // Delete a set list with optimistic updates
  const deleteSetList = useCallback(async (id: string): Promise<boolean> => {
    if (!storageService) return false

    try {
      // Optimistic update - remove from local state immediately
      setSetLists(prev => prev.filter(setList => setList.id !== id))

      await storageService.deleteSetList(id)
      return true
    } catch (err) {
      // Revert optimistic update on error - reload set lists
      await loadSetLists()
      setError(err instanceof Error ? err : new Error('Failed to delete set list'))
      return false
    }
  }, [storageService, setLists])

  // Get a specific set list by ID
  const getSetList = useCallback(async (id: string): Promise<SetList | null> => {
    if (!storageService) return null

    try {
      const setList = await storageService.getSetList(id)
      return setList || null
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get set list'))
      return null
    }
  }, [storageService])

  // Refresh set lists from storage
  const refreshSetLists = useCallback(async () => {
    await loadSetLists()
  }, [loadSetLists])

  return {
    setLists,
    loading,
    error,
    createSetList,
    updateSetList,
    deleteSetList,
    refreshSetLists,
    getSetList,
  }
}