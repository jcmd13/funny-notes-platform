import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

interface NavigationProps {
  variant: 'sidebar' | 'bottom'
}

/**
 * Navigation component with responsive design
 * Shows as sidebar on desktop and bottom nav on mobile
 */
export function Navigation({ variant }: NavigationProps) {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: <HomeIcon />,
      exact: true
    },
    {
      to: '/capture',
      label: 'Capture',
      icon: <CaptureIcon />
    },
    {
      to: '/notes',
      label: 'Notes',
      icon: <NotesIcon />
    },
    {
      to: '/setlists',
      label: 'Set Lists',
      icon: <SetListIcon />
    },
    {
      to: '/venues',
      label: 'Venues',
      icon: <VenuesIcon />
    },
    {
      to: '/contacts',
      label: 'Contacts',
      icon: <ContactsIcon />
    }
  ]

  if (variant === 'sidebar') {
    return (
      <nav className="p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                clsx(
                  'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-yellow-500 text-gray-900'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )
              }
            >
              <span className="w-5 h-5">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    )
  }

  // Bottom navigation for mobile
  return (
    <nav className="px-2 py-1">
      <div className="flex justify-around">
        {navItems.slice(0, 5).map((item) => ( // Show only first 5 items on mobile
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center px-2 py-2 text-xs font-medium transition-colors min-w-0',
                isActive
                  ? 'text-yellow-400'
                  : 'text-gray-400 hover:text-gray-200'
              )
            }
          >
            <span className="w-5 h-5 mb-1">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// Navigation icons
function HomeIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function CaptureIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function SetListIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
}

function VenuesIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}

function ContactsIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}