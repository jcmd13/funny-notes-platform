/**
 * Theme system types and interfaces
 */

export type ThemeMode = 'comedy-club' | 'legal-pad' | 'index-card'

export interface ThemeColors {
  // Background colors
  background: {
    primary: string
    secondary: string
    tertiary: string
    elevated: string
  }
  
  // Text colors
  text: {
    primary: string
    secondary: string
    muted: string
    accent: string
  }
  
  // Border colors
  border: {
    primary: string
    secondary: string
    accent: string
  }
  
  // Interactive colors
  interactive: {
    primary: string
    primaryHover: string
    secondary: string
    secondaryHover: string
    danger: string
    dangerHover: string
  }
  
  // Status colors
  status: {
    success: string
    warning: string
    error: string
    info: string
  }
}

export interface ThemeConfig {
  mode: ThemeMode
  name: string
  description: string
  colors: ThemeColors
  fonts: {
    primary: string
    secondary: string
    mono: string
  }
  effects: {
    shadows: {
      sm: string
      md: string
      lg: string
      glow: string
    }
    animations: {
      fast: string
      normal: string
      slow: string
    }
  }
}

export interface ThemeContextValue {
  theme: ThemeConfig
  setTheme: (mode: ThemeMode) => void
  availableThemes: ThemeConfig[]
}