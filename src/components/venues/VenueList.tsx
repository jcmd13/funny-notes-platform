import { useState, useMemo } from 'react'
import { VenueCard } from './VenueCard'
import { Input, Button } from '@components/ui'
import type { Venue } from '@core/models'

interface VenueListProps {
  venues: Venue[]
  loading?: boolean
  onEdit?: (venue: Venue) => void
  onDelete?: (venue: Venue) => void
  onViewHistory?: (venue: Venue) => void
  onCreateNew?: () => void
}

export function VenueList({ 
  venues, 
  loading = false, 
  onEdit, 
  onDelete, 
  onViewHistory,
  onCreateNew 
}: VenueListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAcoustics, setFilterAcoustics] = useState<string>('')
  const [filterLighting, setFilterLighting] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'location' | 'performances' | 'rating'>('name')

  // Filter and sort venues
  const filteredAndSortedVenues = useMemo(() => {
    let filtered = venues.filter(venue => {
      const matchesSearch = !searchQuery || 
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.characteristics.audienceType.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesAcoustics = !filterAcoustics || venue.characteristics.acoustics === filterAcoustics
      const matchesLighting = !filterLighting || venue.characteristics.lighting === filterLighting

      return matchesSearch && matchesAcoustics && matchesLighting
    })

    // Sort venues
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'location':
          return a.location.localeCompare(b.location)
        case 'performances':
          return b.performanceHistory.length - a.performanceHistory.length
        case 'rating':
          const aRating = a.performanceHistory.length > 0
            ? a.performanceHistory
                .filter(p => p.rating)
                .reduce((sum, p) => sum + (p.rating || 0), 0) / 
              a.performanceHistory.filter(p => p.rating).length
            : 0
          const bRating = b.performanceHistory.length > 0
            ? b.performanceHistory
                .filter(p => p.rating)
                .reduce((sum, p) => sum + (p.rating || 0), 0) / 
              b.performanceHistory.filter(p => p.rating).length
            : 0
          return bRating - aRating
        default:
          return 0
      }
    })

    return filtered
  }, [venues, searchQuery, filterAcoustics, filterLighting, sortBy])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search venues, locations, or audience types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <select
              value={filterAcoustics}
              onChange={(e) => setFilterAcoustics(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">All Acoustics</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div>
            <select
              value={filterLighting}
              onChange={(e) => setFilterLighting(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">All Lighting</option>
              <option value="professional">Professional</option>
              <option value="basic">Basic</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="name">Name</option>
              <option value="location">Location</option>
              <option value="performances">Performance Count</option>
              <option value="rating">Average Rating</option>
            </select>
          </div>

          <div className="text-sm text-gray-400">
            {filteredAndSortedVenues.length} of {venues.length} venues
          </div>
        </div>
      </div>

      {/* Venues List */}
      {filteredAndSortedVenues.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          {venues.length === 0 ? (
            <>
              <div className="text-6xl mb-4">🎪</div>
              <h2 className="text-xl font-semibold mb-2 text-gray-300">No Venues Yet</h2>
              <p className="text-gray-400 mb-4">
                Add venues where you perform to track your gig history and venue details.
              </p>
              {onCreateNew && (
                <Button onClick={onCreateNew}>
                  Create Your First Venue
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-lg font-semibold mb-2 text-gray-300">No Matching Venues</h2>
              <p className="text-gray-400">
                Try adjusting your search or filter criteria.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedVenues.map(venue => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
      )}
    </div>
  )
}