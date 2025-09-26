import { useState, useCallback } from 'react'
import { useStorage } from './useStorage'
import type { Note, SetList, Venue, Contact } from '@core/models'

interface SearchResults {
  notes: Note[]
  setlists: SetList[]
  venues: Venue[]
  contacts: Contact[]
}

interface UseSearchReturn {
  results: SearchResults
  loading: boolean
  error: Error | null
  search: (query: string, options?: { limit?: number }) => Promise<void>
  clearResults: () => void
}

/**
 * Hook for global search functionality across all data types
 */
export function useSearch(): UseSearchReturn {
  const { storageService } = useStorage()
  const [results, setResults] = useState<SearchResults>({
    notes: [],
    setlists: [],
    venues: [],
    contacts: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Perform global search across all data types
  const search = useCallback(async (query: string, options?: { limit?: number }) => {
    if (!storageService || !query.trim()) {
      setResults({ notes: [], setlists: [], venues: [], contacts: [] })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const searchResults = await storageService.globalSearch(query, options)
      setResults(searchResults)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'))
      setResults({ notes: [], setlists: [], venues: [], contacts: [] })
    } finally {
      setLoading(false)
    }
  }, [storageService])

  // Clear search results
  const clearResults = useCallback(() => {
    setResults({ notes: [], setlists: [], venues: [], contacts: [] })
    setError(null)
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  }
}