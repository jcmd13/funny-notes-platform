import { useState, useEffect } from 'react'

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }

    // Listen for custom events
    const handleOpenCommandPalette = () => open()
    const handleCloseModals = () => close()

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleOpenCommandPalette)
    window.addEventListener('close-modals', handleCloseModals)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
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