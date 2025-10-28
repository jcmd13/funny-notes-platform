import { useState } from 'react'
import { useStorage } from '../../hooks/useStorage'
import { useToast } from '../../hooks/useToast'
import type { Venue } from '../../core/models'

interface VenueListProps {
  venues: Venue[]
  onEdit: (venue: Venue) => void
  onUpdate: () => void
}

export function VenueList({ venues, onEdit, onUpdate }: VenueListProps) {
  const { storageService } = useStorage()
  const { success, error } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (venue: Venue) => {
    if (!storageService) return
    
    if (confirm(`Are you sure you want to delete "${venue.name}"?`)) {
      try {
        setDeletingId(venue.id)
        await storageService.deleteVenue(venue.id)
        success('Venue Deleted', `${venue.name} has been removed`)
        onUpdate()
      } catch (err) {
        error('Delete Failed', 'Failed to delete venue')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="space-y-4">
      {venues.map((venue) => (
        <div key={venue.id} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{venue.name}</h3>
                <p className="text-gray-300 mb-2">📍 {venue.location}</p>
                
                {venue.characteristics && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {venue.characteristics.capacity && (
                      <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                        👥 {venue.characteristics.capacity} capacity
                      </span>
                    )}
                    {venue.characteristics.audienceType && (
                      <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded">
                        🎭 {venue.characteristics.audienceType}
                      </span>
                    )}
                    {venue.characteristics.stage && (
                      <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                        🎤 {venue.characteristics.stage}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(venue)}
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                  title="Edit venue"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(venue)}
                  disabled={deletingId === venue.id}
                  className="text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete venue"
                >
                  {deletingId === venue.id ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Performances:</span>
                <span className="text-white ml-2">{venue.performanceHistory.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Contacts:</span>
                <span className="text-white ml-2">{venue.contacts.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Added:</span>
                <span className="text-white ml-2">{formatDate(venue.createdAt)}</span>
              </div>
            </div>

            {venue.performanceHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Performances</h4>
                <div className="space-y-1">
                  {venue.performanceHistory.slice(0, 3).map((performance) => (
                    <div key={performance.id} className="flex justify-between text-xs text-gray-400">
                      <span>{formatDate(performance.date)}</span>
                      <span>{performance.duration ? `${Math.floor(performance.duration / 60)}min` : 'N/A'}</span>
                      <span>{performance.rating ? `⭐ ${performance.rating}/5` : 'No rating'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}