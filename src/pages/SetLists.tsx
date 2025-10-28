import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStorage } from '../hooks/useStorage'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SetList, Note } from '../core/models'

/**
 * SetLists page - for managing performance setlists
 */
function SetLists() {
  const { storageService, isInitialized } = useStorage()
  const [setLists, setSetLists] = useState<SetList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadSetLists = async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedSetLists = await storageService.listSetLists({
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
      setSetLists(loadedSetLists)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load set lists'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isInitialized) {
      loadSetLists()
    }
  }, [isInitialized, storageService])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Set Lists 🎭</h1>
          <button className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors">
            + New Set List
          </button>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-6">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
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
          <h1 className="text-3xl font-bold text-yellow-400">Set Lists 🎭</h1>
          <button className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors">
            + New Set List
          </button>
        </div>
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Set Lists</h3>
          <p className="text-red-300 text-sm mb-3">{error.message}</p>
          <button 
            onClick={loadSetLists}
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
        <h1 className="text-3xl font-bold text-yellow-400">Set Lists 🎭</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          + New Set List
        </button>
      </div>

      {setLists.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No set lists yet</h3>
          <p className="text-gray-400 mb-6">Create your first performance lineup!</p>
          <div className="space-y-3">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center space-x-2 bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              <span>🎭</span>
              <span>Create Set List</span>
            </button>
            <div>
              <Link
                to="/notes"
                className="text-yellow-400 hover:text-yellow-300 text-sm"
              >
                Need material first? Add some notes →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {setLists.map((setList) => (
            <SetListCard key={setList.id} setList={setList} onUpdate={loadSetLists} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSetListModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={loadSetLists}
        />
      )}
    </div>
  )
}

interface SetListCardProps {
  setList: SetList
  onUpdate: () => void
}

function SetListCard({ setList, onUpdate }: SetListCardProps) {
  const { storageService } = useStorage()
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleDelete = async () => {
    if (!storageService) return
    
    if (confirm('Are you sure you want to delete this set list?')) {
      try {
        setDeleting(true)
        await storageService.deleteSetList(setList.id)
        onUpdate()
      } catch (error) {
        console.error('Failed to delete set list:', error)
        alert('Failed to delete set list')
      } finally {
        setDeleting(false)
      }
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{setList.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{setList.notes.length} notes</span>
              <span>{formatDuration(setList.totalDuration)}</span>
              {setList.venue && <span>📍 {setList.venue}</span>}
              {setList.performanceDate && <span>📅 {formatDate(setList.performanceDate)}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? '🔼' : '🔽'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
              title="Delete set list"
            >
              {deleting ? '⏳' : '🗑️'}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Notes in this set:</h4>
            <div className="space-y-2">
              {setList.notes.map((note, index) => (
                <div key={note.id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                  <span className="text-xs text-gray-500 w-6">{index + 1}</span>
                  <span className="text-sm text-gray-200 flex-1 truncate">{note.content}</span>
                  <span className="text-xs text-gray-400">
                    {note.metadata.duration ? formatDuration(note.metadata.duration) : '--:--'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface CreateSetListModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateSetListModal({ onClose, onCreated }: CreateSetListModalProps) {
  const { storageService } = useStorage()
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [performanceDate, setPerformanceDate] = useState('')
  const [availableNotes, setAvailableNotes] = useState<Note[]>([])
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const loadNotes = async () => {
      if (!storageService) return

      try {
        const notes = await storageService.listNotes()
        setAvailableNotes(notes)
      } catch (error) {
        console.error('Failed to load notes:', error)
      } finally {
        setLoadingNotes(false)
      }
    }

    loadNotes()
  }, [storageService])

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setSelectedNotes((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const addNote = (note: Note) => {
    if (!selectedNotes.find(n => n.id === note.id)) {
      setSelectedNotes([...selectedNotes, note])
    }
  }

  const removeNote = (noteId: string) => {
    setSelectedNotes(selectedNotes.filter(n => n.id !== noteId))
  }

  const handleCreate = async () => {
    if (!name.trim() || !storageService) return

    try {
      setLoading(true)
      
      // Check if venue should be created
      let venueToUse = venue.trim()
      if (venueToUse) {
        try {
          // Check if venue already exists
          const existingVenues = await storageService.listVenues()
          const existingVenue = existingVenues.find(v => 
            v.name.toLowerCase() === venueToUse.toLowerCase()
          )
          
          if (!existingVenue) {
            // Create new venue
            const newVenue = await storageService.createVenue({
              name: venueToUse,
              location: venueToUse, // Use venue name as location for now
              characteristics: {
                audienceSize: 100, // Default values
                audienceType: 'General',
                acoustics: 'good' as const,
                lighting: 'basic' as const
              }
            })
            console.log(`Created new venue: ${newVenue.name}`)
          }
        } catch (venueError) {
          console.error('Failed to create venue:', venueError)
          // Continue with set list creation even if venue creation fails
        }
      }
      
      await storageService.createSetList({
        name: name.trim(),
        notes: selectedNotes,
        venue: venueToUse || undefined,
        performanceDate: performanceDate ? new Date(performanceDate) : undefined
      })
      onCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create set list:', error)
      alert('Failed to create set list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-gray-800 rounded-lg border border-gray-700 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Set List</h2>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Set List Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Set List Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Open Mic Night, Corporate Gig"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Venue (optional)
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g., Comedy Club, Conference Center"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Performance Date (optional)
                </label>
                <input
                  type="date"
                  value={performanceDate}
                  onChange={(e) => setPerformanceDate(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Available Notes */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Available Notes</h3>
                <div className="bg-gray-700 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {loadingNotes ? (
                    <div className="text-center py-4 text-gray-400">Loading notes...</div>
                  ) : availableNotes.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      No notes available. <Link to="/capture" className="text-yellow-400">Create some notes first</Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableNotes.map(note => (
                        <div key={note.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                          <span className="text-sm text-gray-200 truncate flex-1">
                            {note.content.substring(0, 50)}...
                          </span>
                          <button
                            onClick={() => addNote(note)}
                            disabled={selectedNotes.find(n => n.id === note.id) !== undefined}
                            className="ml-2 px-2 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Notes */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Set List ({selectedNotes.length} notes)
              </h3>
              <div className="bg-gray-700 rounded-lg p-3 min-h-64 max-h-96 overflow-y-auto">
                {selectedNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Add notes from the left to build your set list
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={selectedNotes} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {selectedNotes.map((note, index) => (
                          <SortableNoteItem
                            key={note.id}
                            note={note}
                            index={index}
                            onRemove={() => removeNote(note.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Set List'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface SortableNoteItemProps {
  note: Note
  index: number
  onRemove: () => void
}

function SortableNoteItem({ note, index, onRemove }: SortableNoteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-2 bg-gray-800 rounded cursor-move"
      {...attributes}
      {...listeners}
    >
      <span className="text-xs text-gray-500 w-6">{index + 1}</span>
      <span className="text-sm text-gray-200 flex-1 truncate">{note.content}</span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="text-gray-400 hover:text-red-400 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

export default SetLists