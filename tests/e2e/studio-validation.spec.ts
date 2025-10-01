import { test, expect } from '@playwright/test';

test.describe('Enterprise Streaming Studio Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/stream/studio');

    // Wait for the page to finish loading and get past the loading state
    await page.waitForFunction(() => {
      const loadingText = document.querySelector('text=Loading Studio...');
      return !loadingText || loadingText.textContent !== 'Loading Studio...';
    }, { timeout: 60000 });
  });

  test('should load new enterprise streaming studio design', async ({ page }) => {
    // Wait for either the studio dashboard or error state to appear
    await page.waitForSelector('text=Live Studio, text=Studio Unavailable', { timeout: 60000 });

    // Check for our new studio header elements
    await expect(page.locator('text=Live Studio')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Live Preview')).toBeVisible({ timeout: 30000 });

    // Verify connection status indicator is visible
    await expect(page.locator('.bg-green-400, .bg-red-400')).toBeVisible();

    // Check for streaming controls
    await expect(page.locator('text=Overlays')).toBeVisible();
    await expect(page.locator('text=EngageMax™')).toBeVisible();
  });

  test('should display modern tab navigation', async ({ page }) => {
    // Check for our new tab design with descriptions
    await expect(page.locator('text=Overlays')).toBeVisible();
    await expect(page.locator('text=Visual elements & graphics')).toBeVisible();

    await expect(page.locator('text=EngageMax™')).toBeVisible();
    await expect(page.locator('text=Polls, reactions & CTAs')).toBeVisible();

    await expect(page.locator('text=AutoOffer™')).toBeVisible();
    await expect(page.locator('text=Dynamic pricing & A/B tests')).toBeVisible();
  });

  test('should show professional live preview with controls', async ({ page }) => {
    // Check for live preview elements
    await expect(page.locator('text=Live Preview')).toBeVisible();

    // Check for demo mode or live stream indicators
    await expect(page.locator('text=Demo Mode, text=Live Stream')).toHaveCount({ min: 1 });

    // Check for fullscreen button
    await expect(page.locator('button:has-text("Fullscreen")')).toBeVisible();

    // Verify responsive dimensions are displayed
    await expect(page.locator('text=/\d+ × \d+/')).toBeVisible();
  });

  test('should have modern gradient styling', async ({ page }) => {
    // Check that we have gradients (indicating our design consistency)
    const hasGradientElements = await page.locator('[class*="gradient"]').count();
    expect(hasGradientElements).toBeGreaterThan(0);

    // Check for backdrop blur elements (modern design)
    const hasBackdropBlur = await page.locator('[class*="backdrop-blur"]').count();
    expect(hasBackdropBlur).toBeGreaterThan(0);
  });

  test('should show stream health and viewer count', async ({ page }) => {
    // Check for viewer count display (flexible number format)
    await expect(page.locator('text=/\d{1,3}(,\d{3})* viewers?/')).toBeVisible();

    // Check for live/offline status
    await expect(page.locator('text=LIVE, text=OFFLINE')).toHaveCount({ min: 1 });

    // Check for connection status indicators
    await expect(page.locator('.bg-green-400, .bg-red-400')).toBeVisible();
  });

  test('should handle tab switching with animations', async ({ page }) => {
    // Test tab switching works
    await page.click('text=EngageMax™');

    // Should switch content
    await expect(page.locator('text=Polls, reactions & CTAs')).toBeVisible();

    // Switch to AutoOffer
    await page.click('text=AutoOffer™');
    await expect(page.locator('text=Dynamic pricing & A/B tests')).toBeVisible();

    // Switch back to Overlays
    await page.click('text=Overlays');
    await expect(page.locator('text=Visual elements & graphics')).toBeVisible();
  });
});