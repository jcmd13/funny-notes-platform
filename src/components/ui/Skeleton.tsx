import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = false
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-700',
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      role="status"
      aria-label="Loading..."
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)} role="status" aria-label="Loading text...">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <div className={cn('p-4 border border-gray-700 rounded-lg bg-gray-800', className)} role="status" aria-label="Loading card...">
      <div className="flex items-start space-x-3">
        <Skeleton width={40} height={40} rounded />
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="60%" />
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
};

// Enhanced skeleton components for specific use cases
interface SkeletonListProps {
  items?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ 
  items = 5, 
  className 
}) => {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading list...">
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className
}) => {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Loading table...">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} height={20} width="100%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              height={16} 
              width={colIndex === 0 ? "60%" : "100%"} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

interface SkeletonDashboardProps {
  className?: string;
}

export const SkeletonDashboard: React.FC<SkeletonDashboardProps> = ({ className }) => {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-label="Loading dashboard...">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`stat-${index}`} className="p-4 border border-gray-700 rounded-lg bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton height={16} width="60%" />
                <Skeleton height={24} width="40%" />
              </div>
              <Skeleton width={32} height={32} rounded />
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton height={24} width="40%" />
          <SkeletonList items={3} />
        </div>
        <div className="space-y-4">
          <Skeleton height={24} width="40%" />
          <SkeletonList items={3} />
        </div>
      </div>
    </div>
  );
};

interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  fields = 4,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label="Loading form...">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={`field-${index}`} className="space-y-2">
          <Skeleton height={16} width="30%" />
          <Skeleton height={40} width="100%" />
        </div>
      ))}
      
      <div className="flex space-x-3 pt-4">
        <Skeleton height={40} width={100} />
        <Skeleton height={40} width={80} />
      </div>
    </div>
  );
};