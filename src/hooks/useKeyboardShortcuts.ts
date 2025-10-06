import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  callback: (event: KeyboardEvent) => void
  description?: string
  preventDefault?: boolean
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean
  preventDefault?: boolean
}

/**
 * Hook for managing global keyboard shortcuts
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options
  const shortcutsRef = useRef(shortcuts)

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      // Allow Escape key to work in input fields
      if (event.key !== 'Escape') return
    }

    for (const shortcut of shortcutsRef.current) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = !!event.ctrlKey === !!shortcut.ctrlKey
      const altMatches = !!event.altKey === !!shortcut.altKey
      const shiftMatches = !!event.shiftKey === !!shortcut.shiftKey
      const metaMatches = !!event.metaKey === !!shortcut.metaKey

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        if (shortcut.preventDefault ?? preventDefault) {
          event.preventDefault()
          event.stopPropagation()
        }
        shortcut.callback(event)
        break
      }
    }
  }, [enabled, preventDefault])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

/**
 * Global keyboard shortcuts hook for the entire app
 */
export const useGlobalKeyboardShortcuts = () => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      callback: () => {
        // Navigate to capture page
        window.location.hash = '#/capture'
      },
      description: 'New note (Ctrl+N)'
    },
    {
      key: 'k',
      ctrlKey: true,
      callback: () => {
        // Trigger global search modal
        const event = new CustomEvent('open-command-palette')
        window.dispatchEvent(event)
      },
      description: 'Open search (Ctrl+K)'
    },
    {
      key: 'Escape',
      callback: () => {
        // Close modals and overlays
        const event = new CustomEvent('close-modals')
        window.dispatchEvent(event)
      },
      description: 'Close modals (Esc)'
    },
    {
      key: '/',
      callback: (event) => {
        // Focus search if available
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        if (searchInput) {
          event.preventDefault()
          searchInput.focus()
        }
      },
      description: 'Focus search (/)'
    }
  ]

  useKeyboardShortcuts(shortcuts)

  return shortcuts
}