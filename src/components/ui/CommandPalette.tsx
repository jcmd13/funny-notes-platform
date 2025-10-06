import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'
// import { useSearch } from '../../hooks/useSearch' // TODO: Implement search functionality
import { useNotes } from '../../hooks/useNotes'
import { useSetLists } from '../../hooks/useSetLists'
import { useVenues } from '../../hooks/useVenues'
import { useContacts } from '../../hooks/useContacts'

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
  category: 'navigation' | 'notes' | 'setlists' | 'venues' | 'contacts' | 'actions'
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  
  // const { searchNotes } = useSearch() // TODO: Implement search functionality
  const { notes } = useNotes()
  const { setLists } = useSetLists()
  const { venues } = useVenues()
  const { contacts } = useContacts()

  // Navigation commands
  const navigationCommands: Command[] = [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'View your overview',
      icon: '🏠',
      action: () => navigate('/'),
      category: 'navigation'
    },
    {
      id: 'nav-capture',
      title: 'Capture',
      subtitle: 'Add new content',
      icon: '✏️',
      action: () => navigate('/capture'),
      category: 'navigation'
    },
    {
      id: 'nav-notes',
      title: 'Notes',
      subtitle: 'Browse all notes',
      icon: '📝',
      action: () => navigate('/notes'),
      category: 'navigation'
    },
    {
      id: 'nav-setlists',
      title: 'Set Lists',
      subtitle: 'Manage your sets',
      icon: '🎭',
      action: () => navigate('/setlists'),
      category: 'navigation'
    },
    {
      id: 'nav-venues',
      title: 'Venues',
      subtitle: 'Manage venues',
      icon: '🏛️',
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
    },
    {
      id: 'nav-performance',
      title: 'Performance',
      subtitle: 'Track performances',
      icon: '🎪',
      action: () => navigate('/performance'),
      category: 'navigation'
    }
  ]

  // Dynamic content commands based on search
  const contentCommands = useMemo(() => {
    const commands: Command[] = []

    if (query.length >= 2) {
      // Search notes
      const matchingNotes = notes
        .filter(note => 
          note.content.toLowerCase().includes(query.toLowerCase()) ||
          note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 5)

      matchingNotes.forEach(note => {
        commands.push({
          id: `note-${note.id}`,
          title: note.content.slice(0, 50) + (note.content.length > 50 ? '...' : ''),
          subtitle: `Note • ${note.tags.join(', ')}`,
          icon: note.captureMethod === 'voice' ? '🎤' : note.captureMethod === 'image' ? '📷' : '📝',
          action: () => navigate('/notes', { state: { highlightNote: note.id } }),
          category: 'notes'
        })
      })

      // Search set lists
      const matchingSetLists = setLists
        .filter(setList => 
          setList.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 3)

      matchingSetLists.forEach(setList => {
        commands.push({
          id: `setlist-${setList.id}`,
          title: setList.name,
          subtitle: `Set List • ${setList.notes.length} notes`,
          icon: '🎭',
          action: () => navigate('/setlists', { state: { highlightSetList: setList.id } }),
          category: 'setlists'
        })
      })

      // Search venues
      const matchingVenues = venues
        .filter(venue => 
          venue.name.toLowerCase().includes(query.toLowerCase()) ||
          venue.location.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 3)

      matchingVenues.forEach(venue => {
        commands.push({
          id: `venue-${venue.id}`,
          title: venue.name,
          subtitle: `Venue • ${venue.location}`,
          icon: '🏛️',
          action: () => navigate('/venues', { state: { highlightVenue: venue.id } }),
          category: 'venues'
        })
      })

      // Search contacts
      const matchingContacts = contacts
        .filter(contact => 
          contact.name.toLowerCase().includes(query.toLowerCase()) ||
          contact.role.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 3)

      matchingContacts.forEach(contact => {
        commands.push({
          id: `contact-${contact.id}`,
          title: contact.name,
          subtitle: `Contact • ${contact.role}`,
          icon: '👤',
          action: () => navigate('/contacts', { state: { highlightContact: contact.id } }),
          category: 'contacts'
        })
      })
    }

    return commands
  }, [query, notes, setLists, venues, contacts, navigate])

  // All available commands
  const allCommands = useMemo(() => {
    const commands = [...navigationCommands]
    
    if (query.length >= 2) {
      commands.push(...contentCommands)
    }

    return commands.filter(command =>
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.subtitle?.toLowerCase().includes(query.toLowerCase())
    )
  }, [navigationCommands, contentCommands, query])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    
    allCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })

    return groups
  }, [allCommands])

  // Reset selection when commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [allCommands])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, allCommands.length - 1))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          event.preventDefault()
          if (allCommands[selectedIndex]) {
            allCommands[selectedIndex].action()
            onClose()
          }
          break
        case 'Escape':
          event.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, allCommands, onClose])

  if (!isOpen) return null

  const categoryLabels = {
    navigation: 'Navigation',
    notes: 'Notes',
    setlists: 'Set Lists',
    venues: 'Venues',
    contacts: 'Contacts',
    actions: 'Actions'
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-gray-800 border border-gray-600 rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-600">
          <div className="text-gray-400 mr-3">
            🔍
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes, navigate, or run commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-400 outline-none"
            aria-label="Command palette search"
          />
          <div className="text-xs text-gray-400 ml-3">
            ↑↓ navigate • ↵ select • esc close
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {allCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              {query.length === 0 ? (
                <>
                  <div className="text-2xl mb-2">🎭</div>
                  <div>Type to search notes, navigate, or run commands</div>
                  <div className="text-sm mt-2">Try "capture", "notes", or search for content</div>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-2">🔍</div>
                  <div>No results found for "{query}"</div>
                  <div className="text-sm mt-2">Try a different search term</div>
                </>
              )}
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category}>
                  {commands.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </div>
                      {commands.map((command) => {
                        const globalIndex = allCommands.indexOf(command)
                        const isSelected = globalIndex === selectedIndex
                        
                        return (
                          <button
                            key={command.id}
                            onClick={() => {
                              command.action()
                              onClose()
                            }}
                            className={cn(
                              'w-full flex items-center px-4 py-3 text-left hover:bg-gray-700 transition-colors',
                              isSelected && 'bg-gray-700'
                            )}
                          >
                            <div className="text-lg mr-3">
                              {command.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-100 font-medium truncate">
                                {command.title}
                              </div>
                              {command.subtitle && (
                                <div className="text-sm text-gray-400 truncate">
                                  {command.subtitle}
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}