import { useState, useEffect } from 'react'
import { useRehearsalSessions, useSetLists } from '../../hooks'
import { Card, LoadingSpinner } from '../ui'
import { formatDuration } from '@utils/dateUtils'
import type { RehearsalSession } from '@core/models'

interface RehearsalHistoryProps {
  setListId?: string
  limit?: number
  className?: string
}

/**
 * Component for displaying rehearsal history and basic analytics
 */
export function RehearsalHistory({ setListId, limit = 10, className = '' }: RehearsalHistoryProps) {
  const { sessions, loading, error } = useRehearsalSessions({
    setListId,
    limit,
    isCompleted: true,
    sortBy: 'startTime',
    sortOrder: 'desc'
  })
  const { getSetList } = useSetLists()
  const [setListNames, setSetListNames] = useState<Record<string, string>>({})

  // Load set list names for sessions
  useEffect(() => {
    const loadSetListNames = async () => {
      const uniqueSetListIds = [...new Set(sessions.map((s: RehearsalSession) => s.setListId))]
      const names: Record<string, string> = {}
      
      for (const id of uniqueSetListIds) {
        try {
          const setList = await getSetList(id)
          if (setList) {
            names[id] = setList.name
          }
        } catch (err) {
          console.error('Failed to load set list name:', err)
        }
      }
      
      setSetListNames(names)
    }

    if (sessions.length > 0) {
      loadSetListNames()
    }
  }, [sessions, getSetList])

  // Calculate analytics
  const analytics = {
    totalSessions: sessions.length,
    totalTime: sessions.reduce((sum: number, session: RehearsalSession) => sum + session.totalDuration, 0),
    averageTime: sessions.length > 0 ? sessions.reduce((sum: number, session: RehearsalSession) => sum + session.totalDuration, 0) / sessions.length : 0,
    completedSessions: sessions.filter((s: RehearsalSession) => s.isCompleted).length
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-400">Failed to load rehearsal history</p>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Analytics Summary */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{analytics.totalSessions}</div>
            <div className="text-sm text-gray-400">Total Sessions</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{formatDuration(analytics.totalTime)}</div>
            <div className="text-sm text-gray-400">Total Time</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{formatDuration(Math.round(analytics.averageTime))}</div>
            <div className="text-sm text-gray-400">Average Time</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{analytics.completedSessions}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </Card>
        </div>
      )}

      {/* Session History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-amber-400 mb-4">
          Recent Rehearsal Sessions
        </h3>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-4">🎭</div>
            <p>No rehearsal sessions yet</p>
            <p className="text-sm mt-2">Start rehearsing a set list to see your practice history here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session: RehearsalSession) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-amber-400 font-medium">
                      {setListNames[session.setListId] || 'Unknown Set List'}
                    </div>
                    
                    {session.isCompleted && (
                      <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-400 mt-1">
                    {formatDate(session.startTime)}
                    {session.endTime && ` - ${formatDate(session.endTime)}`}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-200">
                    {formatDuration(session.totalDuration)}
                  </div>
                  
                  {session.noteTimings && session.noteTimings.length > 0 && (
                    <div className="text-sm text-gray-400">
                      {session.noteTimings.length} notes practiced
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}