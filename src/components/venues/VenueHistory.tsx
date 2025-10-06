import { useState, useEffect } from 'react'
import { Modal, Card, Button } from '@components/ui'
import { useSetLists } from '@hooks/useSetLists'
import type { Venue, VenuePerformance } from '@core/models'

interface VenueHistoryProps {
  venue: Venue | null
  isOpen: boolean
  onClose: () => void
}

export function VenueHistory({ venue, isOpen, onClose }: VenueHistoryProps) {
  const { getSetList } = useSetLists()
  const [performanceDetails, setPerformanceDetails] = useState<Array<VenuePerformance & { setListName?: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (venue && isOpen) {
      loadPerformanceDetails()
    }
  }, [venue, isOpen])

  const loadPerformanceDetails = async () => {
    if (!venue) return

    setLoading(true)
    try {
      const details = await Promise.all(
        venue.performanceHistory.map(async (performance) => {
          const setList = await getSetList(performance.setListId)
          return {
            ...performance,
            setListName: setList?.name || 'Unknown Set List'
          }
        })
      )
      
      // Sort by date, most recent first
      details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setPerformanceDetails(details)
    } catch (error) {
      console.error('Failed to load performance details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getRatingStars = (rating?: number) => {
    if (!rating) return '—'
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const calculateStats = () => {
    if (performanceDetails.length === 0) return null

    const totalPerformances = performanceDetails.length
    const averageDuration = performanceDetails.reduce((sum, p) => sum + p.duration, 0) / totalPerformances
    const ratingsWithValues = performanceDetails.filter(p => p.rating)
    const averageRating = ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((sum, p) => sum + (p.rating || 0), 0) / ratingsWithValues.length
      : 0

    return {
      totalPerformances,
      averageDuration,
      averageRating: averageRating > 0 ? averageRating : null
    }
  }

  const stats = calculateStats()

  if (!venue) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Performance History - ${venue.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Venue Info */}
        <Card className="p-4 bg-gray-750">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Location:</span>
              <div className="text-white">{venue.location}</div>
            </div>
            <div>
              <span className="text-gray-400">Capacity:</span>
              <div className="text-white">{venue.characteristics.audienceSize}</div>
            </div>
            <div>
              <span className="text-gray-400">Acoustics:</span>
              <div className="text-white capitalize">{venue.characteristics.acoustics}</div>
            </div>
            <div>
              <span className="text-gray-400">Lighting:</span>
              <div className="text-white capitalize">{venue.characteristics.lighting}</div>
            </div>
          </div>
        </Card>

        {/* Performance Stats */}
        {stats && (
          <Card className="p-4 bg-gray-750">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">Performance Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Performances:</span>
                <div className="text-white text-lg font-semibold">{stats.totalPerformances}</div>
              </div>
              <div>
                <span className="text-gray-400">Average Duration:</span>
                <div className="text-white text-lg font-semibold">{formatDuration(Math.round(stats.averageDuration))}</div>
              </div>
              {stats.averageRating && (
                <div>
                  <span className="text-gray-400">Average Rating:</span>
                  <div className="text-white text-lg font-semibold">
                    {stats.averageRating.toFixed(1)} ⭐
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Performance History */}
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">Performance History</h3>
          
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </Card>
              ))}
            </div>
          ) : performanceDetails.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-4">🎭</div>
              <h4 className="text-lg font-semibold text-gray-300 mb-2">No Performances Yet</h4>
              <p className="text-gray-400">
                Performance history will appear here once you log performances at this venue.
              </p>
            </Card>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {performanceDetails.map((performance) => (
                <Card key={performance.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-white">{performance.setListName}</h4>
                      <p className="text-sm text-gray-400">{formatDate(performance.date)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Duration</div>
                      <div className="text-white">{formatDuration(performance.duration)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {performance.audienceSize && (
                      <div>
                        <span className="text-gray-400">Audience:</span>
                        <span className="text-white ml-1">{performance.audienceSize}</span>
                      </div>
                    )}
                    {performance.rating && (
                      <div>
                        <span className="text-gray-400">Rating:</span>
                        <span className="text-white ml-1">{getRatingStars(performance.rating)}</span>
                      </div>
                    )}
                  </div>

                  {performance.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-sm text-gray-400 mb-1">Notes:</div>
                      <div className="text-sm text-gray-300">{performance.notes}</div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}