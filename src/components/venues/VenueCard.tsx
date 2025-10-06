
import { Card } from '@components/ui'
import type { Venue } from '@core/models'

interface VenueCardProps {
  venue: Venue
  onEdit?: (venue: Venue) => void
  onDelete?: (venue: Venue) => void
  onViewHistory?: (venue: Venue) => void
  className?: string
}

export function VenueCard({ 
  venue, 
  onEdit, 
  onDelete, 
  onViewHistory,
  className = '' 
}: VenueCardProps) {
  const performanceCount = venue.performanceHistory.length
  const averageRating = venue.performanceHistory.length > 0
    ? venue.performanceHistory
        .filter(p => p.rating)
        .reduce((sum, p) => sum + (p.rating || 0), 0) / 
      venue.performanceHistory.filter(p => p.rating).length
    : 0

  const getAcousticsColor = (acoustics: string) => {
    switch (acoustics) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getLightingColor = (lighting: string) => {
    switch (lighting) {
      case 'professional': return 'text-green-400'
      case 'basic': return 'text-yellow-400'
      case 'minimal': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <Card className={`p-4 hover:bg-gray-750 transition-colors ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-1">
            {venue.name}
          </h3>
          <p className="text-gray-300 text-sm">
            📍 {venue.location}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {onViewHistory && performanceCount > 0 && (
            <button
              onClick={() => onViewHistory(venue)}
              className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded transition-colors"
              title="View performance history"
            >
              📊 {performanceCount}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(venue)}
              className="text-gray-400 hover:text-yellow-400 text-sm px-2 py-1 rounded transition-colors"
              title="Edit venue"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(venue)}
              className="text-gray-400 hover:text-red-400 text-sm px-2 py-1 rounded transition-colors"
              title="Delete venue"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-sm">
          <span className="text-gray-400">Capacity:</span>
          <span className="text-white ml-1">{venue.characteristics.audienceSize}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Type:</span>
          <span className="text-white ml-1">{venue.characteristics.audienceType}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Acoustics:</span>
          <span className={`ml-1 capitalize ${getAcousticsColor(venue.characteristics.acoustics)}`}>
            {venue.characteristics.acoustics}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Lighting:</span>
          <span className={`ml-1 capitalize ${getLightingColor(venue.characteristics.lighting)}`}>
            {venue.characteristics.lighting}
          </span>
        </div>
      </div>

      {performanceCount > 0 && (
        <div className="flex justify-between items-center pt-3 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {performanceCount} performance{performanceCount !== 1 ? 's' : ''}
          </div>
          {averageRating > 0 && (
            <div className="text-sm text-yellow-400">
              ⭐ {averageRating.toFixed(1)}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}