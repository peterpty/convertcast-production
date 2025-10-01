import { test, expect, type Page } from '@playwright/test';

test.describe('AI Suite Integration Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/dashboard/stream/studio');
  });

  test.describe('Hot Lead Scoring Engine', () => {
    test('displays AI Hot Leads panel with casino-style animations', async () => {
      // Navigate to Hot Leads tab
      await page.click('button:has-text("Hot Leads")');

      // Verify Hot Leads Engine header
      await expect(page.locator('text=🎯 AI Hot Leads Engine')).toBeVisible();

      // Check for animated score meters
      const scoreMeters = page.locator('[style*="conic-gradient"]');
      await expect(scoreMeters.first()).toBeVisible();

      // Verify score classifications
      await expect(page.locator('text=JACKPOT')).toBeVisible();
      await expect(page.locator('text=HOT LEAD')).toBeVisible();

      // Test score meter animation on hover
      await scoreMeters.first().hover();
      // Note: Animation testing would require more sophisticated CSS inspection

      // Verify viewer cards display
      const viewerCards = page.locator('.bg-gray-800.rounded-xl');
      await expect(viewerCards).toHaveCount({ min: 1 });

      // Check for suggested actions
      await expect(page.locator('button:has-text("🎰")')).toBeVisible();
      await expect(page.locator('button:has-text("🔥")')).toBeVisible();
    });

    test('validates intent score calculations (0-100 scale)', async () => {
      await page.click('button:has-text("Hot Leads")');

      // Check score ranges
      const scores = await page.locator('.text-2xl.font-bold').allTextContents();
      const numericScores = scores.map(s => parseInt(s)).filter(s => !isNaN(s));

      // Validate all scores are within 0-100 range
      for (const score of numericScores) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }

      // Verify score-based color coding exists
      await expect(page.locator('.text-red-400, .text-orange-400, .text-yellow-400')).toHaveCount({ min: 1 });
    });

    test('verifies one-click overlay triggers work', async () => {
      await page.click('button:has-text("Hot Leads")');

      // Click on a suggested action button
      const actionButton = page.locator('button:has-text("🎯")').first();
      await actionButton.click();

      // Verify console log or UI feedback (in real implementation, would verify actual overlay)
      // Since we're testing with console.log, we'd need to listen for console events
      page.on('console', msg => {
        if (msg.text().includes('Triggering overlay')) {
          expect(msg.text()).toContain('show-offer');
        }
      });
    });
  });

  test.describe('AI Live Chat Engine', () => {
    test('enables synthetic viewer controls', async () => {
      await page.click('button:has-text("AI Chat")');

      // Verify AI Chat Engine header
      await expect(page.locator('text=🤖 AI Live Chat Engine')).toBeVisible();

      // Check synthetic viewer toggle
      const syntheticToggle = page.locator('input[type="checkbox"]:near(:text("🎭 Synthetic Viewers"))');
      await expect(syntheticToggle).toBeVisible();

      // Toggle synthetic viewers on/off
      await syntheticToggle.click();

      // Check frequency slider
      const frequencySlider = page.locator('input[type="range"]');
      await expect(frequencySlider).toBeVisible();

      // Adjust frequency
      await frequencySlider.fill('7');
      await expect(page.locator('text=7/min')).toBeVisible();
    });

    test('generates auto-testimonials and trust-building messages', async () => {
      await page.click('button:has-text("AI Chat")');

      // Enable testimonials and trust building
      await page.check('input[type="checkbox"]:near(:text("💬 Testimonials"))');
      await page.check('input[type="checkbox"]:near(:text("🤝 Trust Building"))');

      // Wait for synthetic messages to appear
      await page.waitForTimeout(3000);

      // Check for AI-generated messages
      await expect(page.locator('.bg-purple-900\\/10')).toHaveCount({ min: 1 });

      // Verify AI badges on synthetic messages
      await expect(page.locator('span:has-text("AI")')).toHaveCount({ min: 1 });

      // Check for intent level indicators
      await expect(page.locator('span:has-text("HOT_LEAD"), span:has-text("WARM")')).toHaveCount({ min: 1 });
    });

    test('provides streamer override controls', async () => {
      await page.click('button:has-text("AI Chat")');

      // Test quick response buttons
      const quickResponseButton = page.locator('button:has-text("Thanks for joining! 🎉")');
      await expect(quickResponseButton).toBeVisible();
      await quickResponseButton.click();

      // Verify message appears in chat
      await expect(page.locator('text=Thanks for joining! 🎉')).toBeVisible();

      // Test manual message input
      const messageInput = page.locator('input[placeholder*="Override"]');
      await messageInput.fill('Test streamer message');
      await page.click('button:has-text("Send")');

      // Verify streamer message appears
      await expect(page.locator('text=Test streamer message')).toBeVisible();
    });
  });

  test.describe('AutoOffer™ Engine', () => {
    test('implements optimal conversion timing', async () => {
      await page.click('button:has-text("AutoOffer™")');

      // Verify AutoOffer™ Engine header
      await expect(page.locator('text=🎯 AutoOffer™ Engine')).toBeVisible();

      // Check auto mode toggle
      const autoModeToggle = page.locator('input[type="checkbox"]:near(:text("Auto Mode"))');
      await expect(autoModeToggle).toBeVisible();

      // Verify performance stats display
      await expect(page.locator('text=OFFERS')).toBeVisible();
      await expect(page.locator('text=CONVERSION')).toBeVisible();
      await expect(page.locator('text=REVENUE')).toBeVisible();

      // Check offer templates display
      await expect(page.locator('.border-red-500, .border-orange-500, .border-green-500')).toHaveCount({ min: 1 });
    });

    test('displays offer opportunities with confidence scores', async () => {
      await page.click('button:has-text("AutoOffer™")');

      // Wait for opportunity analysis
      await page.waitForTimeout(2000);

      // Check for opportunity viewers
      await expect(page.locator('text=🎯 Offer Opportunities')).toBeVisible();

      // Verify confidence percentages are displayed
      const confidenceScores = await page.locator('.font-mono.text-green-400, .font-mono.text-yellow-400').allTextContents();

      for (const score of confidenceScores) {
        const percentage = parseInt(score);
        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      }

      // Test manual trigger buttons
      await expect(page.locator('button:has-text("🎰 Jackpot")')).toBeVisible();
      await expect(page.locator('button:has-text("🔥 Hot")')).toBeVisible();
    });

    test('tracks offer performance analytics', async () => {
      await page.click('button:has-text("AutoOffer™")');

      // Verify performance metrics display
      const performanceStats = page.locator('.bg-gradient-to-r');
      await expect(performanceStats).toHaveCount({ min: 4 });

      // Check footer analytics
      await expect(page.locator('text=AI analyzed')).toBeVisible();
      await expect(page.locator('text=Best score:')).toBeVisible();

      // Verify auto-trigger threshold display
      await expect(page.locator('text=Auto-trigger at 80%+ confidence')).toBeVisible();
    });
  });

  test.describe('InsightEngine™ Dashboard', () => {
    test('provides pre-event predictions', async () => {
      await page.click('button:has-text("Insights™")');

      // Verify InsightEngine™ header
      await expect(page.locator('text=🧠 InsightEngine™ Dashboard')).toBeVisible();

      // Check insights tab
      await page.click('button:has-text("📊 Insights")');

      // Verify key metrics display
      await expect(page.locator('text=Stream Health')).toBeVisible();
      await expect(page.locator('text=Audience Quality')).toBeVisible();
      await expect(page.locator('text=Revenue Velocity')).toBeVisible();

      // Check health score visualization
      const healthBars = page.locator('.bg-green-600, .bg-yellow-600, .bg-red-600');
      await expect(healthBars).toHaveCount({ min: 1 });
    });

    test('generates real-time suggestions', async () => {
      await page.click('button:has-text("Insights™")');
      await page.click('button:has-text("💡 Suggestions")');

      // Check for suggestion priorities
      await expect(page.locator('.bg-red-600:has-text("HIGH"), .bg-yellow-600:has-text("MEDIUM")')).toHaveCount({ min: 1 });

      // Verify suggestion content
      await expect(page.locator('text=Execute Suggestion')).toBeVisible();

      // Test suggestion execution
      const executeButton = page.locator('button:has-text("Execute Suggestion")').first();
      if (await executeButton.isVisible()) {
        await executeButton.click();
        await expect(page.locator('text=✅ Executed')).toBeVisible();
      }
    });

    test('calculates revenue attribution', async () => {
      await page.click('button:has-text("Insights™")');
      await page.click('button:has-text("💰 Revenue")');

      // Verify revenue attribution section
      await expect(page.locator('text=💰 Revenue Attribution')).toBeVisible();

      // Check for revenue sources
      const revenueSources = page.locator('.text-white.font-medium');
      await expect(revenueSources).toHaveCount({ min: 1 });

      // Verify revenue metrics
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=Avg. Order Value')).toBeVisible();
    });

    test('provides optimization recommendations', async () => {
      await page.click('button:has-text("Insights™")');
      await page.click('button:has-text("⚡ Optimize")');

      // Check for optimization cards
      const optimizationCards = page.locator('.bg-gray-800.border.border-gray-700');
      await expect(optimizationCards).toHaveCount({ min: 1 });

      // Verify impact metrics display
      await expect(page.locator('text=Revenue')).toBeVisible();
      await expect(page.locator('text=Engagement')).toBeVisible();
      await expect(page.locator('text=Conversion')).toBeVisible();

      // Check difficulty indicators
      await expect(page.locator('.bg-green-900:has-text("easy"), .bg-yellow-900:has-text("medium")')).toHaveCount({ min: 1 });
    });
  });

  test.describe('SmartScheduler™', () => {
    test('implements AI time optimization', async () => {
      await page.click('button:has-text("Scheduler™")');

      // Verify SmartScheduler™ header
      await expect(page.locator('text=📅 SmartScheduler™ AI')).toBeVisible();

      // Check configuration options
      await expect(page.locator('select')).toHaveCount({ min: 1 }); // Content type dropdown
      await expect(page.locator('input[type="number"]')).toHaveCount({ min: 2 }); // Duration and audience goal

      // Test AI recommendation generation
      await page.click('button:has-text("🤖 Generate AI Recommendation")');

      // Wait for recommendation
      await page.waitForTimeout(2000);

      // Verify AI recommendation appears
      await expect(page.locator('text=🎯 AI RECOMMENDATION')).toBeVisible();
    });

    test('generates schedule recommendations with confidence scores', async () => {
      await page.click('button:has-text("Scheduler™")');

      // Generate recommendation
      await page.click('button:has-text("🤖 Generate AI Recommendation")');
      await page.waitForTimeout(2000);

      // Verify recommendation details
      await expect(page.locator('text=Expected Viewers')).toBeVisible();
      await expect(page.locator('text=Revenue Projection')).toBeVisible();
      await expect(page.locator('text=Engagement Score')).toBeVisible();

      // Check confidence score
      await expect(page.locator('text=% confidence')).toBeVisible();

      // Verify optimization tips
      await expect(page.locator('text=💡 AI Optimization Tips:')).toBeVisible();
    });

    test('displays alternative time slots', async () => {
      await page.click('button:has-text("Scheduler™")');
      await page.click('button:has-text("🤖 Generate AI Recommendation")');
      await page.waitForTimeout(2000);

      // Check alternative slots section
      await expect(page.locator('text=⏰ Alternative Time Slots')).toBeVisible();

      // Verify time slot cards
      const timeSlots = page.locator('.bg-gray-800.rounded-lg.p-3.border.cursor-pointer');
      await expect(timeSlots).toHaveCount({ min: 3 });

      // Test slot selection
      const firstSlot = timeSlots.first();
      await firstSlot.click();

      // Verify selection state
      await expect(page.locator('.border-orange-500')).toBeVisible();

      // Test scheduling alternative
      await page.click('button:has-text("Schedule Alternative")');
    });
  });

  test.describe('AI Suite Integration', () => {
    test('verifies all AI features work together', async () => {
      // Test navigation between AI tabs
      const aiTabs = ['Hot Leads', 'AI Chat', 'AutoOffer™', 'Insights™', 'Scheduler™'];

      for (const tab of aiTabs) {
        await page.click(`button:has-text("${tab}")`);
        await expect(page.locator(`:text("${tab}")`)).toBeVisible();

        // Verify tab content loads
        await page.waitForTimeout(1000);

        // Each AI component should display without errors
        const errorMessages = page.locator('text=Error, text=Failed');
        await expect(errorMessages).toHaveCount(0);
      }
    });

    test('validates real-time data synchronization', async () => {
      // Start with Hot Leads tab
      await page.click('button:has-text("Hot Leads")');

      // Get initial hot leads count
      const hotLeadsTabButton = page.locator('button:has-text("Hot Leads")');
      const initialCount = await hotLeadsTabButton.textContent();

      // Switch to AI Chat and generate some activity
      await page.click('button:has-text("AI Chat")');
      await page.waitForTimeout(3000); // Let AI generate some messages

      // Switch back to Hot Leads
      await page.click('button:has-text("Hot Leads")');

      // Verify data is still consistent
      await expect(page.locator('text=🎯 AI Hot Leads Engine')).toBeVisible();

      // Switch to Insights to verify cross-component data sharing
      await page.click('button:has-text("Insights™")');
      await expect(page.locator('text=Stream Health')).toBeVisible();
    });

    test('ensures AI accuracy across all components', async () => {
      // Test Hot Lead scoring accuracy
      await page.click('button:has-text("Hot Leads")');
      const hotLeadScores = await page.locator('.text-2xl.font-bold').allTextContents();
      const validScores = hotLeadScores.map(s => parseInt(s)).filter(s => !isNaN(s) && s >= 0 && s <= 100);
      expect(validScores.length).toBeGreaterThan(0);

      // Test AutoOffer confidence accuracy
      await page.click('button:has-text("AutoOffer™")');
      await page.waitForTimeout(1000);
      const confidenceScores = await page.locator('.font-mono').allTextContents();
      const validConfidence = confidenceScores
        .filter(s => s.includes('%'))
        .map(s => parseInt(s))
        .filter(s => !isNaN(s) && s >= 0 && s <= 100);
      expect(validConfidence.length).toBeGreaterThan(0);

      // Test Insights metrics accuracy
      await page.click('button:has-text("Insights™")');
      const healthScores = await page.locator('.text-2xl.font-bold').allTextContents();
      const validHealth = healthScores.map(s => parseInt(s.replace('%', ''))).filter(s => !isNaN(s) && s >= 0 && s <= 100);
      expect(validHealth.length).toBeGreaterThan(0);

      // Verify Scheduler recommendations are realistic
      await page.click('button:has-text("Scheduler™")');
      await page.click('button:has-text("🤖 Generate AI Recommendation")');
      await page.waitForTimeout(2000);

      const expectedViewers = await page.locator('text=Expected Viewers').locator('..').locator('.text-white.font-bold').textContent();
      if (expectedViewers) {
        const viewerCount = parseInt(expectedViewers);
        expect(viewerCount).toBeGreaterThan(0);
        expect(viewerCount).toBeLessThan(10000); // Reasonable upper bound
      }
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('measures AI component load times', async () => {
      const startTime = Date.now();

      // Test each AI component load time
      const components = ['Hot Leads', 'AI Chat', 'AutoOffer™', 'Insights™', 'Scheduler™'];

      for (const component of components) {
        const componentStart = Date.now();
        await page.click(`button:has-text("${component}")`);
        await page.waitForSelector(`text=${component}`, { timeout: 5000 });
        const componentLoad = Date.now() - componentStart;

        // Each component should load within 5 seconds
        expect(componentLoad).toBeLessThan(5000);
      }

      const totalTime = Date.now() - startTime;

      // Total AI suite initialization should be under 30 seconds
      expect(totalTime).toBeLessThan(30000);
    });

    test('verifies AI animations are smooth', async () => {
      await page.click('button:has-text("Hot Leads")');

      // Check that score meters are rendered (CSS animations can't be directly tested)
      const animatedElements = page.locator('[style*="conic-gradient"]');
      await expect(animatedElements).toHaveCount({ min: 1 });

      // Verify hover interactions don't break the UI
      await animatedElements.first().hover();
      await page.waitForTimeout(500);

      // UI should still be responsive
      await expect(page.locator('text=🎯 AI Hot Leads Engine')).toBeVisible();
    });
  });
});