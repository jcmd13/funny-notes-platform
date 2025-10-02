import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner } from '../ui';
import type { Note, SetList } from '../../core/models';

interface ActivityItem {
  type: 'note' | 'setlist';
  item: Note | SetList;
  date: Date;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  loading: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, loading }) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getItemTitle = (activity: ActivityItem) => {
    if (activity.type === 'note') {
      const note = activity.item as Note;
      return note.content.length > 50 
        ? `${note.content.substring(0, 50)}...` 
        : note.content;
    } else {
      const setList = activity.item as SetList;
      return setList.name;
    }
  };

  const getItemDescription = (activity: ActivityItem) => {
    if (activity.type === 'note') {
      const note = activity.item as Note;
      return `${note.captureMethod} note${note.tags.length > 0 ? ` • ${note.tags.slice(0, 2).join(', ')}` : ''}`;
    } else {
      const setList = activity.item as SetList;
      return `${setList.notes.length} items • ${Math.round(setList.totalDuration || 0)} min`;
    }
  };

  const getIcon = (type: 'note' | 'setlist') => {
    return type === 'note' ? '📝' : '📋';
  };

  const getLink = (type: 'note' | 'setlist') => {
    return type === 'note' ? '/notes' : '/setlists';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-yellow-400">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <Link 
                key={index}
                to={getLink(activity.type)}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="text-lg">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {getItemTitle(activity)}
                    </p>
                    <p className="text-xs text-gray-400 ml-2 flex-shrink-0">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {getItemDescription(activity)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No recent activity yet.</p>
            <p className="text-sm mt-2">Start capturing ideas to see your creative journey!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};