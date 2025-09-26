import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Navigation } from './Navigation'

/**
 * Main application layout component
 * Provides the overall structure with header and navigation
 */
export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <Header />
      
      {/* Main content area with navigation */}
      <div className="flex-1 flex">
        {/* Desktop sidebar navigation */}
        <aside className="hidden md:block w-64 bg-gray-800 border-r border-gray-700">
          <Navigation variant="sidebar" />
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden bg-gray-800 border-t border-gray-700">
        <Navigation variant="bottom" />
      </div>
    </div>
  )
}