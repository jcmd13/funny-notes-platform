import React, { useState } from 'react'
import { cn } from '../../utils/cn'

export interface FloatingActionButtonProps {
  showCaptureOptions?: boolean
  onTextCapture?: () => void
  onVoiceCapture?: () => void
  onImageCapture?: () => void
  onClick?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  icon?: React.ReactNode
  className?: string
}

export function FloatingActionButton({
  showCaptureOptions = false,
  onTextCapture,
  onVoiceCapture,
  onImageCapture,
  onClick,
  position = 'bottom-right',
  icon,
  className
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  const handleMainClick = () => {
    if (showCaptureOptions) {
      setIsExpanded(!isExpanded)
    } else if (onClick) {
      onClick()
    } else {
      onTextCapture?.()
    }
  }

  const handleOptionClick = (callback?: () => void) => {
    callback?.()
    setIsExpanded(false)
  }

  return (
    <div className={cn('fixed z-40', positionClasses[position], className)}>
      {/* Capture Options */}
      {showCaptureOptions && isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3 mb-2">
          <button
            onClick={() => handleOptionClick(onImageCapture)}
            className="flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-400 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
            title="Capture Image"
          >
            📷
          </button>
          <button
            onClick={() => handleOptionClick(onVoiceCapture)}
            className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-400 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
            title="Voice Recording"
          >
            🎤
          </button>
          <button
            onClick={() => handleOptionClick(onTextCapture)}
            className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-400 text-white rounded-full shadow-lg transition-all transform hover:scale-110"
            title="Text Note"
          >
            📝
          </button>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={handleMainClick}
        className={cn(
          'flex items-center justify-center w-14 h-14 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-full shadow-lg transition-all transform hover:scale-110',
          isExpanded && 'rotate-45'
        )}
        title={showCaptureOptions ? 'Capture Options' : 'Quick Capture'}
      >
        {icon || (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}