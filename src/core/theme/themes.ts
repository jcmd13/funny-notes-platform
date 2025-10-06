/**
 * Theme definitions for Funny Notes
 */

import type { ThemeConfig, ThemeMode } from './types'

export const comedyClubTheme: ThemeConfig = {
  mode: 'comedy-club',
  name: 'Comedy Club',
  description: 'Dark theme inspired by intimate comedy venues with warm stage lighting',
  colors: {
    background: {
      primary: '#0a0a0a',
      secondary: '#141414',
      tertiary: '#1f1f1f',
      elevated: '#1a1a1a'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#e2e8f0',
      muted: '#94a3b8',
      accent: '#fbbf24'
    },
    border: {
      primary: '#2d2d2d',
      secondary: '#404040',
      accent: '#fbbf24'
    },
    interactive: {
      primary: '#fbbf24',
      primaryHover: '#f59e0b',
      secondary: '#2d2d2d',
      secondaryHover: '#404040',
      danger: '#ef4444',
      dangerHover: '#dc2626'
    },
    status: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  fonts: {
    primary: "'Inter', system-ui, -apple-system, sans-serif",
    secondary: "'Bebas Neue', 'Impact', sans-serif",
    mono: "'JetBrains Mono', 'Courier New', monospace"
  },
  effects: {
    shadows: {
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
      md: '0 4px 12px -2px rgba(0, 0, 0, 0.4)',
      lg: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      glow: '0 0 30px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2)'
    },
    animations: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '600ms cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}

export const legalPadTheme: ThemeConfig = {
  mode: 'legal-pad',
  name: 'Legal Pad',
  description: 'Clean, paper-like theme with ruled lines and handwriting aesthetics',
  colors: {
    background: {
      primary: '#fefce8',
      secondary: '#fef3c7',
      tertiary: '#fde68a',
      elevated: '#ffffff'
    },
    text: {
      primary: '#1e293b',
      secondary: '#334155',
      muted: '#64748b',
      accent: '#1d4ed8'
    },
    border: {
      primary: '#cbd5e1',
      secondary: '#94a3b8',
      accent: '#1d4ed8'
    },
    interactive: {
      primary: '#1d4ed8',
      primaryHover: '#1e40af',
      secondary: '#f1f5f9',
      secondaryHover: '#e2e8f0',
      danger: '#dc2626',
      dangerHover: '#b91c1c'
    },
    status: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#1d4ed8'
    }
  },
  fonts: {
    primary: "'Kalam', 'Patrick Hand', 'Comic Sans MS', cursive",
    secondary: "'Courier Prime', 'Courier New', monospace",
    mono: "'Courier Prime', 'Courier New', monospace"
  },
  effects: {
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.12)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
      glow: '0 0 15px rgba(29, 78, 216, 0.25)'
    },
    animations: {
      fast: '150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      normal: '300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      slow: '500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  }
}

export const indexCardTheme: ThemeConfig = {
  mode: 'index-card',
  name: 'Index Card',
  description: 'Minimal card-based layout with clean typography and subtle shadows',
  colors: {
    background: {
      primary: '#f8fafc',
      secondary: '#f1f5f9',
      tertiary: '#e2e8f0',
      elevated: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      muted: '#64748b',
      accent: '#0f766e'
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      accent: '#0f766e'
    },
    interactive: {
      primary: '#0f766e',
      primaryHover: '#0d9488',
      secondary: '#f1f5f9',
      secondaryHover: '#e2e8f0',
      danger: '#dc2626',
      dangerHover: '#b91c1c'
    },
    status: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7'
    }
  },
  fonts: {
    primary: "'Inter', system-ui, -apple-system, sans-serif",
    secondary: "'IBM Plex Mono', 'Source Code Pro', monospace",
    mono: "'IBM Plex Mono', 'Source Code Pro', monospace"
  },
  effects: {
    shadows: {
      sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      glow: '0 0 20px rgba(15, 118, 110, 0.3), 0 0 40px rgba(15, 118, 110, 0.1)'
    },
    animations: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}

export const themes: Record<ThemeMode, ThemeConfig> = {
  'comedy-club': comedyClubTheme,
  'legal-pad': legalPadTheme,
  'index-card': indexCardTheme
}

export const defaultTheme: ThemeMode = 'comedy-club'