
import { cn } from '../../utils/cn'

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('bg-gray-800 rounded-lg p-4 border border-gray-700', className)}>
      <div className="animate-pulse">
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-700 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-700 rounded w-5/6"></div>
          <div className="h-3 bg-gray-700 rounded w-4/6"></div>
        </div>
        <div className="flex justify-between mt-4">
          <div className="h-3 bg-gray-700 rounded w-16"></div>
          <div className="h-3 bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  )
}