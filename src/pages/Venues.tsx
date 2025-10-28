import { useEffect, useState } from 'react'
import { useStorage } from '../hooks/useStorage'
import { VenueList } from '../components/venues/VenueList'
import { VenueEditor } from '../components/venues/VenueEditor'
import type { Venue } from '../core/models'

/**
 * Venues page - for managing performance venues
 */
function Venues() {
  const { storageService, isInitialized } = useStorage()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)

  const loadVenues = async () => {
    if (!storageService || !isInitialized) return

    try {
      setLoading(true)
      setError(null)
      const loadedVenues = await storageService.listVenues({
        sortBy: 'name',
        sortOrder: 'asc'
      })
      setVenues(loadedVenues)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load venues'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isInitialized) {
      loadVenues()
    }
  }, [isInitialized, storageService])

  const handleCreateVenue = () => {
    setEditingVenue(null)
    setShowEditor(true)
  }

  const handleEditVenue = (venue: Venue) => {
    setEditingVenue(venue)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setEditingVenue(null)
  }

  const handleVenueUpdated = () => {
    loadVenues()
    handleCloseEditor()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Venues 🏢</h1>
          <button className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors">
            + Add Venue
          </button>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-6">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Venues 🏢</h1>
          <button onClick={handleCreateVenue} className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors">
            + Add Venue
          </button>
        </div>
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Venues</h3>
          <p className="text-red-300 text-sm mb-3">{error.message}</p>
          <button 
            onClick={loadVenues}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">Venues 🏢</h1>
        <button 
          onClick={handleCreateVenue}
          className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          + Add Venue
        </button>
      </div>

      {venues.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No venues yet</h3>
          <p className="text-gray-400 mb-6">Keep track of where you perform!</p>
          <button 
            onClick={handleCreateVenue}
            className="inline-flex items-center justify-center space-x-2 bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            <span>🏢</span>
            <span>Add Your First Venue</span>
          </button>
        </div>
      ) : (
        <VenueList 
          venues={venues} 
          onEdit={handleEditVenue}
          onUpdate={loadVenues}
        />
      )}

      {showEditor && (
        <VenueEditor
          venue={editingVenue}
          onClose={handleCloseEditor}
          onSaved={handleVenueUpdated}
        />
      )}
    </div>
  )
}

export default Venues