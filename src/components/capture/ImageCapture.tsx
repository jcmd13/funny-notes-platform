import { useState, useRef } from 'react'
import { useStorage } from '../../hooks/useStorage'

// Dynamic import for Tesseract to handle module loading issues
const loadTesseract = async () => {
  try {
    const { createWorker } = await import('tesseract.js')
    return createWorker
  } catch (error) {
    console.error('Failed to load Tesseract:', error)
    return null
  }
}

interface ImageCaptureProps {
  onCapture: (imageData: { image: Blob; extractedText?: string }) => void
  disabled?: boolean
}

export function ImageCapture({ onCapture, disabled }: ImageCaptureProps) {
  const { storageService } = useStorage()
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [useCamera, setUseCamera] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setUseCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check permissions or use file upload.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setUseCamera(false)
  }

  const captureFromCamera = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            setCapturedImage(blob)
            stopCamera()
            processImage(blob)
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setCapturedImage(file)
      processImage(file)
    }
  }

  const processImage = async (imageBlob: Blob) => {
    setIsProcessing(true)
    setExtractedText('')
    
    try {
      setProcessingStep('Initializing OCR...')
      
      const createWorker = await loadTesseract()
      if (!createWorker) {
        throw new Error('OCR library not available')
      }
      
      const worker = await createWorker('eng')
      
      setProcessingStep('Processing image...')
      const { data: { text } } = await worker.recognize(imageBlob)
      
      setProcessingStep('Cleaning up text...')
      // Clean up the extracted text
      const cleanedText = text
        .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
        .replace(/^\s+|\s+$/g, '') // Trim whitespace
        .replace(/[^\w\s.,!?;:'"()-]/g, '') // Remove weird characters
      
      setExtractedText(cleanedText)
      
      await worker.terminate()
    } catch (error) {
      console.error('OCR processing failed:', error)
      setExtractedText('OCR processing is temporarily unavailable. You can still save the image and add text manually.')
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const handleSave = async () => {
    if (capturedImage) {
      try {
        // Store image blob if storage service is available
        if (storageService) {
          await storageService.storeImageBlob(capturedImage, { 
            maxWidth: 1920, 
            quality: 0.8 
          })
        }
        
        onCapture({ 
          image: capturedImage, 
          extractedText: extractedText.trim() || undefined 
        })
      } catch (error) {
        console.error('Error saving image:', error)
        alert('Failed to save image')
      }
    }
  }

  const handleDiscard = () => {
    setCapturedImage(null)
    setExtractedText('')
    stopCamera()
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setExtractedText('')
    startCamera()
  }

  if (capturedImage) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-gray-300">Image Captured</h3>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <img 
            src={URL.createObjectURL(capturedImage)}
            alt="Captured content"
            className="w-full max-h-64 object-contain rounded"
          />
        </div>
        
        {isProcessing ? (
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="animate-spin text-2xl mb-2">⚙️</div>
            <p className="text-yellow-400 text-sm">{processingStep}</p>
          </div>
        ) : extractedText ? (
          <div className="bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Extracted Text:</h4>
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Edit the extracted text if needed..."
            />
            <p className="text-xs text-gray-500 mt-2">
              You can edit the extracted text above before saving.
            </p>
          </div>
        ) : (
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">
              No text could be extracted from this image, but you can still save it.
            </p>
          </div>
        )}
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRetake}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            📷 Retake
          </button>
          <button
            onClick={handleDiscard}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Save Image'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-6">
      <div className="text-4xl mb-4">📷</div>
      
      {!useCamera ? (
        <>
          <h3 className="text-lg font-semibold text-gray-300">Image Capture</h3>
          <p className="text-gray-400 mb-6">
            Capture handwritten notes, whiteboards, or any text-containing images. 
            Text will be automatically extracted using OCR.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={startCamera}
              disabled={disabled}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white px-6 py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📸 Use Camera
            </button>
            
            <div className="text-gray-400 text-sm">or</div>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={disabled}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white px-6 py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📁 Upload Image
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-300">Position Your Content</h3>
          <p className="text-gray-400 mb-4">
            Frame your text clearly and tap capture when ready.
          </p>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-64 object-cover rounded"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={stopCamera}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={captureFromCamera}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
            >
              📸 Capture
            </button>
          </div>
        </>
      )}
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 Tips for better text recognition:</p>
        <p>• Ensure good lighting and clear text</p>
        <p>• Hold the camera steady</p>
        <p>• Avoid shadows and glare</p>
      </div>
    </div>
  )
}