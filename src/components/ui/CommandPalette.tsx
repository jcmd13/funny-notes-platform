import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStorage } from '../../hooks/useStorage'
import type { Note } from '../../core/models'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface Command {
  id: string
  title: string
  subtitle?: string
  icon: string
  action: () => void
  category: 'navigation' | 'actions' | 'search'
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { storageService } = useStorage()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchResults, setSearchResults] = useState<Note[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Base commands
  const baseCommands: Command[] = [
    {
      id: 'capture-text',
      title: 'Capture Text Note',
      subtitle: 'Create a new text note',
      icon: '📝',
      action: () => navigate('/capture?mode=text'),
      category: 'actions'
    },
    {
      id: 'capture-voice',
      title: 'Capture Voice Note',
      subtitle: 'Record a voice memo',
      icon: '🎤',
      action: () => navigate('/capture?mode=voice'),
      category: 'actions'
    },
    {
      id: 'capture-image',
      title: 'Capture Image',
      subtitle: 'Take a photo or upload image',
      icon: '📷',
      action: () => navigate('/capture?mode=image'),
      category: 'actions'
    },
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Go to dashboard',
      icon: '🏠',
      action: () => navigate('/'),
      category: 'navigation'
    },
    {
      id: 'nav-notes',
      title: 'Notes',
      subtitle: 'Browse all notes',
      icon: '📚',
      action: () => navigate('/notes'),
      category: 'navigation'
    },
    {
      id: 'nav-setlists',
      title: 'Set Lists',
      subtitle: 'Manage performance sets',
      icon: '🎭',
      action: () => navigate('/setlists'),
      category: 'navigation'
    },
    {
      id: 'nav-venues',
      title: 'Venues',
      subtitle: 'Manage venues',
      icon: '🏢',
      action: () => navigate('/venues'),
      category: 'navigation'
    },
    {
      id: 'nav-contacts',
      title: 'Contacts',
      subtitle: 'Manage contacts',
      icon: '👥',
      action: () => navigate('/contacts'),
      category: 'navigation'
    }
  ]

  // Search notes when query changes
  useEffect(() => {
    const searchNotes = async () => {
      if (!query.trim() || !storageService) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await storageService.searchNotes(query, { limit: 5 })
        setSearchResults(results)
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchNotes, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, storageService])

  // Filter commands based on query
  const filteredCommands = query.trim() 
    ? baseCommands.filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.subtitle?.toLowerCase().includes(query.toLowerCase())
      )
    : baseCommands

  // Create note commands from search results
  const noteCommands: Command[] = searchResults.map(note => ({
    id: `note-${note.id}`,
    title: note.content.substring(0, 60) + (note.content.length > 60 ? '...' : ''),
    subtitle: `${note.captureMethod} • ${note.tags?.join(', ') || 'No tags'}`,
    icon: note.captureMethod === 'voice' ? '🎤' : note.captureMethod === 'image' ? '📷' : '📝',
    action: () => navigate('/notes'),
    category: 'search'
  }))

  const allCommands = [...filteredCommands, ...noteCommands]

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setSearchResults([])
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, allCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (allCommands[selectedIndex]) {
            allCommands[selectedIndex].action()
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, allCommands, onClose])

  // Reset selected index when commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [allCommands.length])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command palette */}
      <div className="relative w-full max-w-2xl bg-gray-800 rounded-lg border border-gray-700 shadow-2xl">
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-700">
          <div className="text-gray-400 mr-3">🔍</div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes or type a command..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
          />
          {isSearching && (
            <div className="text-gray-400 ml-3 animate-spin">⚙️</div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {allCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              {query.trim() ? 'No results found' : 'No commands available'}
            </div>
          ) : (
            <div className="py-2">
              {/* Group by category */}
              {['actions', 'navigation', 'search'].map(category => {
                const categoryCommands = allCommands.filter(cmd => cmd.category === category)
                if (categoryCommands.length === 0) return null

                return (
                  <div key={category}>
                    {category === 'search' && categoryCommands.length > 0 && (
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Search Results
                      </div>
                    )}
                    {categoryCommands.map((command) => {
                      const globalIndex = allCommands.indexOf(command)
                      return (
                        <button
                          key={command.id}
                          onClick={() => {
                            command.action()
                            onClose()
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-700 transition-colors ${
                            globalIndex === selectedIndex ? 'bg-gray-700' : ''
                          }`}
                        >
                          <span className="text-lg">{command.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">
                              {command.title}
                            </div>
                            {command.subtitle && (
                              <div className="text-gray-400 text-sm truncate">
                                {command.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
          <span>↑↓ Navigate • ⏎ Select • ⎋ Close</span>
          <span>Ctrl+K to open</span>
        </div>
      </div>
    </div>
  )
}