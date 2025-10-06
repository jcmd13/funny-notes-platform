import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNotes } from '../../hooks/useNotes';
import { useStorage } from '../../hooks/useStorage';
import { Button, TagInput, LoadingSpinner, Textarea } from '../ui';
// Lazy load tesseract.js to reduce initial bundle size
const loadTesseract = () => import('tesseract.js');
import type { CreateNoteInput } from '../../core/models';

interface CaptureProgress {
  mode: 'text' | 'voice' | 'image';
  stage: 'idle' | 'capturing' | 'processing' | 'saving' | 'complete' | 'error';
  message: string;
  progress?: number;
}

interface ImageCaptureProps {
  onNoteSaved?: (noteId: string) => void;
  onProgressUpdate?: (progress: Partial<CaptureProgress>) => void;
  onUnsavedWork?: (hasWork: boolean) => void;
  initialTags?: string[];
}

interface ImageState {
  file: File | null;
  preview: string | null;
  isProcessing: boolean;
  ocrText: string;
  ocrConfidence: number;
}

export const ImageCapture: React.FC<ImageCaptureProps> = ({
  onNoteSaved,
  onProgressUpdate,
  onUnsavedWork,
  initialTags = []
}) => {
  const { createNote, loading, error } = useNotes();
  const { storageService } = useStorage();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [manualNotes, setManualNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    preview: null,
    isProcessing: false,
    ocrText: '',
    ocrConfidence: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  // Cleanup camera stream on unmount or when switching away
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Common comedy tags for suggestions
  const tagSuggestions = [
    'signs',
    'memes',
    'visual-comedy',
    'street-art',
    'funny-text',
    'screenshots',
    'social-media',
    'advertisements',
    'menus',
    'instructions',
    'warnings',
    'typos',
    'observational',
    'absurd',
    'ironic'
  ];

  // Handle file selection with enhanced progress tracking
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    onProgressUpdate?.({
      mode: 'image',
      stage: 'processing',
      message: 'Loading image...',
      progress: 10
    });

    // Create preview
    const preview = URL.createObjectURL(file);
    
    setImageState({
      file,
      preview,
      isProcessing: true,
      ocrText: '',
      ocrConfidence: 0
    });

    onUnsavedWork?.(true);

    // Process OCR with progress tracking
    try {
      onProgressUpdate?.({
        mode: 'image',
        stage: 'processing',
        message: 'Analyzing image for text...',
        progress: 30
      });

      const { recognize } = await loadTesseract();
      const result = await recognize(file, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            const progress = Math.min(90, 30 + (m.progress * 60));
            onProgressUpdate?.({
              mode: 'image',
              stage: 'processing',
              message: 'Extracting text from image...',
              progress
            });
          }
        }
      });

      onProgressUpdate?.({
        mode: 'image',
        stage: 'processing',
        message: 'Processing complete',
        progress: 100
      });

      setImageState(prev => ({
        ...prev,
        isProcessing: false,
        ocrText: result.data.text.trim(),
        ocrConfidence: result.data.confidence / 100
      }));

      onProgressUpdate?.({
        mode: 'image',
        stage: 'idle',
        message: 'Image processed successfully'
      });
    } catch (err) {
      console.error('OCR failed:', err);
      setImageState(prev => ({
        ...prev,
        isProcessing: false,
        ocrText: '',
        ocrConfidence: 0
      }));
      onProgressUpdate?.({
        mode: 'image',
        stage: 'error',
        message: 'Failed to extract text from image'
      });
    }
  }, [onProgressUpdate, onUnsavedWork]);

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Test camera availability
  const testCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      return videoDevices.length > 0;
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  };

  // Start camera with progress feedback
  const startCamera = async (facingMode: 'user' | 'environment' = cameraFacing) => {
    try {
      // First stop any existing camera stream
      stopCamera();

      // Test camera availability first
      const hasCamera = await testCameraAvailability();
      if (!hasCamera) {
        onProgressUpdate?.({
          mode: 'image',
          stage: 'error',
          message: 'No camera found on this device'
        });
        return;
      }

      onProgressUpdate?.({
        mode: 'image',
        stage: 'capturing',
        message: 'Accessing camera...'
      });

      // Try different constraint configurations
      const constraints = [
        // First try with facingMode
        {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
        // Fallback without facingMode
        {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        },
        // Simple fallback
        {
          video: true
        }
      ];

      let stream: MediaStream | null = null;
      let lastError: Error | null = null;

      for (const constraint of constraints) {
        try {
          console.log('Trying camera constraint:', constraint);
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('Camera stream obtained with constraint:', constraint);
          break;
        } catch (error) {
          console.warn('Camera constraint failed:', constraint, error);
          lastError = error as Error;
          continue;
        }
      }

      if (!stream) {
        throw lastError || new Error('Failed to get camera stream with any constraint');
      }
      
      setCameraStream(stream);
      setShowCamera(true);
      setCameraFacing(facingMode);
      
      // Wait for video element to be ready
      if (videoRef.current) {
        console.log('Setting video source');
        videoRef.current.srcObject = stream;
        
        // Force video to load and play
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                console.log('Video playing successfully');
                onProgressUpdate?.({
                  mode: 'image',
                  stage: 'capturing',
                  message: 'Camera ready - position your subject'
                });
              })
              .catch((error) => {
                console.error('Video play failed:', error);
                onProgressUpdate?.({
                  mode: 'image',
                  stage: 'error',
                  message: 'Failed to start video playback'
                });
              });
          }
        };

        // Handle video errors
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          stopCamera();
          onProgressUpdate?.({
            mode: 'image',
            stage: 'error',
            message: 'Camera stream error'
          });
        };

        // Add additional event listeners for debugging
        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };

        videoRef.current.onplaying = () => {
          console.log('Video is playing');
        };
      }

    } catch (err) {
      console.error('Camera access failed:', err);
      stopCamera();
      
      let errorMessage = 'Could not access camera';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
      }
      
      onProgressUpdate?.({
        mode: 'image',
        stage: 'error',
        message: errorMessage
      });
      alert(errorMessage + ' You can still upload images using the file option.');
    }
  };

  // Switch camera facing mode
  const switchCamera = useCallback(async () => {
    setIsSwitchingCamera(true);
    try {
      const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
      await startCamera(newFacing);
    } finally {
      setIsSwitchingCamera(false);
    }
  }, [cameraFacing]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      setCameraStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadedmetadata = null;
      videoRef.current.onerror = null;
    }
    
    setShowCamera(false);
    
    onProgressUpdate?.({
      mode: 'image',
      stage: 'idle',
      message: ''
    });
  }, [cameraStream, onProgressUpdate]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Could not get canvas context');
      return;
    }

    // Check if video has loaded and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('Camera not ready yet. Please wait a moment and try again.');
      return;
    }

    try {
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const file = new File([blob], `camera-photo-${timestamp}.jpg`, { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          // Stop camera before processing the image
          stopCamera();
          
          // Process the captured image
          await handleFileSelect(file);
        } else {
          console.error('Failed to create blob from canvas');
          alert('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.9); // Higher quality for camera captures
    } catch (err) {
      console.error('Error capturing photo:', err);
      alert('Failed to capture photo. Please try again.');
    }
  }, [handleFileSelect, stopCamera]);

  // Clear image and start over
  const clearImage = () => {
    if (imageState.preview) {
      URL.revokeObjectURL(imageState.preview);
    }
    
    setImageState({
      file: null,
      preview: null,
      isProcessing: false,
      ocrText: '',
      ocrConfidence: 0
    });
    
    setManualNotes('');
    onUnsavedWork?.(false);
    onProgressUpdate?.({
      mode: 'image',
      stage: 'idle',
      message: ''
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save the image note with enhanced progress tracking
  const saveImageNote = async () => {
    if (!imageState.file || !storageService) return;

    setIsSaving(true);
    onProgressUpdate?.({
      mode: 'image',
      stage: 'saving',
      message: 'Saving image note...',
      progress: 0
    });

    try {
      onProgressUpdate?.({
        mode: 'image',
        stage: 'saving',
        message: 'Compressing image...',
        progress: 25
      });

      // Store the image blob and get a storage key
      const imageKey = await storageService.storeImageBlob(
        imageState.file,
        { maxWidth: 1920, quality: 0.8 }
      );

      onProgressUpdate?.({
        mode: 'image',
        stage: 'saving',
        message: 'Creating note...',
        progress: 75
      });

      // Create attachment for the image
      const imageAttachment = {
        id: crypto.randomUUID(),
        type: 'image' as const,
        filename: imageState.file.name,
        size: imageState.file.size,
        mimeType: imageState.file.type,
        url: imageKey
      };

      // Combine OCR text and manual notes
      const combinedContent = [
        imageState.ocrText && `[OCR Text]: ${imageState.ocrText}`,
        manualNotes && `[Notes]: ${manualNotes}`
      ].filter(Boolean).join('\n\n') || '[Image captured - no text detected]';

      const noteData: CreateNoteInput = {
        content: combinedContent,
        captureMethod: 'image',
        tags,
        estimatedDuration: Math.max(10, Math.floor(combinedContent.length / 10)), // Rough estimate
        metadata: {
          confidence: imageState.ocrConfidence
        },
        attachments: [imageAttachment]
      };

      const newNote = await createNote(noteData);
      if (newNote) {
        onProgressUpdate?.({
          mode: 'image',
          stage: 'complete',
          message: 'Image note saved successfully!',
          progress: 100
        });

        onNoteSaved?.(newNote.id);
        // Clear the form after successful save
        clearImage();
        setTags([]);
        setManualNotes('');
        onUnsavedWork?.(false);
      }
    } catch (err) {
      console.error('Failed to save image note:', err);
      onProgressUpdate?.({
        mode: 'image',
        stage: 'error',
        message: 'Failed to save image note'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Input Section */}
      {!imageState.file && !showCamera && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Capture Visual Comedy
            </h3>
            <p className="text-gray-400 mb-6">
              Take a photo or upload an image. We'll extract any text automatically!
            </p>
          </div>

          {/* Upload Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-300 font-medium mb-1">Upload Image</p>
              <p className="text-sm text-gray-400">
                Click or drag & drop an image file
              </p>
            </div>

            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors cursor-pointer"
              onClick={() => startCamera()}
            >
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray-300 font-medium mb-1">Take Photo</p>
              <p className="text-sm text-gray-400">
                Use your camera to capture
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center">
            {cameraStream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-96 object-cover"
                  style={{ 
                    transform: 'scaleX(-1)',
                    minHeight: '300px',
                    backgroundColor: '#000'
                  }}
                  onLoadStart={() => console.log('Video load started')}
                  onLoadedData={() => console.log('Video data loaded')}
                  onCanPlay={() => console.log('Video can play')}
                  onPlay={() => console.log('Video started playing')}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera overlay controls */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button
                    onClick={switchCamera}
                    disabled={isSwitchingCamera}
                    variant="ghost"
                    size="sm"
                    className="bg-black/50 text-white hover:bg-black/70 transition-all duration-200 disabled:opacity-50"
                    title={`Switch to ${cameraFacing === 'user' ? 'back' : 'front'} camera`}
                  >
                    <span className={`inline-block transition-transform duration-300 ${isSwitchingCamera ? 'animate-spin' : 'hover:rotate-180'}`}>
                      🔄
                    </span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 p-8">
                <div className="text-4xl mb-2">📷</div>
                <p className="mb-2">Initializing camera...</p>
                <p className="text-sm text-gray-500">
                  If this takes too long, try refreshing or use file upload instead
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center space-x-3">
            <Button
              onClick={capturePhoto}
              disabled={!cameraStream}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-3 disabled:opacity-50"
            >
              📸 Capture Photo
            </Button>
            {!cameraStream && (
              <Button
                onClick={() => startCamera(cameraFacing)}
                variant="outline"
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
              >
                🔄 Retry Camera
              </Button>
            )}
            <Button
              onClick={stopCamera}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
          
          {/* Camera instructions */}
          <div className="text-center text-sm text-gray-400 space-y-1">
            <p>Position your subject in the frame and click capture</p>
            <p>
              Currently using: <span className="text-yellow-400 font-medium">
                {cameraFacing === 'user' ? 'Front Camera' : 'Back Camera'}
              </span>
            </p>
            <p>Use the 🔄 button to switch cameras</p>
            {cameraStream && videoRef.current && (
              <p className="text-xs text-green-400">
                Stream active: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Image Preview and Processing */}
      {imageState.file && (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={imageState.preview || ''}
              alt="Captured content"
              className="w-full max-h-96 object-contain rounded-lg border border-gray-600"
            />
            <Button
              onClick={clearImage}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-gray-900/80 text-white hover:bg-gray-800"
            >
              ✕
            </Button>
          </div>

          {/* OCR Processing */}
          {imageState.isProcessing && (
            <div className="text-center py-4">
              <LoadingSpinner />
              <p className="text-yellow-400 text-sm mt-2">
                🔍 Extracting text from image...
              </p>
            </div>
          )}

          {/* OCR Results */}
          {!imageState.isProcessing && imageState.ocrText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-200">
                  Extracted Text
                </label>
                <span className="text-xs text-gray-400">
                  Confidence: {Math.round(imageState.ocrConfidence * 100)}%
                </span>
              </div>
              <div className="p-3 bg-gray-700 rounded-md border border-gray-600">
                <p className="text-gray-200 whitespace-pre-wrap">
                  {imageState.ocrText}
                </p>
              </div>
            </div>
          )}

          {/* Manual Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Your Notes (Optional)
            </label>
            <Textarea
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Add your own notes about this image, comedy ideas, context, etc..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-400">
              Add context, comedy ideas, or observations about the image
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
          placeholder="Add tags like 'signs', 'memes', 'visual-comedy'..."
        />
        <p className="text-xs text-gray-400">
          Tags help you organize and find your visual material later
        </p>
      </div>

      {/* Save Button */}
      {imageState.file && !imageState.isProcessing && (
        <div className="flex justify-center">
          <Button
            onClick={saveImageNote}
            loading={isSaving}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2"
          >
            {isSaving ? 'Saving...' : 'Save Image Note'}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-600 rounded-md">
          <p className="text-sm text-red-400">
            Error saving image note: {error.message}
          </p>
        </div>
      )}

      {/* Camera Permission Help */}
      {showCamera && !cameraStream && (
        <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-md">
          <h4 className="text-sm font-medium text-blue-400 mb-2">Camera Access Required</h4>
          <p className="text-xs text-blue-300 mb-2">
            If the camera isn't working, please:
          </p>
          <ul className="text-xs text-blue-300 space-y-1 ml-4">
            <li>• Check that you've allowed camera permissions for this site</li>
            <li>• Make sure no other apps are using your camera</li>
            <li>• Try refreshing the page and allowing permissions again</li>
            <li>• Use the file upload option as an alternative</li>
          </ul>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="text-sm font-semibold text-yellow-400 mb-2">📸 Image Capture Tips</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Capture funny signs, memes, screenshots, or visual comedy</li>
          <li>• Ensure text is clear and well-lit for better OCR results</li>
          <li>• Add your own notes to provide context and comedy ideas</li>
          <li>• Use tags to organize different types of visual content</li>
          <li>• Images are stored locally and processed on your device</li>
        </ul>
      </div>
    </div>
  );
};