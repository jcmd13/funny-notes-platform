import { useState, useEffect } from 'react'
import type { Note } from '../../core/models'
import { Modal, Button, Textarea, TagInput, Input } from '../ui'
import { useNotes } from '../../hooks'

export interface NoteEditorProps {
  note: Note | null
  isOpen: boolean
  onClose: () => void
  onSave: (note: Note) => void
}

/**
 * Modal editor for editing note content and metadata
 */
export function NoteEditor({ note, isOpen, onClose, onSave }: NoteEditorProps) {
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [venue, setVenue] = useState('')
  const [audience, setAudience] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  const { updateNote } = useNotes()

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      setContent(note.content)
      setTags(note.tags || [])
      setVenue(note.venue || '')
      setAudience(note.audience || '')
      setEstimatedDuration(note.estimatedDuration)
    } else {
      // Reset form
      setContent('')
      setTags([])
      setVenue('')
      setAudience('')
      setEstimatedDuration(undefined)
    }
  }, [note])

  const handleSave = async () => {
    if (!note) return

    setIsSaving(true)
    try {
      const updates: Partial<Note> = {
        content: content.trim(),
        tags: tags,
        venue: venue.trim() || undefined,
        audience: audience.trim() || undefined,
        estimatedDuration: estimatedDuration || undefined,
        updatedAt: new Date()
      }

      const updatedNote = await updateNote(note.id, updates)
      if (!updatedNote) {
        throw new Error('Failed to update note')
      }
      onSave(updatedNote)
      onClose()
    } catch (error) {
      console.error('Failed to save note:', error)
      // TODO: Show error toast
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  const handleDurationChange = (value: string) => {
    const parsed = parseInt(value)
    setEstimatedDuration(isNaN(parsed) || parsed <= 0 ? undefined : parsed)
  }

  const formatDurationDisplay = (seconds?: number) => {
    if (!seconds) return ''
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
  }

  const getCaptureTypeIcon = () => {
    if (!note) return '📄'
    switch (note.captureMethod) {
      case 'text':
        return '📝'
      case 'voice':
        return '🎤'
      case 'image':
        return '📷'
      default:
        return '📄'
    }
  }

  if (!note) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getCaptureTypeIcon()}</span>
            <div>
              <h2 className="text-xl font-semibold text-yellow-400">
                Edit Note
              </h2>
              <p className="text-sm text-gray-400">
                Created {note.createdAt.toLocaleDateString()}
                {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                  <span> • Updated {note.updatedAt.toLocaleDateString()}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Content editor */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your comedy material..."
              rows={8}
              className="w-full"
            />
          </div>

          {/* Audio Playback for Voice Notes */}
          {note.captureMethod === 'voice' && note.attachments?.some(a => a.type === 'audio') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Audio Recording
              </label>
              <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎤</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      Voice recording ({formatDurationDisplay(estimatedDuration)})
                    </p>
                    <p className="text-xs text-gray-400">
                      Audio playback available in note card view
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Preview for Image Notes */}
          {note.captureMethod === 'image' && note.attachments?.some(a => a.type === 'image') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Captured Image
              </label>
              <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📷</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      Image with {note.metadata?.confidence ? `${Math.round(note.metadata.confidence * 100)}% OCR confidence` : 'extracted text'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Image preview available in note card view
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              placeholder="Add tags to organize your material..."
            />
          </div>

          {/* Metadata row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Venue
              </label>
              <Input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Comedy club, open mic..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Audience
              </label>
              <Input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="College crowd, corporate..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (seconds)
              </label>
              <Input
                type="number"
                value={estimatedDuration || ''}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder="30"
                min="1"
              />
              {estimatedDuration && (
                <p className="text-xs text-gray-400 mt-1">
                  ≈ {formatDurationDisplay(estimatedDuration)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={!content.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}