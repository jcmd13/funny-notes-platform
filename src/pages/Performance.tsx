import { useState } from 'react'
import { 
  PerformanceLogger, 
  PerformanceHistory, 
  PerformanceAnalytics, 
  PerformanceComparison 
} from '../components/performance'

type TabType = 'log' | 'history' | 'analytics' | 'comparison'

/**
 * Performance tracking page
 * Provides interface for logging performances, viewing history, analytics, and comparisons
 */
function Performance() {
  const [activeTab, setActiveTab] = useState<TabType>('log')

  const tabs = [
    { id: 'log' as const, label: 'Log Performance', icon: '📝' },
    { id: 'history' as const, label: 'History', icon: '📚' },
    { id: 'analytics' as const, label: 'Analytics', icon: '📊' },
    { id: 'comparison' as const, label: 'Compare', icon: '⚖️' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Performance Tracking</h1>
          <p className="text-gray-400 mt-1">
            Log performances, track feedback, and analyze your growth
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'log' && (
          <div className="max-w-2xl">
            <PerformanceLogger
              onPerformanceCreated={() => {
                // Switch to history tab after creating a performance
                setActiveTab('history')
              }}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <PerformanceHistory />
        )}

        {activeTab === 'analytics' && (
          <PerformanceAnalytics />
        )}

        {activeTab === 'comparison' && (
          <PerformanceComparison />
        )}
      </div>
    </div>
  )
}

export default Performance