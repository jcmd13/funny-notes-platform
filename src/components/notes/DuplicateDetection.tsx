import { useState, useEffect } from 'react'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'
import { Modal } from '@components/ui/Modal'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import { TagChip } from '@components/ui/TagChip'
import { useContentOrganization } from '../../hooks/useContentOrganization'
import type { ContentSimilarity } from '../../core/services'

interface DuplicateDetectionProps {
  onNotesUpdated: () => void
}

export function DuplicateDetection({ onNotesUpdated }: DuplicateDetectionProps) {
  const {
    duplicates,
    detectingDuplicates,
    detectDuplicates,
    mergeDuplicates,
    error,
    clearError
  } = useContentOrganization()

  const [selectedSimilarity, setSelectedSimilarity] = useState<ContentSimilarity | null>(null)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [selectedDuplicates, setSelectedDuplicates] = useState<string[]>([])
  const [threshold, setThreshold] = useState(0.8)

  useEffect(() => {
    // Auto-detect duplicates on component mount
    detectDuplicates(threshold)
  }, [])

  const handleDetectDuplicates = () => {
    clearError()
    detectDuplicates(threshold)
  }

  const handleShowMergeModal = (similarity: ContentSimilarity) => {
    setSelectedSimilarity(similarity)
    setSelectedDuplicates(similarity.duplicates.map(d => d.note.id))
    setShowMergeModal(true)
  }

  const handleMergeDuplicates = async () => {
    if (!selectedSimilarity || selectedDuplicates.length === 0) return

    const result = await mergeDuplicates(selectedSimilarity.originalNote.id, selectedDuplicates)
    if (result) {
      onNotesUpdated()
      setShowMergeModal(false)
      setSelectedSimilarity(null)
      setSelectedDuplicates([])
    }
  }

  const formatSimilarityPercentage = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Duplicate Detection</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm">
            Similarity threshold:
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="ml-2 px-2 py-1 border rounded text-sm"
            >
              <option value={0.6}>60%</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
              <option value={0.9}>90%</option>
            </select>
          </label>
          <Button
            onClick={handleDetectDuplicates}
            disabled={detectingDuplicates}
            size="sm"
          >
            {detectingDuplicates ? <LoadingSpinner size="sm" /> : 'Scan for Duplicates'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
        </div>
      )}

      {detectingDuplicates && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-600 dark:text-gray-400">Scanning for duplicate content...</p>
          </div>
        </div>
      )}

      {!detectingDuplicates && duplicates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No duplicates found! Your content is well organized.</p>
        </div>
      )}

      {!detectingDuplicates && duplicates.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found {duplicates.length} potential duplicate groups
          </p>

          {duplicates.map((similarity: ContentSimilarity, index: number) => (
            <Card key={`${similarity.originalNote.id}-${index}`} className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Original Note
                  </h3>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
                    <p className="text-sm mb-2">{truncateContent(similarity.originalNote.content)}</p>
                    <div className="flex flex-wrap gap-1">
                      {similarity.originalNote.tags.map((tag: string) => (
                        <TagChip key={tag} tag={tag} size="sm" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {similarity.originalNote.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Similar Notes ({similarity.duplicates.length})
                  </h3>
                  <div className="space-y-2">
                    {similarity.duplicates.map((duplicate) => (
                      <div
                        key={duplicate.note.id}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm flex-1">{truncateContent(duplicate.note.content)}</p>
                          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300 ml-2">
                            {formatSimilarityPercentage(duplicate.similarity)} match
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {duplicate.note.tags.map((tag: string) => (
                            <TagChip key={tag} tag={tag} size="sm" />
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            Created: {duplicate.note.createdAt.toLocaleDateString()}
                          </p>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Reasons: {duplicate.reasons.join(', ')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleShowMergeModal(similarity)}
                  >
                    Review & Merge
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Merge Modal */}
      <Modal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        title="Merge Duplicate Notes"
        size="lg"
      >
        {selectedSimilarity && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Original Note (will be kept)</h3>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border">
                <p className="text-sm mb-2">{selectedSimilarity.originalNote.content}</p>
                <div className="flex flex-wrap gap-1">
                  {selectedSimilarity.originalNote.tags.map(tag => (
                    <TagChip key={tag} tag={tag} size="sm" />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Select duplicates to merge (will be deleted)</h3>
              <div className="space-y-2">
                {selectedSimilarity.duplicates.map((duplicate) => (
                  <label
                    key={duplicate.note.id}
                    className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDuplicates.includes(duplicate.note.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDuplicates(prev => [...prev, duplicate.note.id])
                        } else {
                          setSelectedDuplicates(prev => prev.filter(id => id !== duplicate.note.id))
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm mb-1">{truncateContent(duplicate.note.content)}</p>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {duplicate.note.tags.map(tag => (
                          <TagChip key={tag} tag={tag} size="sm" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatSimilarityPercentage(duplicate.similarity)} match - {duplicate.reasons.join(', ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Merging will combine content, tags, and attachments from selected duplicates 
                into the original note. The duplicate notes will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowMergeModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMergeDuplicates}
                disabled={selectedDuplicates.length === 0}
              >
                Merge Selected ({selectedDuplicates.length})
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}