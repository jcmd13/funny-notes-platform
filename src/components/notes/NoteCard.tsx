import { useState } from 'react'
import { Note } from '../../core/models'
import { Card, CardContent, Button, TagChip, ConfirmDialog } from '../ui'
import { formatDistanceToNow } from '../../utils/dateUtils'

export interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  onTagClick?: (tag: string) => void
}

/**
 * Individual note card component for displaying note content and metadata
 */
export function NoteCard({ note, onEdit, onDelete, onTagClick }: NoteCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleEdit = () => {
    onEdit(note)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    onDelete(note.id)
    setShowDeleteConfirm(false)
  }

  const getContentPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const getCaptureTypeIcon = () => {
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

  const getEstimatedDuration = () => {
    if (note.estimatedDuration) {
      const minutes = Math.floor(note.estimatedDuration / 60)
      const seconds = note.estimatedDuration % 60
      return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
    }
    return null
  }

  return (
    <>
      <Card className="hover:bg-gray-750 transition-colors cursor-pointer group">
        <CardContent className="p-4">
          {/* Header with type icon and actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getCaptureTypeIcon()}</span>
              <div className="text-sm text-gray-400">
                {formatDistanceToNow(note.createdAt)} ago
              </div>
              {getEstimatedDuration() && (
                <div className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                  ⏱️ {getEstimatedDuration()}
                </div>
              )}
            </div>
            
            {/* Action buttons - show on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="text-gray-400 hover:text-yellow-400"
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-400"
              >
                🗑️
              </Button>
            </div>
          </div>

          {/* Content preview */}
          <div 
            className="mb-3 cursor-pointer"
            onClick={handleEdit}
          >
            <p className="text-gray-200 leading-relaxed">
              {getContentPreview(note.content)}
            </p>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {note.tags.map((tag) => (
                <TagChip
                  key={tag}
                  tag={tag}
                  onClick={() => onTagClick?.(tag)}
                  size="sm"
                />
              ))}
            </div>
          )}

          {/* Metadata footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {note.venue && (
                <span className="flex items-center space-x-1">
                  <span>🏢</span>
                  <span>{note.venue}</span>
                </span>
              )}
              {note.audience && (
                <span className="flex items-center space-x-1">
                  <span>👥</span>
                  <span>{note.audience}</span>
                </span>
              )}
            </div>
            
            {note.updatedAt.getTime() !== note.createdAt.getTime() && (
              <span className="text-gray-500">
                Updated {formatDistanceToNow(note.updatedAt)} ago
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </>
  )
}