import { useState } from 'react'
import { VenueList, VenueEditor, VenueHistory } from '@components/venues'
import { ConfirmDialog, Button, Toast } from '@components/ui'
import { useVenues } from '@hooks/useVenues'
import type { Venue, CreateVenueInput } from '@core/models'

function Venues() {
  const { venues, loading, error, createVenue, updateVenue, deleteVenue } = useVenues()
  
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [historyVenue, setHistoryVenue] = useState<Venue | null>(null)
  const [deletingVenue, setDeletingVenue] = useState<Venue | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleCreateNew = () => {
    setEditingVenue(null)
    setIsEditorOpen(true)
  }

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue)
    setIsEditorOpen(true)
  }

  const handleViewHistory = (venue: Venue) => {
    setHistoryVenue(venue)
    setIsHistoryOpen(true)
  }

  const handleDeleteClick = (venue: Venue) => {
    setDeletingVenue(venue)
    setIsDeleteDialogOpen(true)
  }

  const handleSave = async (venueData: CreateVenueInput) => {
    setSaving(true)
    try {
      if (editingVenue) {
        await updateVenue(editingVenue.id, venueData)
        setToast({ message: 'Venue updated successfully!', type: 'success' })
      } else {
        await createVenue(venueData)
        setToast({ message: 'Venue created successfully!', type: 'success' })
      }
      setIsEditorOpen(false)
      setEditingVenue(null)
    } catch (error) {
      console.error('Failed to save venue:', error)
      setToast({ message: 'Failed to save venue. Please try again.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingVenue) return

    setDeleting(true)
    try {
      const success = await deleteVenue(deletingVenue.id)
      if (success) {
        setToast({ message: 'Venue deleted successfully!', type: 'success' })
      } else {
        setToast({ message: 'Failed to delete venue. Please try again.', type: 'error' })
      }
    } catch (error) {
      console.error('Failed to delete venue:', error)
      setToast({ message: 'Failed to delete venue. Please try again.', type: 'error' })
    } finally {
      setDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeletingVenue(null)
    }
  }

  const handleCloseEditor = () => {
    if (!saving) {
      setIsEditorOpen(false)
      setEditingVenue(null)
    }
  }

  const handleCloseHistory = () => {
    setIsHistoryOpen(false)
    setHistoryVenue(null)
  }

  const handleCloseDeleteDialog = () => {
    if (!deleting) {
      setIsDeleteDialogOpen(false)
      setDeletingVenue(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">
          Venues 🏢
        </h1>
        <Button onClick={handleCreateNew}>
          <span className="text-lg mr-2">+</span>
          Create Venue
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-200">
            Failed to load venues: {error.message}
          </p>
        </div>
      )}

      <VenueList
        venues={venues}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onViewHistory={handleViewHistory}
        onCreateNew={handleCreateNew}
      />

      <VenueEditor
        venue={editingVenue}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSave}
        loading={saving}
      />

      <VenueHistory
        venue={historyVenue}
        isOpen={isHistoryOpen}
        onClose={handleCloseHistory}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Venue"
        message={`Are you sure you want to delete "${deletingVenue?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />

      {toast && (
        <Toast
          id="venue-toast"
          title={toast.type === 'success' ? 'Success' : 'Error'}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default Venues