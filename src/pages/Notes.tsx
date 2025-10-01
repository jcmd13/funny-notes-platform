import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotes } from '../hooks'
import { NoteList } from '../components/notes'
import { Button } from '../components/ui'
import { Note } from '../core/models'

/**
 * Notes page - for viewing and managing all notes
 */
export function Notes() {
  const { notes, loading, error, refreshNotes, deleteNote, updateNote } = useNotes()
  const [refreshing, setRefreshing] = useState(false)

  // Load notes on component mount
  useEffect(() => {
    refreshNotes()
  }, [refreshNotes])

  // Handle refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshNotes()
    } finally {
      setRefreshing(false)
    }
  }

  // Handle note deletion
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
    } catch (error) {
      console.error('Failed to delete note:', error)
      // TODO: Show error toast
    }
  }

  // Handle note updates
  const handleUpdateNote = async (note: Note) => {
    try {
      await updateNote(note)
    } catch (error) {
      console.error('Failed to update note:', error)
      // TODO: Show error toast
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-yellow-400">
            Your Notes 📝
          </h1>
          <p className="text-gray-300 mt-1">
            Manage and organize your comedy material
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Link
            to="/capture"
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Note</span>
          </Link>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="text-red-400">
            <h3 className="font-semibold mb-2">Error Loading Notes</h3>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      )}

      {/* Notes list */}
      <NoteList
        notes={notes}
        loading={loading}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
      />
    </div>
  )
}