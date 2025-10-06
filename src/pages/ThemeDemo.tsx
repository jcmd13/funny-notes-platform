/**
 * Theme demonstration page showcasing enhanced visual design and theming
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../core/theme'
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveStack,
  StaggerContainer,
  StaggerItem,
  AnimatedCard,
  AnimatedModal,
  ThemeSwitcher,
  Button,

  Input,
  TagChip
} from '../components/ui'

function ThemeDemo() {
  const { theme } = useTheme()
  const [showModal, setShowModal] = useState(false)
  const [, setSelectedDemo] = useState<string | null>(null)

  const demoCards = [
    {
      id: 'animations',
      title: 'Smooth Animations',
      description: 'Experience fluid transitions and micro-interactions',
      icon: '✨',
      color: theme.colors.status.info
    },
    {
      id: 'responsive',
      title: 'Responsive Design',
      description: 'Optimized for mobile, tablet, and desktop',
      icon: '📱',
      color: theme.colors.status.success
    },
    {
      id: 'accessibility',
      title: 'Accessibility',
      description: 'Built with screen readers and keyboard navigation in mind',
      icon: '♿',
      color: theme.colors.status.warning
    },
    {
      id: 'themes',
      title: 'Multiple Themes',
      description: 'Comedy Club, Legal Pad, and Index Card themes',
      icon: '🎨',
      color: theme.colors.interactive.primary
    }
  ]

  const interactionDemos = [
    { class: 'hover-lift', label: 'Hover Lift' },
    { class: 'hover-glow', label: 'Hover Glow' },
    { class: 'hover-rotate', label: 'Hover Rotate' },
    { class: 'hover-bounce', label: 'Hover Bounce' },
    { class: 'press-scale', label: 'Press Scale' }
  ]

  return (
    <ResponsiveContainer maxWidth="2xl" className="min-h-screen">
      <ResponsiveStack spacing="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: theme.colors.text.accent }}
          >
            Enhanced Visual Design
          </h1>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            Explore the enhanced theming system with stage lighting effects, 
            smooth animations, and responsive design optimizations.
          </p>
        </motion.div>

        {/* Theme Switcher Demo */}
        <AnimatedCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-2xl font-semibold"
              style={{ color: theme.colors.text.primary }}
            >
              Theme Switcher
            </h2>
            <ThemeSwitcher />
          </div>
          <p style={{ color: theme.colors.text.secondary }}>
            Switch between Comedy Club, Legal Pad, and Index Card themes to see 
            the visual transformations in real-time.
          </p>
        </AnimatedCard>

        {/* Feature Cards */}
        <StaggerContainer>
          <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap="lg">
            {demoCards.map((card) => (
              <StaggerItem key={card.id}>
                <AnimatedCard 
                  className="p-6 cursor-pointer"
                  onClick={() => setSelectedDemo(card.id)}
                >
                  <div className="text-center">
                    <div 
                      className="text-4xl mb-4"
                      style={{ filter: `drop-shadow(0 0 10px ${card.color}40)` }}
                    >
                      {card.icon}
                    </div>
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {card.title}
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: theme.colors.text.muted }}
                    >
                      {card.description}
                    </p>
                  </div>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </ResponsiveGrid>
        </StaggerContainer>

        {/* Interactive Elements Demo */}
        <AnimatedCard className="p-6">
          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ color: theme.colors.text.primary }}
          >
            Interactive Elements
          </h2>
          
          <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3 }} gap="md" className="mb-6">
            {interactionDemos.map((demo) => (
              <div
                key={demo.class}
                className={`p-4 rounded-lg border text-center cursor-pointer ${demo.class}`}
                style={{
                  backgroundColor: theme.colors.background.elevated,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.primary
                }}
              >
                {demo.label}
              </div>
            ))}
          </ResponsiveGrid>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button className="btn-primary">
              Primary Button
            </Button>
            <Button 
              className="btn-secondary"
              style={{
                backgroundColor: theme.colors.interactive.secondary,
                borderColor: theme.colors.border.primary,
                color: theme.colors.text.primary
              }}
            >
              Secondary Button
            </Button>
            <Button 
              className="hover-glow"
              style={{
                backgroundColor: theme.colors.status.success,
                color: theme.colors.background.primary
              }}
            >
              Success Button
            </Button>
          </div>
        </AnimatedCard>

        {/* Form Elements Demo */}
        <AnimatedCard className="p-6">
          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ color: theme.colors.text.primary }}
          >
            Form Elements
          </h2>
          
          <ResponsiveStack spacing="md">
            <Input
              placeholder="Enter your comedy material..."
              className="input-base"
            />
            
            <div className="flex flex-wrap gap-2">
              <TagChip tag="observational" />
              <TagChip tag="storytelling" />
              <TagChip tag="crowd-work" />
              <TagChip tag="callback" />
            </div>
            
            <textarea
              placeholder="Write your set notes here..."
              rows={4}
              className="input-base resize-none"
              style={{
                backgroundColor: theme.colors.background.elevated,
                borderColor: theme.colors.border.primary,
                color: theme.colors.text.primary
              }}
            />
          </ResponsiveStack>
        </AnimatedCard>

        {/* Theme-Specific Effects Demo */}
        <AnimatedCard className="p-6">
          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ color: theme.colors.text.primary }}
          >
            Theme-Specific Effects
          </h2>
          
          <ResponsiveGrid cols={{ default: 1, lg: 3 }} gap="lg">
            {/* Comedy Club Effects */}
            <div className="text-center">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center stage-lights spotlight-effect"
                style={{ backgroundColor: theme.colors.background.secondary }}
              >
                <span className="text-2xl microphone-icon">🎤</span>
              </div>
              <h3 style={{ color: theme.colors.text.primary }}>Stage Lighting</h3>
              <p style={{ color: theme.colors.text.muted }}>
                Animated spotlights and glow effects
              </p>
            </div>

            {/* Legal Pad Effects */}
            <div className="text-center">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded ruled-paper handwriting-font flex items-center justify-center"
                style={{ backgroundColor: theme.colors.background.elevated }}
              >
                <span className="text-2xl">📝</span>
              </div>
              <h3 style={{ color: theme.colors.text.primary }}>Paper Texture</h3>
              <p style={{ color: theme.colors.text.muted }}>
                Ruled lines and handwriting aesthetics
              </p>
            </div>

            {/* Index Card Effects */}
            <div className="text-center">
              <div 
                className="w-20 h-20 mx-auto mb-4 rounded-lg index-card card-stack flex items-center justify-center"
                style={{ backgroundColor: theme.colors.background.elevated }}
              >
                <span className="text-2xl">🗃️</span>
              </div>
              <h3 style={{ color: theme.colors.text.primary }}>Card Stack</h3>
              <p style={{ color: theme.colors.text.muted }}>
                Layered card effects and shadows
              </p>
            </div>
          </ResponsiveGrid>
        </AnimatedCard>

        {/* Animation Showcase */}
        <AnimatedCard className="p-6">
          <h2 
            className="text-2xl font-semibold mb-6"
            style={{ color: theme.colors.text.primary }}
          >
            Animation Classes
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              'fade-in-up', 'fade-in-down', 'slide-in-left', 'slide-in-right',
              'scale-in', 'bounce-in', 'rotate-in', 'flip-in'
            ].map((animClass) => (
              <motion.div
                key={animClass}
                className={`p-3 rounded border text-center text-sm cursor-pointer ${animClass}`}
                style={{
                  backgroundColor: theme.colors.background.secondary,
                  borderColor: theme.colors.border.primary,
                  color: theme.colors.text.secondary
                }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  // Re-trigger animation by removing and adding class
                  const element = document.querySelector(`[data-anim="${animClass}"]`)
                  if (element) {
                    element.classList.remove(animClass)
                    setTimeout(() => element.classList.add(animClass), 10)
                  }
                }}
                data-anim={animClass}
              >
                {animClass}
              </motion.div>
            ))}
          </div>
        </AnimatedCard>

        {/* Modal Demo */}
        <div className="text-center">
          <Button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Show Enhanced Modal
          </Button>
        </div>
      </ResponsiveStack>

      {/* Enhanced Modal */}
      <AnimatedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Enhanced Modal Demo"
      >
        <ResponsiveStack spacing="md">
          <p style={{ color: theme.colors.text.secondary }}>
            This modal demonstrates the enhanced animation system with spring physics
            and backdrop blur effects.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button 
              onClick={() => setShowModal(false)}
              className="btn-secondary"
              style={{
                backgroundColor: theme.colors.interactive.secondary,
                borderColor: theme.colors.border.primary,
                color: theme.colors.text.primary
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => setShowModal(false)}
              className="btn-primary"
            >
              Confirm
            </Button>
          </div>
        </ResponsiveStack>
      </AnimatedModal>
    </ResponsiveContainer>
  )
}

export default ThemeDemo