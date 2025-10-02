import React, { useState, useCallback, useEffect } from 'react';
import { TextCapture } from './TextCapture';
import { VoiceCapture } from './VoiceCapture';
import { ImageCapture } from './ImageCapture';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner, Modal } from '../ui';

type CaptureMode = 'text' | 'voice' | 'image';

interface CaptureFormProps {
  onNoteSaved?: (noteId: string) => void;
  initialMode?: CaptureMode;
}

interface CaptureProgress {
  mode: CaptureMode;
  stage: 'idle' | 'capturing' | 'processing' | 'saving' | 'complete' | 'error';
  message: string;
  progress?: number;
}

export const CaptureForm = React.forwardRef<
  { switchMode: (mode: CaptureMode) => void },
  CaptureFormProps
>(({
  onNoteSaved,
  initialMode = 'text'
}, ref) => {
  const [activeMode, setActiveMode] = useState<CaptureMode>(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [captureProgress, setCaptureProgress] = useState<CaptureProgress>({
    mode: initialMode,
    stage: 'idle',
    message: ''
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
  const [, setPendingMode] = useState<CaptureMode | null>(null);

  const captureModes = [
    {
      id: 'text' as const,
      label: 'Text',
      icon: '📝',
      description: 'Type your ideas',
      available: true,
      shortcut: 'T'
    },
    {
      id: 'voice' as const,
      label: 'Voice',
      icon: '🎤',
      description: 'Record audio',
      available: true,
      shortcut: 'V'
    },
    {
      id: 'image' as const,
      label: 'Image',
      icon: '📷',
      description: 'Capture photos',
      available: true,
      shortcut: 'I'
    }
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 't':
            event.preventDefault();
            handleModeChange('text');
            break;
          case 'v':
            event.preventDefault();
            handleModeChange('voice');
            break;
          case 'i':
            event.preventDefault();
            handleModeChange('image');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle mode switching with unsaved work protection
  const handleModeChange = useCallback((newMode: CaptureMode) => {
    if (newMode === activeMode) return;

    if (hasUnsavedWork) {
      setPendingMode(newMode);
      // In a real implementation, you'd show a confirmation dialog
      // For now, we'll just switch
      setActiveMode(newMode);
      setHasUnsavedWork(false);
      setPendingMode(null);
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveMode(newMode);
        setIsTransitioning(false);
        setCaptureProgress({
          mode: newMode,
          stage: 'idle',
          message: ''
        });
      }, 150);
    }
  }, [activeMode, hasUnsavedWork]);

  // Expose switchMode method via ref
  React.useImperativeHandle(ref, () => ({
    switchMode: handleModeChange
  }), [handleModeChange]);

  // Handle progress updates from child components
  const handleProgressUpdate = useCallback((progress: Partial<CaptureProgress>) => {
    setCaptureProgress(prev => ({ ...prev, ...progress }));
    
    // Show progress modal for processing stages
    if (progress.stage === 'processing' || progress.stage === 'saving') {
      setShowProgressModal(true);
    } else if (progress.stage === 'complete' || progress.stage === 'error' || progress.stage === 'idle') {
      setShowProgressModal(false);
    }
  }, []);

  // Handle note saved callback
  const handleNoteSaved = useCallback((noteId: string) => {
    setHasUnsavedWork(false);
    setCaptureProgress(prev => ({
      ...prev,
      stage: 'complete',
      message: 'Note saved successfully!'
    }));
    onNoteSaved?.(noteId);
    
    // Hide progress modal after a brief delay
    setTimeout(() => {
      setShowProgressModal(false);
      setCaptureProgress(prev => ({ ...prev, stage: 'idle', message: '' }));
    }, 1500);
  }, [onNoteSaved]);

  // Handle unsaved work detection
  const handleUnsavedWork = useCallback((hasWork: boolean) => {
    setHasUnsavedWork(hasWork);
  }, []);

  // Get progress indicator for current stage
  const getProgressIndicator = () => {
    const { stage, message } = captureProgress;
    
    switch (stage) {
      case 'capturing':
        return {
          icon: '🎯',
          color: 'text-blue-400',
          message: message || 'Capturing...'
        };
      case 'processing':
        return {
          icon: '⚡',
          color: 'text-yellow-400',
          message: message || 'Processing...'
        };
      case 'saving':
        return {
          icon: '💾',
          color: 'text-green-400',
          message: message || 'Saving...'
        };
      case 'complete':
        return {
          icon: '✅',
          color: 'text-green-400',
          message: message || 'Complete!'
        };
      case 'error':
        return {
          icon: '❌',
          color: 'text-red-400',
          message: message || 'Error occurred'
        };
      default:
        return null;
    }
  };

  const progressIndicator = getProgressIndicator();

  return (
    <div className="space-y-6">
      {/* Capture mode selector with enhanced UI */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-yellow-400">Capture Method</CardTitle>
            {progressIndicator && (
              <div className={`flex items-center space-x-2 text-sm ${progressIndicator.color}`}>
                <span>{progressIndicator.icon}</span>
                <span>{progressIndicator.message}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {captureModes.map((mode) => (
              <div
                className={`relative cursor-pointer h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-200 rounded-lg border-2 ${
                  activeMode === mode.id 
                    ? 'bg-yellow-500 border-yellow-500 text-gray-900 ring-2 ring-yellow-400 ring-opacity-50' 
                    : 'bg-transparent border-gray-600 text-gray-200 hover:bg-yellow-400/10 hover:border-yellow-400/50'
                } ${isTransitioning ? 'opacity-50' : ''} hover:shadow-lg hover:shadow-yellow-400/20 group`}
                onClick={() => handleModeChange(mode.id)}
              >
                <div className="text-2xl">{mode.icon}</div>
                <div className="text-center">
                  <div className="font-semibold">{mode.label}</div>
                  <div className="text-xs opacity-75">{mode.description}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Alt+{mode.shortcut}
                  </div>
                  {!mode.available && (
                    <div className="text-xs text-gray-400 mt-1">Coming Soon</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick tips for current mode */}
          <div className="mt-4 p-3 bg-gray-700/50 rounded-md">
            <div className="text-xs text-gray-300">
              <span className="font-medium">💡 Quick tip:</span>{' '}
              {activeMode === 'text' && 'Use Ctrl+Enter to save quickly, or just keep typing - auto-save has you covered!'}
              {activeMode === 'voice' && 'Find a quiet space for best results. Your recording will be transcribed automatically.'}
              {activeMode === 'image' && 'Ensure text is clear and well-lit for better OCR results. Add your own notes for context.'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capture interface with transition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center space-x-2">
            <span>{captureModes.find(m => m.id === activeMode)?.icon}</span>
            <span>Capture Your Ideas</span>
            {hasUnsavedWork && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                Unsaved changes
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {activeMode === 'text' && (
              <TextCapture 
                key="text-capture"
                onNoteSaved={handleNoteSaved}
                onProgressUpdate={handleProgressUpdate}
                onUnsavedWork={handleUnsavedWork}
              />
            )}
            
            {activeMode === 'voice' && (
              <VoiceCapture 
                key="voice-capture"
                onNoteSaved={handleNoteSaved}
                onProgressUpdate={handleProgressUpdate}
                onUnsavedWork={handleUnsavedWork}
              />
            )}
            
            {activeMode === 'image' && (
              <ImageCapture 
                key="image-capture"
                onNoteSaved={handleNoteSaved}
                onProgressUpdate={handleProgressUpdate}
                onUnsavedWork={handleUnsavedWork}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => {}}
        title="Processing"
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="text-4xl">
            {progressIndicator?.icon || '⚡'}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-200">
              {progressIndicator?.message || 'Processing...'}
            </p>
            {captureProgress.progress !== undefined && (
              <div className="mt-3">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${captureProgress.progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {Math.round(captureProgress.progress)}% complete
                </p>
              </div>
            )}
          </div>
          <LoadingSpinner />
        </div>
      </Modal>
    </div>
  );
});

CaptureForm.displayName = 'CaptureForm';