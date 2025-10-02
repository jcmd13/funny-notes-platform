import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  // New props for capture functionality
  onTextCapture?: () => void;
  onVoiceCapture?: () => void;
  onImageCapture?: () => void;
  showCaptureOptions?: boolean;
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({
    className,
    icon,
    position = 'bottom-right',
    size = 'md',
    children,
    onTextCapture,
    onVoiceCapture,
    onImageCapture,
    showCaptureOptions = false,
    onClick,
    ...props
  }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const positions = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6'
    };

    const sizes = {
      sm: 'w-12 h-12',
      md: 'w-14 h-14',
      lg: 'w-16 h-16'
    };

    const defaultIcon = (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    );

    const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (showCaptureOptions) {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      } else {
        onClick?.(e);
      }
    };

    const handleCaptureAction = (action: () => void) => {
      action();
      setIsExpanded(false);
    };

    // If not showing capture options, render the simple version
    if (!showCaptureOptions) {
      return (
        <button
          ref={ref}
          onClick={onClick}
          className={cn(
            'fixed z-50 flex items-center justify-center rounded-full shadow-xl transition-all duration-300',
            'bg-gradient-to-r from-yellow-500 to-yellow-500 hover:from-yellow-400 hover:to-yellow-400',
            'text-gray-900 backdrop-blur-md border border-white/20',
            'hover:scale-110 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
            'focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900',
            positions[position],
            sizes[size],
            className
          )}
          {...props}
        >
          {icon || defaultIcon}
          {children}
        </button>
      );
    }

    // Render the expandable capture button
    return (
      <div className={cn('fixed z-50', positions[position])}>
        {/* Backdrop */}
        {isExpanded && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}

        {/* Capture Options */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 flex flex-col space-y-3 animate-in slide-in-from-bottom-2 duration-200">
            {/* Text Capture */}
            {onTextCapture && (
              <button
                onClick={() => handleCaptureAction(onTextCapture)}
                className="group flex items-center space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-3 text-white hover:bg-white/20 transition-all duration-200 shadow-lg hover:scale-105"
              >
                <div className="w-10 h-10 bg-blue-500/80 rounded-full flex items-center justify-center text-lg">
                  📝
                </div>
                <span className="text-sm font-medium pr-2">Text Note</span>
              </button>
            )}

            {/* Voice Capture */}
            {onVoiceCapture && (
              <button
                onClick={() => handleCaptureAction(onVoiceCapture)}
                className="group flex items-center space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-3 text-white hover:bg-white/20 transition-all duration-200 shadow-lg hover:scale-105"
              >
                <div className="w-10 h-10 bg-red-500/80 rounded-full flex items-center justify-center text-lg">
                  🎤
                </div>
                <span className="text-sm font-medium pr-2">Voice Note</span>
              </button>
            )}

            {/* Image Capture */}
            {onImageCapture && (
              <button
                onClick={() => handleCaptureAction(onImageCapture)}
                className="group flex items-center space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-3 text-white hover:bg-white/20 transition-all duration-200 shadow-lg hover:scale-105"
              >
                <div className="w-10 h-10 bg-green-500/80 rounded-full flex items-center justify-center text-lg">
                  📷
                </div>
                <span className="text-sm font-medium pr-2">Photo Note</span>
              </button>
            )}
          </div>
        )}

        {/* Main FAB */}
        <button
          ref={ref}
          onClick={handleMainClick}
          className={cn(
            'rounded-full shadow-xl transition-all duration-300',
            'bg-gradient-to-r from-yellow-500 to-yellow-500 hover:from-yellow-400 hover:to-yellow-400',
            'text-gray-900 backdrop-blur-md border border-white/20',
            'hover:scale-110 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
            'flex items-center justify-center',
            'focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900',
            isExpanded ? 'rotate-45' : 'rotate-0',
            sizes[size],
            className
          )}
          {...props}
        >
          {isExpanded ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            icon || defaultIcon
          )}
          {children}
        </button>
      </div>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

export { FloatingActionButton };