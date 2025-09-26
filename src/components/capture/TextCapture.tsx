import React, { useState, useCallback } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { Textarea, TagInput, Button, LoadingSpinner } from '../ui';
import { debounce } from '../../utils/debounce';
import type { CreateNoteInput } from '../../core/models';

interface TextCaptureProps {
  onNoteSaved?: (noteId: string) => void;
  initialContent?: string;
  initialTags?: string[];
  autoFocus?: boolean;
}

export const TextCapture: React.FC<TextCaptureProps> = ({
  onNoteSaved,
  initialContent = '',
  initialTags = [],
  autoFocus = true
}) => {
  const { createNote, updateNote, loading, error } = useNotes();
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Common comedy tags for suggestions
  const tagSuggestions = [
    'observational',
    'storytelling',
    'crowd-work',
    'callback',
    'one-liner',
    'prop-comedy',
    'impressions',
    'self-deprecating',
    'relationship',
    'family',
    'work',
    'travel',
    'food',
    'technology',
    'politics',
    'social-media',
    'dating',
    'marriage',
    'parenting',
    'aging'
  ];

  // Auto-save function with debouncing
  const autoSave = useCallback(
    debounce(async (noteContent: string, noteTags: string[]) => {
      if (!noteContent.trim()) return;

      setIsSaving(true);
      try {
        const noteData: CreateNoteInput = {
          content: noteContent.trim(),
          type: 'text',
          tags: noteTags,
          metadata: {
            duration: estimatePerformanceDuration(noteContent)
          },
          attachments: []
        };

        if (currentNoteId) {
          // Update existing note
          await updateNote(currentNoteId, noteData);
        } else {
          // Create new note
          const newNote = await createNote(noteData);
          if (newNote) {
            setCurrentNoteId(newNote.id);
            onNoteSaved?.(newNote.id);
          }
        }

        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [currentNoteId, createNote, updateNote, onNoteSaved]
  );

  // Handle content changes
  const handleContentChange = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
    autoSave(value, tags);
  };

  // Handle tag changes
  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
    setHasUnsavedChanges(true);
    if (content.trim()) {
      autoSave(content, newTags);
    }
  };

  // Manual save function
  const handleManualSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      const noteData: CreateNoteInput = {
        content: content.trim(),
        type: 'text',
        tags,
        metadata: {
          duration: estimatePerformanceDuration(content)
        },
        attachments: []
      };

      if (currentNoteId) {
        await updateNote(currentNoteId, noteData);
      } else {
        const newNote = await createNote(noteData);
        if (newNote) {
          setCurrentNoteId(newNote.id);
          onNoteSaved?.(newNote.id);
        }
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Manual save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear the form
  const handleClear = () => {
    setContent('');
    setTags([]);
    setCurrentNoteId(null);
    setLastSaved(null);
    setHasUnsavedChanges(false);
  };

  // Estimate performance duration (rough calculation)
  const estimatePerformanceDuration = (text: string): number => {
    // Rough estimate: 150 words per minute speaking pace
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(wordCount / 150 * 60)); // Duration in seconds
  };

  // Format last saved time
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Saved just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return `Saved at ${date.toLocaleTimeString()}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Content input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-200">
            Your Comedy Material
          </label>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            {isSaving && (
              <>
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </>
            )}
            {lastSaved && !isSaving && (
              <span>{formatLastSaved(lastSaved)}</span>
            )}
            {hasUnsavedChanges && !isSaving && (
              <span className="text-yellow-400">Unsaved changes</span>
            )}
          </div>
        </div>
        
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start typing your comedy material here... 

Examples:
• A funny observation about everyday life
• A story that happened to you
• A clever one-liner
• An idea for crowd work

The app will auto-save as you type!"
          rows={8}
          className="resize-none"
          autoFocus={autoFocus}
        />
        
        {content.trim() && (
          <div className="text-xs text-gray-400">
            Estimated performance time: ~{estimatePerformanceDuration(content)} seconds
          </div>
        )}
      </div>

      {/* Tags input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Tags (optional)
        </label>
        <TagInput
          tags={tags}
          onTagsChange={handleTagsChange}
          suggestions={tagSuggestions}
          placeholder="Add tags like 'observational', 'storytelling'..."
        />
        <p className="text-xs text-gray-400">
          Tags help you organize and find your material later
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <Button
            onClick={handleManualSave}
            loading={isSaving}
            disabled={!content.trim() || loading}
          >
            {currentNoteId ? 'Update Note' : 'Save Note'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isSaving || loading}
          >
            Clear
          </Button>
        </div>

        {content.trim() && (
          <div className="text-xs text-gray-400">
            {content.trim().split(/\s+/).length} words
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-600 rounded-md">
          <p className="text-sm text-red-400">
            Error saving note: {error.message}
          </p>
        </div>
      )}
    </div>
  );
};