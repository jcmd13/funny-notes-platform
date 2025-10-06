import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Complete note capture and organization journey', async ({ page }) => {
    // Navigate to capture page
    await page.click('text=Capture');
    await expect(page).toHaveURL('/capture');

    // Create a text note
    const textarea = page.locator('textarea[placeholder*="start typing"]');
    await textarea.fill('Why did the chicken cross the road? To get to the other side!');

    // Add tags
    const tagInput = page.locator('input[placeholder*="add tags"]');
    await tagInput.fill('comedy');
    await tagInput.press('Enter');
    await tagInput.fill('classic');
    await tagInput.press('Enter');

    // Wait for auto-save indicator
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });

    // Navigate to notes page
    await page.click('text=Notes');
    await expect(page).toHaveURL('/notes');

    // Verify note appears in list
    await expect(page.locator('text=Why did the chicken cross the road?')).toBeVisible();
    await expect(page.locator('text=comedy')).toBeVisible();
    await expect(page.locator('text=classic')).toBeVisible();

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="search"]');
    await searchInput.fill('chicken');
    
    // Should still show the note
    await expect(page.locator('text=Why did the chicken cross the road?')).toBeVisible();

    // Clear search and search for something else
    await searchInput.clear();
    await searchInput.fill('nonexistent');
    
    // Should show no results
    await expect(page.locator('text=No notes found')).toBeVisible();
  });

  test('Voice capture workflow', async ({ page }) => {
    // Mock getUserMedia for voice capture
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices = {
        getUserMedia: () => Promise.resolve({
          getTracks: () => [{ stop: () => {} }],
        }),
      };
      
      // @ts-ignore
      window.MediaRecorder = class {
        static isTypeSupported = () => true;
        start = () => {};
        stop = () => {};
        addEventListener = (event: string, callback: Function) => {
          if (event === 'dataavailable') {
            setTimeout(() => callback({ 
              data: new Blob(['audio'], { type: 'audio/wav' }) 
            }), 100);
          }
          if (event === 'stop') {
            setTimeout(() => callback(), 150);
          }
        };
        removeEventListener = () => {};
      };
    });

    await page.goto('/capture');

    // Switch to voice capture tab
    await page.click('text=Voice');

    // Start recording
    await page.click('button:has-text("Start Recording")');
    
    // Should show recording indicator
    await expect(page.locator('text=Recording')).toBeVisible();

    // Stop recording
    await page.click('button:has-text("Stop Recording")');

    // Should show playback controls
    await expect(page.locator('button:has-text("Play")')).toBeVisible();

    // Should create a voice note
    await expect(page.locator('text=Voice note created')).toBeVisible({ timeout: 3000 });
  });

  test('SetList creation and rehearsal workflow', async ({ page }) => {
    // First create some notes to use in setlist
    await page.goto('/capture');
    
    const textarea = page.locator('textarea[placeholder*="start typing"]');
    await textarea.fill('Opening joke about airlines');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });

    await textarea.clear();
    await textarea.fill('Middle bit about social media');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });

    await textarea.clear();
    await textarea.fill('Closing story about family');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });

    // Navigate to setlists
    await page.click('text=SetLists');
    await expect(page).toHaveURL('/setlists');

    // Create new setlist
    await page.click('button:has-text("Create SetList")');

    // Enter setlist name
    const nameInput = page.locator('input[placeholder*="setlist name"]');
    await nameInput.fill('Comedy Club Set');

    // Add notes to setlist (simplified - actual implementation may vary)
    await page.click('text=Opening joke about airlines');
    await page.click('button:has-text("Add to SetList")');

    await page.click('text=Middle bit about social media');
    await page.click('button:has-text("Add to SetList")');

    // Save setlist
    await page.click('button:has-text("Save SetList")');

    // Verify setlist creation
    await expect(page.locator('text=Comedy Club Set')).toBeVisible();

    // Start rehearsal
    await page.click('button:has-text("Rehearse")');

    // Should navigate to rehearsal mode
    await expect(page.locator('text=Rehearsal Mode')).toBeVisible();
    
    // Should show first note
    await expect(page.locator('text=Opening joke about airlines')).toBeVisible();

    // Should have rehearsal controls
    await expect(page.locator('button:has-text("Start Timer")')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();

    // Test navigation
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Middle bit about social media')).toBeVisible();
  });

  test('Search and filter functionality', async ({ page }) => {
    // Create test notes with different tags
    await page.goto('/capture');
    
    const textarea = page.locator('textarea[placeholder*="start typing"]');
    const tagInput = page.locator('input[placeholder*="add tags"]');

    // Create first note
    await textarea.fill('Joke about animals');
    await tagInput.fill('comedy');
    await tagInput.press('Enter');
    await tagInput.fill('animals');
    await tagInput.press('Enter');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });

    // Create second note
    await textarea.clear();
    await textarea.fill('Story about relationships');
    await tagInput.clear();
    await tagInput.fill('comedy');
    await tagInput.press('Enter');
    await tagInput.fill('relationships');
    await tagInput.press('Enter');
    await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });

    // Navigate to notes
    await page.click('text=Notes');

    // Test text search
    const searchInput = page.locator('input[placeholder*="search"]');
    await searchInput.fill('animals');
    
    await expect(page.locator('text=Joke about animals')).toBeVisible();
    await expect(page.locator('text=Story about relationships')).not.toBeVisible();

    // Test tag filter
    await searchInput.clear();
    await page.click('button:has-text("Filter by Tags")');
    await page.click('text=relationships');
    
    await expect(page.locator('text=Story about relationships')).toBeVisible();
    await expect(page.locator('text=Joke about animals')).not.toBeVisible();

    // Clear filters
    await page.click('button:has-text("Clear Filters")');
    
    // Both notes should be visible
    await expect(page.locator('text=Joke about animals')).toBeVisible();
    await expect(page.locator('text=Story about relationships')).toBeVisible();
  });

  test('Bulk operations workflow', async ({ page }) => {
    // Create multiple test notes
    await page.goto('/capture');
    
    const textarea = page.locator('textarea[placeholder*="start typing"]');

    for (let i = 1; i <= 3; i++) {
      await textarea.clear();
      await textarea.fill(`Test joke number ${i}`);
      await expect(page.locator('text=Saved')).toBeVisible({ timeout: 3000 });
    }

    // Navigate to notes
    await page.click('text=Notes');

    // Enter selection mode
    await page.click('button:has-text("Select")');

    // Select multiple notes
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // Should show bulk actions
    await expect(page.locator('button:has-text("Delete Selected")')).toBeVisible();
    await expect(page.locator('button:has-text("Tag Selected")')).toBeVisible();

    // Test bulk tagging
    await page.click('button:has-text("Tag Selected")');
    const bulkTagInput = page.locator('input[placeholder*="add tags to selected"]');
    await bulkTagInput.fill('bulk-tagged');
    await page.click('button:has-text("Apply Tags")');

    // Exit selection mode
    await page.click('button:has-text("Cancel")');

    // Verify tags were applied
    await expect(page.locator('text=bulk-tagged').first()).toBeVisible();
  });

  test('Offline functionality', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    await page.goto('/capture');

    // Should still be able to create notes offline
    const textarea = page.locator('textarea[placeholder*="start typing"]');
    await textarea.fill('Offline joke creation');

    // Should show offline indicator
    await expect(page.locator('text=Offline')).toBeVisible();

    // Should still save locally
    await expect(page.locator('text=Saved locally')).toBeVisible({ timeout: 3000 });

    // Go back online
    await page.context().setOffline(false);

    // Should show sync indicator
    await expect(page.locator('text=Syncing')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 });
  });

  test('PWA installation flow', async ({ page }) => {
    // This test would check PWA installation prompts
    // Note: Actual PWA testing requires specific browser setup
    
    await page.goto('/');

    // Check for PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');

    // Check for service worker registration
    const swRegistration = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistration).toBe(true);

    // Check for PWA install prompt (would appear under certain conditions)
    // This is browser-dependent and may not always be testable
  });

  test('Responsive design across viewports', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Should show mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    // Should adapt layout
    await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();

    // Should show desktop layout
    await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
  });

  test('Keyboard navigation and accessibility', async ({ page }) => {
    await page.goto('/');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Should focus on first interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Test global keyboard shortcuts
    await page.keyboard.press('Control+k');
    
    // Should open search/command palette
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();

    // Test escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible();

    // Test capture shortcut
    await page.keyboard.press('Control+n');
    await expect(page).toHaveURL('/capture');
  });
});