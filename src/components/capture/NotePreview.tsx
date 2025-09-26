import React, { useState } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { Card, CardHeader, CardTitle, CardContent, Button, TagChip, ConfirmDialog } from '../ui';
import { TextCapture } from './TextCapture';
import type { Note } from '../../core/models';

interface NotePreviewProps {
  note: Note;
  onNoteUpdated?: (note: Note) => void;
  onNoteDeleted?: (noteId: string) => void;
}

export const NotePreview: React.FC<NotePreviewProps> = ({
  note,
  onNoteUpdated,
  onNoteDeleted
}) => {
  const { deleteNote, loading } = useNotes();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleNoteSaved = () => {
    setIsEditing(false);
    // The note will be updated through the parent component's data refresh
    onNoteUpdated?.(note);
  };

  const handleDelete = async () => {
    const success = await deleteNote(note.id);
    if (success) {
      onNoteDeleted?.(note.id);
    }
    setShowDeleteConfirm(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeIcon = (type: Note['type']) => {
    switch (type) {
      case 'text': return '📝';
      case 'voice': return '🎤';
      case 'image': return '📷';
      case 'mixed': return '📋';
      default: return '📝';
    }
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-yellow-400">Edit Note</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TextCapture
            initialContent={note.content}
            initialTags={note.tags}
            onNoteSaved={handleNoteSaved}
            autoFocus={false}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getTypeIcon(note.type)}</span>
              <CardTitle className="text-gray-200">
                {note.type.charAt(0).toUpperCase() + note.type.slice(1)} Note
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Note content */}
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                {note.content}
              </div>
            </div>

            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag, index) => (
                  <TagChip key={index} tag={tag} />
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-4">
                <span>Created: {formatDate(note.createdAt)}</span>
                {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                  <span>Updated: {formatDate(note.updatedAt)}</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {note.metadata?.duration && (
                  <span>~{note.metadata.duration}s performance</span>
                )}
                <span>{note.content.trim().split(/\s+/).length} words</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={loading}
      />
    </>
  );
};