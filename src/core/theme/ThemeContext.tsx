/**
 * Theme context provider for managing application themes
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ThemeContextValue, ThemeMode } from './types'
import { themes, defaultTheme } from './themes'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'funny-notes-theme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    // Load theme from localStorage or use default (with safety check)
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode
      return savedTheme && themes[savedTheme] ? savedTheme : defaultTheme
    }
    return defaultTheme
  })

  const setTheme = (mode: ThemeMode) => {
    setCurrentTheme(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
    }
  }

  // Apply theme CSS variables to document root
  useEffect(() => {
    const theme = themes[currentTheme]
    const root = document.documentElement

    // Apply color variables
    root.style.setProperty('--color-bg-primary', theme.colors.background.primary)
    root.style.setProperty('--color-bg-secondary', theme.colors.background.secondary)
    root.style.setProperty('--color-bg-tertiary', theme.colors.background.tertiary)
    root.style.setProperty('--color-bg-elevated', theme.colors.background.elevated)

    root.style.setProperty('--color-text-primary', theme.colors.text.primary)
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
    root.style.setProperty('--color-text-muted', theme.colors.text.muted)
    root.style.setProperty('--color-text-accent', theme.colors.text.accent)

    root.style.setProperty('--color-border-primary', theme.colors.border.primary)
    root.style.setProperty('--color-border-secondary', theme.colors.border.secondary)
    root.style.setProperty('--color-border-accent', theme.colors.border.accent)

    root.style.setProperty('--color-interactive-primary', theme.colors.interactive.primary)
    root.style.setProperty('--color-interactive-primary-hover', theme.colors.interactive.primaryHover)
    root.style.setProperty('--color-interactive-secondary', theme.colors.interactive.secondary)
    root.style.setProperty('--color-interactive-secondary-hover', theme.colors.interactive.secondaryHover)
    root.style.setProperty('--color-interactive-danger', theme.colors.interactive.danger)
    root.style.setProperty('--color-interactive-danger-hover', theme.colors.interactive.dangerHover)

    root.style.setProperty('--color-status-success', theme.colors.status.success)
    root.style.setProperty('--color-status-warning', theme.colors.status.warning)
    root.style.setProperty('--color-status-error', theme.colors.status.error)
    root.style.setProperty('--color-status-info', theme.colors.status.info)

    // Apply font variables
    root.style.setProperty('--font-primary', theme.fonts.primary)
    root.style.setProperty('--font-secondary', theme.fonts.secondary)
    root.style.setProperty('--font-mono', theme.fonts.mono)

    // Apply effect variables
    root.style.setProperty('--shadow-sm', theme.effects.shadows.sm)
    root.style.setProperty('--shadow-md', theme.effects.shadows.md)
    root.style.setProperty('--shadow-lg', theme.effects.shadows.lg)
    root.style.setProperty('--shadow-glow', theme.effects.shadows.glow)

    root.style.setProperty('--animation-fast', theme.effects.animations.fast)
    root.style.setProperty('--animation-normal', theme.effects.animations.normal)
    root.style.setProperty('--animation-slow', theme.effects.animations.slow)

    // Apply theme class to body for theme-specific styles
    document.body.className = `theme-${currentTheme}`
  }, [currentTheme])

  const value: ThemeContextValue = {
    theme: themes[currentTheme],
    setTheme,
    availableThemes: Object.values(themes)
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}