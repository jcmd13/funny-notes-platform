import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStorage } from './useStorage'
import type { RehearsalSession, CreateRehearsalSessionInput } from '../core/models'

interface UseRehearsalSessionsOptions {
  limit?: number
  setListId?: string
  isCompleted?: boolean
  sortBy?: 'createdAt' | 'updatedAt' | 'startTime'
  sortOrder?: 'asc' | 'desc'
}

interface UseRehearsalSessionsReturn {
  sessions: RehearsalSession[]
  loading: boolean
  error: Error | null
  createSession: (input: CreateRehearsalSessionInput) => Promise<RehearsalSession | null>
  updateSession: (id: string, updates: Partial<RehearsalSession>) => Promise<RehearsalSession | null>
  deleteSession: (id: string) => Promise<boolean>
  getSession: (id: string) => Promise<RehearsalSession | null>
  refreshSessions: () => Promise<void>
}

/**
 * Hook for managing rehearsal sessions with CRUD operations and caching
 */
export function useRehearsalSessions(options?: UseRehearsalSessionsOptions): UseRehearsalSessionsReturn {
  const { storageService, isInitialized } = useStorage()
  const [sessions, setSessions] = useState<RehearsalSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Stabilize options object to prevent infinite re-renders
  const stableOptions = useMemo(() => options || {}, [
    options?.limit,
    options?.setListId,
    options?.isCompleted,
    options?.sortBy,
    options?.sortOrder
  ])

  // Load sessions from storage
  const loadSessions = useCallback(async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedSessions = await storageService.listRehearsalSessions(stableOptions)
      setSessions(loadedSessions)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load rehearsal sessions'))
    } finally {
      setLoading(false)
    }
  }, [storageService, isInitialized, stableOptions])

  // Load sessions when storage is ready or options change
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Create a new rehearsal session with optimistic updates
  const createSession = useCallback(async (input: CreateRehearsalSessionInput): Promise<RehearsalSession | null> => {
    if (!storageService) return null

    try {
      const newSession = await storageService.createRehearsalSession(input)
      
      // Optimistic update - add to local state immediately
      setSessions(prev => [newSession, ...prev])
      
      return newSession
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create rehearsal session'))
      return null
    }
  }, [storageService])

  // Update an existing rehearsal session with optimistic updates
  const updateSession = useCallback(async (id: string, updates: Partial<RehearsalSession>): Promise<RehearsalSession | null> => {
    if (!storageService) return null

    try {
      // Optimistic update - update local state immediately
      setSessions(prev => prev.map(session => 
        session.id === id ? { ...session, ...updates, updatedAt: new Date() } : session
      ))

      const updatedSession = await storageService.updateRehearsalSession(id, updates)
      
      // Update with actual data from storage
      setSessions(prev => prev.map(session => 
        session.id === id ? updatedSession : session
      ))
      
      return updatedSession
    } catch (err) {
      // Revert optimistic update on error
      await loadSessions()
      setError(err instanceof Error ? err : new Error('Failed to update rehearsal session'))
      return null
    }
  }, [storageService, loadSessions])

  // Delete a rehearsal session with optimistic updates
  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    if (!storageService) return false

    try {
      // Optimistic update - remove from local state immediately
      setSessions(prev => prev.filter(session => session.id !== id))

      await storageService.deleteRehearsalSession(id)
      return true
    } catch (err) {
      // Revert optimistic update on error - reload sessions
      await loadSessions()
      setError(err instanceof Error ? err : new Error('Failed to delete rehearsal session'))
      return false
    }
  }, [storageService, loadSessions])

  // Get a specific rehearsal session by ID
  const getSession = useCallback(async (id: string): Promise<RehearsalSession | null> => {
    if (!storageService) return null

    try {
      const session = await storageService.getRehearsalSession(id)
      return session || null
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get rehearsal session'))
      return null
    }
  }, [storageService])

  // Refresh sessions from storage
  const refreshSessions = useCallback(async () => {
    await loadSessions()
  }, [loadSessions])

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    getSession,
    refreshSessions,
  }
}