import { useState } from 'react';
import { CaptureForm } from '../components/capture';
import { FloatingActionButton } from '../components/ui';

/**
 * Capture page - for creating new notes and ideas
 */
export function Capture() {
  const [recentlySavedNoteId, setRecentlySavedNoteId] = useState<string | null>(null);

  const handleNoteSaved = (noteId: string) => {
    setRecentlySavedNoteId(noteId);
    // Show a brief success message or animation
    setTimeout(() => setRecentlySavedNoteId(null), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
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
          <div className="mt-4 p-3 bg-green-900/20 border border-green-600 rounded-md">
            <p className="text-sm text-green-400">
              ✅ Note saved successfully! Your comedy gold is safe.
            </p>
          </div>
        )}
      </div>

      {/* Capture form */}
      <CaptureForm onNoteSaved={handleNoteSaved} />

      {/* Quick tips */}
      <div className="mt-12 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">💡 Quick Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-gray-200 mb-2">Writing Tips:</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Write in your natural voice</li>
              <li>• Don't worry about perfection</li>
              <li>• Include setup and punchline</li>
              <li>• Note the audience reaction you expect</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-200 mb-2">Organization:</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Use tags to categorize material</li>
              <li>• Auto-save keeps your work safe</li>
              <li>• Estimated timing helps with sets</li>
              <li>• Edit anytime to refine your jokes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating action button for quick access */}
      <FloatingActionButton
        onClick={scrollToTop}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        }
        position="bottom-right"
      />
    </div>
  );
}