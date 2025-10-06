import { useEffect } from 'react'
import { usePerformances } from '../../hooks'
import { Card } from '../ui'
import type { PerformanceStats } from '../../core/models'

/**
 * Component displaying performance analytics and success metrics
 * Shows trends, top material, venue performance, and monthly breakdowns
 */
export function PerformanceAnalytics() {
  const { stats, loadStats, loading } = usePerformances()

  useEffect(() => {
    loadStats()
  }, [loadStats])

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              <div className="h-8 bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-700 rounded w-5/6"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatRating = (rating: number) => {
    return rating.toFixed(1)
  }

  const getTrendIcon = (direction: PerformanceStats['recentTrend']['direction']) => {
    switch (direction) {
      case 'improving': return '📈'
      case 'declining': return '📉'
      case 'stable': return '➡️'
    }
  }

  const getTrendColor = (direction: PerformanceStats['recentTrend']['direction']) => {
    switch (direction) {
      case 'improving': return 'text-green-400'
      case 'declining': return 'text-red-400'
      case 'stable': return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-100">Performance Analytics</h2>
      
      {stats.totalPerformances === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-400">
            <p className="text-lg mb-2">No performance data yet</p>
            <p className="text-sm">Complete some performances and add feedback to see your analytics here.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {stats.totalPerformances}
                </div>
                <div className="text-sm text-gray-400">Total Performances</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {formatRating(stats.averageRating)}
                </div>
                <div className="text-sm text-gray-400">Average Rating</div>
                <div className="text-xs text-gray-500 mt-1">
                  {'★'.repeat(Math.round(stats.averageRating))}{'☆'.repeat(5 - Math.round(stats.averageRating))}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {formatDuration(stats.totalStageTime)}
                </div>
                <div className="text-sm text-gray-400">Total Stage Time</div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="text-center">
                <div className={`text-2xl mb-2 ${getTrendColor(stats.recentTrend.direction)}`}>
                  {getTrendIcon(stats.recentTrend.direction)}
                </div>
                <div className="text-sm text-gray-400">Recent Trend</div>
                <div className={`text-xs mt-1 capitalize ${getTrendColor(stats.recentTrend.direction)}`}>
                  {stats.recentTrend.direction}
                  {stats.recentTrend.ratingChange !== 0 && (
                    <span className="ml-1">
                      ({stats.recentTrend.ratingChange > 0 ? '+' : ''}{stats.recentTrend.ratingChange.toFixed(1)})
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Best Venue */}
          {stats.bestVenue && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">🏆 Best Venue</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-100">{stats.bestVenue.venueName}</h4>
                    <p className="text-sm text-gray-400">
                      {stats.bestVenue.performanceCount} performance{stats.bestVenue.performanceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-semibold">
                      {formatRating(stats.bestVenue.averageRating)}/5
                    </div>
                    <div className="text-xs text-gray-400">
                      {'★'.repeat(Math.round(stats.bestVenue.averageRating))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Top Material */}
          {stats.topMaterial.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">🎯 Top Performing Material</h3>
              <div className="space-y-3">
                {stats.topMaterial.slice(0, 5).map((material, index) => (
                  <div key={material.noteId} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-yellow-400 font-semibold">#{index + 1}</span>
                          <span className="text-xs text-gray-400">
                            {material.timesPerformed} performance{material.timesPerformed !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {material.noteContent}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-semibold">
                          {formatRating(material.averageRating)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {'★'.repeat(Math.round(material.averageRating))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Monthly Breakdown */}
          {stats.monthlyBreakdown.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">📊 Monthly Performance</h3>
              <div className="space-y-3">
                {stats.monthlyBreakdown.slice(-6).map(month => (
                  <div key={month.month} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-100">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {month.performanceCount} performance{month.performanceCount !== 1 ? 's' : ''} • {formatDuration(month.totalDuration)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-semibold">
                          {formatRating(month.averageRating)}/5
                        </div>
                        <div className="text-xs text-gray-400">
                          {'★'.repeat(Math.round(month.averageRating))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}