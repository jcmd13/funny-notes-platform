import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotes } from '../hooks/useNotes'
import { useSetLists } from '../hooks/useSetLists'
import { useVenues } from '../hooks/useVenues'
import { useContacts } from '../hooks/useContacts'
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui'
import { DashboardStats, ActivityTimeline } from '../components/dashboard'
import type { Note, SetList } from '../core/models'

/**
 * Dashboard page - main landing page showing overview and quick actions
 */
export function Dashboard() {
  const { notes, loading: notesLoading, error: notesError, refreshNotes } = useNotes()
  const { setLists, loading: setListsLoading, error: setListsError, refreshSetLists } = useSetLists()
  const { venues, loading: venuesLoading, error: venuesError, refreshVenues } = useVenues()
  const { contacts, loading: contactsLoading, error: contactsError, refreshContacts } = useContacts()
  
  const [refreshing, setRefreshing] = useState(false)

  // Load all data on component mount
  useEffect(() => {
    refreshNotes()
    refreshSetLists()
    refreshVenues()
    refreshContacts()
  }, [refreshNotes, refreshSetLists, refreshVenues, refreshContacts])

  // Handle refresh functionality
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refreshNotes(),
        refreshSetLists(),
        refreshVenues(),
        refreshContacts()
      ])
    } finally {
      setRefreshing(false)
    }
  }

  // Get recent activity (last 5 notes and setlists combined)
  const getRecentActivity = (): Array<{ type: 'note' | 'setlist', item: Note | SetList, date: Date }> => {
    const recentNotes = notes.slice(0, 3).map(note => ({
      type: 'note' as const,
      item: note,
      date: note.updatedAt
    }))
    
    const recentSetLists = setLists.slice(0, 2).map(setList => ({
      type: 'setlist' as const,
      item: setList,
      date: setList.updatedAt
    }))

    return [...recentNotes, ...recentSetLists]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
  }

  const isLoading = notesLoading || setListsLoading || venuesLoading || contactsLoading
  const hasError = notesError || setListsError || venuesError || contactsError
  const recentActivity = getRecentActivity()

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">
          Welcome to the Stage! 🎤
        </h1>
        <p className="text-lg text-gray-300">
          {notes.length > 0 
            ? "Your comedy empire is growing! Keep the laughs coming." 
            : "Ready to organize your comedy gold? Let's get your material library started."
          }
        </p>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleRefresh} 
          loading={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Dashboard'}
        </Button>
      </div>

      {/* Quick stats cards */}
      <DashboardStats
        stats={{
          notes: notes.length,
          setLists: setLists.length,
          venues: venues.length,
          contacts: contacts.length
        }}
        loading={isLoading}
        errors={{
          notes: notesError || undefined,
          setLists: setListsError || undefined,
          venues: venuesError || undefined,
          contacts: contactsError || undefined
        }}
      />

      {/* Error display */}
      {hasError && (
        <Card className="border-red-600 bg-red-900/20">
          <CardContent className="pt-6">
            <div className="text-red-400">
              <h3 className="font-semibold mb-2">Error Loading Dashboard Data</h3>
              <ul className="text-sm space-y-1">
                {notesError && <li>• Notes: {notesError.message}</li>}
                {setListsError && <li>• Set Lists: {setListsError.message}</li>}
                {venuesError && <li>• Venues: {venuesError.message}</li>}
                {contactsError && <li>• Contacts: {contactsError.message}</li>}
              </ul>
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

      {/* Recent activity */}
      <ActivityTimeline
        activities={recentActivity}
        loading={isLoading}
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

