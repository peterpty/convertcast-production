import { test, expect } from '@playwright/test';

test('Debug production login flow', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });

  // Track network requests
  page.on('request', request => {
    if (request.url().includes('auth') || request.url().includes('supabase')) {
      console.log(`REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('auth') || response.url().includes('supabase')) {
      console.log(`RESPONSE: ${response.status()} ${response.url()}`);
      if (response.status() >= 400) {
        const body = await response.text().catch(() => 'Could not read body');
        console.log(`ERROR RESPONSE BODY:`, body);
      }
    }
  });

  // Track page errors
  page.on('pageerror', error => {
    console.log(`PAGE ERROR:`, error.message);
  });

  // Navigate to login page
  console.log('Navigating to https://convertcast.app/auth/login');
  await page.goto('https://convertcast.app/auth/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take initial screenshot
  await page.screenshot({ path: 'debug-login-initial.png', fullPage: true });
  console.log('Screenshot saved: debug-login-initial.png');

  // Fill in email
  console.log('Filling email...');
  await page.fill('input[type="email"]', 'petertillmanyoung@gmail.com');

  // Fill in password (using environment variable or default)
  const password = process.env.TEST_PASSWORD || 'TestPassword123!';
  console.log('Filling password...');
  await page.fill('input[type="password"]', password);

  // Take screenshot before clicking
  await page.screenshot({ path: 'debug-login-before-submit.png', fullPage: true });

  // Check for cookies before login
  const cookiesBefore = await page.context().cookies();
  console.log('Cookies before login:', cookiesBefore.map(c => c.name).join(', '));

  // Click sign in button
  console.log('Clicking Sign In button...');
  await page.click('button[type="submit"]');

  // Wait a bit to see what happens
  await page.waitForTimeout(5000);

  // Check current URL
  const currentUrl = page.url();
  console.log('Current URL after sign in attempt:', currentUrl);

  // Take screenshot after clicking
  await page.screenshot({ path: 'debug-login-after-submit.png', fullPage: true });
  console.log('Screenshot saved: debug-login-after-submit.png');

  // Check for cookies after login
  const cookiesAfter = await page.context().cookies();
  console.log('Cookies after login:', cookiesAfter.map(c => c.name).join(', '));

  // Check localStorage
  const localStorage = await page.evaluate(() => {
    const items: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        items[key] = window.localStorage.getItem(key) || '';
      }
    }
    return items;
  });
  console.log('LocalStorage:', Object.keys(localStorage).join(', '));

  // Check for Supabase session in localStorage
  const supabaseKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('sb-'));
  console.log('Supabase localStorage keys:', supabaseKeys);

  // Check if still on login page or redirected
  if (currentUrl.includes('/auth/login')) {
    console.log('❌ STILL ON LOGIN PAGE - No redirect occurred');

    // Check for error messages
    const errorText = await page.textContent('.error, [role="alert"], .text-red').catch(() => null);
    if (errorText) {
      console.log('Error message on page:', errorText);
    }

    // Check button state
    const buttonText = await page.textContent('button[type="submit"]').catch(() => null);
    console.log('Button text:', buttonText);
  } else if (currentUrl.includes('/dashboard')) {
    console.log('✅ REDIRECTED TO DASHBOARD - Login successful!');
  } else {
    console.log('⚠️ REDIRECTED TO:', currentUrl);
  }

  // Final screenshot
  await page.screenshot({ path: 'debug-login-final.png', fullPage: true });
  console.log('Final screenshot saved: debug-login-final.png');
});
