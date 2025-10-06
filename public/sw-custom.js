/**
 * Custom Service Worker for Funny Notes PWA
 * Handles background sync and push notifications
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { BackgroundSync } from 'workbox-background-sync'

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Background sync for offline data
const bgSync = new BackgroundSync('funny-notes-sync', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours (specified in minutes)
})

// Cache strategies for different resource types
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        return `${request.url}?${Date.now()}`
      }
    }]
  })
)

registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources'
  })
)

// Handle background sync messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    // Queue sync operation
    bgSync.replayRequests()
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'funny-notes-sync') {
    event.waitUntil(syncOfflineData())
  }
})

// Handle push notifications (foundation for future backend)
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || []
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})

/**
 * Sync offline data when connection is restored
 */
async function syncOfflineData() {
  try {
    // This would integrate with your storage service
    // For now, we'll just log that sync is happening
    console.log('Background sync triggered - syncing offline data')
    
    // In a real implementation, you would:
    // 1. Get pending operations from IndexedDB
    // 2. Send them to your backend API
    // 3. Update local storage with server responses
    // 4. Clear pending operations queue
    
    return Promise.resolve()
  } catch (error) {
    console.error('Background sync failed:', error)
    throw error
  }
}

// Notify main app when update is available
self.addEventListener('install', (event) => {
  // Send message to main app about update
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_UPDATE_AVAILABLE'
      })
    })
  })
})