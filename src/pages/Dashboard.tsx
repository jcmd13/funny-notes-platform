import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStorage } from '../hooks/useStorage'
import { Card, CardHeader, CardTitle, CardContent, Button, SkeletonCard, FloatingActionButton } from '../components/ui'
import { RehearsalHistory } from '../components/rehearsal'
import { seedSampleData } from '../utils/seedData'
import type { Note } from '../core/models'

/**
 * Dashboard page - main landing page showing overview and quick actions
 */
function Dashboard() {
  const { storageService, isInitialized, error: storageError } = useStorage()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [, setRefreshing] = useState(false)
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
      setNotes([]) // Ensure we have a stable state
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
    } else {
      // Set a timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        if (!isInitialized) {
          setLoading(false)
          setError(new Error('Storage initialization timeout'))
        }
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [isInitialized, storageService, storageError])

  // Handle refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadNotes(false) // Don't seed on manual refresh
    } finally {
      setRefreshing(false)
    }
  }

  // Get recent notes for activity display
  const getRecentNotes = (): Note[] => {
    return notes.slice(0, 5)
  }

  const recentNotes = getRecentNotes()
  const hasError = error || storageError

  // Handle capture navigation
  const handleTextCapture = () => {
    navigate('/capture?mode=text')
  }

  const handleVoiceCapture = () => {
    navigate('/capture?mode=voice')
  }

  const handleImageCapture = () => {
    navigate('/capture?mode=image')
  }

  return (
    <div className="section-spacing">
      {/* Welcome section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-3">
          Welcome to the Stage! 🎤
        </h1>
        <p className="text-xl text-body max-w-2xl mx-auto">
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
          error={error}
        />
        <StatsCard
          title="Set Lists"
          value={0}
          icon="📋"
          description="Coming soon"
          loading={false}
          isPlaceholder
        />
        <StatsCard
          title="Venues"
          value={0}
          icon="🏢"
          description="Coming soon"
          loading={false}
          isPlaceholder
        />
        <StatsCard
          title="Contacts"
          value={0}
          icon="👥"
          description="Coming soon"
          loading={false}
          isPlaceholder
        />
      </div>

      {/* Error display */}
      {hasError && (
        <Card className="border-red-600 bg-red-900/20">
          <CardContent className="pt-6">
            <div className="text-red-400">
              <h3 className="font-semibold mb-2">Error Loading Dashboard</h3>
              <p className="text-sm">{hasError.message}</p>
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Rehearsal History */}
      <RehearsalHistory limit={5} className="mb-6" />

      {/* Recent Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400">Recent Notes</CardTitle>
        </CardHeader>
        <CardContent>
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
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : recentNotes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <RecentNoteItem key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No notes yet</h3>
              <p className="text-sm mb-4">Start capturing your comedy material!</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/capture"
                  className="btn-primary inline-flex items-center justify-center space-x-2"
                >
                  <span className="text-lg">+</span>
                  <span>Capture</span>
                </Link>
                <Button
                  onClick={async () => {
                    if (storageService) {
                      setIsSeeding(true)
                      await seedSampleData(storageService)
                      await loadNotes(false)
                    }
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isSeeding}
                  className="text-sm"
                >
                  {isSeeding ? 'Adding Examples...' : '🎭 Add Examples'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating capture button */}
      <FloatingActionButton
        showCaptureOptions={true}
        onTextCapture={handleTextCapture}
        onVoiceCapture={handleVoiceCapture}
        onImageCapture={handleImageCapture}
        position="bottom-right"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
      />
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
  isPlaceholder?: boolean
}

function StatsCard({ title, value, icon, description, loading, error, isPlaceholder }: StatsCardProps) {
  // Prevent flickering by maintaining the last known value during loading
  const [displayValue, setDisplayValue] = useState(value)
  
  useEffect(() => {
    if (!loading && !error) {
      setDisplayValue(value)
    }
  }, [value, loading, error])

  return (
    <Card className={`${error ? 'border-red-600 bg-red-900/20' : ''} ${isPlaceholder ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className={`text-2xl font-bold ${error ? 'text-red-400' : 'text-white'} ${loading ? 'opacity-50' : ''}`}>
              {error ? '!' : displayValue.toString()}
            </p>
            <p className="text-xs text-gray-500">
              {loading && !error ? 'Loading...' : description}
            </p>
          </div>
          <div className="text-2xl">{error ? '⚠️' : icon}</div>
        </div>
      </CardContent>
    </Card>
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

  const getCaptureLabel = (captureMethod: string) => {
    switch (captureMethod) {
      case 'text': return 'Text Note'
      case 'voice': return 'Voice Recording'
      case 'image': return 'Image Note'
      case 'mixed': return 'Mixed Content'
      default: return 'Note'
    }
  }

  const getPreview = (content: string, maxLength: number = 80) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <Link 
      to="/notes"
      className="grid grid-cols-12 gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600"
    >
      {/* Column 1: Icon and Type (2 columns) */}
      <div className="col-span-2 flex flex-col items-center justify-start space-y-1">
        <div className="text-lg">{getCaptureIcon(note.captureMethod)}</div>
        <div className="text-xs text-gray-500 text-center leading-tight">
          {getCaptureLabel(note.captureMethod)}
        </div>
      </div>
      
      {/* Column 2: Content (8 columns) */}
      <div className="col-span-8 min-w-0">
        <p className="text-sm font-medium text-gray-200 line-clamp-2 mb-1">
          {getPreview(note.content)}
        </p>
        
        {/* Duration and Tags Row */}
        <div className="flex items-center space-x-3 mt-1">
          {note.estimatedDuration && (
            <div className="text-xs text-gray-500">
              {Math.floor(note.estimatedDuration / 60)}:{(note.estimatedDuration % 60).toString().padStart(2, '0')}
            </div>
          )}
          
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{note.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Column 3: Date (2 columns) */}
      <div className="col-span-2 flex justify-end">
        <p className="text-xs text-gray-400 text-right">
          {formatDate(note.updatedAt)}
        </p>
      </div>
    </Link>
  )
}


export default Dashboard