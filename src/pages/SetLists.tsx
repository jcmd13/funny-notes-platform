import { useState } from 'react'
import { useSetLists } from '@hooks/useSetLists'
import type { SetList, CreateSetListInput } from '@core/models'
import { SetListCard, SetListEditor, SetListBuilder } from '@components/setlists'
import { Button, ConfirmDialog, LoadingSpinner } from '@components/ui'

/**
 * SetLists page - for managing performance set lists
 */
export function SetLists() {
  const { setLists, loading, createSetList, updateSetList, deleteSetList } = useSetLists()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingSetList, setEditingSetList] = useState<SetList | null>(null)
  const [builderSetList, setBuilderSetList] = useState<SetList | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<SetList | null>(null)

  const handleCreateSetList = () => {
    setEditingSetList(null)
    setIsEditorOpen(true)
  }

  const handleEditSetList = (setList: SetList) => {
    setEditingSetList(setList)
    setIsEditorOpen(true)
  }

  const handleSaveSetList = async (input: CreateSetListInput) => {
    if (editingSetList) {
      await updateSetList(editingSetList.id, input)
    } else {
      await createSetList(input)
    }
    setIsEditorOpen(false)
    setEditingSetList(null)
  }

  const handleDeleteSetList = (setList: SetList) => {
    setDeleteConfirm(setList)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteSetList(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleViewSetList = (setList: SetList) => {
    setBuilderSetList(setList)
  }

  const handleUpdateSetListNotes = async (notes: any[]) => {
    if (builderSetList) {
      // Calculate total duration
      const totalDuration = notes.reduce((total, note) => {
        return total + (note.estimatedDuration || 0)
      }, 0)

      await updateSetList(builderSetList.id, {
        notes,
        totalDuration,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">
          Set Lists 🎭
        </h1>
        <Button
          onClick={handleCreateSetList}
          className="inline-flex items-center space-x-2"
        >
          <span className="text-lg">+</span>
          <span>Create Set List</span>
        </Button>
      </div>

      {setLists.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">🎪</div>
            <h2 className="text-xl font-semibold mb-2">No Set Lists Yet</h2>
            <p>Create your first set list to organize material for performances.</p>
            <p className="text-sm mt-2">
              Drag and drop notes to build the perfect lineup.
            </p>
            <Button
              onClick={handleCreateSetList}
              className="mt-4"
            >
              Create Your First Set List
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {setLists.map((setList: SetList) => (
            <SetListCard
              key={setList.id}
              setList={setList}
              onEdit={handleEditSetList}
              onDelete={handleDeleteSetList}
              onView={handleViewSetList}
            />
          ))}
        </div>
      )}

      {/* Set List Editor Modal */}
      <SetListEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingSetList(null)
        }}
        onSave={handleSaveSetList}
        setList={editingSetList}
        title={editingSetList ? 'Edit Set List' : 'Create Set List'}
      />

      {/* Set List Builder */}
      {builderSetList && (
        <SetListBuilder
          setList={builderSetList}
          onUpdateSetList={handleUpdateSetListNotes}
          onClose={() => setBuilderSetList(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Set List"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}