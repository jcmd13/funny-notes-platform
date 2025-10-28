import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import { CommandPalette } from '../ui/CommandPalette'
import { usePWA } from '../../hooks/usePWA'

/**
 * Application header with branding and quick actions
 */
export function Header() {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const { 
    isOnline, 
    isInstallable, 
    isUpdateAvailable, 
    syncStatus,
    promptInstall,
    updateApp,
    triggerSync
  } = usePWA()

  const handleInstallClick = async () => {
    await promptInstall()
  }

  const handleUpdateClick = async () => {
    await updateApp()
  }

  const handleSyncClick = async () => {
    await triggerSync()
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        setShowCommandPalette(true)
      }
      if (event.key === 'Escape') {
        setShowCommandPalette(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

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
        
        {/* Status indicators and quick actions */}
        <div className="flex items-center space-x-2">
          {/* Offline/Online indicator */}
          <div className="flex items-center space-x-1">
            <div 
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}
              title={isOnline ? 'Online' : 'Offline'}
            />
            {!isOnline && (
              <span className="text-xs text-gray-400 hidden sm:inline">Offline</span>
            )}
          </div>

          {/* Sync status */}
          {syncStatus !== 'idle' && (
            <button
              onClick={handleSyncClick}
              className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              title={`Sync status: ${syncStatus}`}
            >
              <SyncIcon spinning={syncStatus === 'syncing'} />
            </button>
          )}

          {/* Update available indicator */}
          {isUpdateAvailable && (
            <button
              onClick={handleUpdateClick}
              className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
              title="Update available - click to update"
            >
              <UpdateIcon />
            </button>
          )}

          {/* Install PWA button */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
              title="Install app"
            >
              <InstallIcon />
            </button>
          )}

          {/* Theme switcher */}
          <ThemeSwitcher />

          {/* Global search */}
          <button 
            onClick={() => setShowCommandPalette(true)}
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
      
      {/* Command Palette */}
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
      />
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

function SyncIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg 
      className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
      />
    </svg>
  )
}

function UpdateIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  )
}

function InstallIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )
}