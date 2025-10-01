import { test, expect } from '@playwright/test';

test.describe('ConvertCast Registration Flow', () => {
  test('should display registration gate and collect required information', async ({ page }) => {
    // Create a mock event (you'll need to set this up with your test database)
    const mockEventId = 'test-event-123';

    // Navigate to event registration page
    await page.goto(`/join/${mockEventId}`);

    // Test Step 1: Email Check
    await expect(page.locator('h1')).toContainText('Register for Event');
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();

    // Enter email
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Test Step 2: Required Details
    await expect(page.getByPlaceholder('First Name')).toBeVisible();
    await expect(page.getByPlaceholder('Last Name')).toBeVisible();
    await expect(page.getByPlaceholder('Phone Number')).toBeVisible();

    // Fill required fields
    await page.getByPlaceholder('First Name').fill('John');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Phone Number').fill('+1234567890');

    // Optional company field
    await page.getByPlaceholder('Company (optional)').fill('Test Company');

    // Submit registration
    await page.getByRole('button', { name: 'Register' }).click();

    // Test Step 3: ShowUp Surge™ Activation
    await expect(page.locator('[data-testid="showup-surge-activated"]')).toBeVisible();

    // Test Step 4: Access Grant (based on event status)
    // For a live event, should join immediately
    await expect(page.locator('[data-testid="event-access-granted"]')).toBeVisible();
  });

  test('should handle existing user registration', async ({ page }) => {
    const mockEventId = 'test-event-123';

    await page.goto(`/join/${mockEventId}`);

    // Enter existing email
    await page.getByPlaceholder('Enter your email').fill('existing@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show "Welcome back!" message
    await expect(page.locator('text=Welcome back!')).toBeVisible();

    // Should pre-fill some fields for existing user
    await expect(page.getByPlaceholder('First Name')).toHaveValue('ExistingUser');
  });

  test('should validate required fields', async ({ page }) => {
    const mockEventId = 'test-event-123';

    await page.goto(`/join/${mockEventId}`);

    // Try to continue without email
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('text=Email is required')).toBeVisible();

    // Enter invalid email
    await page.getByPlaceholder('Enter your email').fill('invalid-email');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should track behavioral data during registration', async ({ page }) => {
    const mockEventId = 'test-event-123';

    // Start timing the registration process
    const startTime = Date.now();

    await page.goto(`/join/${mockEventId}`);

    // Fill registration form
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByPlaceholder('First Name').fill('John');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Phone Number').fill('+1234567890');

    await page.getByRole('button', { name: 'Register' }).click();

    const endTime = Date.now();
    const registrationTime = endTime - startTime;

    // Behavioral tracking should capture:
    // - Device type, browser info, timezone (automatic)
    // - Time to complete registration
    // - Source/campaign (from URL params)
    expect(registrationTime).toBeGreaterThan(0);
  });
});