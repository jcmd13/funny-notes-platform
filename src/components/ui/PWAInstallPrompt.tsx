import { useState } from 'react'
import { usePWA } from '@hooks/usePWA'
import { Button } from './Button'
import { Modal } from './Modal'

/**
 * PWA installation prompt component
 */
export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Auto-show prompt after a delay if installable
  useState(() => {
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    }
  })

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const installed = await promptInstall()
      if (installed) {
        setShowPrompt(false)
      }
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if not installable or already dismissed
  if (!isInstallable || !showPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null
  }

  return (
    <Modal isOpen={showPrompt} onClose={handleDismiss} title="Install Funny Notes">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🎤</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">
              Install Funny Notes
            </h3>
            <p className="text-sm text-gray-400">
              Get the full app experience with offline access
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <CheckIcon />
            <span>Works offline - capture ideas anywhere</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckIcon />
            <span>Faster loading and better performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckIcon />
            <span>Native app-like experience</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckIcon />
            <span>No app store required</span>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1"
          >
            {isInstalling ? 'Installing...' : 'Install App'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleDismiss}
            className="flex-1"
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}