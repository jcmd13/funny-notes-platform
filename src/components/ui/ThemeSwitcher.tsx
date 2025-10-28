import { useTheme } from '../../core/theme'

/**
 * Theme switcher component for toggling between themes
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  
  // Safe fallback for theme mode
  const currentThemeMode = theme?.mode || 'comedy-club'
  
  const toggleTheme = () => {
    // Cycle through all available themes
    const themeKeys = ['comedy-club', 'legal-pad', 'index-card'] as const
    const currentIndex = themeKeys.indexOf(currentThemeMode)
    const nextIndex = (currentIndex + 1) % themeKeys.length
    setTheme(themeKeys[nextIndex])
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
      title={`Switch theme (Current: ${theme?.name || 'Comedy Club'}) - Click to cycle`}
    >
      {currentThemeMode === 'comedy-club' ? (
        <ComedyIcon />
      ) : currentThemeMode === 'legal-pad' ? (
        <PadIcon />
      ) : (
        <CardIcon />
      )}
    </button>
  )
}

function ComedyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10l1 16H6L7 4z" />
    </svg>
  )
}

function PadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}