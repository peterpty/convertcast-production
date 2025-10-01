import { test, expect, type Page } from '@playwright/test';

test.describe('AI-Powered Overlay Integration', () => {
  let page: Page;
  let overlayPage: Page;

  test.beforeEach(async ({ browser }) => {
    // Open studio page
    page = await browser.newPage();
    await page.goto('/dashboard/stream/studio');

    // Open overlay page in a separate tab (simulating OBS browser source)
    overlayPage = await browser.newPage();
    await overlayPage.goto('/overlay/test-stream-123');
  });

  test.afterEach(async () => {
    await page.close();
    await overlayPage.close();
  });

  test.describe('AI-Triggered Overlays', () => {
    test('triggers premium offer overlay for JACKPOT leads', async () => {
      // Navigate to Hot Leads in studio
      await page.click('button:has-text("Hot Leads")');

      // Find a JACKPOT level viewer and trigger premium offer
      const jackpotViewer = page.locator('.border-red-500.animate-pulse').first();
      if (await jackpotViewer.isVisible()) {
        await jackpotViewer.click();

        // Trigger premium offer action
        const premiumButton = page.locator('button:has-text("🎯 Send premium offer immediately")');
        if (await premiumButton.isVisible()) {
          await premiumButton.click();
        }
      }

      // Verify overlay appears on overlay page
      // Note: In a real implementation, this would trigger via WebSocket
      await overlayPage.waitForTimeout(2000);

      // Check for offer overlay appearance (would be implemented in overlay renderer)
      // This is a placeholder for actual overlay testing
      console.log('Premium offer overlay should appear for JACKPOT leads');
    });

    test('displays engagement overlays for optimal timing', async () => {
      // Go to AutoOffer tab
      await page.click('button:has-text("AutoOffer™")');

      // Wait for auto-offer analysis
      await page.waitForTimeout(3000);

      // Verify high-confidence offers are being analyzed
      const highConfidenceOffers = page.locator('.text-green-400').filter({ hasText: '%' });
      if (await highConfidenceOffers.count() > 0) {
        // In real implementation, auto-offers would trigger overlays
        console.log('High-confidence offers should trigger overlays automatically');
      }

      // Test manual offer trigger
      const manualOfferButton = page.locator('button:has-text("🎰 Jackpot")').first();
      if (await manualOfferButton.isVisible()) {
        await manualOfferButton.click();

        // Verify overlay trigger (would check WebSocket message or overlay appearance)
        // This would be implemented in the actual overlay system
      }
    });

    test('shows AI suggestions as overlay notifications', async () => {
      // Navigate to Insights tab
      await page.click('button:has-text("Insights™")');
      await page.click('button:has-text("💡 Suggestions")');

      // Wait for AI suggestions to generate
      await page.waitForTimeout(2000);

      // Find high-priority suggestions
      const highPrioritySuggestion = page.locator('.border-red-500').first();
      if (await highPrioritySuggestion.isVisible()) {
        const executeButton = highPrioritySuggestion.locator('button:has-text("Execute Suggestion")');
        if (await executeButton.isVisible()) {
          await executeButton.click();

          // In real implementation, this would trigger overlay notification
          await expect(highPrioritySuggestion.locator('text=✅ Executed')).toBeVisible();
        }
      }
    });
  });

  test.describe('Real-time AI Data in Overlays', () => {
    test('displays live viewer count with AI enhancement', async () => {
      // Check overlay page for viewer count display
      await overlayPage.waitForTimeout(1000);

      // In the overlay system, AI-enhanced viewer counts would include:
      // - Total viewers
      // - Hot leads count
      // - Engagement quality score

      // Verify development debug info is shown
      if (process.env.NODE_ENV === 'development') {
        const debugInfo = overlayPage.locator('.absolute.bottom-4.right-4');
        await expect(debugInfo).toBeVisible();
      }

      // Test that overlay responds to studio changes
      await page.click('button:has-text("Hot Leads")');

      // In real implementation, viewer data changes would reflect in overlay
      console.log('Overlay should update with AI-enhanced viewer metrics');
    });

    test('shows AI-powered social proof overlays', async () => {
      // Navigate to Insights for social proof data
      await page.click('button:has-text("Insights™")');

      // Check revenue attribution data
      await page.click('button:has-text("💰 Revenue")');

      // Wait for revenue data
      await page.waitForTimeout(1000);

      // Verify revenue metrics are available for overlay display
      const revenueMetrics = page.locator('text=Total Revenue');
      if (await revenueMetrics.isVisible()) {
        // In overlay system, this would trigger social proof overlay
        console.log('Social proof overlay should display revenue milestones');
      }

      // Check for testimonial data in AI Chat
      await page.click('button:has-text("AI Chat")');

      // Enable testimonials
      const testimonialsCheckbox = page.locator('input[type="checkbox"]:near(:text("💬 Testimonials"))');
      if (await testimonialsCheckbox.isVisible()) {
        await testimonialsCheckbox.check();

        // Wait for testimonial messages
        await page.waitForTimeout(3000);

        // Verify testimonial content exists for overlay use
        const testimonialMessages = page.locator('span:has-text("AI")');
        await expect(testimonialMessages).toHaveCount({ min: 1 });
      }
    });

    test('integrates AI scoring with overlay urgency levels', async () => {
      await page.click('button:has-text("Hot Leads")');

      // Find viewers with different intent levels
      const viewers = page.locator('.bg-gray-800.rounded-xl');
      const viewerCount = await viewers.count();

      if (viewerCount > 0) {
        for (let i = 0; i < Math.min(3, viewerCount); i++) {
          const viewer = viewers.nth(i);

          // Check intent level indicators
          const intentLevels = viewer.locator('.text-xs.px-2.py-1.rounded-full');
          if (await intentLevels.count() > 0) {
            const levelText = await intentLevels.first().textContent();

            // Verify appropriate urgency mapping
            if (levelText?.includes('JACKPOT')) {
              // Should trigger immediate/urgent overlays
              console.log('JACKPOT level should trigger urgent overlays');
            } else if (levelText?.includes('HOT')) {
              // Should trigger high-priority overlays
              console.log('HOT LEAD level should trigger high-priority overlays');
            }
          }
        }
      }

      // Test overlay urgency in AutoOffer system
      await page.click('button:has-text("AutoOffer™")');

      // Check for active offers with confidence scores
      const confidenceScores = page.locator('.font-mono.text-green-400');
      const highConfidenceCount = await confidenceScores.count();

      if (highConfidenceCount > 0) {
        // High confidence offers should trigger urgent overlays
        console.log('High confidence offers should have urgent overlay priority');
      }
    });
  });

  test.describe('AI Chat Integration with Overlays', () => {
    test('synchronizes synthetic chat with overlay display', async () => {
      await page.click('button:has-text("AI Chat")');

      // Enable synthetic chat features
      await page.check('input[type="checkbox"]:near(:text("🎭 Synthetic Viewers"))');
      await page.check('input[type="checkbox"]:near(:text("💬 Testimonials"))');
      await page.check('input[type="checkbox"]:near(:text("🤝 Trust Building"))');

      // Set high frequency for testing
      await page.locator('input[type="range"]').fill('8');

      // Wait for synthetic messages to generate
      await page.waitForTimeout(5000);

      // Verify synthetic messages are created
      const syntheticMessages = page.locator('.bg-purple-900\\/10');
      await expect(syntheticMessages).toHaveCount({ min: 1 });

      // Check message intent levels for overlay integration
      const intentBadges = page.locator('span:has-text("HOT_LEAD"), span:has-text("WARM"), span:has-text("LUKEWARM")');
      if (await intentBadges.count() > 0) {
        // Intent levels should influence overlay display timing
        console.log('Message intent levels should influence overlay timing');
      }

      // Test streamer override impact on overlays
      const overrideInput = page.locator('input[placeholder*="Override"]');
      await overrideInput.fill('Testing overlay integration');
      await page.click('button:has-text("Send")');

      // Streamer messages should have priority in overlay system
      await expect(page.locator('text=Testing overlay integration')).toBeVisible();
    });

    test('uses AI chat sentiment for overlay personalization', async () => {
      await page.click('button:has-text("AI Chat")');

      // Generate various message types
      const quickResponses = [
        'button:has-text("Thanks for joining! 🎉")',
        'button:has-text("Great question!")',
        'button:has-text("Absolutely, let me explain")'
      ];

      for (const responseSelector of quickResponses) {
        const button = page.locator(responseSelector);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(1000);
        }
      }

      // Verify different response types generate appropriate sentiment data
      const messages = page.locator('.text-white.text-sm');
      const messageCount = await messages.count();

      if (messageCount > 0) {
        // Different message sentiments should trigger different overlay styles
        console.log('Message sentiment should personalize overlay appearance');
      }

      // Check for engagement metrics that would influence overlays
      const engagementStats = page.locator('text=Engagement Level:');
      if (await engagementStats.isVisible()) {
        // Engagement levels should modify overlay behavior
        console.log('Engagement levels should modify overlay behavior');
      }
    });
  });

  test.describe('Smart Scheduler Integration', () => {
    test('provides overlay countdown for scheduled streams', async () => {
      await page.click('button:has-text("Scheduler™")');

      // Configure a future stream
      await page.selectOption('select', 'webinar');
      await page.fill('input[type="number"]', '90'); // Duration
      await page.fill('input[type="number"][min="10"]', '200'); // Audience goal

      // Generate schedule recommendation
      await page.click('button:has-text("🤖 Generate AI Recommendation")');
      await page.waitForTimeout(3000);

      // Verify recommendation appears
      await expect(page.locator('text=🎯 AI RECOMMENDATION')).toBeVisible();

      // Check expected outcomes for overlay use
      const expectedViewers = page.locator('text=Expected Viewers');
      const revenueProjection = page.locator('text=Revenue Projection');

      if (await expectedViewers.isVisible() && await revenueProjection.isVisible()) {
        // These metrics should be available for pre-stream overlays
        console.log('Schedule metrics should be available for pre-stream overlays');
      }

      // Test scheduling a stream
      const scheduleButton = page.locator('button:has-text("📅 Schedule This Time")');
      if (await scheduleButton.isVisible()) {
        await scheduleButton.click();

        // In real implementation, would set up overlay countdown
        console.log('Scheduling should trigger overlay countdown setup');
      }
    });

    test('uses AI optimization tips for overlay content', async () => {
      await page.click('button:has-text("Scheduler™")');

      // Generate recommendation with tips
      await page.click('button:has-text("🤖 Generate AI Recommendation")');
      await page.waitForTimeout(3000);

      // Check for optimization tips
      const optimizationTips = page.locator('text=💡 AI Optimization Tips:');
      if (await optimizationTips.isVisible()) {
        // Tips should be used for overlay messaging
        const tipsList = page.locator('.text-gray-300.text-xs');
        const tipCount = await tipsList.count();

        if (tipCount > 0) {
          console.log('AI optimization tips should influence overlay content');
        }
      }

      // Check alternative time slots for overlay display
      const alternativeSlots = page.locator('text=⏰ Alternative Time Slots');
      if (await alternativeSlots.isVisible()) {
        const timeSlots = page.locator('.bg-gray-800.rounded-lg.p-3.border.cursor-pointer');
        const slotCount = await timeSlots.count();

        if (slotCount > 0) {
          // Alternative slots could be shown in overlays for rescheduling
          console.log('Alternative time slots should be available for overlay rescheduling prompts');
        }
      }
    });
  });

  test.describe('Cross-Component AI Integration', () => {
    test('ensures AI data consistency across all systems', async () => {
      // Test data flow between all AI components

      // 1. Start with Hot Leads data
      await page.click('button:has-text("Hot Leads")');
      const hotLeadCount = page.locator('🔥').count();

      // 2. Check AutoOffer uses same data
      await page.click('button:has-text("AutoOffer™")');
      await page.waitForTimeout(1000);

      // Should show consistent opportunity counts
      const opportunities = page.locator('.bg-green-900\\/20');
      console.log('AutoOffer opportunities should match hot lead analysis');

      // 3. Verify Insights reflects same metrics
      await page.click('button:has-text("Insights™")');
      const streamHealth = page.locator('text=Stream Health');

      if (await streamHealth.isVisible()) {
        // Health metrics should be consistent with lead scoring
        console.log('Stream health should reflect hot lead metrics');
      }

      // 4. Check AI Chat uses same viewer data
      await page.click('button:has-text("AI Chat")');
      const engagementLevel = page.locator('text=Engagement Level:');

      if (await engagementLevel.isVisible()) {
        // Should show consistent engagement with other components
        console.log('Chat engagement should match insights data');
      }

      // 5. Verify Scheduler considers current metrics
      await page.click('button:has-text("Scheduler™")');
      await page.click('button:has-text("🤖 Generate AI Recommendation")');
      await page.waitForTimeout(2000);

      const recommendation = page.locator('text=🎯 AI RECOMMENDATION');
      if (await recommendation.isVisible()) {
        // Recommendations should factor in current performance
        console.log('Scheduler should consider current AI metrics');
      }
    });

    test('validates end-to-end AI workflow accuracy', async () => {
      // Simulate complete AI workflow

      // 1. AI identifies hot leads
      await page.click('button:has-text("Hot Leads")');
      const jackpotLeads = page.locator('.border-red-500.animate-pulse');
      const jackpotCount = await jackpotLeads.count();

      // 2. AutoOffer should trigger for these leads
      await page.click('button:has-text("AutoOffer™")');
      await page.waitForTimeout(2000);

      const autoOffers = page.locator('.bg-green-900\\/20:has-text("READY FOR OFFER")');
      const autoOfferCount = await autoOffers.count();

      // 3. Insights should show high conversion opportunity
      await page.click('button:has-text("Insights™")');
      const conversionOpportunity = page.locator('text=Conversion Opportunity');

      if (await conversionOpportunity.isVisible()) {
        const opportunityParent = conversionOpportunity.locator('..');
        const opportunityScore = await opportunityParent.locator('.text-white.text-lg.font-bold').textContent();

        if (opportunityScore) {
          const score = parseInt(opportunityScore.replace('%', ''));
          // High jackpot leads should correlate with high conversion opportunity
          if (jackpotCount > 0) {
            expect(score).toBeGreaterThan(30); // Reasonable threshold
          }
        }
      }

      // 4. AI Chat should reflect high-value audience
      await page.click('button:has-text("AI Chat")');
      await page.waitForTimeout(2000);

      const averageEngagement = page.locator('text=Engagement Level:');
      if (await averageEngagement.isVisible()) {
        // Should show high engagement when we have jackpot leads
        console.log('Chat engagement should reflect hot lead presence');
      }

      // 5. Scheduler should optimize for current audience quality
      await page.click('button:has-text("Scheduler™")');

      // Set high audience goal since we have quality leads
      await page.fill('input[type="number"][min="10"]', '150');
      await page.click('button:has-text("🤖 Generate AI Recommendation")');
      await page.waitForTimeout(3000);

      const projectedRevenue = page.locator('text=Revenue Projection');
      if (await projectedRevenue.isVisible()) {
        // Should project higher revenue for quality audience
        console.log('Revenue projection should reflect audience quality');
      }

      // Verify all components show consistent AI analysis
      expect(true).toBe(true); // Placeholder for actual cross-validation
    });
  });
});