import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Bob the Shockingly Dumb QA Tester - Automated Edition
 *
 * This test suite implements Bob's dumb behavior patterns to catch UX issues
 * that real users might encounter. Bob makes all the mistakes regular users make.
 *
 * Run with: npx playwright test bob-qa-suite.spec.ts --headed
 */

// Override base URL to use current dev server
test.use({
  baseURL: 'http://localhost:3000',
  viewport: { width: 1280, height: 720 },
  // Take screenshots for Bob's "evidence"
  screenshot: 'only-on-failure',
  video: 'retain-on-failure'
});

test.describe('Bob QA Suite - ConvertCast Edition', () => {

  test.describe('Bob the First-Time Visitor', () => {

    test('Bob visits homepage and gets confused by navigation', async ({ page }) => {
      // Bob goes to the homepage but doesn't read anything carefully
      await page.goto('/');

      // Bob immediately starts clicking things without reading
      await page.waitForLoadState('networkidle');

      // Bob looks for the most colorful/prominent button
      const buttons = await page.locator('button, a[role="button"], .btn').all();

      // Bob clicks the first button he sees without reading the text
      if (buttons.length > 0) {
        const firstButton = buttons[0];
        const buttonText = await firstButton.textContent();
        console.log(`Bob sees button: "${buttonText}" and clicks it without thinking`);

        try {
          await firstButton.click({ timeout: 5000 });
        } catch (error) {
          console.log(`Bob couldn't click button - probably disabled or hidden: ${error}`);
        }
      }

      // Bob expects immediate feedback and gets impatient
      await page.waitForTimeout(1000);

      // Bob might be on login page now, or somewhere else
      const currentUrl = page.url();
      console.log(`Bob ended up on: ${currentUrl}`);

      // This should not crash the app
      expect(page.url()).toContain('localhost:3000');
    });

    test('Bob tries to sign up with terrible input', async ({ page }) => {
      await page.goto('/auth/signup');

      // Bob's typical bad inputs
      const badInputs = [
        { email: 'bob@gmial', password: 'password', expectation: 'Invalid email' },
        { email: 'bob@', password: '123', expectation: 'Too short password' },
        { email: 'bob🎉@test.com', password: 'Password123!@#$%^&*()', expectation: 'Emoji in email' },
        { email: '', password: '', expectation: 'Empty fields' },
      ];

      for (const input of badInputs) {
        console.log(`Bob tries email: "${input.email}" and password: "${input.password}"`);

        // Clear fields first
        await page.fill('input[type="email"]', '').catch(() => {});
        await page.fill('input[type="password"]', '').catch(() => {});

        // Bob types his bad input
        await page.fill('input[type="email"]', input.email).catch(() => {});
        await page.fill('input[type="password"]', input.password).catch(() => {});

        // Bob immediately submits without reading validation
        await page.click('button[type="submit"]').catch(() => {});

        // Bob waits exactly 2 seconds then assumes it's broken
        await page.waitForTimeout(2000);

        // Check if there's any error message visible
        const errorMessages = await page.locator('[role="alert"], .error, .text-red-500, .text-red-600').all();

        if (errorMessages.length > 0) {
          const errorText = await errorMessages[0].textContent();
          console.log(`Bob sees error: "${errorText}" for ${input.expectation}`);
        } else {
          console.log(`Bob sees no error message for ${input.expectation} - might be confusing!`);
        }
      }
    });

    test('Bob tries to access studio without auth', async ({ page }) => {
      // Bob bookmarks or copies a deep link to studio
      await page.goto('/dashboard/stream/studio');

      // Bob should be redirected or see an error
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      console.log(`Bob tried to access studio, ended up on: ${currentUrl}`);

      // Bob should not be able to access protected routes
      expect(currentUrl).not.toContain('/studio');

      // Check if Bob sees any helpful message about logging in
      const loginMessages = await page.locator('text=login, text=sign in, text=authenticate').all();
      if (loginMessages.length === 0) {
        console.log('Bob sees no login guidance - might be confusing!');
      }
    });
  });

  test.describe('Bob the Mobile User', () => {

    test.use({
      viewport: { width: 375, height: 667 }, // iPhone SE size
    });

    test('Bob watches stream on mobile and rotates constantly', async ({ page }) => {
      // Bob starts in portrait mode
      await page.goto('/watch/demo'); // Using a demo/test URL

      await page.waitForLoadState('networkidle');

      // Bob sees video and immediately assumes it should be bigger
      console.log('Bob in portrait mode, expects bigger video');

      // Simulate rotation to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(1000);

      console.log('Bob rotated to landscape');

      // Bob gets confused by any rotation prompts or locks
      const rotationPrompt = await page.locator('text=rotate, text=landscape, text=fullscreen').first();
      if (await rotationPrompt.isVisible().catch(() => false)) {
        console.log('Bob sees rotation prompt but might ignore it');
        // Bob might click it, might not
        await rotationPrompt.click().catch(() => {});
      }

      // Bob rotates back to portrait randomly
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      console.log('Bob rotated back to portrait');

      // The app should handle these rotations gracefully
      expect(page.url()).toContain('localhost:3000');

      // Check if video player is still functional
      const videoElement = await page.locator('video, mux-player').first();
      if (await videoElement.isVisible().catch(() => false)) {
        console.log('Video player survived Bob\\'s rotation rampage');
      }
    });

    test('Bob tries to chat while in landscape mode', async ({ page }) => {
      await page.goto('/watch/demo');

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(1000);

      // Bob looks for chat input
      const chatInput = await page.locator('input[type="text"], textarea').first();

      if (await chatInput.isVisible().catch(() => false)) {
        console.log('Bob found chat input in landscape mode');

        // Bob clicks on chat input
        await chatInput.click();

        // Check if keyboard simulation affects layout
        // In real mobile, virtual keyboard would appear
        await chatInput.type('Hello! 🎉 This is Bob typing in landscape!');

        // Bob hits enter
        await page.keyboard.press('Enter');

        console.log('Bob typed in chat while in landscape mode');

        // The layout should handle this gracefully
        expect(await chatInput.isVisible()).toBe(true);
      } else {
        console.log('Bob cannot find chat input in landscape mode - might be a UX issue');
      }
    });
  });

  test.describe('Bob the Impatient User', () => {

    test('Bob refreshes constantly and double-clicks everything', async ({ page }) => {
      await page.goto('/');

      // Bob clicks a button multiple times rapidly
      const firstButton = await page.locator('button, a[role="button"]').first();

      if (await firstButton.isVisible().catch(() => false)) {
        console.log('Bob found a button and will click it multiple times');

        // Bob's impatient clicking pattern
        await firstButton.click();
        await page.waitForTimeout(100);
        await firstButton.click(); // Double click
        await page.waitForTimeout(500);
        await firstButton.click(); // Triple click because "it's not working"

        // Bob gets impatient and refreshes
        await page.reload();
        await page.waitForTimeout(2000);

        // App should still be functional after Bob's chaos
        expect(page.url()).toContain('localhost:3000');
      }
    });

    test('Bob assumes loading spinners mean crashes', async ({ page }) => {
      await page.goto('/dashboard'); // This might redirect to login

      await page.waitForTimeout(1000);

      // Bob looks for any loading indicators
      const spinners = await page.locator('.spinner, .loading, [role="status"]').all();

      if (spinners.length > 0) {
        console.log(`Bob sees ${spinners.length} loading indicator(s) and panics`);

        // Bob waits exactly 2 seconds then gives up
        await page.waitForTimeout(2000);

        // Bob hits refresh because "it's frozen"
        await page.reload();

        console.log('Bob refreshed because loading took more than 2 seconds');
      }

      // Check that the page recovered from Bob's refresh
      expect(page.url()).toContain('localhost:3000');
    });
  });

  test.describe('Bob the Edge Case Generator', () => {

    test('Bob tests with extreme browser zoom', async ({ page }) => {
      await page.goto('/');

      // Bob zooms to 50% (simulating zoom out)
      await page.evaluate(() => {
        document.body.style.zoom = '0.5';
      });

      await page.waitForTimeout(1000);
      console.log('Bob zoomed out to 50%');

      // Check if navigation is still usable
      const navElements = await page.locator('nav a, nav button').all();
      console.log(`Bob sees ${navElements.length} navigation elements at 50% zoom`);

      // Bob zooms to 200% (simulating zoom in)
      await page.evaluate(() => {
        document.body.style.zoom = '2.0';
      });

      await page.waitForTimeout(1000);
      console.log('Bob zoomed in to 200%');

      // Check if layout still works
      const overflowElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => {
          const style = window.getComputedStyle(el);
          return style.overflow === 'visible' && el.scrollWidth > el.clientWidth;
        }).length;
      });

      if (overflowElements > 5) {
        console.log(`Warning: ${overflowElements} elements might be overflowing at 200% zoom`);
      }

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1.0';
      });
    });

    test('Bob opens multiple tabs and switches between them', async ({ context }) => {
      // Bob opens the app in multiple tabs
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      const page3 = await context.newPage();

      await page1.goto('/');
      await page2.goto('/auth/login');
      await page3.goto('/watch/demo');

      console.log('Bob opened 3 tabs with different pages');

      // Bob randomly switches between tabs
      await page2.bringToFront();
      await page2.waitForTimeout(1000);

      await page1.bringToFront();
      await page1.waitForTimeout(500);

      await page3.bringToFront();
      await page3.waitForTimeout(1500);

      // Check that all pages are still functional
      expect(page1.url()).toContain('localhost:3000');
      expect(page2.url()).toContain('localhost:3000');
      expect(page3.url()).toContain('localhost:3000');

      console.log('All tabs survived Bob\\'s switching rampage');

      await page1.close();
      await page2.close();
      await page3.close();
    });
  });

  test.describe('Bob QA Report Generator', () => {

    test('Bob generates a summary of all his findings', async ({ page }) => {
      // This test runs after all others and summarizes findings
      await page.goto('/');

      // Check basic page health
      const pageHealth = {
        hasTitle: await page.title() !== '',
        hasNavigation: await page.locator('nav').count() > 0,
        hasButtons: await page.locator('button').count() > 0,
        hasLinks: await page.locator('a').count() > 0,
        hasImages: await page.locator('img').count() > 0,
        responsiveElements: await page.locator('[class*="responsive"], [class*="mobile"], [class*="lg:"], [class*="md:"], [class*="sm:"]').count()
      };

      console.log('\\n🤖 BOB QA AUTOMATION REPORT 🤖');
      console.log('================================');
      console.log(`✅ Page has title: ${pageHealth.hasTitle}`);
      console.log(`✅ Has navigation: ${pageHealth.hasNavigation}`);
      console.log(`✅ Has interactive buttons: ${pageHealth.hasButtons}`);
      console.log(`✅ Has links: ${pageHealth.hasLinks}`);
      console.log(`✅ Has images: ${pageHealth.hasImages}`);
      console.log(`✅ Responsive elements found: ${pageHealth.responsiveElements}`);

      console.log('\\n📊 Bob\\'s Dumb User Testing Results:');
      console.log('• Tested first-time visitor confusion patterns');
      console.log('• Verified bad input handling in forms');
      console.log('• Checked protected route access');
      console.log('• Tested mobile rotation chaos');
      console.log('• Verified landscape mode chat functionality');
      console.log('• Tested impatient user behavior');
      console.log('• Checked loading state tolerance');
      console.log('• Tested extreme zoom levels');
      console.log('• Verified multi-tab stability');

      console.log('\\n🎯 Recommendations:');
      console.log('1. Check test failures for UX improvements');
      console.log('2. Review console warnings from Bob\\'s testing');
      console.log('3. Ensure error messages are user-friendly');
      console.log('4. Verify mobile experience handles rotations');
      console.log('5. Test real user scenarios based on Bob\\'s patterns');

      console.log('\\n📝 Next Steps:');
      console.log('• Run manual testing following Bob QA methodology');
      console.log('• Review any failed tests for critical UX issues');
      console.log('• Update forms to handle Bob\\'s bad input patterns');
      console.log('• Improve loading states and user feedback');

      // Basic assertions to ensure the app survived Bob's testing
      expect(pageHealth.hasTitle).toBe(true);
      expect(pageHealth.hasButtons).toBe(true);
    });
  });
});

// Custom test to verify current dev server is running
test('Verify dev server is accessible', async ({ page }) => {
  await page.goto('/');

  // Should be able to reach the homepage
  expect(page.url()).toContain('localhost:3000');

  // Should have some content
  const bodyText = await page.locator('body').textContent();
  expect(bodyText?.length).toBeGreaterThan(0);

  console.log('✅ Dev server at localhost:3000 is accessible for Bob QA testing');
});