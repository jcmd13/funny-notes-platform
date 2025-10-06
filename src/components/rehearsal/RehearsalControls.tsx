import { useEffect } from 'react'
import { Button } from '../ui'
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline'

interface RehearsalControlsProps {
  currentIndex: number
  totalNotes: number
  isRunning: boolean
  onPrevious: () => void
  onNext: () => void
  onStart: () => void
  onPause: () => void
  onStop: () => void
  onExit: () => void
  className?: string
}

/**
 * Navigation and control component for rehearsal mode
 */
export function RehearsalControls({
  currentIndex,
  totalNotes,
  isRunning,
  onPrevious,
  onNext,
  onStart,
  onPause,
  onStop,
  onExit,
  className = ''
}: RehearsalControlsProps) {
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < totalNotes - 1

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      switch (event.code) {
        case 'ArrowLeft':
          event.preventDefault()
          if (canGoPrevious) {
            onPrevious()
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (canGoNext) {
            onNext()
          }
          break
        case 'Space':
          event.preventDefault()
          if (isRunning) {
            onPause()
          } else {
            onStart()
          }
          break
        case 'Escape':
          event.preventDefault()
          onExit()
          break
        case 'KeyS':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onStop()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, totalNotes, isRunning, onPrevious, onNext, onStart, onPause, onStop, onExit, canGoPrevious, canGoNext])

  return (
    <div className={`flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Previous
        </Button>

        <div className="text-sm text-gray-400 mx-4">
          {currentIndex + 1} of {totalNotes}
        </div>

        <Button
          onClick={onNext}
          disabled={!canGoNext}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          Next
          <ChevronRightIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={isRunning ? onPause : onStart}
          variant={isRunning ? 'secondary' : 'primary'}
          size="lg"
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <PauseIcon className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <PlayIcon className="w-5 h-5" />
              Start
            </>
          )}
        </Button>

        <Button
          onClick={onStop}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <StopIcon className="w-5 h-5" />
          Stop
        </Button>
      </div>

      {/* Exit Control */}
      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-500 text-right">
          <div>← → Navigate</div>
          <div>Space: Play/Pause</div>
          <div>Esc: Exit</div>
        </div>
        
        <Button
          onClick={onExit}
          variant="outline"
          size="lg"
        >
          Exit Rehearsal
        </Button>
      </div>
    </div>
  )
}