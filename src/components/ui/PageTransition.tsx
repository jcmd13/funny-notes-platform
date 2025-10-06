/**
 * Enhanced page transition component with theme-aware animations
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../core/theme'
import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const { theme } = useTheme()

  // Different transition styles based on theme
  const getTransitionVariants = () => {
    switch (theme.mode) {
      case 'comedy-club':
        return {
          initial: { 
            opacity: 0, 
            scale: 0.95,
            filter: 'brightness(0.5)'
          },
          animate: { 
            opacity: 1, 
            scale: 1,
            filter: 'brightness(1)'
          },
          exit: { 
            opacity: 0, 
            scale: 1.05,
            filter: 'brightness(0.5)'
          }
        }
      case 'legal-pad':
        return {
          initial: { 
            opacity: 0, 
            x: 20,
            rotate: 1
          },
          animate: { 
            opacity: 1, 
            x: 0,
            rotate: 0
          },
          exit: { 
            opacity: 0, 
            x: -20,
            rotate: -1
          }
        }
      case 'index-card':
        return {
          initial: { 
            opacity: 0, 
            y: 30,
            rotateX: -10
          },
          animate: { 
            opacity: 1, 
            y: 0,
            rotateX: 0
          },
          exit: { 
            opacity: 0, 
            y: -30,
            rotateX: 10
          }
        }
      default:
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 }
        }
    }
  }

  const variants = getTransitionVariants()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Staggered animation container for lists and grids
 */
interface StaggerContainerProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function StaggerContainer({ children, className = '', delay = 0.1 }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: delay
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Individual stagger item
 */
interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className = '' }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Floating action button with enhanced animations
 */
interface AnimatedFABProps {
  onClick: () => void
  icon: ReactNode
  label: string
  className?: string
}

export function AnimatedFAB({ onClick, icon, label, className = '' }: AnimatedFABProps) {
  const { theme } = useTheme()

  return (
    <motion.button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 ${className}`}
      style={{
        backgroundColor: theme.colors.interactive.primary,
        color: theme.colors.background.primary,
        boxShadow: theme.effects.shadows.glow
      }}
      whileHover={{ 
        scale: 1.1,
        boxShadow: theme.effects.shadows.glow + ', 0 8px 25px rgba(0, 0, 0, 0.2)'
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      aria-label={label}
    >
      <motion.div
        whileHover={{ rotate: 15 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.div>
    </motion.button>
  )
}

/**
 * Modal with enhanced animations
 */
interface AnimatedModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function AnimatedModal({ isOpen, onClose, children, title }: AnimatedModalProps) {
  const { theme } = useTheme()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              className="w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: theme.colors.background.elevated,
                borderColor: theme.colors.border.primary
              }}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div 
                  className="px-6 py-4 border-b"
                  style={{ borderColor: theme.colors.border.primary }}
                >
                  <h2 
                    className="text-lg font-semibold"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {title}
                  </h2>
                </div>
              )}
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Card with hover animations
 */
interface AnimatedCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function AnimatedCard({ children, className = '', onClick, hover = true }: AnimatedCardProps) {
  const { theme } = useTheme()

  return (
    <motion.div
      className={`rounded-lg border transition-all duration-200 ${className} ${theme.mode === 'index-card' ? 'index-card' : ''}`}
      style={{
        backgroundColor: theme.colors.background.elevated,
        borderColor: theme.colors.border.primary
      }}
      whileHover={hover ? { 
        y: -4,
        boxShadow: theme.effects.shadows.lg
      } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}