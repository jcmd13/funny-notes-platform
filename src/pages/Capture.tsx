import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStorage } from '../hooks/useStorage'
import { useToast } from '../hooks/useToast'
import { VoiceCapture, ImageCapture } from '../components/capture'
import type { CaptureMethod } from '../core/models'

/**
 * Capture page - unified interface for capturing notes via text, voice, or image
 */
function Capture() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { storageService } = useStorage()
  const { success, error: showError } = useToast()
  
  // Get initial mode from URL params or default to text
  const initialMode = (searchParams.get('mode') as CaptureMethod) || 'text'
  const [activeMode, setActiveMode] = useState<CaptureMethod>(initialMode)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])


  // Handle voice capture
  const handleVoiceCapture = (blob: Blob, transcript?: string) => {
    setAudioBlob(blob)
    if (transcript) {
      setContent(transcript)
    }
  }

  // Handle image capture
  const handleImageCapture = (data: { image: Blob; extractedText?: string }) => {
    setImageBlob(data.image)
    if (data.extractedText) {
      setContent(data.extractedText)
    }
  }

  // Load existing tags for suggestions
  useEffect(() => {
    const loadTags = async () => {
      if (!storageService) return
      
      try {
        const notes = await storageService.listNotes()
        const tags = new Set<string>()
        notes.forEach(note => {
          note.tags?.forEach(tag => tags.add(tag))
        })
        setAvailableTags(Array.from(tags).sort())
      } catch (error) {
        console.error('Failed to load tags:', error)
      }
    }
    
    loadTags()
  }, [storageService])

  // Generate tag suggestions based on content
  useEffect(() => {
    if (!content.trim() || availableTags.length === 0) {
      setTagSuggestions([])
      return
    }

    const contentLower = content.toLowerCase()
    const suggestions = availableTags.filter(tag => {
      // Suggest tags that aren't already added
      const currentTags = tags.split(',').map(t => t.trim().toLowerCase())
      if (currentTags.includes(tag.toLowerCase())) return false
      
      // Simple keyword matching for suggestions
      return contentLower.includes(tag.toLowerCase()) ||
             tag.toLowerCase().includes(contentLower.split(' ')[0]) ||
             (contentLower.includes('work') && tag.toLowerCase().includes('work')) ||
             (contentLower.includes('relationship') && tag.toLowerCase().includes('relationship')) ||
             (contentLower.includes('family') && tag.toLowerCase().includes('family'))
    }).slice(0, 5) // Limit to 5 suggestions

    setTagSuggestions(suggestions)
  }, [content, availableTags, tags])

  const handleTagSuggestionClick = (suggestedTag: string) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    if (!currentTags.includes(suggestedTag)) {
      const newTags = [...currentTags, suggestedTag].join(', ')
      setTags(newTags)
    }
  }

  // Handle save action
  const handleSave = async () => {
    const hasContent = content.trim() || audioBlob || imageBlob
    
    if (!hasContent) {
      showError('No Content', 'Please capture some content before saving')
      return
    }

    // Prevent saving very short or incomplete content
    const trimmedContent = content.trim()
    if (trimmedContent && trimmedContent.length < 3) {
      const confirmed = window.confirm(
        `The content "${trimmedContent}" seems very short. Are you sure you want to save this note?`
      )
      if (!confirmed) {
        return
      }
    }

    if (!storageService) {
      showError('Storage Error', 'Storage not available. Please try again.')
      return
    }

    try {
      setSaving(true)
      
      // Parse tags from comma-separated string
      const parsedTags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // Prepare attachments
      const attachments = []
      
      if (audioBlob) {
        const audioUrl = await storageService.storeAudioBlob(audioBlob)
        attachments.push({
          id: `audio-${Date.now()}`,
          type: 'audio' as const,
          filename: `audio-${Date.now()}.webm`,
          size: audioBlob.size,
          mimeType: audioBlob.type || 'audio/webm',
          url: audioUrl
        })
      }
      
      if (imageBlob) {
        const imageUrl = await storageService.storeImageBlob(imageBlob)
        attachments.push({
          id: `image-${Date.now()}`,
          type: 'image' as const,
          filename: `image-${Date.now()}.jpg`,
          size: imageBlob.size,
          mimeType: imageBlob.type || 'image/jpeg',
          url: imageUrl
        })
      }

      await storageService.createNote({
        content: content.trim() || `${activeMode} capture`,
        captureMethod: activeMode,
        tags: parsedTags.length > 0 ? parsedTags : [],
        attachments: attachments.length > 0 ? attachments : [],
        metadata: {}
      })

      success('Note Saved!', 'Your comedy material has been captured successfully.')
      navigate('/notes')
    } catch (error) {
      console.error('Failed to save note:', error)
      showError('Save Failed', 'Failed to save note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel action
  const handleCancel = () => {
    navigate(-1) // Go back to previous page
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">
          Capture Your Comedy Gold ✨
        </h1>
        <p className="text-gray-300">
          Choose your preferred method to capture that brilliant idea
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-800 rounded-lg">
        <ModeButton
          mode="text"
          activeMode={activeMode}
          onClick={() => setActiveMode('text')}
          icon="📝"
          label="Text"
        />
        <ModeButton
          mode="voice"
          activeMode={activeMode}
          onClick={() => setActiveMode('voice')}
          icon="🎤"
          label="Voice"
        />
        <ModeButton
          mode="image"
          activeMode={activeMode}
          onClick={() => setActiveMode('image')}
          icon="📷"
          label="Image"
        />
      </div>

      {/* Capture Interface */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        {activeMode === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Comedy Material
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your joke, observation, or comedy idea here..."
                className="w-full h-40 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={saving}
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}

                placeholder="observational, relationship, work (comma-separated)"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                disabled={saving}
              />
              
              {/* Tag Suggestions */}
              {tagSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {tagSuggestions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagSuggestionClick(tag)}
                        className="text-xs bg-gray-600 hover:bg-yellow-500 hover:text-gray-900 text-gray-300 px-2 py-1 rounded transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Popular Tags */}
              {availableTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-2">Popular tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 8).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagSuggestionClick(tag)}
                        className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200 px-2 py-1 rounded transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Add tags to help organize and find your material later
              </p>
            </div>
          </div>
        )}
        
        {activeMode === 'voice' && (
          <VoiceCapture
            onCapture={handleVoiceCapture}
            disabled={saving}
          />
        )}
        
        {activeMode === 'image' && (
          <ImageCapture
            onCapture={handleImageCapture}
            disabled={saving}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleCancel}
          className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={() => setContent('')}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-sm font-semibold text-yellow-400 mb-2">💡 Pro Tips</h3>
        <div className="text-sm text-gray-300 space-y-1">
          {activeMode === 'text' && (
            <>
              <p>• Write down the core idea first, then expand</p>
              <p>• Note the context or situation that inspired it</p>
              <p>• Consider the timing and delivery style</p>
            </>
          )}
          {activeMode === 'voice' && (
            <>
              <p>• Speak clearly and at a normal pace</p>
              <p>• Record in a quiet environment for best results</p>
              <p>• You can pause and resume recording as needed</p>
            </>
          )}
          {activeMode === 'image' && (
            <>
              <p>• Ensure good lighting for text recognition</p>
              <p>• Hold the camera steady for clear images</p>
              <p>• Text will be automatically extracted from images</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface ModeButtonProps {
  mode: CaptureMethod
  activeMode: CaptureMethod
  onClick: () => void
  icon: string
  label: string
}

function ModeButton({ mode, activeMode, onClick, icon, label }: ModeButtonProps) {
  const isActive = mode === activeMode
  
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-0 px-4 py-3 rounded-md font-medium transition-colors ${
        isActive
          ? 'bg-yellow-500 text-gray-900'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <div className="flex items-center justify-center space-x-2">
        <span className="text-lg">{icon}</span>
        <span className="hidden sm:inline">{label}</span>
      </div>
    </button>
  )
}

export default Capture