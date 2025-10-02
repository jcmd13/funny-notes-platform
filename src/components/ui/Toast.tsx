import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const typeStyles = {
    success: {
      bg: 'bg-green-900/90',
      border: 'border-green-600',
      icon: '✅',
      iconColor: 'text-green-400'
    },
    error: {
      bg: 'bg-red-900/90',
      border: 'border-red-600',
      icon: '❌',
      iconColor: 'text-red-400'
    },
    warning: {
      bg: 'bg-yellow-900/90',
      border: 'border-yellow-600',
      icon: '⚠️',
      iconColor: 'text-yellow-400'
    },
    info: {
      bg: 'bg-blue-900/90',
      border: 'border-blue-600',
      icon: 'ℹ️',
      iconColor: 'text-blue-400'
    }
  };

  const style = typeStyles[type];

  return createPortal(
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out',
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div
        className={cn(
          'rounded-lg border shadow-lg backdrop-blur-sm p-4',
          style.bg,
          style.border
        )}
      >
        <div className="flex items-start space-x-3">
          <div className={cn('text-lg', style.iconColor)}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-100">
              {title}
            </h4>
            {message && (
              <p className="text-sm text-gray-300 mt-1">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Toast Manager Hook
interface ToastItem extends Omit<ToastProps, 'onClose'> {
  id: string;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, message?: string) => 
    addToast({ type: 'success', title, message });

  const error = (title: string, message?: string) => 
    addToast({ type: 'error', title, message });

  const warning = (title: string, message?: string) => 
    addToast({ type: 'warning', title, message });

  const info = (title: string, message?: string) => 
    addToast({ type: 'info', title, message });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

// Toast Container Component
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </>
  );
};

export { Toast };