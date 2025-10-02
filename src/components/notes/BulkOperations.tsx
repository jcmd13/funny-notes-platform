import { useState } from 'react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Modal } from '@components/ui/Modal'
import { ConfirmDialog } from '@components/ui/ConfirmDialog'
import { TagChip } from '@components/ui/TagChip'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import { useContentOrganization } from '../../hooks/useContentOrganization'
import type { Note } from '@core/models'

interface BulkOperationsProps {
  selectedNotes: Note[]
  onSelectionChange: (noteIds: string[]) => void
  onOperationComplete: () => void
}

export function BulkOperations({ selectedNotes, onSelectionChange, onOperationComplete }: BulkOperationsProps) {
  const {
    bulkOperationInProgress,
    bulkDeleteNotes,
    bulkAddTags,
    bulkRemoveTags,
    exportToJSON,
    exportToCSV,
    downloadFile,
    exportInProgress,
    error
  } = useContentOrganization()

  const [showTagModal, setShowTagModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tagOperation, setTagOperation] = useState<'add' | 'remove'>('add')
  const [tagInput, setTagInput] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)

  const selectedIds = selectedNotes.map(note => note.id)
  const hasSelection = selectedIds.length > 0

  const handleBulkDelete = async () => {
    if (!hasSelection) return

    const result = await bulkDeleteNotes(selectedIds)
    if (result.success) {
      onSelectionChange([])
      onOperationComplete()
    }
    setShowDeleteConfirm(false)
  }

  const handleBulkTag = async () => {
    if (!hasSelection || !tagInput.trim()) return

    const tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
    
    const result = tagOperation === 'add' 
      ? await bulkAddTags(selectedIds, tags)
      : await bulkRemoveTags(selectedIds, tags)

    if (result.success) {
      onOperationComplete()
      setTagInput('')
      setShowTagModal(false)
    }
  }

  const handleExportSelected = async (format: 'json' | 'csv') => {
    if (!hasSelection) return

    try {
      if (format === 'json') {
        // Export only selected notes in JSON format
        const exportData = {
          notes: selectedNotes,
          setlists: [],
          venues: [],
          contacts: [],
          exportedAt: new Date().toISOString(),
          version: '1.0.0'
        }
        const content = JSON.stringify(exportData, null, 2)
        downloadFile(content, `selected-notes-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
      } else {
        // Export selected notes as CSV
        const headers = ['ID', 'Content', 'Capture Method', 'Tags', 'Venue', 'Audience', 'Estimated Duration', 'Created At']
        const rows = selectedNotes.map(note => [
          note.id,
          `"${note.content.replace(/"/g, '""')}"`,
          note.captureMethod,
          `"${note.tags.join(', ')}"`,
          note.venue || '',
          note.audience || '',
          note.estimatedDuration?.toString() || '',
          note.createdAt.toISOString()
        ])
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
        downloadFile(csvContent, `selected-notes-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      }
      setShowExportModal(false)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleExportAll = async (format: 'json' | 'csv') => {
    try {
      if (format === 'json') {
        const data = await exportToJSON()
        const content = JSON.stringify(data, null, 2)
        downloadFile(content, `funny-notes-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
      } else {
        const csvContent = await exportToCSV('notes')
        downloadFile(csvContent, `all-notes-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      }
      setShowExportModal(false)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  // Get unique tags from selected notes for tag suggestions
  const existingTags = Array.from(new Set(selectedNotes.flatMap(note => note.tags)))

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-gray-800 border-b">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>{selectedIds.length} selected</span>
        {selectedIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasSelection || bulkOperationInProgress}
          onClick={() => {
            setTagOperation('add')
            setShowTagModal(true)
          }}
        >
          Add Tags
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasSelection || bulkOperationInProgress}
          onClick={() => {
            setTagOperation('remove')
            setShowTagModal(true)
          }}
        >
          Remove Tags
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasSelection || exportInProgress}
          onClick={() => setShowExportModal(true)}
        >
          Export
        </Button>

        <Button
          variant="destructive"
          size="sm"
          disabled={!hasSelection || bulkOperationInProgress}
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete
        </Button>
      </div>

      {bulkOperationInProgress && (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Processing...</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          Error: {error.message}
        </div>
      )}

      {/* Tag Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title={tagOperation === 'add' ? 'Add Tags' : 'Remove Tags'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {tagOperation === 'add' ? 'Tags to add' : 'Tags to remove'} (comma-separated)
            </label>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="comedy, standup, new-material"
              className="w-full"
            />
          </div>

          {tagOperation === 'remove' && existingTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Existing tags (click to add to removal list)
              </label>
              <div className="flex flex-wrap gap-1">
                {existingTags.map(tag => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    onClick={() => {
                      const currentTags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
                      if (!currentTags.includes(tag)) {
                        setTagInput(prev => prev ? `${prev}, ${tag}` : tag)
                      }
                    }}
                    className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowTagModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkTag}
              disabled={!tagInput.trim() || bulkOperationInProgress}
            >
              {tagOperation === 'add' ? 'Add Tags' : 'Remove Tags'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Notes"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Export Selected Notes ({selectedIds.length})</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportSelected('json')}
                disabled={exportInProgress}
              >
                Export as JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportSelected('csv')}
                disabled={exportInProgress}
              >
                Export as CSV
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Export All Data</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportAll('json')}
                disabled={exportInProgress}
              >
                All Data (JSON)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportAll('csv')}
                disabled={exportInProgress}
              >
                All Notes (CSV)
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Notes"
        message={`Are you sure you want to delete ${selectedIds.length} selected notes? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}