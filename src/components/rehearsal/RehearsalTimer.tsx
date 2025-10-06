import { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui'

interface RehearsalTimerProps {
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  elapsedTime: number
  className?: string
}

/**
 * Timer component for rehearsal sessions with start/pause/reset functionality
 */
export function RehearsalTimer({
  isRunning,
  onStart,
  onPause,
  onReset,
  elapsedTime,
  className = ''
}: RehearsalTimerProps) {
  const [displayTime, setDisplayTime] = useState(elapsedTime)

  // Update display time when elapsed time changes
  useEffect(() => {
    setDisplayTime(elapsedTime)
  }, [elapsedTime])

  // Update display time every second when running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setDisplayTime(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning])

  // Format time as MM:SS or HH:MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (isRunning) {
            onPause()
          } else {
            onStart()
          }
          break
        case 'KeyR':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onReset()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isRunning, onStart, onPause, onReset])

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Timer Display */}
      <div className="text-4xl font-mono font-bold text-amber-400 bg-gray-900 px-6 py-3 rounded-lg border border-amber-400/20">
        {formatTime(displayTime)}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={isRunning ? onPause : onStart}
          variant={isRunning ? 'secondary' : 'primary'}
          size="lg"
          className="min-w-[100px]"
        >
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          disabled={displayTime === 0}
        >
          Reset
        </Button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-sm text-gray-400 ml-4">
        <div>Space: Start/Pause</div>
        <div>Ctrl+R: Reset</div>
      </div>
    </div>
  )
}