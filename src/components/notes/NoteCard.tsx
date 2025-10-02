import { useState, useRef, useEffect } from 'react'
import type { Note } from '../../core/models'
import { Card, CardContent, Button, TagChip, ConfirmDialog } from '../ui'
import { formatDistanceToNow } from '../../utils/dateUtils'
import { useStorage } from '../../hooks/useStorage'

export interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
  onTagClick?: (tag: string) => void
  selected?: boolean
  onSelectionChange?: (noteId: string, selected: boolean) => void
  showSelection?: boolean
}

/**
 * Individual note card component for displaying note content and metadata
 */
export function NoteCard({ 
  note, 
  onEdit, 
  onDelete, 
  onTagClick, 
  selected = false, 
  onSelectionChange,
  showSelection = false 
}: NoteCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { storageService } = useStorage()

  const handleEdit = () => {
    onEdit(note)
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelectionChange?.(note.id, e.target.checked)
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
      case 'mixed':
        return '📋'
      default:
        return '📄'
    }
  }

  const hasAudioAttachment = () => {
    return note.attachments?.some(attachment => attachment.type === 'audio')
  }

  const hasImageAttachment = () => {
    return note.attachments?.some(attachment => attachment.type === 'image')
  }

  const getAudioAttachment = () => {
    return note.attachments?.find(attachment => attachment.type === 'audio')
  }

  const getImageAttachment = () => {
    return note.attachments?.find(attachment => attachment.type === 'image')
  }

  const handlePlayAudio = async () => {
    const audioAttachment = getAudioAttachment()
    if (!audioAttachment || !storageService) return

    try {
      if (!audioUrl) {
        // Load audio blob from storage
        const blob = await storageService.getMediaBlob(audioAttachment.url || '')
        if (blob) {
          const url = URL.createObjectURL(blob)
          setAudioUrl(url)
          
          // Play audio after setting URL
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play()
              setIsPlaying(true)
            }
          }, 100)
        }
      } else {
        // Audio already loaded, just play/pause
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
          } else {
            audioRef.current.play()
            setIsPlaying(true)
          }
        }
      }
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleAudioError = () => {
    setIsPlaying(false)
    console.error('Audio playback error')
  }

  // Load image preview
  const loadImagePreview = async () => {
    const imageAttachment = getImageAttachment()
    if (!imageAttachment || !storageService || imageUrl) return

    try {
      const blob = await storageService.getMediaBlob(imageAttachment.url || '')
      if (blob) {
        const url = URL.createObjectURL(blob)
        setImageUrl(url)
      }
    } catch (error) {
      console.error('Failed to load image:', error)
    }
  }

  // Load image on mount if it's an image note
  useEffect(() => {
    if (hasImageAttachment()) {
      loadImagePreview()
    }
  }, [])

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [audioUrl, imageUrl])

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
      <Card className={`hover:bg-gray-750 transition-colors cursor-pointer group ${
        selected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
      }`}>
        <CardContent className="p-4">
          {/* Header with type icon and actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {showSelection && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={handleSelectionChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
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
                className="text-gray-400 transition-colors hover:text-yellow-400"
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
            
            {/* Audio playback for voice notes */}
            {hasAudioAttachment() && (
              <div className="mt-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePlayAudio}
                      className="text-yellow-400 hover:text-yellow-300 p-1"
                    >
                      {isPlaying ? '⏸️' : '▶️'}
                    </Button>
                    <span className="text-sm text-gray-300">
                      {isPlaying ? 'Playing...' : 'Voice Recording'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {getEstimatedDuration() && `${getEstimatedDuration()}`}
                  </div>
                </div>
                
                {/* Hidden audio element */}
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={handleAudioEnded}
                    onError={handleAudioError}
                    className="hidden"
                  />
                )}
              </div>
            )}

            {/* Image preview for image notes */}
            {hasImageAttachment() && (
              <div className="mt-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Captured content"
                    className="w-full max-h-48 object-cover rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={handleEdit}
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Loading image...</span>
                  </div>
                )}
              </div>
            )}
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

      />
    </>
  )
}