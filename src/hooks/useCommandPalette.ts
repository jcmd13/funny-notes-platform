import { useState, useEffect } from 'react'

/**
 * Hook for managing the command palette state
 */
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  // Listen for global events to open/close the command palette
  useEffect(() => {
    const handleOpenCommandPalette = () => {
      open()
    }

    const handleCloseModals = () => {
      close()
    }

    window.addEventListener('open-command-palette', handleOpenCommandPalette)
    window.addEventListener('close-modals', handleCloseModals)

    return () => {
      window.removeEventListener('open-command-palette', handleOpenCommandPalette)
      window.removeEventListener('close-modals', handleCloseModals)
    }
  }, [])

  return {
    isOpen,
    open,
    close,
    toggle
  }
}