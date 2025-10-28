import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStorage } from '../hooks/useStorage'
import { useToast } from '../hooks/useToast'
import { seedSampleData } from '../utils/seedData'
import type { Note } from '../core/models'

/**
 * Dashboard page - main landing page showing overview and quick actions
 */
function Dashboard() {
  const { storageService, isInitialized, error: storageError } = useStorage()
  const { success } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  // Load notes data directly from storage service
  const loadNotes = async (shouldSeed = false) => {
    if (!storageService || !isInitialized) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      let loadedNotes = await storageService.listNotes({
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      // If no notes exist and we should seed, add sample data
      if (loadedNotes.length === 0 && shouldSeed) {
        setIsSeeding(true)
        const seeded = await seedSampleData(storageService)
        if (seeded) {
          success('Sample Data Added', 'Added some comedy material to get you started!')
          // Reload notes after seeding
          loadedNotes = await storageService.listNotes({
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          })
        }
        setIsSeeding(false)
      }

      setNotes(loadedNotes)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load notes'))
      setNotes([])
    } finally {
      setLoading(false)
      setIsSeeding(false)
    }
  }

  // Load notes when storage is ready
  useEffect(() => {
    if (isInitialized && storageService) {
      loadNotes(true) // Enable seeding on first load
    } else if (storageError) {
      setLoading(false)
      setError(storageError)
    }
  }, [isInitialized, storageService, storageError])

  const recentNotes = notes.slice(0, 5)
  const hasError = error || storageError

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-3">
          Welcome to the Stage! 🎤
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {notes.length > 0 
            ? "Your comedy empire is growing! Keep the laughs coming." 
            : "Ready to organize your comedy gold? Let's get your material library started."
          }
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Notes"
          value={notes.length}
          icon="📝"
          description="Ideas captured"
          loading={loading}
          error={hasError}
        />
        <StatsCard
          title="Set Lists"
          value={0}
          icon="📋"
          description="Coming soon"
        />
        <StatsCard
          title="Venues"
          value={0}
          icon="🏢"
          description="Coming soon"
        />
        <StatsCard
          title="Contacts"
          value={0}
          icon="👥"
          description="Coming soon"
        />
      </div>

      {/* Error display */}
      {hasError && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="text-red-400">
            <h3 className="font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-sm">{hasError.message}</p>
            <button 
              onClick={() => loadNotes(false)}
              className="mt-3 px-4 py-2 border border-red-600 text-red-400 rounded hover:bg-red-900/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="Capture New Idea"
            description="Got a funny thought? Capture it instantly"
            icon="💡"
            to="/capture"
            primary
          />
          <QuickActionCard
            title="Browse Notes"
            description="Review and organize your material"
            icon="📚"
            to="/notes"
          />
          <QuickActionCard
            title="Create Set List"
            description="Build your next performance lineup"
            icon="🎭"
            to="/setlists"
          />
        </div>
      </div>

      {/* Recent Notes */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">Recent Notes</h2>
        {loading || isSeeding ? (
          <div className="space-y-3">
            {isSeeding && (
              <div className="text-center py-4">
                <p className="text-yellow-400 text-sm mb-2">
                  🎭 Setting up your comedy workspace with sample material...
                </p>
              </div>
            )}
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse bg-gray-700 rounded p-4">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <RecentNoteItem key={note.id} note={note} />
            ))}
            <div className="pt-4 border-t border-gray-700">
              <Link
                to="/notes"
                className="text-yellow-400 hover:text-yellow-300 text-sm"
              >
                View all notes →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No notes yet</h3>
            <p className="text-sm mb-4">Start capturing your comedy material!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/capture"
                className="inline-flex items-center justify-center space-x-2 bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
              >
                <span className="text-lg">+</span>
                <span>Capture Your First Note</span>
              </Link>
              <button
                onClick={async () => {
                  if (storageService) {
                    setIsSeeding(true)
                    await seedSampleData(storageService)
                    await loadNotes(false)
                  }
                }}
                disabled={isSeeding}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {isSeeding ? 'Adding Examples...' : '🎭 Add Examples'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  icon: string
  to: string
  primary?: boolean
}

function QuickActionCard({ title, description, icon, to, primary }: QuickActionCardProps) {
  return (
    <Link
      to={to}
      className={`block p-4 rounded-lg border transition-colors ${
        primary
          ? 'bg-yellow-500 border-yellow-400 text-gray-900 hover:bg-yellow-400'
          : 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className={`text-sm ${primary ? 'text-gray-700' : 'text-gray-300'}`}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}

interface StatsCardProps {
  title: string
  value: number
  icon: string
  description: string
  loading?: boolean
  error?: Error | null
}

function StatsCard({ title, value, icon, description, loading, error }: StatsCardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 border ${error ? 'border-red-600' : 'border-gray-700'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${error ? 'text-red-400' : 'text-white'} ${loading ? 'opacity-50' : ''}`}>
            {error ? '!' : loading ? '...' : value}
          </p>
          <p className="text-xs text-gray-500">
            {loading ? 'Loading...' : description}
          </p>
        </div>
        <div className="text-2xl">{error ? '⚠️' : icon}</div>
      </div>
    </div>
  )
}

interface RecentNoteItemProps {
  note: Note
}

function RecentNoteItem({ note }: RecentNoteItemProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getCaptureIcon = (captureMethod: string) => {
    switch (captureMethod) {
      case 'text': return '📝'
      case 'voice': return '🎤'
      case 'image': return '📷'
      case 'mixed': return '📋'
      default: return '📄'
    }
  }

  const getPreview = (content: string, maxLength: number = 80) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <Link 
      to="/notes"
      className="block p-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600"
    >
      <div className="flex items-start space-x-3">
        <div className="text-lg">{getCaptureIcon(note.captureMethod)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 mb-1">
            {getPreview(note.content)}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{note.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {formatDate(note.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default Dashboard