import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook for managing focus in modals and overlays
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      if (!containerRef.current) return []
      
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ')

      return Array.from(
        containerRef.current.querySelectorAll(focusableSelectors)
      ) as HTMLElement[]
    }

    // Focus the first focusable element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab: move to previous element
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: move to next element
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus to the previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isActive])

  return containerRef
}

/**
 * Hook for managing focus announcements for screen readers
 */
export const useFocusAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove the announcement after a short delay
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  return { announce }
}

/**
 * Hook for managing keyboard navigation in lists
 */
export const useKeyboardNavigation = <T extends HTMLElement>(
  items: T[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical'
    onSelect?: (index: number, item: T) => void
  } = {}
) => {
  const { loop = true, orientation = 'vertical', onSelect } = options
  const currentIndex = useRef(0)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (items.length === 0) return

    let newIndex = currentIndex.current

    switch (event.key) {
      case orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight':
        event.preventDefault()
        newIndex = loop 
          ? (currentIndex.current + 1) % items.length
          : Math.min(currentIndex.current + 1, items.length - 1)
        break

      case orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft':
        event.preventDefault()
        newIndex = loop
          ? currentIndex.current === 0 ? items.length - 1 : currentIndex.current - 1
          : Math.max(currentIndex.current - 1, 0)
        break

      case 'Home':
        event.preventDefault()
        newIndex = 0
        break

      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect?.(currentIndex.current, items[currentIndex.current])
        return

      default:
        return
    }

    currentIndex.current = newIndex
    items[newIndex]?.focus()
  }, [items, loop, orientation, onSelect])

  const setCurrentIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      currentIndex.current = index
      items[index]?.focus()
    }
  }, [items])

  return {
    handleKeyDown,
    setCurrentIndex,
    currentIndex: currentIndex.current
  }
}

/**
 * Hook for managing skip links for accessibility
 */
export const useSkipLinks = () => {
  useEffect(() => {
    // Create skip link if it doesn't exist
    if (!document.querySelector('#skip-to-main')) {
      const skipLink = document.createElement('a')
      skipLink.id = 'skip-to-main'
      skipLink.href = '#main-content'
      skipLink.textContent = 'Skip to main content'
      skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded'
      
      document.body.insertBefore(skipLink, document.body.firstChild)
    }

    // Ensure main content area has proper ID
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]')
    if (mainContent && !mainContent.id) {
      mainContent.id = 'main-content'
    }
  }, [])
}

/**
 * Hook for managing reduced motion preferences
 */
export const useReducedMotion = () => {
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion.current = event.matches
      
      // Update CSS custom property for conditional animations
      document.documentElement.style.setProperty(
        '--animation-duration',
        event.matches ? '0ms' : '300ms'
      )
    }

    mediaQuery.addEventListener('change', handleChange)
    
    // Set initial value
    handleChange(mediaQuery as any)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion.current
}

/**
 * Hook for managing ARIA live regions
 */
export const useAriaLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      liveRegion.id = 'aria-live-region'
      
      document.body.appendChild(liveRegion)
      liveRegionRef.current = liveRegion
    }

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current)
      }
    }
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority)
      liveRegionRef.current.textContent = message
      
      // Clear the message after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  return { announce }
}