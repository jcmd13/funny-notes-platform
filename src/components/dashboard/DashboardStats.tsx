import React from 'react';
import { Card, LoadingSpinner } from '../ui';

interface DashboardStatsProps {
  stats: {
    notes: number;
    setLists: number;
    venues: number;
    contacts: number;
  };
  loading: boolean;
  errors: {
    notes?: Error;
    setLists?: Error;
    venues?: Error;
    contacts?: Error;
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading, errors }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Total Notes',
      value: stats.notes,
      icon: '📝',
      description: 'Ideas captured',
      error: errors.notes
    },
    {
      title: 'Set Lists',
      value: stats.setLists,
      icon: '📋',
      description: 'Performance ready',
      error: errors.setLists
    },
    {
      title: 'Venues',
      value: stats.venues,
      icon: '🏢',
      description: 'Places to perform',
      error: errors.venues
    },
    {
      title: 'Contacts',
      value: stats.contacts,
      icon: '👥',
      description: 'Industry connections',
      error: errors.contacts
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <StatCard key={index} {...item} />
      ))}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  description: string;
  error?: Error;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, error }) => {
  return (
    <Card className={`p-4 ${error ? 'border-red-600 bg-red-900/20' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${error ? 'text-red-400' : 'text-white'}`}>
            {error ? '!' : value.toString()}
          </p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className="text-2xl">{error ? '⚠️' : icon}</div>
      </div>
    </Card>
  );
};