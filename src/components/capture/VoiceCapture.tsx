import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { useStorage } from '../../hooks/useStorage';
import { Button, TagInput, LoadingSpinner } from '../ui';
import type { CreateNoteInput } from '../../core/models';

interface CaptureProgress {
  mode: 'text' | 'voice' | 'image';
  stage: 'idle' | 'capturing' | 'processing' | 'saving' | 'complete' | 'error';
  message: string;
  progress?: number;
}

interface VoiceCaptureProps {
  onNoteSaved?: (noteId: string) => void;
  onProgressUpdate?: (progress: Partial<CaptureProgress>) => void;
  onUnsavedWork?: (hasWork: boolean) => void;
  initialTags?: string[];
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export const VoiceCapture: React.FC<VoiceCaptureProps> = ({
  onNoteSaved,
  onProgressUpdate,
  onUnsavedWork,
  initialTags = []
}) => {
  const { createNote, loading, error } = useNotes();
  const { storageService } = useStorage();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Common comedy tags for suggestions
  const tagSuggestions = [
    'observational',
    'storytelling',
    'crowd-work',
    'callback',
    'one-liner',
    'prop-comedy',
    'impressions',
    'self-deprecating',
    'relationship',
    'family',
    'work',
    'travel',
    'food',
    'technology',
    'politics',
    'social-media',
    'dating',
    'marriage',
    'parenting',
    'aging'
  ];

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Clean up any blob URLs
      if (recordingState.audioUrl) {
        URL.revokeObjectURL(recordingState.audioUrl);
      }
    };
  }, []); // Empty dependency array to run only on unmount

  // Start recording
  const startRecording = async () => {
    try {
      onProgressUpdate?.({
        mode: 'voice',
        stage: 'capturing',
        message: 'Accessing microphone...'
      });

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl
        }));

        onUnsavedWork?.(true);
        onProgressUpdate?.({
          mode: 'voice',
          stage: 'idle',
          message: 'Recording complete'
        });
      };

      mediaRecorder.start(1000); // Collect data every second
      
      startTimeRef.current = Date.now();
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0
      }));

      onProgressUpdate?.({
        mode: 'voice',
        stage: 'capturing',
        message: 'Recording in progress...'
      });

      // Start timer - use a more stable approach
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingState(prev => ({
          ...prev,
          duration: elapsed
        }));
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      onProgressUpdate?.({
        mode: 'voice',
        stage: 'error',
        message: 'Could not access microphone'
      });
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        // Resume timer with correct start time
        startTimeRef.current = Date.now() - (recordingState.duration * 1000);
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingState(prev => ({
            ...prev,
            duration: elapsed
          }));
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: !prev.isPaused
      }));
    }
  };

  // Clear recording and start over
  const clearRecording = () => {
    cleanup();
    
    // Clean up the current audio URL
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }
    
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null
    });
    setTranscription('');
    startTimeRef.current = 0;
    onUnsavedWork?.(false);
    onProgressUpdate?.({
      mode: 'voice',
      stage: 'idle',
      message: ''
    });
  };

  // Enhanced transcription with progress tracking
  const transcribeAudio = async () => {
    if (!recordingState.audioBlob) return;

    setIsTranscribing(true);
    onProgressUpdate?.({
      mode: 'voice',
      stage: 'processing',
      message: 'Transcribing audio...',
      progress: 0
    });

    try {
      // Simulate progress updates during transcription
      const progressSteps = [20, 40, 60, 80, 100];
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        onProgressUpdate?.({
          mode: 'voice',
          stage: 'processing',
          message: 'Transcribing audio...',
          progress: progressSteps[i]
        });
      }

      // Placeholder for actual transcription service
      // In a real implementation, you would send the audio to a service like:
      // - Web Speech API (limited browser support)
      // - OpenAI Whisper API
      // - Google Speech-to-Text
      // - Azure Speech Services
      
      setTranscription('[Transcription would appear here - integrate with speech-to-text service]');
      
      onProgressUpdate?.({
        mode: 'voice',
        stage: 'idle',
        message: 'Transcription complete'
      });
    } catch (err) {
      console.error('Transcription failed:', err);
      setTranscription('[Transcription failed - please add manual notes]');
      onProgressUpdate?.({
        mode: 'voice',
        stage: 'error',
        message: 'Transcription failed'
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Save the voice note with enhanced progress tracking
  const saveVoiceNote = async () => {
    if (!recordingState.audioBlob || !storageService) return;

    setIsSaving(true);
    onProgressUpdate?.({
      mode: 'voice',
      stage: 'saving',
      message: 'Saving voice note...',
      progress: 0
    });

    try {
      // Simulate progress during save
      onProgressUpdate?.({
        mode: 'voice',
        stage: 'saving',
        message: 'Compressing audio...',
        progress: 25
      });

      // Store the audio blob and get a storage key
      const audioKey = await storageService.storeAudioBlob(
        recordingState.audioBlob,
        { duration: recordingState.duration }
      );

      onProgressUpdate?.({
        mode: 'voice',
        stage: 'saving',
        message: 'Creating note...',
        progress: 75
      });

      // Create attachment for the audio
      const audioAttachment = {
        id: crypto.randomUUID(),
        type: 'audio' as const,
        filename: `voice-note-${Date.now()}.webm`,
        size: recordingState.audioBlob.size,
        mimeType: recordingState.audioBlob.type,
        url: audioKey // Store the storage key instead of blob URL
      };

      const noteData: CreateNoteInput = {
        content: transcription || '[Voice recording - no transcription available]',
        captureMethod: 'voice',
        tags,
        estimatedDuration: recordingState.duration,
        metadata: {
          duration: recordingState.duration,
          confidence: transcription ? 0.8 : 0.0 // Placeholder confidence score
        },
        attachments: [audioAttachment]
      };

      const newNote = await createNote(noteData);
      if (newNote) {
        onProgressUpdate?.({
          mode: 'voice',
          stage: 'complete',
          message: 'Voice note saved successfully!',
          progress: 100
        });

        onNoteSaved?.(newNote.id);
        // Clear the form after successful save
        clearRecording();
        setTags([]);
        setTranscription('');
        onUnsavedWork?.(false);
      }
    } catch (err) {
      console.error('Failed to save voice note:', err);
      onProgressUpdate?.({
        mode: 'voice',
        stage: 'error',
        message: 'Failed to save voice note'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">
          {recordingState.isRecording ? (recordingState.isPaused ? '⏸️' : '🎤') : '🎙️'}
        </div>
        
        {recordingState.isRecording && (
          <div className="text-2xl font-mono text-yellow-400">
            {formatDuration(recordingState.duration)}
          </div>
        )}

        <div className="flex justify-center space-x-3">
          {!recordingState.isRecording && !recordingState.audioBlob && (
            <Button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
              disabled={loading}
            >
              🎤 Start Recording
            </Button>
          )}

          {recordingState.isRecording && (
            <>
              <Button
                onClick={togglePause}
                variant="outline"
                className="px-4 py-2"
              >
                {recordingState.isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </Button>
              <Button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                ⏹️ Stop
              </Button>
            </>
          )}

          {recordingState.audioBlob && (
            <Button
              onClick={clearRecording}
              variant="outline"
              className="px-4 py-2"
            >
              🗑️ Clear
            </Button>
          )}
        </div>
      </div>

      {/* Audio Playback */}
      {recordingState.audioUrl && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Recording Complete ({formatDuration(recordingState.duration)})
            </h3>
            <audio 
              controls 
              src={recordingState.audioUrl}
              className="mx-auto"
            />
          </div>

          {/* Transcription Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-200">
                Transcription (Optional)
              </label>
              <Button
                onClick={transcribeAudio}
                variant="outline"
                size="sm"
                disabled={isTranscribing}
                className="text-xs"
              >
                {isTranscribing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Transcribing...</span>
                  </>
                ) : (
                  '🎯 Auto-Transcribe'
                )}
              </Button>
            </div>
            
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Transcription will appear here, or you can type manual notes about your recording..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
            
            <p className="text-xs text-gray-400">
              Add notes about your recording to make it easier to find later
            </p>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-200">
          Tags (optional)
        </label>
        <TagInput
          tags={tags}
          onTagsChange={setTags}
          suggestions={tagSuggestions}
          placeholder="Add tags like 'observational', 'storytelling'..."
        />
        <p className="text-xs text-gray-400">
          Tags help you organize and find your material later
        </p>
      </div>

      {/* Save Button */}
      {recordingState.audioBlob && (
        <div className="flex justify-center">
          <Button
            onClick={saveVoiceNote}
            loading={isSaving}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2"
          >
            {isSaving ? 'Saving...' : 'Save Voice Note'}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-600 rounded-md">
          <p className="text-sm text-red-400">
            Error saving voice note: {error.message}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="text-sm font-semibold text-yellow-400 mb-2">💡 Voice Recording Tips</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Find a quiet space for better audio quality</li>
          <li>• Speak clearly and at a normal pace</li>
          <li>• Use the transcription feature or add manual notes</li>
          <li>• Tag your recordings for easy organization</li>
          <li>• Recordings are stored locally on your device</li>
        </ul>
      </div>
    </div>
  );
};