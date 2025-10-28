import { useEffect, useState } from 'react'
import { useStorage } from '../../hooks/useStorage'
import type { RehearsalSession } from '../../core/models'

interface RehearsalHistoryProps {
  limit?: number
  className?: string
}

export function RehearsalHistory({ limit = 10, className }: RehearsalHistoryProps) {
  const { storageService, isInitialized } = useStorage()
  const [sessions, setSessions] = useState<RehearsalSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSessions = async () => {
      if (!storageService || !isInitialized) return

      try {
        setLoading(true)
        const loadedSessions = await storageService.listRehearsalSessions({
          limit,
          sortBy: 'startTime',
          sortOrder: 'desc'
        })
        setSessions(loadedSessions)
      } catch (error) {
        console.error('Failed to load rehearsal sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [storageService, isInitialized, limit])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Rehearsal History</h3>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className={className}>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">Rehearsal History</h3>
          <div className="text-center py-6 text-gray-400">
            <div className="text-3xl mb-2">🎭</div>
            <p className="text-sm">No rehearsal sessions yet</p>
            <p className="text-xs text-gray-500 mt-1">Start practicing with your set lists!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Rehearsal History</h3>
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    Set List Practice
                  </span>
                  {session.isCompleted ? (
                    <span className="text-xs bg-green-900/30 text-green-300 px-2 py-0.5 rounded">
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-900/30 text-yellow-300 px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span>📅 {formatDate(session.startTime)}</span>
                  <span>⏱️ {formatDuration(session.totalDuration)}</span>
                  <span>📝 {session.noteTimings.length} notes</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-yellow-400">
                  {formatDuration(session.totalDuration)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}