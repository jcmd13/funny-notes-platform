import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { useFocusTrap } from '../../hooks/useFocusManagement';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy
}) => {
  const modalId = useRef(`modal-${Math.random().toString(36).substr(2, 9)}`)
  const titleId = useRef(`${modalId.current}-title`)
  const focusTrapRef = useFocusTrap(isOpen)

  // Listen for global close modal events
  useEffect(() => {
    const handleCloseModals = () => {
      if (isOpen) {
        onClose()
      }
    }

    window.addEventListener('close-modals', handleCloseModals)
    return () => window.removeEventListener('close-modals', handleCloseModals)
  }, [isOpen, onClose])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      // Set aria-hidden on other elements
      const otherElements = document.querySelectorAll('body > *:not([data-modal-container])')
      otherElements.forEach(el => {
        if (el !== document.querySelector('[data-modal-container]')) {
          el.setAttribute('aria-hidden', 'true')
        }
      })
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      
      // Remove aria-hidden from other elements
      const otherElements = document.querySelectorAll('[aria-hidden="true"]')
      otherElements.forEach(el => {
        el.removeAttribute('aria-hidden')
      })
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose()
    }
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-modal-container
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={focusTrapRef}
        className={cn(
          'relative w-full mx-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700',
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy || (title ? titleId.current : undefined)}
        aria-describedby={ariaDescribedBy}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 
              id={titleId.current}
              className="text-xl font-semibold text-gray-100"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded"
              aria-label="Close modal"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export { Modal };