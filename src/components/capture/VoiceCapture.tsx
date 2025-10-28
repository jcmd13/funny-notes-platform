import { useState, useRef, useEffect } from 'react'
import { useStorage } from '../../hooks/useStorage'

interface VoiceCaptureProps {
  onCapture: (audioBlob: Blob, transcript?: string) => void
  disabled?: boolean
}

export function VoiceCapture({ onCapture, disabled }: VoiceCaptureProps) {
  const { storageService } = useStorage()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showTranscribeOption, setShowTranscribeOption] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Initialize speech recognition for post-processing
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        setTranscript(finalTranscript.trim())
        setIsTranscribing(false)
      }
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsTranscribing(false)
      }

      recognition.onend = () => {
        setIsTranscribing(false)
      }
      
      recognitionRef.current = recognition
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms for better quality
      
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)
      setTranscript('') // Clear any previous transcript
      setShowTranscribeOption(false)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      setShowTranscribeOption(true)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleSave = async () => {
    if (audioBlob) {
      try {
        setIsTranscribing(true)
        
        // Store audio blob if storage service is available
        // Store audio blob if storage service is available
        if (storageService) {
          await storageService.storeAudioBlob(audioBlob, { duration })
        }
        
        // Clean up transcript by removing interim markers and extra spaces
        const cleanTranscript = transcript
          .replace(/\[.*?\]/g, '') // Remove interim text in brackets
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim()
        
        onCapture(audioBlob, cleanTranscript || undefined)
      } catch (error) {
        console.error('Error saving audio:', error)
        alert('Failed to save audio recording')
      } finally {
        setIsTranscribing(false)
      }
    }
  }

  const handleDiscard = () => {
    setAudioBlob(null)
    setTranscript('')
    setDuration(0)
  }

  const handleClearTranscript = () => {
    setTranscript('')
  }

  const handleTranscribe = async () => {
    if (!audioBlob || !recognitionRef.current) return
    
    setIsTranscribing(true)
    setTranscript('')
    
    try {
      // Create a temporary audio element to play the recorded audio
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      // Start speech recognition and play the audio
      recognitionRef.current.start()
      await audio.play()
      
      // Clean up
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
      }
      
    } catch (error) {
      console.error('Transcription failed:', error)
      setIsTranscribing(false)
      setTranscript('Transcription failed. You can still save the audio recording.')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (audioBlob) {
    return (
      <div className="text-center space-y-6">
        <div className="text-4xl mb-4">🎤</div>
        <h3 className="text-lg font-semibold text-gray-300">Recording Complete</h3>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <span className="text-sm text-gray-400">Duration:</span>
            <span className="text-lg font-mono text-yellow-400">{formatTime(duration)}</span>
          </div>
          
          <audio 
            controls 
            src={URL.createObjectURL(audioBlob)}
            className="w-full"
          />
        </div>
        
        {/* Transcription Section */}
        {showTranscribeOption && !transcript && !isTranscribing && (
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Convert to Text</h4>
            <p className="text-gray-400 text-sm mb-3">
              Would you like to transcribe this recording to text?
            </p>
            <button
              onClick={handleTranscribe}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
            >
              🎯 Transcribe Audio
            </button>
          </div>
        )}

        {isTranscribing && (
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Transcribing...</h4>
            <div className="animate-pulse text-blue-400">
              🎯 Converting speech to text...
            </div>
          </div>
        )}

        {transcript && (
          <div className="bg-gray-700 rounded-lg p-4 text-left">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Transcript:</h4>
            <p className="text-gray-200 text-sm">{transcript}</p>
            <button
              onClick={handleClearTranscript}
              className="mt-2 text-xs text-gray-400 hover:text-gray-200 underline"
            >
              Clear transcript
            </button>
          </div>
        )}
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleDiscard}
            disabled={isTranscribing}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={isTranscribing}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {isTranscribing ? 'Processing...' : 'Save Recording'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      <div className="text-4xl mb-4">🎤</div>
      
      {!isRecording ? (
        <>
          <h3 className="text-lg font-semibold text-gray-300">Voice Recording</h3>
          <p className="text-gray-400 mb-6">
            Record your comedy ideas with voice notes. Speech-to-text will automatically transcribe your recording.
          </p>
          <button
            onClick={startRecording}
            disabled={disabled}
            className="bg-red-500 hover:bg-red-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔴 Start Recording
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-300">
            {isPaused ? 'Recording Paused' : 'Recording...'}
          </h3>
          
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className={`w-4 h-4 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-2xl font-mono text-yellow-400">{formatTime(duration)}</span>
            </div>
            

          </div>
          
          <div className="flex justify-center space-x-4">
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                ▶️ Resume
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                ⏸️ Pause
              </button>
            )}
            
            <button
              onClick={stopRecording}
              className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ⏹️ Stop
            </button>
          </div>
        </>
      )}
      
      {!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
        <p className="text-xs text-gray-500">
          Speech-to-text not available in this browser. Audio will still be recorded.
        </p>
      )}
    </div>
  )
}