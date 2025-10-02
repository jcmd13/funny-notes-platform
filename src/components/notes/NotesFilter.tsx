import { useState } from 'react'
import { Input, Button, TagChip } from '../ui'
import type { CaptureMethod } from '../../core/models/Note'

export interface NotesFilterOptions {
  searchQuery: string
  selectedTags: string[]
  captureMethod: CaptureMethod | 'all'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  sortBy: 'newest' | 'oldest' | 'updated' | 'duration'
}

export interface NotesFilterProps {
  filters: NotesFilterOptions
  availableTags: string[]
  onFiltersChange: (filters: NotesFilterOptions) => void
  onClearFilters: () => void
}

/**
 * Filter and search interface for notes list
 */
export function NotesFilter({ 
  filters, 
  availableTags, 
  onFiltersChange, 
  onClearFilters 
}: NotesFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilters = (updates: Partial<NotesFilterOptions>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag]
    
    updateFilters({ selectedTags: newTags })
  }

  const hasActiveFilters = 
    filters.searchQuery || 
    filters.selectedTags.length > 0 || 
    filters.captureMethod !== 'all' || 
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'newest'

  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      {/* Search bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search your comedy material..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-400 hover:text-red-400"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-gray-700">
          {/* Capture method filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'text', 'voice', 'image'] as const).map((method) => (
                <Button
                  key={method}
                  variant={filters.captureMethod === method ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ captureMethod: method })}
                  className="capitalize"
                >
                  {method === 'all' ? '📄 All' : 
                   method === 'text' ? '📝 Text' :
                   method === 'voice' ? '🎤 Voice' : '📷 Image'}
                </Button>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date Range
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'all', label: 'All Time' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'year', label: 'This Year' }
              ] as const).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filters.dateRange === key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ dateRange: key })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sort By
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'newest', label: '🕐 Newest First' },
                { key: 'oldest', label: '🕐 Oldest First' },
                { key: 'updated', label: '✏️ Recently Updated' },
                { key: 'duration', label: '⏱️ By Duration' }
              ] as const).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filters.sortBy === key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => updateFilters({ sortBy: key })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tags filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filter by Tags
          </label>
          <div className="flex flex-wrap gap-1">
            {availableTags.map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                onClick={() => handleTagToggle(tag)}
                selected={filters.selectedTags.includes(tag)}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="text-sm text-gray-400">
          {filters.searchQuery && (
            <span>Searching for "{filters.searchQuery}" • </span>
          )}
          {filters.selectedTags.length > 0 && (
            <span>{filters.selectedTags.length} tag{filters.selectedTags.length === 1 ? '' : 's'} selected • </span>
          )}
          {filters.captureMethod !== 'all' && (
            <span>Type: {filters.captureMethod} • </span>
          )}
          {filters.dateRange !== 'all' && (
            <span>Range: {filters.dateRange} • </span>
          )}
          Sorted by {filters.sortBy}
        </div>
      )}
    </div>
  )
}