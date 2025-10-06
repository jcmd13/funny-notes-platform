import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSetLists, useRehearsalSessions } from '../../hooks'
import { RehearsalTimer } from './RehearsalTimer'
import { RehearsalControls } from './RehearsalControls'
import { LoadingSpinner, Card } from '../ui'
import type { RehearsalSession, NoteTiming } from '../../core/models'

/**
 * Full-screen rehearsal interface for practicing set lists
 */
export function RehearsalInterface() {
  const { setListId } = useParams<{ setListId: string }>()
  const navigate = useNavigate()
  const { getSetList } = useSetLists()
  const { createSession, updateSession } = useRehearsalSessions()

  // State management
  const [setList, setSetList] = useState<any>(null)
  const [currentSession, setCurrentSession] = useState<RehearsalSession | null>(null)
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [noteStartTime, setNoteStartTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load set list data
  useEffect(() => {
    const loadSetList = async () => {
      if (!setListId) {
        setError('No set list ID provided')
        setLoading(false)
        return
      }

      try {
        const loadedSetList = await getSetList(setListId)
        if (!loadedSetList) {
          setError('Set list not found')
          setLoading(false)
          return
        }

        setSetList(loadedSetList)
        setLoading(false)
      } catch (err) {
        setError('Failed to load set list')
        setLoading(false)
      }
    }

    loadSetList()
  }, [setListId, getSetList])

  // Current note
  const currentNote = useMemo(() => {
    if (!setList?.notes || currentNoteIndex >= setList.notes.length) {
      return null
    }
    return setList.notes[currentNoteIndex]
  }, [setList, currentNoteIndex])

  // Timer management
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, startTime])

  // Start rehearsal session
  const handleStart = useCallback(async () => {
    if (!setListId) return

    try {
      if (!currentSession) {
        // Create new session
        const sessionStartTime = new Date()
        const newSession = await createSession({
          setListId,
          startTime: sessionStartTime,
          totalDuration: 0,
          currentNoteIndex: 0,
          noteTimings: [],
          isCompleted: false
        })

        if (newSession) {
          setCurrentSession(newSession)
          setStartTime(sessionStartTime)
          setNoteStartTime(0)
        }
      } else {
        // Resume existing session
        if (!startTime) {
          const resumeTime = new Date()
          setStartTime(new Date(resumeTime.getTime() - (currentSession.totalDuration * 1000)))
        }
        if (noteStartTime === null) {
          setNoteStartTime(elapsedTime)
        }
      }

      setIsRunning(true)
    } catch (err) {
      console.error('Failed to start rehearsal session:', err)
    }
  }, [setListId, currentSession, createSession, startTime, noteStartTime, elapsedTime])

  // Pause rehearsal session
  const handlePause = useCallback(async () => {
    setIsRunning(false)

    if (currentSession && startTime) {
      try {
        await updateSession(currentSession.id, {
          totalDuration: elapsedTime,
          currentNoteIndex
        })
      } catch (err) {
        console.error('Failed to update rehearsal session:', err)
      }
    }
  }, [currentSession, updateSession, elapsedTime, currentNoteIndex, startTime])

  // Reset timer
  const handleReset = useCallback(async () => {
    setIsRunning(false)
    setElapsedTime(0)
    setStartTime(null)
    setNoteStartTime(null)

    if (currentSession) {
      try {
        await updateSession(currentSession.id, {
          totalDuration: 0,
          currentNoteIndex: 0,
          noteTimings: []
        })
      } catch (err) {
        console.error('Failed to reset rehearsal session:', err)
      }
    }
  }, [currentSession, updateSession])

  // Stop rehearsal session
  const handleStop = useCallback(async () => {
    setIsRunning(false)

    if (currentSession && startTime) {
      try {
        // Record final note timing if we were on a note
        let finalNoteTimings = [...(currentSession.noteTimings || [])]
        
        if (noteStartTime !== null && currentNote) {
          const noteTiming: NoteTiming = {
            noteId: currentNote.id,
            startTime: noteStartTime,
            endTime: elapsedTime,
            duration: elapsedTime - noteStartTime
          }
          
          // Update or add the timing for current note
          const existingIndex = finalNoteTimings.findIndex(t => t.noteId === currentNote.id)
          if (existingIndex >= 0) {
            finalNoteTimings[existingIndex] = noteTiming
          } else {
            finalNoteTimings.push(noteTiming)
          }
        }

        await updateSession(currentSession.id, {
          endTime: new Date(),
          totalDuration: elapsedTime,
          currentNoteIndex,
          noteTimings: finalNoteTimings,
          isCompleted: true
        })
      } catch (err) {
        console.error('Failed to complete rehearsal session:', err)
      }
    }
  }, [currentSession, updateSession, elapsedTime, currentNoteIndex, noteStartTime, currentNote, startTime])

  // Navigate to previous note
  const handlePrevious = useCallback(async () => {
    if (currentNoteIndex > 0) {
      // Record timing for current note if timer is running
      if (isRunning && noteStartTime !== null && currentNote && currentSession) {
        const noteTiming: NoteTiming = {
          noteId: currentNote.id,
          startTime: noteStartTime,
          endTime: elapsedTime,
          duration: elapsedTime - noteStartTime
        }

        const updatedTimings = [...(currentSession.noteTimings || [])]
        const existingIndex = updatedTimings.findIndex(t => t.noteId === currentNote.id)
        
        if (existingIndex >= 0) {
          updatedTimings[existingIndex] = noteTiming
        } else {
          updatedTimings.push(noteTiming)
        }

        try {
          await updateSession(currentSession.id, {
            noteTimings: updatedTimings,
            currentNoteIndex: currentNoteIndex - 1
          })
        } catch (err) {
          console.error('Failed to update session:', err)
        }
      }

      setCurrentNoteIndex(prev => prev - 1)
      setNoteStartTime(isRunning ? elapsedTime : null)
    }
  }, [currentNoteIndex, isRunning, noteStartTime, currentNote, currentSession, elapsedTime, updateSession])

  // Navigate to next note
  const handleNext = useCallback(async () => {
    if (setList && currentNoteIndex < setList.notes.length - 1) {
      // Record timing for current note if timer is running
      if (isRunning && noteStartTime !== null && currentNote && currentSession) {
        const noteTiming: NoteTiming = {
          noteId: currentNote.id,
          startTime: noteStartTime,
          endTime: elapsedTime,
          duration: elapsedTime - noteStartTime
        }

        const updatedTimings = [...(currentSession.noteTimings || [])]
        const existingIndex = updatedTimings.findIndex(t => t.noteId === currentNote.id)
        
        if (existingIndex >= 0) {
          updatedTimings[existingIndex] = noteTiming
        } else {
          updatedTimings.push(noteTiming)
        }

        try {
          await updateSession(currentSession.id, {
            noteTimings: updatedTimings,
            currentNoteIndex: currentNoteIndex + 1
          })
        } catch (err) {
          console.error('Failed to update session:', err)
        }
      }

      setCurrentNoteIndex(prev => prev + 1)
      setNoteStartTime(isRunning ? elapsedTime : null)
    }
  }, [setList, currentNoteIndex, isRunning, noteStartTime, currentNote, currentSession, elapsedTime, updateSession])

  // Exit rehearsal mode
  const handleExit = useCallback(async () => {
    if (isRunning) {
      await handleStop()
    }
    navigate('/setlists')
  }, [isRunning, handleStop, navigate])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Error state
  if (error || !setList) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || 'Set list not found'}</p>
          <button
            onClick={() => navigate('/setlists')}
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            Back to Set Lists
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header with Timer */}
      <div className="border-b border-gray-800 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-400">{setList.name}</h1>
            <p className="text-gray-400">Rehearsal Mode</p>
          </div>
          
          <RehearsalTimer
            isRunning={isRunning}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            elapsedTime={elapsedTime}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {currentNote ? (
            <Card className="p-8 bg-gray-900 border-gray-700">
              {/* Note Content */}
              <div className="text-center mb-8">
                <div className="text-lg font-medium text-amber-400 mb-4">
                  Note {currentNoteIndex + 1} of {setList.notes.length}
                </div>
                
                <div className="text-2xl leading-relaxed text-gray-100 whitespace-pre-wrap">
                  {currentNote.content}
                </div>

                {/* Note Metadata */}
                {(currentNote.tags?.length > 0 || currentNote.estimatedDuration) && (
                  <div className="mt-6 pt-6 border-t border-gray-700 flex items-center justify-center gap-6 text-sm text-gray-400">
                    {currentNote.tags?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span>Tags:</span>
                        <div className="flex gap-1">
                          {currentNote.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-gray-800 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {currentNote.estimatedDuration && (
                      <div>
                        Estimated: {Math.floor(currentNote.estimatedDuration / 60)}:
                        {(currentNote.estimatedDuration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-400">No notes in this set list</p>
            </Card>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <RehearsalControls
            currentIndex={currentNoteIndex}
            totalNotes={setList.notes?.length || 0}
            isRunning={isRunning}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onStart={handleStart}
            onPause={handlePause}
            onStop={handleStop}
            onExit={handleExit}
          />
        </div>
      </div>
    </div>
  )
}