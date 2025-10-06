import { useState, useEffect } from 'react'
import { usePerformances, useSetLists, useVenues } from '../../hooks'
import { Card, Button } from '../ui'
import type { Performance } from '../../core/models'

/**
 * Component for comparing performances to track improvement over time
 * Allows side-by-side comparison of performance metrics and feedback
 */
export function PerformanceComparison() {
  const { performances, loading } = usePerformances()
  const { setLists } = useSetLists()
  const { venues } = useVenues()
  
  const [selectedPerformances, setSelectedPerformances] = useState<Performance[]>([])
  const [comparisonMode, setComparisonMode] = useState<'venue' | 'setlist' | 'manual'>('manual')

  // Filter to only completed performances with feedback
  const completedPerformances = performances.filter(p => 
    p.status === 'completed' && p.feedback
  )

  const handlePerformanceSelect = (performance: Performance) => {
    if (selectedPerformances.find(p => p.id === performance.id)) {
      setSelectedPerformances(prev => prev.filter(p => p.id !== performance.id))
    } else if (selectedPerformances.length < 3) {
      setSelectedPerformances(prev => [...prev, performance])
    }
  }

  const clearSelection = () => {
    setSelectedPerformances([])
  }

  const getSetListName = (setListId: string) => {
    const setList = setLists.find(sl => sl.id === setListId)
    return setList?.name || 'Unknown Set List'
  }

  const getVenueName = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId)
    return venue?.name || 'Unknown Venue'
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
    return `${minutes}m`
  }

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  // Auto-select performances based on comparison mode
  useEffect(() => {
    if (comparisonMode === 'venue' && completedPerformances.length > 0) {
      // Group by venue and select latest from each venue (max 3)
      const venueGroups = completedPerformances.reduce((acc, perf) => {
        if (!acc[perf.venueId]) acc[perf.venueId] = []
        acc[perf.venueId].push(perf)
        return acc
      }, {} as Record<string, Performance[]>)

      const latestFromEachVenue = Object.values(venueGroups)
        .map(group => group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0])
        .slice(0, 3)

      setSelectedPerformances(latestFromEachVenue)
    } else if (comparisonMode === 'setlist' && completedPerformances.length > 0) {
      // Group by setlist and select latest from each setlist (max 3)
      const setlistGroups = completedPerformances.reduce((acc, perf) => {
        if (!acc[perf.setListId]) acc[perf.setListId] = []
        acc[perf.setListId].push(perf)
        return acc
      }, {} as Record<string, Performance[]>)

      const latestFromEachSetlist = Object.values(setlistGroups)
        .map(group => group.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0])
        .slice(0, 3)

      setSelectedPerformances(latestFromEachSetlist)
    }
  }, [comparisonMode, completedPerformances])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (completedPerformances.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400">
          <p className="text-lg mb-2">No completed performances to compare</p>
          <p className="text-sm">Complete some performances and add feedback to use the comparison tool.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Performance Comparison</h2>
          
          <div className="flex gap-2">
            <Button
              variant={comparisonMode === 'manual' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('manual')}
            >
              Manual
            </Button>
            <Button
              variant={comparisonMode === 'venue' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('venue')}
            >
              By Venue
            </Button>
            <Button
              variant={comparisonMode === 'setlist' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setComparisonMode('setlist')}
            >
              By Set List
            </Button>
            {selectedPerformances.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {comparisonMode === 'manual' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-200 mb-3">
              Select Performances to Compare (max 3)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {completedPerformances.map(performance => (
                <button
                  key={performance.id}
                  onClick={() => handlePerformanceSelect(performance)}
                  disabled={selectedPerformances.length >= 3 && !selectedPerformances.find(p => p.id === performance.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedPerformances.find(p => p.id === performance.id)
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="font-medium text-gray-100 text-sm">
                    {getSetListName(performance.setListId)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getVenueName(performance.venueId)} • {formatDate(performance.date)}
                  </div>
                  <div className="text-xs text-yellow-400 mt-1">
                    {getRatingStars(performance.feedback!.rating)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedPerformances.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Select performances to compare</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedPerformances.map((performance, index) => (
              <div key={performance.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-yellow-400 font-semibold text-sm">
                    Performance #{index + 1}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(performance.date)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-100 text-sm">
                      {getSetListName(performance.setListId)}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {getVenueName(performance.venueId)}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-center">
                      <div className="text-yellow-400 text-lg mb-1">
                        {getRatingStars(performance.feedback!.rating)}
                      </div>
                      <div className="text-sm text-gray-300">
                        {performance.feedback!.rating}/5 Overall
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-2 text-xs">
                    {performance.actualDuration && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-gray-200">{formatDuration(performance.actualDuration)}</span>
                      </div>
                    )}
                    
                    {performance.feedback!.audienceSize && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Audience:</span>
                        <span className="text-gray-200">{performance.feedback!.audienceSize}</span>
                      </div>
                    )}
                    
                    {performance.feedback!.audienceResponse && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Response:</span>
                        <span className="text-gray-200 capitalize">{performance.feedback!.audienceResponse}</span>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  {performance.feedback!.highlights.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-green-400 mb-1">Highlights:</div>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {performance.feedback!.highlights.slice(0, 2).map((highlight, idx) => (
                          <li key={idx} className="truncate">• {highlight}</li>
                        ))}
                        {performance.feedback!.highlights.length > 2 && (
                          <li className="text-gray-400">+{performance.feedback!.highlights.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {performance.feedback!.improvements.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-orange-400 mb-1">Improvements:</div>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {performance.feedback!.improvements.slice(0, 2).map((improvement, idx) => (
                          <li key={idx} className="truncate">• {improvement}</li>
                        ))}
                        {performance.feedback!.improvements.length > 2 && (
                          <li className="text-gray-400">+{performance.feedback!.improvements.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison Insights */}
        {selectedPerformances.length > 1 && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
            <h3 className="text-lg font-medium text-gray-100 mb-3">Comparison Insights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400 mb-1">Rating Range:</div>
                <div className="text-gray-200">
                  {Math.min(...selectedPerformances.map(p => p.feedback!.rating))} - {Math.max(...selectedPerformances.map(p => p.feedback!.rating))} stars
                </div>
              </div>
              
              <div>
                <div className="text-gray-400 mb-1">Average Rating:</div>
                <div className="text-gray-200">
                  {(selectedPerformances.reduce((sum, p) => sum + p.feedback!.rating, 0) / selectedPerformances.length).toFixed(1)} stars
                </div>
              </div>
              
              <div>
                <div className="text-gray-400 mb-1">Best Performance:</div>
                <div className="text-gray-200">
                  {(() => {
                    const best = selectedPerformances.reduce((best, current) => 
                      current.feedback!.rating > best.feedback!.rating ? current : best
                    )
                    return `${getVenueName(best.venueId)} (${best.feedback!.rating}★)`
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}