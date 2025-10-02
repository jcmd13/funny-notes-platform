import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotes } from '../hooks'
import { NoteList, BulkOperations, DuplicateDetection, ImportExport } from '../components/notes'
import { Button, FloatingActionButton, Modal } from '../components/ui'
import type { Note } from '../core/models'

/**
 * Notes page - for viewing and managing all notes
 */
export function Notes() {
  const { notes, loading, error, refreshNotes, deleteNote, updateNote } = useNotes()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<string[]>([])
  const [showOrganizationModal, setShowOrganizationModal] = useState(false)
  const [organizationTab, setOrganizationTab] = useState<'duplicates' | 'import-export'>('duplicates')
  const navigate = useNavigate()

  // Load notes on component mount - only once
  useEffect(() => {
    refreshNotes()
  }, []) // Empty dependency array to prevent loops

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
      await updateNote(note.id, note)
    } catch (error) {
      console.error('Failed to update note:', error)
      // TODO: Show error toast
    }
  }

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
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="text-red-400">
            <h3 className="font-semibold mb-2">Error Loading Notes</h3>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      )}

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
        loading={loading}
        onDeleteNote={handleDeleteNote}
        onUpdateNote={handleUpdateNote}
        selectedNotes={selectedNotes}
        onNoteSelection={handleNoteSelection}
        showSelection={true}
      />

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