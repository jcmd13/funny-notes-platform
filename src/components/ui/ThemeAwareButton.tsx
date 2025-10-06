/**
 * Theme-aware button component with enhanced animations
 */

import type React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useTheme } from '../../core/theme'

interface ThemeAwareButtonProps extends Omit<HTMLMotionProps<'button'>, 'style'> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  className?: string
}

export function ThemeAwareButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...motionProps
}: ThemeAwareButtonProps) {
  const { theme } = useTheme()

  const getButtonStyles = () => {
    const baseStyles = {
      fontFamily: theme.fonts.primary,
      transition: `all ${theme.effects.animations.fast}`,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.6 : 1
    }

    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.interactive.primary,
        color: theme.mode === 'comedy-club' ? '#1f2937' : '#ffffff',
        borderColor: theme.colors.interactive.primary
      },
      secondary: {
        backgroundColor: theme.colors.interactive.secondary,
        color: theme.colors.text.primary,
        borderColor: theme.colors.border.primary
      },
      danger: {
        backgroundColor: theme.colors.interactive.danger,
        color: '#ffffff',
        borderColor: theme.colors.interactive.danger
      },
      ghost: {
        backgroundColor: 'transparent',
        color: theme.colors.text.secondary,
        borderColor: 'transparent'
      }
    }

    return { ...baseStyles, ...variantStyles[variant] }
  }

  const getSizeClasses = () => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }
    return sizeClasses[size]
  }

  const getHoverStyles = () => {
    if (disabled || loading) return {}

    const hoverStyles = {
      primary: { backgroundColor: theme.colors.interactive.primaryHover },
      secondary: { backgroundColor: theme.colors.interactive.secondaryHover },
      danger: { backgroundColor: theme.colors.interactive.dangerHover },
      ghost: { backgroundColor: theme.colors.interactive.secondary + '20' }
    }

    return hoverStyles[variant]
  }

  const getThemeSpecificEffects = () => {
    switch (theme.mode) {
      case 'comedy-club':
        return variant === 'primary' ? 'hover-glow' : ''
      case 'legal-pad':
        return 'ink-effect'
      case 'index-card':
        return 'hover-lift'
      default:
        return ''
    }
  }

  return (
    <motion.button
      className={`
        inline-flex items-center justify-center
        font-medium rounded-md border
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${getSizeClasses()}
        ${getThemeSpecificEffects()}
        ${className}
      `}
      style={{
        ...getButtonStyles(),
        // Focus ring handled by CSS classes
      }}
      whileHover={getHoverStyles()}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
      disabled={disabled || loading}
      {...motionProps}
    >
      {loading && (
        <motion.div
          className="mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.div>
      )}
      {children}
    </motion.button>
  )
}