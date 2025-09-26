import React from 'react';
import { cn } from '../../utils/cn';

export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, icon, position = 'bottom-right', size = 'md', children, ...props }, ref) => {
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

    return (
      <button
        ref={ref}
        className={cn(
          'fixed z-50 flex items-center justify-center rounded-full bg-amber-500 text-gray-900 shadow-lg hover:bg-amber-400 active:bg-amber-600 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900',
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
);

FloatingActionButton.displayName = 'FloatingActionButton';

export { FloatingActionButton };