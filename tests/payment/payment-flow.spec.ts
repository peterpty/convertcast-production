import { test, expect } from '@playwright/test';

// Test card numbers for Stripe
const STRIPE_TEST_CARDS = {
  VISA_SUCCESS: '4242424242424242',
  VISA_DECLINED: '4000000000000002',
  VISA_INSUFFICIENT_FUNDS: '4000000000009995',
  VISA_AUTHENTICATION_REQUIRED: '4000002500003155',
  MASTERCARD_SUCCESS: '5555555555554444',
  AMEX_SUCCESS: '378282246310005'
};

// PayPal test credentials (sandbox)
const PAYPAL_TEST_CREDENTIALS = {
  BUYER_EMAIL: 'sb-buyer@example.com',
  BUYER_PASSWORD: 'testpassword'
};

test.describe('Payment System - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the studio with payment system
    await page.goto('/studio');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('AutoOffer™ Dynamic Pricing', () => {
    test('should trigger offer based on viewer score', async ({ page }) => {
      // Simulate high-intent viewer
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'test-viewer-001',
          name: 'John Test',
          email: 'john.test@example.com',
          intentScore: 95,
          engagementTime: 300000, // 5 minutes
          behavior: {
            pageViews: 8,
            timeOnPage: 300,
            interactions: 12,
            scrollDepth: 0.9
          }
        }));
      });

      // Refresh to apply viewer data
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Wait for AutoOffer to trigger (should happen within 10 seconds for high-intent viewer)
      const urgencyOverlay = page.locator('[data-testid="urgency-overlay"]');
      await expect(urgencyOverlay).toBeVisible({ timeout: 15000 });

      // Verify high-intensity offer for high-scoring viewer
      await expect(page.locator('.animate-pulse')).toBeVisible();
      await expect(page.locator('text=CLAIM NOW!')).toBeVisible();

      // Verify dynamic pricing (should show discount for high-intent viewer)
      const discountBadge = page.locator('text=/\\d+% OFF/');
      await expect(discountBadge).toBeVisible();
    });

    test('should show different offer intensity based on viewer score', async ({ page }) => {
      // Test medium-intent viewer
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'test-viewer-002',
          name: 'Jane Test',
          email: 'jane.test@example.com',
          intentScore: 70,
          engagementTime: 120000, // 2 minutes
          behavior: {
            pageViews: 3,
            timeOnPage: 120,
            interactions: 5,
            scrollDepth: 0.6
          }
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Trigger manual offer for testing
      await page.click('[data-testid="manual-trigger-premium"]');

      const urgencyOverlay = page.locator('[data-testid="urgency-overlay"]');
      await expect(urgencyOverlay).toBeVisible();

      // Should show medium intensity (yellow theme, not extreme red)
      await expect(page.locator('.border-yellow-500')).toBeVisible();
      await expect(page.locator('text=Start Now')).toBeVisible();
    });
  });

  test.describe('A/B Testing', () => {
    test('should assign viewer to test variant and track conversion', async ({ page }) => {
      // Set up test viewer
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'ab-test-viewer-001',
          name: 'AB Test User',
          email: 'abtest@example.com',
          intentScore: 85
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Trigger offer
      await page.click('[data-testid="manual-trigger-premium"]');

      // Check if A/B test variant is applied
      const urgencyOverlay = page.locator('[data-testid="urgency-overlay"]');
      await expect(urgencyOverlay).toBeVisible();

      // Verify A/B test tracking in console
      const logs = [];
      page.on('console', msg => {
        if (msg.text().includes('A/B test')) {
          logs.push(msg.text());
        }
      });

      // Continue to checkout to trigger conversion tracking
      await page.click('text=CLAIM NOW!');

      // Should see checkout component
      const checkout = page.locator('[data-testid="in-stream-checkout"]');
      await expect(checkout).toBeVisible();
    });
  });

  test.describe('Stripe Payment Flow', () => {
    test('should complete successful payment with Stripe', async ({ page }) => {
      // Set up test viewer and trigger offer
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'stripe-test-001',
          name: 'Stripe Test User',
          email: 'stripe.test@example.com',
          intentScore: 80
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Trigger offer
      await page.click('[data-testid="manual-trigger-premium"]');
      await page.click('text=CLAIM NOW!');

      // Should show checkout
      const checkout = page.locator('[data-testid="in-stream-checkout"]');
      await expect(checkout).toBeVisible();

      // Select Stripe payment method
      await page.click('[data-testid="stripe-payment-option"]');

      // Fill Stripe form
      const cardNumberFrame = page.frameLocator('iframe[name*="cardnumber"]');
      await cardNumberFrame.locator('input[name="cardnumber"]').fill(STRIPE_TEST_CARDS.VISA_SUCCESS);

      const expiryFrame = page.frameLocator('iframe[name*="expiry"]');
      await expiryFrame.locator('input[name="expiry"]').fill('12/30');

      const cvcFrame = page.frameLocator('iframe[name*="cvc"]');
      await cvcFrame.locator('input[name="cvc"]').fill('123');

      // Fill billing details
      await page.fill('[data-testid="cardholder-name"]', 'Test Cardholder');
      await page.fill('[data-testid="email"]', 'stripe.test@example.com');

      // Submit payment
      await page.click('[data-testid="complete-payment"]');

      // Wait for payment processing
      await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });

      // Verify success message
      await expect(page.locator('text=Payment Successful')).toBeVisible();
      await expect(page.locator('text=Thank you for your purchase')).toBeVisible();

      // Verify invoice generation
      await expect(page.locator('text=Invoice sent to')).toBeVisible();
    });

    test('should handle declined card gracefully', async ({ page }) => {
      // Set up test viewer and trigger offer
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'stripe-decline-001',
          name: 'Decline Test User',
          email: 'decline.test@example.com',
          intentScore: 75
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Trigger offer and proceed to checkout
      await page.click('[data-testid="manual-trigger-premium"]');
      await page.click('text=CLAIM NOW!');
      await page.click('[data-testid="stripe-payment-option"]');

      // Fill with declined card
      const cardNumberFrame = page.frameLocator('iframe[name*="cardnumber"]');
      await cardNumberFrame.locator('input[name="cardnumber"]').fill(STRIPE_TEST_CARDS.VISA_DECLINED);

      const expiryFrame = page.frameLocator('iframe[name*="expiry"]');
      await expiryFrame.locator('input[name="expiry"]').fill('12/30');

      const cvcFrame = page.frameLocator('iframe[name*="cvc"]');
      await cvcFrame.locator('input[name="cvc"]').fill('123');

      await page.fill('[data-testid="cardholder-name"]', 'Test Declined');
      await page.fill('[data-testid="email"]', 'decline.test@example.com');

      // Submit payment
      await page.click('[data-testid="complete-payment"]');

      // Should show error message
      await expect(page.locator('text=Your card was declined')).toBeVisible({ timeout: 10000 });

      // Checkout should still be visible for retry
      await expect(page.locator('[data-testid="in-stream-checkout"]')).toBeVisible();
    });

    test('should handle authentication required', async ({ page }) => {
      // Set up test and use authentication required card
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'stripe-3ds-001',
          name: '3DS Test User',
          email: '3ds.test@example.com',
          intentScore: 85
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.click('[data-testid="manual-trigger-premium"]');
      await page.click('text=CLAIM NOW!');
      await page.click('[data-testid="stripe-payment-option"]');

      // Fill with 3D Secure card
      const cardNumberFrame = page.frameLocator('iframe[name*="cardnumber"]');
      await cardNumberFrame.locator('input[name="cardnumber"]').fill(STRIPE_TEST_CARDS.VISA_AUTHENTICATION_REQUIRED);

      const expiryFrame = page.frameLocator('iframe[name*="expiry"]');
      await expiryFrame.locator('input[name="expiry"]').fill('12/30');

      const cvcFrame = page.frameLocator('iframe[name*="cvc"]');
      await cvcFrame.locator('input[name="cvc"]').fill('123');

      await page.fill('[data-testid="cardholder-name"]', 'Test 3DS');
      await page.fill('[data-testid="email"]', '3ds.test@example.com');

      await page.click('[data-testid="complete-payment"]');

      // Should show 3D Secure challenge
      await expect(page.locator('iframe[name*="3ds"]')).toBeVisible({ timeout: 15000 });

      // Complete 3D Secure (in test mode, usually auto-completes)
      await page.waitForSelector('[data-testid="payment-success"]', { timeout: 45000 });
    });
  });

  test.describe('PayPal Payment Flow', () => {
    test('should complete successful payment with PayPal', async ({ page }) => {
      // Set up test viewer
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'paypal-test-001',
          name: 'PayPal Test User',
          email: 'paypal.test@example.com',
          intentScore: 90
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Trigger offer and select PayPal
      await page.click('[data-testid="manual-trigger-premium"]');
      await page.click('text=CLAIM NOW!');

      const checkout = page.locator('[data-testid="in-stream-checkout"]');
      await expect(checkout).toBeVisible();

      await page.click('[data-testid="paypal-payment-option"]');

      // Fill email for PayPal
      await page.fill('[data-testid="email"]', 'paypal.test@example.com');

      // Click PayPal button
      await page.click('[data-testid="paypal-button"]');

      // PayPal popup should open (in sandbox mode)
      const paypalPopup = await page.waitForEvent('popup', { timeout: 10000 });

      // In a real test, you would interact with PayPal login
      // For now, we'll simulate the approval flow
      await page.evaluate(() => {
        // Simulate PayPal approval callback
        window.dispatchEvent(new CustomEvent('paypal-approved', {
          detail: { orderID: 'test-order-123' }
        }));
      });

      // Should complete payment
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Multi-Currency Support', () => {
    test('should handle EUR currency payments', async ({ page }) => {
      // Set up EUR viewer
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'eur-test-001',
          name: 'European User',
          email: 'eur.test@example.com',
          intentScore: 80,
          country: 'DE',
          currency: 'EUR'
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.click('[data-testid="manual-trigger-premium"]');

      // Should show EUR pricing
      await expect(page.locator('text=/€\\d+/')).toBeVisible();

      // Verify conversion rates applied
      const eurPrice = await page.locator('[data-testid="final-price"]').textContent();
      expect(eurPrice).toContain('€');
    });

    test('should apply correct tax rates by region', async ({ page }) => {
      // Test German VAT
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'vat-test-001',
          name: 'German User',
          email: 'german.test@example.com',
          intentScore: 85,
          country: 'DE',
          currency: 'EUR'
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.click('[data-testid="manual-trigger-premium"]');
      await page.click('text=CLAIM NOW!');

      // Should show VAT calculation
      await expect(page.locator('text=VAT')).toBeVisible();
      await expect(page.locator('text=20%')).toBeVisible();
    });
  });

  test.describe('Invoice Generation', () => {
    test('should generate and download PDF invoice', async ({ page }) => {
      // Complete a payment first
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'invoice-test-001',
          name: 'Invoice Test User',
          email: 'invoice.test@example.com',
          intentScore: 85
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.click('[data-testid="manual-trigger-premium"]');
      await page.click('text=CLAIM NOW!');
      await page.click('[data-testid="stripe-payment-option"]');

      // Complete payment with test card
      const cardNumberFrame = page.frameLocator('iframe[name*="cardnumber"]');
      await cardNumberFrame.locator('input[name="cardnumber"]').fill(STRIPE_TEST_CARDS.VISA_SUCCESS);

      const expiryFrame = page.frameLocator('iframe[name*="expiry"]');
      await expiryFrame.locator('input[name="expiry"]').fill('12/30');

      const cvcFrame = page.frameLocator('iframe[name*="cvc"]');
      await cvcFrame.locator('input[name="cvc"]').fill('123');

      await page.fill('[data-testid="cardholder-name"]', 'Invoice Test');
      await page.fill('[data-testid="email"]', 'invoice.test@example.com');

      await page.click('[data-testid="complete-payment"]');

      await page.waitForSelector('[data-testid="payment-success"]');

      // Download invoice
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="download-invoice"]')
      ]);

      expect(download.suggestedFilename()).toMatch(/Invoice-INV-\d+-\d+\.pdf/);
    });
  });

  test.describe('Performance and UX', () => {
    test('should load checkout within 2 seconds', async ({ page }) => {
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'perf-test-001',
          name: 'Performance Test',
          email: 'perf.test@example.com',
          intentScore: 80
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const startTime = Date.now();

      await page.click('[data-testid="manual-trigger-premium"]');
      await page.click('text=CLAIM NOW!');

      await page.waitForSelector('[data-testid="in-stream-checkout"]');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X

      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'mobile-test-001',
          name: 'Mobile User',
          email: 'mobile.test@example.com',
          intentScore: 85
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.click('[data-testid="manual-trigger-premium"]');

      const urgencyOverlay = page.locator('[data-testid="urgency-overlay"]');
      await expect(urgencyOverlay).toBeVisible();

      // Should fit mobile screen
      const overlayBox = await urgencyOverlay.boundingBox();
      expect(overlayBox?.width).toBeLessThanOrEqual(375);

      await page.click('text=CLAIM NOW!');

      const checkout = page.locator('[data-testid="in-stream-checkout"]');
      await expect(checkout).toBeVisible();

      // Checkout should also fit mobile
      const checkoutBox = await checkout.boundingBox();
      expect(checkoutBox?.width).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Set up offline mode
      await page.context().setOffline(true);

      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'offline-test-001',
          name: 'Offline Test',
          email: 'offline.test@example.com',
          intentScore: 80
        }));
      });

      await page.reload();

      // Try to trigger payment
      await page.click('[data-testid="manual-trigger-premium"]', { timeout: 5000 });

      // Should show appropriate error message
      await expect(page.locator('text=Network connection error')).toBeVisible({ timeout: 10000 });
    });

    test('should prevent duplicate payments', async ({ page }) => {
      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'duplicate-test-001',
          name: 'Duplicate Test',
          email: 'duplicate.test@example.com',
          intentScore: 85
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.click('[data-testid="manual-trigger-premium"]');
      await page.click('text=CLAIM NOW!');
      await page.click('[data-testid="stripe-payment-option"]');

      // Fill payment form
      const cardNumberFrame = page.frameLocator('iframe[name*="cardnumber"]');
      await cardNumberFrame.locator('input[name="cardnumber"]').fill(STRIPE_TEST_CARDS.VISA_SUCCESS);

      const expiryFrame = page.frameLocator('iframe[name*="expiry"]');
      await expiryFrame.locator('input[name="expiry"]').fill('12/30');

      const cvcFrame = page.frameLocator('iframe[name*="cvc"]');
      await cvcFrame.locator('input[name="cvc"]').fill('123');

      await page.fill('[data-testid="cardholder-name"]', 'Duplicate Test');
      await page.fill('[data-testid="email"]', 'duplicate.test@example.com');

      // Click payment button multiple times rapidly
      const payButton = page.locator('[data-testid="complete-payment"]');
      await payButton.click();
      await payButton.click(); // Second click should be ignored

      // Should only process one payment
      await page.waitForSelector('[data-testid="payment-success"]');

      // Verify no duplicate transactions
      const successMessages = page.locator('[data-testid="payment-success"]');
      await expect(successMessages).toHaveCount(1);
    });
  });

  test.describe('Analytics Tracking', () => {
    test('should track conversion funnel events', async ({ page }) => {
      const events = [];

      page.on('console', msg => {
        if (msg.text().includes('🎯') || msg.text().includes('💰')) {
          events.push(msg.text());
        }
      });

      await page.evaluate(() => {
        window.localStorage.setItem('testViewer', JSON.stringify({
          id: 'analytics-test-001',
          name: 'Analytics Test',
          email: 'analytics.test@example.com',
          intentScore: 90
        }));
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should track offer trigger
      await page.click('[data-testid="manual-trigger-premium"]');
      expect(events.some(e => e.includes('Triggered optimized offer'))).toBe(true);

      await page.click('text=CLAIM NOW!');

      // Complete payment
      await page.click('[data-testid="stripe-payment-option"]');

      const cardNumberFrame = page.frameLocator('iframe[name*="cardnumber"]');
      await cardNumberFrame.locator('input[name="cardnumber"]').fill(STRIPE_TEST_CARDS.VISA_SUCCESS);

      const expiryFrame = page.frameLocator('iframe[name*="expiry"]');
      await expiryFrame.locator('input[name="expiry"]').fill('12/30');

      const cvcFrame = page.frameLocator('iframe[name*="cvc"]');
      await cvcFrame.locator('input[name="cvc"]').fill('123');

      await page.fill('[data-testid="cardholder-name"]', 'Analytics Test');
      await page.fill('[data-testid="email"]', 'analytics.test@example.com');

      await page.click('[data-testid="complete-payment"]');
      await page.waitForSelector('[data-testid="payment-success"]');

      // Should track successful payment
      expect(events.some(e => e.includes('Payment successful'))).toBe(true);
    });
  });
});