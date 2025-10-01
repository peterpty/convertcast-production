import { test, expect, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

const supabaseUrl = 'https://yedvdwedhoetxukablxf.supabase.co';
const supabaseServiceKey = 'sb_secret_0vs2_C1wmxbN65Wd509P-A_V9fPYCaq';

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Test data
const testUser = {
  email: 'testuser@convertcast.com',
  name: 'Test User',
  company: 'ConvertCast Test'
};

const testEvent = {
  title: 'Test Registration Webinar',
  description: 'Testing the registration flow and ShowUp Surge integration',
  timezone: 'America/New_York'
};

const testRegistration = {
  email: 'testregistration@convertcast.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '(555) 123-4567'
};

let testUserId: string;
let testEventId: string;

test.describe('Registration Flow', () => {
  test.beforeAll(async () => {
    // Create test user and event
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }
    testUserId = user.id;

    // Create test event
    const tomorrow = new Date(Date.now() + 86400000);
    const eventEnd = new Date(Date.now() + 90000000);

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        user_id: testUserId,
        title: testEvent.title,
        description: testEvent.description,
        scheduled_start: tomorrow.toISOString(),
        scheduled_end: eventEnd.toISOString(),
        timezone: testEvent.timezone,
        status: 'scheduled'
      })
      .select()
      .single();

    if (eventError) {
      throw new Error(`Failed to create test event: ${eventError.message}`);
    }
    testEventId = event.id;
  });

  test.afterAll(async () => {
    // Cleanup test data
    await supabaseAdmin.from('registrations').delete().eq('event_id', testEventId);
    await supabaseAdmin.from('viewer_profiles').delete().eq('email', testRegistration.email);
    await supabaseAdmin.from('events').delete().eq('id', testEventId);
    await supabaseAdmin.from('users').delete().eq('id', testUserId);
  });

  test('should display registration gate for unauthenticated users', async ({ page }) => {
    // Navigate to join page
    await page.goto(`/join/${testEventId}`);

    // Verify page loads and displays event information
    await expect(page).toHaveTitle(/ConvertCast/);
    await expect(page.locator('h1')).toContainText(testEvent.title);
    await expect(page.locator('text=' + testEvent.description)).toBeVisible();

    // Verify registration form is present
    await expect(page.locator('h2')).toContainText('Secure Your Spot');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Continue');
  });

  test('should validate email input', async ({ page }) => {
    await page.goto(`/join/${testEventId}`);

    // Test empty email
    await page.click('button[type="submit"]');
    // HTML5 validation should prevent submission

    // Test invalid email format
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    // HTML5 validation should show error

    // Test valid email format
    await page.fill('input[type="email"]', testRegistration.email);
    await page.click('button[type="submit"]');

    // Should proceed to step 2
    await expect(page.locator('h2')).toContainText('Complete Registration');
  });

  test('should show progressive form steps', async ({ page }) => {
    await page.goto(`/join/${testEventId}`);

    // Step 1: Email
    await expect(page.locator('text=1')).toHaveClass(/bg-purple-600/);
    await expect(page.locator('text=2')).toHaveClass(/bg-gray-200/);

    // Enter email and continue
    await page.fill('input[type="email"]', testRegistration.email);
    await page.click('button[type="submit"]');

    // Step 2: Name and phone
    await expect(page.locator('text=1')).toHaveClass(/bg-purple-600/);
    await expect(page.locator('text=2')).toHaveClass(/bg-purple-600/);
    
    // Verify all required fields are present
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#lastName')).toBeVisible();
    await expect(page.locator('input#phone')).toBeVisible();
    
    // Verify ShowUp Surge notification
    await expect(page.locator('text=ShowUp Surge™ Activated!')).toBeVisible();
  });

  test('should validate name and phone inputs', async ({ page }) => {
    await page.goto(`/join/${testEventId}`);
    
    // Complete step 1
    await page.fill('input[type="email"]', testRegistration.email);
    await page.click('button[type="submit"]');

    // Test empty fields submission
    await page.click('button[type="submit"]');
    // Should show validation error
    await expect(page.locator('text=All fields are required')).toBeVisible();

    // Fill partial data
    await page.fill('input#firstName', testRegistration.firstName);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=All fields are required')).toBeVisible();

    // Fill all data except phone
    await page.fill('input#lastName', testRegistration.lastName);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=All fields are required')).toBeVisible();

    // Test invalid phone format
    await page.fill('input#phone', 'invalid-phone');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Please enter a valid phone number')).toBeVisible();
  });

  test('should format phone number automatically', async ({ page }) => {
    await page.goto(`/join/${testEventId}`);
    
    // Complete step 1
    await page.fill('input[type="email"]', testRegistration.email);
    await page.click('button[type="submit"]');

    // Test phone formatting
    const phoneInput = page.locator('input#phone');
    
    await phoneInput.fill('5551234567');
    await expect(phoneInput).toHaveValue('(555) 123-4567');
    
    await phoneInput.fill('15551234567');
    await expect(phoneInput).toHaveValue('(555) 123-4567'); // Should format correctly
  });

  test('should complete full registration flow', async ({ page }) => {
    await page.goto(`/join/${testEventId}`);
    
    // Step 1: Email
    await page.fill('input[type="email"]', testRegistration.email);
    await page.click('button[type="submit"]');
    
    // Step 2: Personal details
    await page.fill('input#firstName', testRegistration.firstName);
    await page.fill('input#lastName', testRegistration.lastName);
    await page.fill('input#phone', testRegistration.phone);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.locator('text=Completing Registration...')).toBeVisible();
    
    // Should redirect to stream page
    await expect(page).toHaveURL(new RegExp(`/stream/${testEventId}`));
    
    // Verify stream page loads
    await expect(page.locator('h1')).toContainText(testEvent.title);
    await expect(page.locator('text=Successfully Registered')).toBeVisible();
  });

  test('should prevent direct access to stream without registration', async ({ page }) => {
    // Try to access stream directly without registration
    await page.goto(`/stream/${testEventId}`);
    
    // Should redirect to registration page
    await expect(page).toHaveURL(new RegExp(`/join/${testEventId}`));
    await expect(page.locator('h2')).toContainText('Secure Your Spot');
  });

  test('should handle invalid event ID', async ({ page }) => {
    const invalidEventId = '00000000-0000-0000-0000-000000000000';
    
    await page.goto(`/join/${invalidEventId}`);
    
    // Should show error message
    await expect(page.locator('text=Event Unavailable')).toBeVisible();
    await expect(page.locator('text=Event not found')).toBeVisible();
    
    // Should have return home button
    await expect(page.locator('button', { hasText: 'Return Home' })).toBeVisible();
  });

  test('should persist registration with cookies', async ({ page, context }) => {
    // Complete registration
    await page.goto(`/join/${testEventId}`);
    
    await page.fill('input[type="email"]', `cookie.test.${Date.now()}@convertcast.com`);
    await page.click('button[type="submit"]');
    
    await page.fill('input#firstName', 'Cookie');
    await page.fill('input#lastName', 'Test');
    await page.fill('input#phone', '(555) 999-8888');
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect to stream
    await expect(page).toHaveURL(new RegExp(`/stream/${testEventId}`));
    
    // Verify cookie was set
    const cookies = await context.cookies();
    const registrationCookie = cookies.find(cookie => 
      cookie.name === `convertcast_reg_${testEventId}`
    );
    
    expect(registrationCookie).toBeDefined();
    expect(registrationCookie?.value).toContain('access_token');
    
    // Navigate away and back
    await page.goto('/');
    await page.goto(`/join/${testEventId}`);
    
    // Should automatically redirect to stream (already registered)
    await expect(page).toHaveURL(new RegExp(`/stream/${testEventId}`));
  });

  test('should display trust indicators and social proof', async ({ page }) => {
    await page.goto(`/join/${testEventId}`);
    
    // Verify trust indicators are present
    await expect(page.locator('text=Registered')).toBeVisible();
    await expect(page.locator('text=Watching Live')).toBeVisible();
    await expect(page.locator('text=Satisfaction')).toBeVisible();
    
    // Verify social proof messages
    await expect(page.locator('text=just registered')).toBeVisible();
    await expect(page.locator('text=secured her spot')).toBeVisible();
    
    // Verify security badges
    await expect(page.locator('text=SSL Secured')).toBeVisible();
    await expect(page.locator('text=Privacy Protected')).toBeVisible();
    await expect(page.locator('text=Instant Access')).toBeVisible();
  });

  test('should show appropriate status indicators', async ({ page }) => {
    await page.goto(`/join/${testEventId}`);
    
    // Should show "Starts in" indicator for upcoming event
    await expect(page.locator('text=Starts in')).toBeVisible();
    
    // Verify event timing display
    await expect(page.locator('text=' + testEvent.title)).toBeVisible();
    await expect(page.locator('text=' + testEvent.description)).toBeVisible();
  });
});

