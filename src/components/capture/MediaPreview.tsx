import React, { useState, useRef } from 'react';
import { Button, Modal, Textarea } from '../ui';

interface MediaPreviewProps {
  type: 'image' | 'audio';
  src: string;
  filename: string;
  size: number;
  duration?: number;
  ocrText?: string;
  onEdit?: (editedData: { filename?: string; notes?: string }) => void;
  onDelete?: () => void;
  className?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  type,
  src,
  filename,
  size,
  duration,
  ocrText,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedFilename, setEditedFilename] = useState(filename);
  const [editedNotes, setEditedNotes] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveEdit = () => {
    onEdit?.({
      filename: editedFilename !== filename ? editedFilename : undefined,
      notes: editedNotes.trim() || undefined
    });
    setShowEditModal(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={`bg-gray-800 rounded-lg border border-gray-600 overflow-hidden ${className}`}>
        {/* Media Display */}
        <div className="relative">
          {type === 'image' ? (
            <div className="relative group">
              <img
                src={src}
                alt={filename}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => setIsFullscreen(true)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/80 text-white"
                  onClick={() => setIsFullscreen(true)}
                >
                  🔍 View Full Size
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🎵</div>
              <audio
                ref={audioRef}
                controls
                src={src}
                className="w-full"
                preload="metadata"
              />
            </div>
          )}
        </div>

        {/* Media Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-200 truncate">
              {filename}
            </h4>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="text-xs"
              >
                ✏️ Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-xs"
              >
                💾 Save
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  🗑️ Delete
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{formatFileSize(size)}</span>
            {duration && <span>{formatDuration(duration)}</span>}
          </div>

          {/* OCR Text Preview */}
          {ocrText && (
            <div className="mt-3 p-2 bg-gray-700/50 rounded text-xs">
              <div className="text-gray-300 font-medium mb-1">Extracted Text:</div>
              <div className="text-gray-400 line-clamp-3">
                {ocrText}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Media"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Filename
            </label>
            <input
              type="text"
              value={editedFilename}
              onChange={(e) => setEditedFilename(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Additional Notes
            </label>
            <Textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Add any additional notes or context about this media..."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Fullscreen Image Modal */}
      {type === 'image' && (
        <Modal
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          size="xl"
        >
          <div className="text-center">
            <img
              src={src}
              alt={filename}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            <div className="mt-4 text-sm text-gray-400">
              {filename} • {formatFileSize(size)}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};