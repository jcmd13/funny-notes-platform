import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CaptureForm } from '../components/capture';
import { FloatingActionButton, ErrorBoundary, ToastContainer, useToast } from '../components/ui';

/**
 * Capture page - for creating new notes and ideas
 */
function Capture() {
  const [searchParams] = useSearchParams();
  const [recentlySavedNoteId, setRecentlySavedNoteId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'text' | 'voice' | 'image'>('text');
  const { success, error } = useToast();
  const captureFormRef = useRef<{ switchMode: (mode: 'text' | 'voice' | 'image') => void }>(null);

  // Handle URL parameters for initial mode
  useEffect(() => {
    const modeParam = searchParams.get('mode') as 'text' | 'voice' | 'image';
    if (modeParam && ['text', 'voice', 'image'].includes(modeParam)) {
      setActiveMode(modeParam);
    }
  }, [searchParams]);

  const handleNoteSaved = (noteId: string) => {
    setRecentlySavedNoteId(noteId);
    success('Note Saved!', 'Your comedy gold is safely stored.');
    // Clear the success state after a delay
    setTimeout(() => setRecentlySavedNoteId(null), 3000);
  };

  const handleError = (errorMessage: string) => {
    error('Capture Failed', errorMessage);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTextCapture = () => {
    setActiveMode('text');
    captureFormRef.current?.switchMode('text');
    scrollToTop();
  };

  const handleVoiceCapture = () => {
    setActiveMode('voice');
    captureFormRef.current?.switchMode('voice');
    scrollToTop();
  };

  const handleImageCapture = () => {
    setActiveMode('image');
    captureFormRef.current?.switchMode('image');
    scrollToTop();
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            Capture Your Ideas 💡
          </h1>
          <p className="text-lg text-gray-300">
            Got a funny thought? Let's get it down before it escapes!
          </p>
          {recentlySavedNoteId && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-600 rounded-md animate-pulse">
              <p className="text-sm text-green-400">
                ✅ Note saved successfully! Your comedy gold is safe.
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Capture form with error boundary */}
        <ErrorBoundary
          fallback={
            <div className="text-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">
                Capture Temporarily Unavailable
              </h3>
              <p className="text-gray-400 mb-4">
                Don't worry! Your previous notes are safe. Try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-md transition-colors hover:bg-yellow-400"
              >
                🔄 Refresh Page
              </button>
            </div>
          }
          onError={(error) => handleError(error.message)}
        >
          <CaptureForm 
            ref={captureFormRef}
            onNoteSaved={handleNoteSaved} 
            initialMode={activeMode}
          />
        </ErrorBoundary>

        {/* Enhanced Quick tips */}
        <div className="mt-12 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">💡 Pro Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-gray-200 mb-2 flex items-center">
                📝 Writing Tips
              </h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Write in your natural voice</li>
                <li>• Don't worry about perfection</li>
                <li>• Include setup and punchline</li>
                <li>• Note the audience reaction you expect</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-200 mb-2 flex items-center">
                🎤 Voice & Image
              </h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Find quiet spaces for recording</li>
                <li>• Ensure good lighting for photos</li>
                <li>• Add context notes to media</li>
                <li>• Use transcription for searchability</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-200 mb-2 flex items-center">
                🏷️ Organization
              </h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Use tags to categorize material</li>
                <li>• Auto-save keeps your work safe</li>
                <li>• Estimated timing helps with sets</li>
                <li>• Switch modes with Alt+T/V/I</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modern floating capture button */}
        <FloatingActionButton
          showCaptureOptions={true}
          onTextCapture={handleTextCapture}
          onVoiceCapture={handleVoiceCapture}
          onImageCapture={handleImageCapture}
          position="bottom-right"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          }
        />
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}export
 default Capture