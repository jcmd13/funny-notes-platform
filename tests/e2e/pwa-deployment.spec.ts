import { test, expect } from '@playwright/test'

test.describe('PWA Deployment Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load main page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Funny Notes/)
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should have valid PWA manifest', async ({ page }) => {
    // Check manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toBeAttached()
    
    // Fetch and validate manifest
    const manifestHref = await manifestLink.getAttribute('href')
    const manifestResponse = await page.request.get(manifestHref!)
    expect(manifestResponse.status()).toBe(200)
    
    const manifest = await manifestResponse.json()
    expect(manifest.name).toBe('Funny Notes - Comedy Material Manager')
    expect(manifest.short_name).toBe('FunnyNotes')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons).toHaveLength(4)
  })

  test('should register service worker', async ({ page }) => {
    // Wait for service worker registration
    await page.waitForFunction(() => 'serviceWorker' in navigator)
    
    const swRegistration = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      return {
        active: !!registration?.active,
        scope: registration?.scope
      }
    })
    
    expect(swRegistration.active).toBe(true)
    expect(swRegistration.scope).toContain('/')
  })

  test('should show install prompt on supported browsers', async ({ page, browserName }) => {
    // Skip on Firefox as it doesn't support beforeinstallprompt
    test.skip(browserName === 'firefox', 'Firefox does not support PWA installation prompts')
    
    // Simulate beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
    })
    
    // Check if install prompt appears
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible()
  })

  test('should work offline after initial load', async ({ page }) => {
    // Load the page first
    await page.waitForLoadState('networkidle')
    
    // Go offline
    await page.context().setOffline(true)
    
    // Navigate to different pages
    await page.click('a[href="/capture"]')
    await expect(page.locator('h1')).toContainText('Capture')
    
    await page.click('a[href="/notes"]')
    await expect(page.locator('h1')).toContainText('Notes')
    
    // Test offline functionality
    await page.fill('[data-testid="text-capture-input"]', 'Offline test note')
    await page.click('[data-testid="save-note-button"]')
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
  })

  test('should cache static assets', async ({ page }) => {
    // Load page and wait for caching
    await page.waitForLoadState('networkidle')
    
    // Check if assets are cached
    const cacheNames = await page.evaluate(async () => {
      return await caches.keys()
    })
    
    expect(cacheNames.length).toBeGreaterThan(0)
    expect(cacheNames.some(name => name.includes('workbox'))).toBe(true)
  })

  test('should handle app updates', async ({ page }) => {
    // Wait for service worker
    await page.waitForFunction(() => 'serviceWorker' in navigator)
    
    // Simulate app update
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        // Simulate update found
        const event = new Event('updatefound')
        registration.dispatchEvent(event)
      }
    })
    
    // Should show update notification
    await expect(page.locator('[data-testid="app-update-notification"]')).toBeVisible()
  })
})

test.describe('Cross-Browser Compatibility', () => {
  test('should work in Chrome', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test')
    
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Test Chrome-specific features
    await page.evaluate(() => {
      expect('serviceWorker' in navigator).toBe(true)
      expect('indexedDB' in window).toBe(true)
      expect('caches' in window).toBe(true)
    })
  })

  test('should work in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test')
    
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Test Firefox compatibility
    await page.evaluate(() => {
      expect('serviceWorker' in navigator).toBe(true)
      expect('indexedDB' in window).toBe(true)
    })
  })

  test('should work in Safari/WebKit', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test')
    
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Test Safari compatibility
    await page.evaluate(() => {
      expect('serviceWorker' in navigator).toBe(true)
      expect('indexedDB' in window).toBe(true)
    })
  })
})

test.describe('Performance Validation', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/')
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const metrics = {
            fcp: 0,
            lcp: 0,
            cls: 0
          }
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime
            }
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime
            }
            if (entry.entryType === 'layout-shift') {
              metrics.cls += entry.value
            }
          })
          
          resolve(metrics)
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] })
        
        // Fallback timeout
        setTimeout(() => resolve({ fcp: 0, lcp: 0, cls: 0 }), 5000)
      })
    })
    
    // Validate Core Web Vitals thresholds
    expect((metrics as any).fcp).toBeLessThan(2000) // FCP < 2s
    expect((metrics as any).lcp).toBeLessThan(2500) // LCP < 2.5s
    expect((metrics as any).cls).toBeLessThan(0.1)  // CLS < 0.1
  })

  test('should have efficient bundle sizes', async ({ page }) => {
    await page.goto('/')
    
    // Check resource sizes
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        size: (entry as any).transferSize || 0,
        type: entry.name.split('.').pop()
      }))
    })
    
    const jsResources = resources.filter(r => r.type === 'js')
    const cssResources = resources.filter(r => r.type === 'css')
    
    // Validate bundle sizes
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0)
    const totalCssSize = cssResources.reduce((sum, r) => sum + r.size, 0)
    
    expect(totalJsSize).toBeLessThan(1024 * 1024) // JS < 1MB
    expect(totalCssSize).toBeLessThan(100 * 1024) // CSS < 100KB
  })
})