import { useState, useEffect } from 'react'
import { usePWA } from '../../hooks/usePWA'

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  // Check if user previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    setDismissed(wasDismissed === 'true')
  }, [])

  const handleInstall = async () => {
    const success = await promptInstall()
    if (success) {
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!isInstallable || dismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-40">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">📱</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-1">
            Install Funny Notes
          </h3>
          <p className="text-xs text-gray-300 mb-3">
            Get the full app experience with offline access and faster loading.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleInstall}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-semibold rounded transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1 border border-gray-600 text-gray-300 text-xs rounded hover:bg-gray-700 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}