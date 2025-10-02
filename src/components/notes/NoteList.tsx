import { useState, useMemo } from 'react'
import type { Note } from '../../core/models'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { NotesFilter, type NotesFilterOptions } from './NotesFilter'
import { LoadingSpinner } from '../ui'

export interface NoteListProps {
  notes: Note[]
  loading?: boolean
  onDeleteNote: (noteId: string) => void
  onUpdateNote: (note: Note) => void
  selectedNotes?: string[]
  onNoteSelection?: (noteId: string, selected: boolean) => void
  showSelection?: boolean
}

/**
 * Main notes list component with filtering, search, and management
 */
export function NoteList({ 
  notes, 
  loading, 
  onDeleteNote, 
  onUpdateNote, 
  selectedNotes = [], 
  onNoteSelection,
  showSelection = false 
}: NoteListProps) {
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [filters, setFilters] = useState<NotesFilterOptions>({
    searchQuery: '',
    selectedTags: [],
    captureMethod: 'all',
    dateRange: 'all',
    sortBy: 'newest'
  })

  // Get all available tags from notes
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach(note => {
      note.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [notes])

  // Filter and sort notes based on current filters
  const filteredNotes = useMemo(() => {
    let filtered = [...notes]

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(note =>
        note.content.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        note.venue?.toLowerCase().includes(query) ||
        note.audience?.toLowerCase().includes(query)
      )
    }

    // Tags filter
    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        filters.selectedTags.every(tag =>
          note.tags?.includes(tag)
        )
      )
    }

    // Capture method filter
    if (filters.captureMethod !== 'all') {
      filtered = filtered.filter(note => note.captureMethod === filters.captureMethod)
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      let cutoffDate: Date
      switch (filters.dateRange) {
        case 'today':
          cutoffDate = startOfDay
          break
        case 'week':
          cutoffDate = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          cutoffDate = new Date(startOfDay.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }
      
      filtered = filtered.filter(note => note.createdAt >= cutoffDate)
    }

    // Sort notes
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime()
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case 'duration':
          const aDuration = a.estimatedDuration || 0
          const bDuration = b.estimatedDuration || 0
          return bDuration - aDuration
        case 'newest':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime()
      }
    })

    return filtered
  }, [notes, filters])

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
  }

  const handleSaveNote = (updatedNote: Note) => {
    onUpdateNote(updatedNote)
    setEditingNote(null)
  }

  const handleTagClick = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      selectedTags: [],
      captureMethod: 'all',
      dateRange: 'all',
      sortBy: 'newest'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <NotesFilter
        filters={filters}
        availableTags={availableTags}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {filteredNotes.length === notes.length ? (
            <span>Showing all {notes.length} note{notes.length === 1 ? '' : 's'}</span>
          ) : (
            <span>
              Showing {filteredNotes.length} of {notes.length} note{notes.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        
        {filteredNotes.length > 0 && (
          <div className="text-xs text-gray-500">
            Sorted by {filters.sortBy === 'newest' ? 'newest first' : 
                      filters.sortBy === 'oldest' ? 'oldest first' :
                      filters.sortBy === 'updated' ? 'recently updated' : 'duration'}
          </div>
        )}
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {filters.searchQuery || filters.selectedTags.length > 0 || 
             filters.captureMethod !== 'all' || filters.dateRange !== 'all' ? '🔍' : '📝'}
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {filters.searchQuery || filters.selectedTags.length > 0 || 
             filters.captureMethod !== 'all' || filters.dateRange !== 'all' 
              ? 'No notes match your filters' 
              : 'No notes yet'}
          </h3>
          <p className="text-gray-400 mb-4">
            {filters.searchQuery || filters.selectedTags.length > 0 || 
             filters.captureMethod !== 'all' || filters.dateRange !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Start capturing your comedy material to see it here.'}
          </p>
          {(filters.searchQuery || filters.selectedTags.length > 0 || 
            filters.captureMethod !== 'all' || filters.dateRange !== 'all') && (
            <button
              onClick={handleClearFilters}
              className="text-yellow-400 underline transition-colors hover:text-yellow-300"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={onDeleteNote}
              onTagClick={handleTagClick}
              selected={selectedNotes.includes(note.id)}
              onSelectionChange={onNoteSelection}
              showSelection={showSelection}
            />
          ))}
        </div>
      )}

      {/* Note editor modal */}
      <NoteEditor
        note={editingNote}
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        onSave={handleSaveNote}
      />
    </div>
  )
}