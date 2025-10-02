import { Link } from 'react-router-dom'

/**
 * Application header with branding and quick actions
 */
export function Header() {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="container mx-auto max-w-6xl flex items-center justify-between">
        {/* Logo and branding */}
        <Link to="/" className="flex items-center space-x-3 transition-colors hover:text-yellow-300">
          <div className="text-2xl">🎤</div>
          <div>
            <h1 className="text-xl font-bold text-yellow-400">Funny Notes</h1>
            <p className="text-xs text-gray-400 hidden sm:block">Comedy Material Manager</p>
          </div>
        </Link>
        
        {/* Quick actions */}
        <div className="flex items-center space-x-2">
          {/* Global search - will be implemented later */}
          <button 
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
            title="Search (Ctrl+K)"
          >
            <SearchIcon />
          </button>
          
          {/* Quick capture button */}
          <Link
            to="/capture"
            className="bg-yellow-500 text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors hover:bg-yellow-400"
          >
            <PlusIcon />
            <span className="hidden sm:inline">Capture</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

// Simple SVG icons
function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}