import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Note, SetList } from '@core/models'
import { useNotes } from '@hooks/useNotes'
import { Button, Input } from '@components/ui'
import { formatDuration } from '@utils/dateUtils'

interface SetListBuilderProps {
  setList: SetList
  onUpdateSetList: (notes: Note[]) => Promise<void>
  onClose: () => void
}

interface SortableNoteItemProps {
  note: Note
  index: number
  onRemove: (noteId: string) => void
}

function SortableNoteItem({ note, index, onRemove }: SortableNoteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-gray-700 rounded-lg p-3 ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-yellow-400"
          >
            ⋮⋮
          </div>
          
          <div className="text-sm font-medium text-yellow-400 w-8">
            {index + 1}.
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {note.content.split('\n')[0] || 'Untitled Note'}
            </div>
            <div className="text-xs text-gray-400 flex items-center space-x-2">
              <span>{note.captureMethod}</span>
              {note.estimatedDuration && (
                <>
                  <span>•</span>
                  <span>{formatDuration(note.estimatedDuration)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onRemove(note.id)}
          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          title="Remove from set list"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface AvailableNoteItemProps {
  note: Note
  onAdd: (note: Note) => void
  isInSetList: boolean
}

function AvailableNoteItem({ note, onAdd, isInSetList }: AvailableNoteItemProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {note.content.split('\n')[0] || 'Untitled Note'}
          </div>
          <div className="text-xs text-gray-400 flex items-center space-x-2 mt-1">
            <span>{note.captureMethod}</span>
            {note.estimatedDuration && (
              <>
                <span>•</span>
                <span>{formatDuration(note.estimatedDuration)}</span>
              </>
            )}
            {note.tags.length > 0 && (
              <>
                <span>•</span>
                <span>{note.tags.slice(0, 2).join(', ')}</span>
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onAdd(note)}
          disabled={isInSetList}
          className={`ml-3 px-3 py-1 text-xs rounded transition-colors ${
            isInSetList
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
          }`}
        >
          {isInSetList ? 'Added' : 'Add'}
        </button>
      </div>
    </div>
  )
}

export function SetListBuilder({ setList, onUpdateSetList, onClose }: SetListBuilderProps) {
  const { notes: allNotes, loading: notesLoading } = useNotes()
  const [setListNotes, setSetListNotes] = useState<Note[]>(setList.notes)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Filter available notes based on search query
  const filteredNotes = allNotes.filter((note: Note) => {
    const matchesSearch = searchQuery === '' || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  // Calculate total duration
  const totalDuration = setListNotes.reduce((total, note) => {
    return total + (note.estimatedDuration || 0)
  }, 0)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSetListNotes((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }

    setActiveId(null)
  }

  const handleAddNote = (note: Note) => {
    if (!setListNotes.find(n => n.id === note.id)) {
      setSetListNotes(prev => [...prev, note])
    }
  }

  const handleRemoveNote = (noteId: string) => {
    setSetListNotes(prev => prev.filter(note => note.id !== noteId))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onUpdateSetList(setListNotes)
      onClose()
    } catch (error) {
      console.error('Failed to save set list:', error)
    } finally {
      setSaving(false)
    }
  }

  const activeNote = activeId ? setListNotes.find(note => note.id === activeId) : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">
              Build Set List: {setList.name}
            </h2>
            <div className="text-sm text-gray-400 mt-1">
              {setListNotes.length} notes • {formatDuration(totalDuration)} total
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            >
              Save Set List
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Available Notes */}
          <div className="w-1/2 p-6 border-r border-gray-700 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Available Notes
              </h3>
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {notesLoading ? (
                <div className="text-center py-8 text-gray-400">
                  Loading notes...
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  {searchQuery ? 'No notes match your search' : 'No notes available'}
                </div>
              ) : (
                filteredNotes.map((note: Note) => (
                  <AvailableNoteItem
                    key={note.id}
                    note={note}
                    onAdd={handleAddNote}
                    isInSetList={setListNotes.some(n => n.id === note.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Set List Notes */}
          <div className="w-1/2 p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">
              Set List Order
            </h3>
            
            <div className="flex-1 overflow-y-auto">
              {setListNotes.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-4">🎭</div>
                  <p>No notes in set list yet</p>
                  <p className="text-sm mt-1">Add notes from the left panel</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={setListNotes.map(note => note.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {setListNotes.map((note, index) => (
                        <SortableNoteItem
                          key={note.id}
                          note={note}
                          index={index}
                          onRemove={handleRemoveNote}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  
                  <DragOverlay>
                    {activeNote ? (
                      <div className="bg-gray-700 rounded-lg p-3 shadow-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-400">⋮⋮</div>
                          <div className="text-sm font-medium text-white">
                            {activeNote.content.split('\n')[0] || 'Untitled Note'}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}