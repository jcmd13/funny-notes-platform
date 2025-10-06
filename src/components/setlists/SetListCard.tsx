import { useNavigate } from 'react-router-dom'
import type { SetList } from '@core/models'
import { Card, Button } from '@components/ui'
import { formatDuration } from '@utils/dateUtils'

interface SetListCardProps {
  setList: SetList
  onEdit?: (setList: SetList) => void
  onDelete?: (setList: SetList) => void
  onView?: (setList: SetList) => void
}

export function SetListCard({ setList, onEdit, onDelete, onView }: SetListCardProps) {
  const navigate = useNavigate()
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <Card className="p-4 hover:bg-gray-750 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-yellow-400 truncate">
            {setList.name}
          </h3>
          
          <div className="mt-2 space-y-1 text-sm text-gray-300">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <span>🎭</span>
                <span>{setList.notes.length} notes</span>
              </span>
              
              <span className="flex items-center space-x-1">
                <span>⏱️</span>
                <span>{formatDuration(setList.totalDuration)}</span>
              </span>
            </div>
            
            {setList.performanceDate && (
              <div className="flex items-center space-x-1 text-gray-400">
                <span>📅</span>
                <span>{formatDate(setList.performanceDate)}</span>
              </div>
            )}
            
            {setList.venue && (
              <div className="flex items-center space-x-1 text-gray-400">
                <span>🏛️</span>
                <span>{setList.venue}</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Updated {formatDate(setList.updatedAt)}
          </div>

          {/* Rehearsal Button */}
          {setList.notes.length > 0 && (
            <div className="mt-3">
              <Button
                onClick={() => navigate(`/rehearsal/${setList.id}`)}
                variant="primary"
                size="sm"
                className="w-full"
              >
                🎭 Start Rehearsal
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {onView && (
            <button
              onClick={() => onView(setList)}
              className="p-2 text-gray-400 hover:bg-gray-700 rounded transition-colors hover:text-yellow-400"
              title="View set list"
            >
              👁️
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={() => onEdit(setList)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
              title="Edit set list"
            >
              ✏️
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(setList)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
              title="Delete set list"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}