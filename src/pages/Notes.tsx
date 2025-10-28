import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStorage } from '../hooks/useStorage'
import type { Note } from '../core/models'

/**
 * Notes page - for browsing and managing notes
 */
function Notes() {
  const { storageService, isInitialized } = useStorage()
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])

  const loadNotes = async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedNotes = await storageService.listNotes({
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
      setNotes(loadedNotes)
      
      // Extract all unique tags
      const tags = new Set<string>()
      loadedNotes.forEach(note => {
        note.tags?.forEach(tag => tags.add(tag))
      })
      setAllTags(Array.from(tags).sort())
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load notes'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isInitialized) {
      loadNotes()
    }
  }, [isInitialized, storageService])

  // Filter notes based on search and tag selection
  useEffect(() => {
    let filtered = notes

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(note => 
        note.content.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(note => 
        note.tags?.includes(selectedTag)
      )
    }

    setFilteredNotes(filtered)
  }, [notes, searchQuery, selectedTag])

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTag(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Your Notes 📚</h1>
          <Link
            to="/capture"
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            + New Note
          </Link>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-4">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Your Notes 📚</h1>
          <Link
            to="/capture"
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            + New Note
          </Link>
        </div>
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Notes</h3>
          <p className="text-red-300 text-sm mb-3">{error.message}</p>
          <button 
            onClick={loadNotes}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">Your Notes 📚</h1>
        <Link
          to="/capture"
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          + New Note
        </Link>
      </div>

      {/* Search and Filter Controls */}
      {notes.length > 0 && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">Filter by tags:</h3>
                {(selectedTag || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-400 hover:text-gray-200 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      selectedTag === tag
                        ? 'bg-yellow-500 text-gray-900 font-semibold'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="text-sm text-gray-400">
            Showing {filteredNotes.length} of {notes.length} notes
            {selectedTag && ` tagged with "${selectedTag}"`}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No notes yet</h3>
          <p className="text-gray-400 mb-6">Start building your comedy material library!</p>
          <Link
            to="/capture"
            className="inline-flex items-center justify-center space-x-2 bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            <span>📝</span>
            <span>Create Your First Note</span>
          </Link>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No notes found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || selectedTag 
              ? 'Try adjusting your search or filter criteria'
              : 'No notes match your current filters'
            }
          </p>
          {(searchQuery || selectedTag) && (
            <button
              onClick={clearFilters}
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} onUpdate={loadNotes} onTagClick={handleTagClick} />
          ))}
        </div>
      )}
    </div>
  )
}

interface NoteCardProps {
  note: Note
  onUpdate: () => void
  onTagClick: (tag: string) => void
}

function NoteCard({ note, onUpdate, onTagClick }: NoteCardProps) {
  const { storageService } = useStorage()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!storageService) return
    
    try {
      setDeleting(true)
      await storageService.deleteNote(note.id)
      onUpdate()
    } catch (error) {
      console.error('Failed to delete note:', error)
      alert('Failed to delete note')
    } finally {
      setDeleting(false)
    }
  }

  const getCaptureIcon = (captureMethod: string) => {
    switch (captureMethod) {
      case 'text': return '📝'
      case 'voice': return '🎤'
      case 'image': return '📷'
      case 'mixed': return '📋'
      default: return '📄'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getCaptureIcon(note.captureMethod)}</span>
          <span className="text-xs text-gray-400 capitalize">{note.captureMethod}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{formatDate(note.updatedAt)}</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Delete note"
          >
            {deleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-gray-200 whitespace-pre-wrap">{note.content}</p>
      </div>
      
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.map(tag => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className="text-xs bg-gray-700 hover:bg-yellow-500 hover:text-gray-900 text-gray-300 px-2 py-1 rounded transition-colors cursor-pointer"
              title={`Filter by #${tag}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notes