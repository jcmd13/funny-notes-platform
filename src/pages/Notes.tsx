import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useNotes } from '../hooks'
import { useAsyncOperation } from '../hooks/useErrorHandler'
import { NoteList, BulkOperations, DuplicateDetection, ImportExport } from '../components/notes'
import { 
  Button, 
  FloatingActionButton, 
  Modal, 
  EmptyStates, 
  SkeletonList,
  useToast 
} from '../components/ui'
import type { Note } from '../core/models'

/**
 * Notes page - for viewing and managing all notes
 */
function Notes() {
  const { notes, loading, error, refreshNotes, deleteNote, updateNote } = useNotes()
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [showOrganizationModal, setShowOrganizationModal] = useState(false)
  const [organizationTab, setOrganizationTab] = useState<'duplicates' | 'import-export'>('duplicates')
  const navigate = useNavigate()
  const location = useLocation()
  const { success, error: showError } = useToast()

  // Handle highlighting specific note from navigation state
  const highlightNoteId = location.state?.highlightNote

  // Enhanced refresh with error handling
  const {
    execute: handleRefresh,
    isLoading: refreshing,
    error: refreshError
  } = useAsyncOperation(
    async () => {
      await refreshNotes()
      success('Notes refreshed', 'Your notes are up to date')
    },
    { 
      context: 'refresh notes',
      onError: (error) => showError('Refresh failed', error.message)
    }
  )

  // Enhanced note deletion with error handling
  const {
    execute: handleDeleteNote,
    isLoading: deleting
  } = useAsyncOperation(
    async (noteId: string) => {
      await deleteNote(noteId)
      success('Note deleted', 'Your note has been removed')
    },
    { 
      context: 'delete note',
      onError: (error) => showError('Delete failed', error.message)
    }
  )

  // Enhanced note updates with error handling
  const {
    execute: handleUpdateNote,
    isLoading: updating
  } = useAsyncOperation(
    async (note: Note) => {
      await updateNote(note.id, note)
      success('Note updated', 'Your changes have been saved')
    },
    { 
      context: 'update note',
      onError: (error) => showError('Update failed', error.message)
    }
  )

  // Load notes on component mount - only once
  useEffect(() => {
    refreshNotes()
  }, []) // Empty dependency array to prevent loops

  // Handle capture navigation
  const handleTextCapture = () => {
    navigate('/capture?mode=text')
  }

  const handleVoiceCapture = () => {
    navigate('/capture?mode=voice')
  }

  const handleImageCapture = () => {
    navigate('/capture?mode=image')
  }

  // Handle note selection for bulk operations
  const handleNoteSelection = (noteId: string, selected: boolean) => {
    setSelectedNotes(prev => 
      selected 
        ? [...prev, noteId]
        : prev.filter(id => id !== noteId)
    )
  }

  const handleSelectionChange = (noteIds: string[]) => {
    setSelectedNotes(noteIds)
  }

  const handleOperationComplete = () => {
    refreshNotes()
    setSelectedNotes([])
  }

  const getSelectedNotesData = () => {
    return notes.filter(note => selectedNotes.includes(note.id))
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
            onClick={() => setShowOrganizationModal(true)}
          >
            Organize
          </Button>
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
            className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-md font-medium inline-flex items-center space-x-2 transition-colors hover:bg-yellow-400"
          >
            <span className="text-lg">+</span>
            <span>Capture</span>
          </Link>
        </div>
      </div>

      {/* Error display */}
      {(error || refreshError) && 
        EmptyStates.Error(
          (error || refreshError)?.message || 'Failed to load notes',
          handleRefresh
        )
      }

      {/* Loading state */}
      {loading && !error && (
        <div className="space-y-4" role="status" aria-label="Loading notes">
          <div className="text-center text-gray-400 mb-6">
            Loading your notes...
          </div>
          <SkeletonList items={5} />
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && notes.length === 0 && (
        <EmptyStates.Notes />
      )}

      {/* Content when notes exist */}
      {!loading && !error && notes.length > 0 && (
        <>
          {/* Bulk Operations */}
          {selectedNotes.length > 0 && (
            <BulkOperations
              selectedNotes={getSelectedNotesData()}
              onSelectionChange={handleSelectionChange}
              onOperationComplete={handleOperationComplete}
            />
          )}

          {/* Notes list */}
          <NoteList
            notes={notes}
            loading={updating || deleting}
            onDeleteNote={(noteId) => handleDeleteNote(noteId)}
            onUpdateNote={(note) => handleUpdateNote(note)}
            selectedNotes={selectedNotes}
            onNoteSelection={handleNoteSelection}
            showSelection={true}
            highlightNoteId={highlightNoteId}
          />
        </>
      )}

      {/* Organization Modal */}
      <Modal
        isOpen={showOrganizationModal}
        onClose={() => setShowOrganizationModal(false)}
        title="Content Organization"
        size="xl"
      >
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                organizationTab === 'duplicates'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setOrganizationTab('duplicates')}
            >
              Duplicate Detection
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                organizationTab === 'import-export'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setOrganizationTab('import-export')}
            >
              Import & Export
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {organizationTab === 'duplicates' && (
              <DuplicateDetection onNotesUpdated={handleOperationComplete} />
            )}
            {organizationTab === 'import-export' && (
              <ImportExport onImportComplete={handleOperationComplete} />
            )}
          </div>
        </div>
      </Modal>

      {/* Floating capture button */}
      <FloatingActionButton
        showCaptureOptions={true}
        onTextCapture={handleTextCapture}
        onVoiceCapture={handleVoiceCapture}
        onImageCapture={handleImageCapture}
        position="bottom-right"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
      />
    </div>
  )
}

export default Notes