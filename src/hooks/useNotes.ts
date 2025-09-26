import { useState, useEffect, useCallback } from 'react'
import { useStorage } from './useStorage'
import type { Note, CreateNoteInput } from '@core/models'

interface UseNotesOptions {
  limit?: number
  tags?: string[]
  type?: Note['type']
  sortBy?: 'createdAt' | 'updatedAt' | 'content'
  sortOrder?: 'asc' | 'desc'
}

interface UseNotesReturn {
  notes: Note[]
  loading: boolean
  error: Error | null
  createNote: (input: CreateNoteInput) => Promise<Note | null>
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note | null>
  deleteNote: (id: string) => Promise<boolean>
  refreshNotes: () => Promise<void>
  searchNotes: (query: string) => Promise<Note[]>
}

/**
 * Hook for managing notes with CRUD operations and caching
 */
export function useNotes(options: UseNotesOptions = {}): UseNotesReturn {
  const { storageService, isInitialized } = useStorage()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load notes from storage
  const loadNotes = useCallback(async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedNotes = await storageService.listNotes(options)
      setNotes(loadedNotes)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load notes'))
    } finally {
      setLoading(false)
    }
  }, [storageService, isInitialized, options])

  // Load notes when storage is ready or options change
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Create a new note with optimistic updates
  const createNote = useCallback(async (input: CreateNoteInput): Promise<Note | null> => {
    if (!storageService) return null

    try {
      const newNote = await storageService.createNote(input)
      
      // Optimistic update - add to local state immediately
      setNotes(prev => [newNote, ...prev])
      
      return newNote
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create note'))
      return null
    }
  }, [storageService])

  // Update an existing note with optimistic updates
  const updateNote = useCallback(async (id: string, updates: Partial<Note>): Promise<Note | null> => {
    if (!storageService) return null

    try {
      // Optimistic update - update local state immediately
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
      ))

      const updatedNote = await storageService.updateNote(id, updates)
      
      // Update with actual data from storage
      setNotes(prev => prev.map(note => 
        note.id === id ? updatedNote : note
      ))
      
      return updatedNote
    } catch (err) {
      // Revert optimistic update on error
      await loadNotes()
      setError(err instanceof Error ? err : new Error('Failed to update note'))
      return null
    }
  }, [storageService, loadNotes])

  // Delete a note with optimistic updates
  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    if (!storageService) return false

    try {
      // Optimistic update - remove from local state immediately
      setNotes(prev => prev.filter(note => note.id !== id))

      await storageService.deleteNote(id)
      return true
    } catch (err) {
      // Revert optimistic update on error - reload notes
      await loadNotes()
      setError(err instanceof Error ? err : new Error('Failed to delete note'))
      return false
    }
  }, [storageService, notes])

  // Refresh notes from storage
  const refreshNotes = useCallback(async () => {
    await loadNotes()
  }, [loadNotes])

  // Search notes
  const searchNotes = useCallback(async (query: string): Promise<Note[]> => {
    if (!storageService) return []

    try {
      return await storageService.searchNotes(query)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search notes'))
      return []
    }
  }, [storageService])

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes,
    searchNotes,
  }
}