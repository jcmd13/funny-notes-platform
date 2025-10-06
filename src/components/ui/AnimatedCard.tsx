/**
 * Animated card component with theme support
 */

import type React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { useTheme } from '../../core/theme'

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'style'> {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'interactive'
  hover?: boolean
  className?: string
}

export function AnimatedCard({ 
  children, 
  variant = 'default',
  hover = true,
  className = '',
  ...motionProps 
}: AnimatedCardProps) {
  const { theme } = useTheme()

  const getCardStyles = () => {
    const baseStyles = {
      backgroundColor: variant === 'elevated' 
        ? theme.colors.background.elevated 
        : theme.colors.background.secondary,
      borderColor: theme.colors.border.primary,
      color: theme.colors.text.primary,
      boxShadow: theme.effects.shadows.md
    }

    return baseStyles
  }

  const hoverAnimation = hover ? {
    y: -4,
    boxShadow: theme.effects.shadows.lg,
    transition: { duration: 0.2 }
  } : {}

  const tapAnimation = {
    scale: 0.98,
    transition: { duration: 0.1 }
  }

  return (
    <motion.div
      className={`
        rounded-lg border p-4 cursor-pointer
        ${theme.mode === 'index-card' ? 'index-card' : ''}
        ${theme.mode === 'legal-pad' ? 'ruled-paper' : ''}
        ${theme.mode === 'comedy-club' ? 'stage-glow' : ''}
        ${className}
      `}
      style={getCardStyles()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={{ duration: 0.3 }}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}