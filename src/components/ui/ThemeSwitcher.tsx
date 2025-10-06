/**
 * Enhanced theme switcher component with improved animations and visual feedback
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../core/theme'
import type { ThemeMode } from '../../core/theme/types'

interface ThemeSwitcherProps {
  className?: string
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, setTheme, availableThemes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const handleThemeChange = async (mode: ThemeMode) => {
    if (mode === theme.mode) {
      setIsOpen(false)
      return
    }

    setIsChanging(true)
    
    // Add a small delay for visual feedback
    setTimeout(() => {
      setTheme(mode)
      setIsChanging(false)
      setIsOpen(false)
    }, 200)
  }

  const getThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'comedy-club':
        return '🎤'
      case 'legal-pad':
        return '📝'
      case 'index-card':
        return '🗃️'
      default:
        return '🎨'
    }
  }

  const getThemePreview = (mode: ThemeMode) => {
    const themeConfig = availableThemes.find(t => t.mode === mode)
    if (!themeConfig) return null

    return (
      <div className="flex space-x-1 mt-2">
        <div 
          className="w-3 h-3 rounded-full border"
          style={{ 
            backgroundColor: themeConfig.colors.background.primary,
            borderColor: themeConfig.colors.border.primary
          }}
        />
        <div 
          className="w-3 h-3 rounded-full border"
          style={{ 
            backgroundColor: themeConfig.colors.interactive.primary,
            borderColor: themeConfig.colors.border.primary
          }}
        />
        <div 
          className="w-3 h-3 rounded-full border"
          style={{ 
            backgroundColor: themeConfig.colors.text.accent,
            borderColor: themeConfig.colors.border.primary
          }}
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-opacity-10 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent hover-lift"
        style={{
          color: theme.colors.text.secondary,
          backgroundColor: isOpen ? theme.colors.interactive.secondary + '40' : 'transparent'
        }}
        aria-label="Change theme"
        aria-expanded={isOpen}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.span 
          className="text-lg"
          animate={{ 
            rotate: isChanging ? 360 : 0,
            scale: isChanging ? 1.2 : 1
          }}
          transition={{ 
            rotate: { duration: 0.5, ease: "easeInOut" },
            scale: { duration: 0.2, ease: "easeInOut" }
          }}
        >
          {getThemeIcon(theme.mode)}
        </motion.span>
        <span className="hidden sm:inline text-sm font-medium">
          {theme.name}
        </span>
        <motion.svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown menu */}
            <motion.div
              className="absolute right-0 mt-3 w-72 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-sm"
              style={{
                backgroundColor: theme.colors.background.elevated + 'f0',
                borderColor: theme.colors.border.primary,
                boxShadow: theme.effects.shadows.lg + ', 0 0 0 1px ' + theme.colors.border.primary
              }}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ 
                duration: 0.2, 
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              <div className="p-2">
                <div 
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wide border-b"
                  style={{ 
                    color: theme.colors.text.muted,
                    borderColor: theme.colors.border.primary
                  }}
                >
                  Choose Your Theme
                </div>
                
                <div className="py-2 space-y-1">
                  {availableThemes.map((themeOption, index) => (
                    <motion.button
                      key={themeOption.mode}
                      onClick={() => handleThemeChange(themeOption.mode)}
                      className="w-full px-3 py-3 text-left flex items-start space-x-3 rounded-lg transition-all duration-200 group"
                      style={{
                        backgroundColor: theme.mode === themeOption.mode 
                          ? theme.colors.interactive.primary + '20' 
                          : 'transparent'
                      }}
                      whileHover={{ 
                        backgroundColor: theme.colors.interactive.secondary + '60',
                        scale: 1.02
                      }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <motion.span 
                        className="text-xl flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200"
                        whileHover={{ rotate: 10 }}
                      >
                        {getThemeIcon(themeOption.mode)}
                      </motion.span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div 
                            className="font-medium text-sm"
                            style={{ color: theme.colors.text.primary }}
                          >
                            {themeOption.name}
                          </div>
                          {theme.mode === themeOption.mode && (
                            <motion.span 
                              className="text-sm"
                              style={{ color: theme.colors.interactive.primary }}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              ✓
                            </motion.span>
                          )}
                        </div>
                        <div 
                          className="text-xs mt-1 leading-tight"
                          style={{ color: theme.colors.text.muted }}
                        >
                          {themeOption.description}
                        </div>
                        {getThemePreview(themeOption.mode)}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div 
                  className="px-3 py-2 text-xs border-t mt-2"
                  style={{ 
                    color: theme.colors.text.muted,
                    borderColor: theme.colors.border.primary
                  }}
                >
                  Theme preferences are saved automatically
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Theme change loading indicator */}
      <AnimatePresence>
        {isChanging && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: theme.colors.background.elevated + '80' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-4 h-4 border-2 border-t-transparent rounded-full"
              style={{ borderColor: theme.colors.interactive.primary }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}