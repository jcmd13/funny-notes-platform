import React from 'react'
import { Button } from './Button'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📝',
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl mb-3',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-2'
    },
    md: {
      container: 'py-12',
      icon: 'text-6xl mb-4',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-3'
    },
    lg: {
      container: 'py-16',
      icon: 'text-8xl mb-6',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-4'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center max-w-md mx-auto',
      classes.container,
      className
    )}>
      <div className={classes.icon} role="img" aria-hidden="true">
        {icon}
      </div>
      
      <div className={classes.spacing}>
        <h3 className={cn('font-semibold text-gray-200', classes.title)}>
          {title}
        </h3>
        
        <p className={cn('text-gray-400', classes.description)}>
          {description}
        </p>
      </div>

      {(action || secondaryAction) && (
        <div className={cn('flex flex-col sm:flex-row gap-3 mt-6', classes.spacing)}>
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'primary'}
              className="min-w-[120px]"
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="min-w-[120px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Predefined empty states for common scenarios
export const EmptyStates = {
  Notes: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="📝"
      title="No notes yet"
      description="Start capturing your ideas, jokes, and creative thoughts. Your first note is just a click away!"
      action={{
        label: "Create First Note",
        onClick: () => window.location.hash = '#/capture'
      }}
      {...props}
    />
  ),

  SetLists: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="🎭"
      title="No set lists created"
      description="Organize your material into performance-ready sets. Create your first set list to get started."
      action={{
        label: "Create Set List",
        onClick: () => {} // Will be overridden by parent
      }}
      {...props}
    />
  ),

  Venues: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="🏛️"
      title="No venues added"
      description="Keep track of the places where you perform. Add venue details, characteristics, and performance history."
      action={{
        label: "Add Venue",
        onClick: () => {} // Will be overridden by parent
      }}
      {...props}
    />
  ),

  Contacts: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="👥"
      title="No contacts yet"
      description="Build your network of bookers, venue owners, and fellow performers. Add your first contact to get started."
      action={{
        label: "Add Contact",
        onClick: () => {} // Will be overridden by parent
      }}
      {...props}
    />
  ),

  SearchResults: (query: string, props: Partial<EmptyStateProps> = {}) => (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords or check your spelling.`}
      action={{
        label: "Clear Search",
        onClick: () => {} // Will be overridden by parent
      }}
      size="sm"
      {...props}
    />
  ),

  Performances: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="🎪"
      title="No performances logged"
      description="Track your shows, audience feedback, and performance metrics. Log your first performance to start building your history."
      action={{
        label: "Log Performance",
        onClick: () => {} // Will be overridden by parent
      }}
      {...props}
    />
  ),

  RehearsalHistory: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="🎯"
      title="No rehearsal sessions"
      description="Practice makes perfect! Start rehearsing your sets to track your progress and improve your timing."
      action={{
        label: "Start Rehearsal",
        onClick: () => {} // Will be overridden by parent
      }}
      {...props}
    />
  ),

  Error: (error: string, onRetry?: () => void, props: Partial<EmptyStateProps> = {}) => (
    <EmptyState
      icon="😵"
      title="Something went wrong"
      description={error || "We encountered an unexpected error. Don't worry, your data is safe."}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry
      } : undefined}
      secondaryAction={{
        label: "Refresh Page",
        onClick: () => window.location.reload()
      }}
      size="sm"
      {...props}
    />
  ),

  Offline: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon="📡"
      title="You're offline"
      description="No worries! You can still capture ideas and work with your existing content. Everything will sync when you're back online."
      size="sm"
      {...props}
    />
  )
}