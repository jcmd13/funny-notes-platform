import { useState, useEffect } from 'react'
import { usePerformances, useSetLists, useVenues } from '../../hooks'
import { Card, Button } from '../ui'
import { PerformanceFeedback } from './PerformanceFeedback'
import type { Performance } from '../../core/models'

interface PerformanceHistoryProps {
  venueId?: string
  setListId?: string
  limit?: number
}

/**
 * Component displaying past performances with filtering options
 * Shows performance details, feedback, and allows adding feedback to completed performances
 */
export function PerformanceHistory({ venueId, setListId, limit }: PerformanceHistoryProps) {
  const { performances, loading, loadPerformances, deletePerformance } = usePerformances()
  const { setLists } = useSetLists()
  const { venues } = useVenues()
  
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'completed' | 'scheduled' | 'cancelled'>('all')

  useEffect(() => {
    loadPerformances({ venueId, setListId, limit })
  }, [loadPerformances, venueId, setListId, limit])

  const filteredPerformances = performances.filter(performance => {
    if (filter === 'all') return true
    return performance.status === filter
  })

  const getSetListName = (setListId: string) => {
    const setList = setLists.find(sl => sl.id === setListId)
    return setList?.name || 'Unknown Set List'
  }

  const getVenueName = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId)
    return venue?.name || 'Unknown Venue'
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: Performance['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'scheduled': return 'text-blue-400'
      case 'cancelled': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  const handleDeletePerformance = async (performance: Performance) => {
    if (window.confirm(`Are you sure you want to delete the performance at ${getVenueName(performance.venueId)}?`)) {
      try {
        await deletePerformance(performance.id)
      } catch (error) {
        console.error('Failed to delete performance:', error)
      }
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Performance History</h2>
          
          {/* Filter Buttons */}
          <div className="flex gap-2">
            {(['all', 'completed', 'scheduled', 'cancelled'] as const).map(status => (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {filteredPerformances.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No performances found.</p>
            {filter !== 'all' && (
              <p className="text-sm mt-2">Try changing the filter or log your first performance.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPerformances.map(performance => (
              <div
                key={performance.id}
                className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-100">
                      {getSetListName(performance.setListId)}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {getVenueName(performance.venueId)} • {formatDate(performance.date)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium capitalize ${getStatusColor(performance.status)}`}>
                      {performance.status}
                    </span>
                    
                    <div className="flex gap-1">
                      {performance.status === 'completed' && !performance.feedback && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPerformance(performance)
                            setShowFeedbackForm(true)
                          }}
                        >
                          Add Feedback
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePerformance(performance)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Performance Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {performance.actualDuration && (
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-gray-200 ml-2">{formatDuration(performance.actualDuration)}</span>
                    </div>
                  )}
                  
                  {performance.startTime && (
                    <div>
                      <span className="text-gray-400">Started:</span>
                      <span className="text-gray-200 ml-2">{formatDate(performance.startTime)}</span>
                    </div>
                  )}
                  
                  {performance.endTime && (
                    <div>
                      <span className="text-gray-400">Ended:</span>
                      <span className="text-gray-200 ml-2">{formatDate(performance.endTime)}</span>
                    </div>
                  )}
                </div>

                {/* Feedback Summary */}
                {performance.feedback && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-lg">
                          {getRatingStars(performance.feedback.rating)}
                        </span>
                        <span className="text-sm text-gray-400">
                          ({performance.feedback.rating}/5)
                        </span>
                      </div>
                      
                      {performance.feedback.audienceResponse && (
                        <span className="text-sm text-gray-400 capitalize">
                          Audience: {performance.feedback.audienceResponse}
                        </span>
                      )}
                    </div>
                    
                    {performance.feedback.notes && (
                      <p className="text-sm text-gray-300 mt-2">
                        {performance.feedback.notes}
                      </p>
                    )}
                    
                    {performance.feedback.highlights.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-green-400 font-medium">Highlights:</span>
                        <ul className="text-xs text-gray-300 mt-1">
                          {performance.feedback.highlights.map((highlight, index) => (
                            <li key={index}>• {highlight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* General Notes */}
                {performance.notes && (
                  <div className="mt-3 p-2 bg-gray-750 rounded text-sm text-gray-300">
                    <span className="text-gray-400">Notes:</span> {performance.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Feedback Form Modal */}
      {showFeedbackForm && selectedPerformance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-100">Add Performance Feedback</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowFeedbackForm(false)
                  setSelectedPerformance(null)
                }}
              >
                ×
              </Button>
            </div>
            
            <div className="p-4">
              <PerformanceFeedback
                performance={selectedPerformance}
                onFeedbackSubmitted={() => {
                  setShowFeedbackForm(false)
                  setSelectedPerformance(null)
                  loadPerformances({ venueId, setListId, limit })
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}