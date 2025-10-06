import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test('Service worker registration and caching', async ({ page }) => {
    await page.goto('/');

    // Check service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return !!registration;
      }
      return false;
    });

    expect(swRegistered).toBe(true);

    // Check that assets are cached
    const cacheNames = await page.evaluate(async () => {
      return await caches.keys();
    });

    expect(cacheNames.length).toBeGreaterThan(0);
  });

  test('Offline functionality', async ({ page }) => {
    // First load the page online to cache resources
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.context().setOffline(true);

    // Reload the page - should still work from cache
    await page.reload();
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Should still be able to navigate
    await page.click('text=Capture');
    await expect(page).toHaveURL('/capture');

    // Should be able to create notes offline
    const textarea = page.locator('textarea[placeholder*="start typing"]');
    await textarea.fill('Offline note creation test');

    // Should show offline save indicator
    await expect(page.locator('text=Saved locally')).toBeVisible({ timeout: 3000 });

    // Go back online
    await page.context().setOffline(false);

    // Should sync when back online
    await expect(page.locator('text=Syncing')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Online')).toBeVisible({ timeout: 10000 });
  });

  test('Background sync functionality', async ({ page }) => {
    await page.goto('/capture');

    // Create a note while online
    const textarea = page.locator('textarea[placeholder*="start typing"]');
    await textarea.fill('Background sync test note');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });

    // Go offline
    await page.context().setOffline(true);

    // Create another note while offline
    await textarea.clear();
    await textarea.fill('Offline note for background sync');
    await expect(page.locator('text=Saved locally')).toBeVisible({ timeout: 3000 });

    // Go back online
    await page.context().setOffline(false);

    // Should trigger background sync
    await expect(page.locator('text=Syncing in background')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=All changes synced')).toBeVisible({ timeout: 15000 });
  });

  test('App manifest and installation', async ({ page }) => {
    await page.goto('/');

    // Check manifest is present
    const manifestContent = await page.evaluate(async () => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        const response = await fetch(manifestLink.getAttribute('href')!);
        return await response.json();
      }
      return null;
    });

    expect(manifestContent).toBeTruthy();
    expect(manifestContent.name).toBe('Funny Notes');
    expect(manifestContent.short_name).toBe('Funny Notes');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.start_url).toBe('/');
    expect(manifestContent.theme_color).toBeTruthy();
    expect(manifestContent.background_color).toBeTruthy();
    expect(manifestContent.icons).toHaveLength(expect.any(Number));

    // Check icons are accessible
    for (const icon of manifestContent.icons) {
      const iconResponse = await page.request.get(icon.src);
      expect(iconResponse.status()).toBe(200);
    }
  });

  test('Push notification setup', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);

    await page.goto('/');

    // Check notification permission
    const notificationPermission = await page.evaluate(() => {
      return Notification.permission;
    });

    expect(notificationPermission).toBe('granted');

    // Check push manager availability
    const pushManagerAvailable = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return 'pushManager' in registration;
      }
      return false;
    });

    expect(pushManagerAvailable).toBe(true);
  });

  test('Storage quota and persistence', async ({ page }) => {
    await page.goto('/');

    // Check storage estimate
    const storageEstimate = await page.evaluate(async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return await navigator.storage.estimate();
      }
      return null;
    });

    expect(storageEstimate).toBeTruthy();
    expect(typeof storageEstimate.quota).toBe('number');
    expect(typeof storageEstimate.usage).toBe('number');

    // Check persistent storage
    const persistentStorage = await page.evaluate(async () => {
      if ('storage' in navigator && 'persist' in navigator.storage) {
        return await navigator.storage.persist();
      }
      return false;
    });

    // Note: This may not always be granted, but we can check the API exists
    expect(typeof persistentStorage).toBe('boolean');
  });

  test('App update flow', async ({ page }) => {
    await page.goto('/');

    // Simulate app update by registering a new service worker
    await page.evaluate(() => {
      // Dispatch a custom event to simulate update available
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    });

    // Should show update notification
    await expect(page.locator('[data-testid="update-available"]')).toBeVisible({ timeout: 5000 });

    // Click update button
    await page.click('button:has-text("Update App")');

    // Should show updating indicator
    await expect(page.locator('text=Updating app')).toBeVisible();

    // Should reload after update
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=App updated successfully')).toBeVisible({ timeout: 10000 });
  });

  test('Cross-browser PWA compatibility', async ({ page, browserName }) => {
    await page.goto('/');

    // Check basic PWA features work across browsers
    const pwaSupportCheck = await page.evaluate(() => {
      const checks = {
        serviceWorker: 'serviceWorker' in navigator,
        cacheAPI: 'caches' in window,
        indexedDB: 'indexedDB' in window,
        webManifest: !!document.querySelector('link[rel="manifest"]'),
        fetchAPI: 'fetch' in window,
      };
      return checks;
    });

    // All browsers should support these core PWA features
    expect(pwaSupportCheck.serviceWorker).toBe(true);
    expect(pwaSupportCheck.cacheAPI).toBe(true);
    expect(pwaSupportCheck.indexedDB).toBe(true);
    expect(pwaSupportCheck.webManifest).toBe(true);
    expect(pwaSupportCheck.fetchAPI).toBe(true);

    // Browser-specific checks
    if (browserName === 'chromium') {
      const chromeFeatures = await page.evaluate(() => ({
        beforeInstallPrompt: 'onbeforeinstallprompt' in window,
        webShare: 'share' in navigator,
      }));
      
      expect(chromeFeatures.beforeInstallPrompt).toBe(true);
    }

    if (browserName === 'webkit') {
      // Safari-specific PWA features
      const safariFeatures = await page.evaluate(() => ({
        standalone: 'standalone' in navigator,
        touchIcon: !!document.querySelector('link[rel="apple-touch-icon"]'),
      }));
      
      expect(safariFeatures.touchIcon).toBe(true);
    }
  });

  test('Performance metrics and loading', async ({ page }) => {
    await page.goto('/');

    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    // PWA should load quickly
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // Less than 2 seconds
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500); // Less than 1.5 seconds

    // Check that critical resources are cached
    const cachedResources = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      let cachedCount = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cachedCount += keys.length;
      }
      
      return cachedCount;
    });

    expect(cachedResources).toBeGreaterThan(0);
  });

  test('Data persistence across sessions', async ({ page, context }) => {
    await page.goto('/capture');

    // Create a note
    const textarea = page.locator('textarea[placeholder*="start typing"]');
    await textarea.fill('Persistence test note');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });

    // Close and reopen browser context
    await context.close();
    const newContext = await page.context().browser()!.newContext();
    const newPage = await newContext.newPage();

    await newPage.goto('/notes');

    // Note should still be there
    await expect(newPage.locator('text=Persistence test note')).toBeVisible({ timeout: 5000 });

    await newContext.close();
  });
});