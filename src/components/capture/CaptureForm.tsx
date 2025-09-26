import React, { useState } from 'react';
import { TextCapture } from './TextCapture';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui';

type CaptureMode = 'text' | 'voice' | 'image';

interface CaptureFormProps {
  onNoteSaved?: (noteId: string) => void;
  initialMode?: CaptureMode;
}

export const CaptureForm: React.FC<CaptureFormProps> = ({
  onNoteSaved,
  initialMode = 'text'
}) => {
  const [activeMode, setActiveMode] = useState<CaptureMode>(initialMode);

  const captureModes = [
    {
      id: 'text' as const,
      label: 'Text',
      icon: '📝',
      description: 'Type your ideas',
      available: true
    },
    {
      id: 'voice' as const,
      label: 'Voice',
      icon: '🎤',
      description: 'Record audio',
      available: false // Will be implemented in task 6
    },
    {
      id: 'image' as const,
      label: 'Image',
      icon: '📷',
      description: 'Capture photos',
      available: false // Will be implemented in task 7
    }
  ];

  return (
    <div className="space-y-6">
      {/* Capture mode selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400">Capture Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {captureModes.map((mode) => (
              <Button
                key={mode.id}
                variant={activeMode === mode.id ? 'primary' : 'outline'}
                onClick={() => mode.available && setActiveMode(mode.id)}
                disabled={!mode.available}
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <div className="text-2xl">{mode.icon}</div>
                <div className="text-center">
                  <div className="font-semibold">{mode.label}</div>
                  <div className="text-xs opacity-75">{mode.description}</div>
                  {!mode.available && (
                    <div className="text-xs text-gray-400 mt-1">Coming Soon</div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Capture interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center space-x-2">
            <span>{captureModes.find(m => m.id === activeMode)?.icon}</span>
            <span>Capture Your Ideas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeMode === 'text' && (
            <TextCapture onNoteSaved={onNoteSaved} />
          )}
          
          {activeMode === 'voice' && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🎤</div>
              <h3 className="text-lg font-semibold mb-2">Voice Capture</h3>
              <p>Voice recording will be available in the next update.</p>
              <p className="text-sm mt-2">
                This will include audio recording and transcription.
              </p>
            </div>
          )}
          
          {activeMode === 'image' && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-lg font-semibold mb-2">Image Capture</h3>
              <p>Photo capture and OCR will be available in the next update.</p>
              <p className="text-sm mt-2">
                This will include camera access and text extraction from images.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};