test.describe('ShowUp Surge Integration', () => {
  test('should activate ShowUp Surge on registration', async ({ page }) => {
    // This test verifies that ShowUp Surge is activated in the backend
    const uniqueEmail = `showup.test.${Date.now()}@convertcast.com`;
    
    await page.goto(`/join/${testEventId}`);
    
    // Complete registration
    await page.fill('input[type="email"]', uniqueEmail);
    await page.click('button[type="submit"]');
    
    await page.fill('input#firstName', 'ShowUp');
    await page.fill('input#lastName', 'Test');
    await page.fill('input#phone', '(555) 777-6666');
    
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await expect(page).toHaveURL(new RegExp(`/stream/${testEventId}`));
    
    // Verify in database that ShowUp Surge was activated
    const { data: registration } = await supabaseAdmin
      .from('registrations')
      .select('showup_surge_sequence')
      .eq('event_id', testEventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Should have ShowUp Surge data
    expect(registration?.showup_surge_sequence).toBeDefined();
    expect(registration?.showup_surge_sequence).toHaveProperty('optimal_reminder_time');
    expect(registration?.showup_surge_sequence).toHaveProperty('incentive_type');
  });
});

test.describe('Security and Access Control', () => {
  test('should reject invalid access tokens', async ({ page }) => {
    const invalidToken = 'invalid_token_12345';
    
    await page.goto(`/stream/${testEventId}?token=${invalidToken}`);
    
    // Should redirect to registration
    await expect(page).toHaveURL(new RegExp(`/join/${testEventId}`));
  });
  
  test('should handle database errors gracefully', async ({ page }) => {
    // This test uses a non-existent event ID to trigger database errors
    const nonExistentEventId = '99999999-9999-9999-9999-999999999999';
    
    await page.goto(`/join/${nonExistentEventId}`);
    
    await expect(page.locator('text=Event Unavailable')).toBeVisible();
    await expect(page.locator('text=Event not found')).toBeVisible();
  });
});

test.describe('User Experience', () => {
  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`/join/${testEventId}`);
    
    // Should still display all elements properly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Complete registration on mobile
    await page.fill('input[type="email"]', `mobile.test.${Date.now()}@convertcast.com`);
    await page.click('button[type="submit"]');
    
    await page.fill('input#firstName', 'Mobile');
    await page.fill('input#lastName', 'Test');
    await page.fill('input#phone', '(555) 444-3333');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(new RegExp(`/stream/${testEventId}`));
  });
  
  test('should have proper loading states', async ({ page }) => {
    await page.goto(`/join/${testEventId}`);
    
    // Submit email
    await page.fill('input[type="email"]', `loading.test.${Date.now()}@convertcast.com`);
    
    // Look for loading state on email submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show loading text briefly
    await expect(page.locator('text=Securing Your Spot...')).toBeVisible({ timeout: 1000 });
  });
});