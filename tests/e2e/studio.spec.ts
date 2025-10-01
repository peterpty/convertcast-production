import { test, expect } from '@playwright/test';

test.describe('Digital Streaming Studio', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to streaming studio
    await page.goto('/dashboard/stream/studio');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should load studio dashboard with all components', async ({ page }) => {
    // Wait for studio to load
    await expect(page.locator('text=Studio Control')).toBeVisible();
    
    // Check main components are present
    await expect(page.locator('text=Live Preview')).toBeVisible();
    await expect(page.locator('text=Live Dashboard')).toBeVisible();
    
    // Verify connection status
    await expect(page.locator('text=Connected')).toBeVisible();
    
    // Check demo stream info
    await expect(page.locator('text=Demo Webinar - ConvertCast Studio')).toBeVisible();
    await expect(page.locator('text=LIVE')).toBeVisible();
    await expect(page.locator('text=viewers')).toBeVisible();
  });

  test('should display live preview canvas with correct dimensions', async ({ page }) => {
    // Check live preview section
    await expect(page.locator('text=Live Preview')).toBeVisible();
    await expect(page.locator('text=1920×1080')).toBeVisible();
    await expect(page.locator('text=16:9')).toBeVisible();
    
    // Check for live video placeholder
    await expect(page.locator('text=Live Video Stream')).toBeVisible();
    await expect(page.locator('text=LIVE PREVIEW')).toBeVisible();
  });

  test.describe('Left Panel - Overlay Controls', () => {
    test('should switch between overlay control tabs', async ({ page }) => {
      // Check default tab is overlays
      await expect(page.locator('[data-testid="overlay-tab"]')).toHaveClass(/text-purple-400/);
      
      // Switch to EngageMax™ tab
      await page.click('text=EngageMax™');
      await expect(page.locator('text=EngageMax™ Control Center')).toBeVisible();
      
      // Switch to AutoOffer™ tab
      await page.click('text=AutoOffer™');
      await expect(page.locator('text=AutoOffer™ Conversion Engine')).toBeVisible();
    });

    test('should control lower thirds overlay', async ({ page }) => {
      // Make sure we're on overlay controls
      await page.click('text=Overlay Controls');
      
      // Find and click lower thirds section
      await page.click('text=Lower Thirds');
      
      // Toggle lower thirds visibility
      const toggle = page.locator('input[type="checkbox"]').first();
      await toggle.check();
      
      // Update text fields
      await page.fill('input[placeholder="Enter main text"]', 'Test Main Text');
      await page.fill('input[placeholder="Enter subtext"]', 'Test Subtitle');
      
      // Change position
      await page.selectOption('select', 'bottom-center');
      
      // Change style
      await page.click('text=elegant');
    });

    test('should control countdown timer', async ({ page }) => {
      await page.click('text=Overlay Controls');
      await page.click('text=Countdown Timer');
      
      // Toggle countdown visibility
      const toggle = page.locator('input[type="checkbox"]').nth(1);
      await toggle.check();
      
      // Set countdown message
      await page.fill('input[placeholder="Countdown message"]', 'Stream Starting Soon!');
      
      // Test quick time buttons
      await page.click('text=+5 min');
      
      // Verify countdown is now visible (check for timer format)
      await expect(page.locator('text=/\d{2}:\d{2}:\d{2}/')).toBeVisible({ timeout: 10000 });
    });

    test('should control registration CTA', async ({ page }) => {
      await page.click('text=Overlay Controls');
      await page.click('text=Registration CTA');
      
      // Toggle CTA visibility
      const toggle = page.locator('input[type="checkbox"]').nth(2);
      await toggle.check();
      
      // Update CTA text
      await page.fill('input[placeholder="CTA headline"]', 'Join Now for Free!');
      await page.fill('input[placeholder="Button text"]', 'Register Today');
      
      // Enable urgency mode
      const urgencyToggle = page.locator('text=Urgency Mode').locator('..//input[@type="checkbox"]');
      await urgencyToggle.check();
    });

    test('should use quick actions', async ({ page }) => {
      await page.click('text=Overlay Controls');
      
      // Test Hide All button
      await page.click('text=Hide All');
      
      // Test Show Essentials button  
      await page.click('text=Show Essentials');
      
      // Verify essentials are shown
      await expect(page.locator('text=Welcome to the Stream')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('EngageMax™ Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=EngageMax™');
    });

    test('should display EngageMax™ control center', async ({ page }) => {
      await expect(page.locator('text=🚀 EngageMax™ Control Center')).toBeVisible();
      await expect(page.locator('text=Boost engagement by 234%')).toBeVisible();
      
      // Check all section buttons are present
      await expect(page.locator('text=Live Polls')).toBeVisible();
      await expect(page.locator('text=Quiz Builder')).toBeVisible();
      await expect(page.locator('text=Emoji Reactions')).toBeVisible();
      await expect(page.locator('text=Smart CTAs')).toBeVisible();
    });

    test('should create and launch live poll', async ({ page }) => {
      // Select polls section (should be default)
      await page.click('text=Live Polls');
      
      // Fill out poll form
      await page.fill('input[placeholder*="ask your audience"]', 'What is your biggest challenge?');
      await page.fill('input[placeholder="Option 1"]', 'Lead Generation');
      await page.fill('input[placeholder="Option 2"]', 'Content Creation');
      
      // Add another option
      await page.click('text=+ Add Option');
      await page.fill('input[placeholder="Option 3"]', 'Email Marketing');
      
      // Launch poll
      await page.click('text=📊 Launch Poll');
      
      // Verify poll is active
      await expect(page.locator('text=Active Poll')).toBeVisible();
      await expect(page.locator('text=ACTIVE')).toBeVisible();
      
      // End poll
      await page.click('text=End Poll');
    });

    test('should use predefined poll templates', async ({ page }) => {
      await page.click('text=Live Polls');
      
      // Click first template
      await page.click('text=What\'s your biggest challenge with online marketing?');
      
      // Verify template loaded
      await expect(page.locator('input[value*="biggest challenge"]')).toBeVisible();
      await expect(page.locator('input[value="Lead Generation"]')).toBeVisible();
    });

    test('should enable quiz mode', async ({ page }) => {
      await page.click('text=Live Polls');
      
      // Enable quiz mode
      await page.check('input[type="checkbox"] + text=Quiz Mode');
      
      // Verify quiz indicators appear
      await expect(page.locator('text=(Quiz)')).toBeVisible();
      await expect(page.locator('text=✓ Correct')).toBeVisible();
      
      // Fill quiz question
      await page.fill('input[placeholder*="quiz question"]', 'What does ROI stand for?');
      await page.fill('input[placeholder="Option 1"]', 'Return on Investment');
      await page.fill('input[placeholder="Option 2"]', 'Rate of Interest');
      
      // Launch quiz
      await page.click('text=🧠 Start Quiz');
    });

    test('should control emoji reactions', async ({ page }) => {
      await page.click('text=Emoji Reactions');
      
      // Toggle reactions
      const reactionsToggle = page.locator('text=Live Reactions').locator('..//input[@type="checkbox"]');
      await reactionsToggle.check();
      
      // Change position
      await page.click('text=🎈 Floating');
      await page.click('text=📍 Bottom Bar');
      
      // Check available emojis are shown
      await expect(page.locator('text=❤️')).toBeVisible();
      await expect(page.locator('text=👍')).toBeVisible();
      await expect(page.locator('text=🔥')).toBeVisible();
    });

    test('should trigger smart CTAs', async ({ page }) => {
      await page.click('text=Smart CTAs');
      
      // Update CTA message
      await page.fill('textarea[placeholder*="call-to-action"]', 'Limited time offer - 50% off!');
      
      // Trigger CTA
      await page.click('text=🚀 Trigger Smart CTA');
      
      // Use predefined CTA
      await page.click('text=🚀 Register now for exclusive bonus content!');
      
      // Verify message updated
      await expect(page.locator('textarea[value*="Register now"]')).toBeVisible();
    });
  });

  test.describe('AutoOffer™ Features', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('text=AutoOffer™');
    });

    test('should display AutoOffer™ control center', async ({ page }) => {
      await expect(page.locator('text=💰 AutoOffer™ Conversion Engine')).toBeVisible();
      await expect(page.locator('text=Increase conversions by 189%')).toBeVisible();
      
      // Check all sections
      await expect(page.locator('text=Dynamic Pricing')).toBeVisible();
      await expect(page.locator('text=A/B Testing')).toBeVisible();
      await expect(page.locator('text=Behavioral Triggers')).toBeVisible();
      await expect(page.locator('text=Performance')).toBeVisible();
    });

    test('should apply pricing strategies', async ({ page }) => {
      await page.click('text=Dynamic Pricing');
      
      // Click on pricing strategies
      await page.click('text=Early Bird');
      await page.click('text=Flash Sale');
      await page.click('text=Bundle Deal');
      
      // Use quick actions
      await page.click('text=⚡ Flash Offer');
      await page.click('text=🔥 Mid-Stream');
      await page.click('text=🎯 Closing Offer');
    });

    test('should set up A/B testing experiment', async ({ page }) => {
      await page.click('text=A/B Testing');
      
      // Configure Variant A
      await page.fill('input[value="497"]', '399');
      await page.fill('input[value*="Early Bird"]', 'Super Early Bird - 60% Off!');
      
      // Configure Variant B
      await page.fill('input[value="697"]', '597');
      await page.fill('input[value*="Premium Training"]', 'Ultimate Business Package');
      
      // Start experiment
      await page.click('text=🧪 Start A/B Test');
      
      // Verify experiment is running
      await expect(page.locator('text=EXPERIMENT RUNNING')).toBeVisible();
      
      // Stop experiment
      await page.click('text=⏹️ Stop Experiment');
    });

    test('should configure behavioral triggers', async ({ page }) => {
      await page.click('text=Behavioral Triggers');
      
      // Toggle triggers
      const triggers = page.locator('input[type="checkbox"]');
      const triggerCount = await triggers.count();
      
      // Toggle first few triggers
      for (let i = 0; i < Math.min(3, triggerCount); i++) {
        await triggers.nth(i).click();
      }
      
      // Verify trigger descriptions
      await expect(page.locator('text=High Engagement')).toBeVisible();
      await expect(page.locator('text=engagement > 80%')).toBeVisible();
    });

    test('should display performance analytics', async ({ page }) => {
      await page.click('text=Performance');
      
      // Check analytics cards
      await expect(page.locator('text=Conversion Rate')).toBeVisible();
      await expect(page.locator('text=18.7%')).toBeVisible();
      await expect(page.locator('text=Revenue per Viewer')).toBeVisible();
      await expect(page.locator('text=$47.20')).toBeVisible();
      
      // Check performance data
      await expect(page.locator('text=A/B Test Winner')).toBeVisible();
      await expect(page.locator('text=Variant B')).toBeVisible();
      await expect(page.locator('text=+34% better performance')).toBeVisible();
    });
  });

  test.describe('Right Panel - Live Dashboard', () => {
    test('should switch between dashboard tabs', async ({ page }) => {
      // Check default tab and switch between them
      await page.click('text=💬');
      await expect(page.locator('text=Send a message to viewers')).toBeVisible();
      
      await page.click('text=🔥');
      await expect(page.locator('text=🔥 AI Hot Leads Engine')).toBeVisible();
      
      await page.click('text=📈');
      await expect(page.locator('text=📈 Real-time Analytics')).toBeVisible();
    });

    test('should display and interact with live chat', async ({ page }) => {
      await page.click('text=💬');
      
      // Check for demo messages
      await expect(page.locator('text=Sarah M.')).toBeVisible();
      await expect(page.locator('text=This is exactly what I needed!')).toBeVisible();
      
      // Send a message
      await page.fill('input[placeholder*="Send a message"]', 'Hello everyone!');
      await page.click('text=Send');
      
      // Verify message appears
      await expect(page.locator('text=Hello everyone!')).toBeVisible();
      await expect(page.locator('text=Streamer')).toBeVisible();
    });

    test('should display AI Hot Leads', async ({ page }) => {
      await page.click('text=🔥');
      
      // Check hot leads header
      await expect(page.locator('text=🔥 AI Hot Leads Engine')).toBeVisible();
      await expect(page.locator('text=AI-powered lead scoring')).toBeVisible();
      
      // Check for demo leads
      await expect(page.locator('text=Lisa R.')).toBeVisible();
      await expect(page.locator('text=JACKPOT')).toBeVisible();
      await expect(page.locator('text=92%')).toBeVisible();
      
      // Check lead details
      await expect(page.locator('text=Asked about advanced features')).toBeVisible();
      await expect(page.locator('text=High engagement')).toBeVisible();
      
      // Test action buttons
      await expect(page.locator('text=📧 Send Offer')).toBeVisible();
      await expect(page.locator('text=📞 Follow Up')).toBeVisible();
    });

    test('should display real-time analytics', async ({ page }) => {
      await page.click('text=📈');
      
      // Check analytics metrics
      await expect(page.locator('text=Active Viewers')).toBeVisible();
      await expect(page.locator('text=1,247')).toBeVisible();
      
      await expect(page.locator('text=Engagement Rate')).toBeVisible();
      await expect(page.locator('text=87.3%')).toBeVisible();
      
      await expect(page.locator('text=Hot Leads')).toBeVisible();
      await expect(page.locator('text=Conversion Rate')).toBeVisible();
      
      // Check engagement actions
      await expect(page.locator('text=Poll Participation')).toBeVisible();
      await expect(page.locator('text=Chat Messages')).toBeVisible();
      await expect(page.locator('text=Emoji Reactions')).toBeVisible();
    });
  });

  test('should display connection status', async ({ page }) => {
    // Check connection indicators
    await expect(page.locator('text=Connected')).toBeVisible();
    
    // Check WebSocket status dot
    const statusDot = page.locator('.bg-green-400.animate-pulse');
    await expect(statusDot).toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main components should still be visible
    await expect(page.locator('text=Studio Control')).toBeVisible();
    await expect(page.locator('text=Live Preview')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page.locator('text=EngageMax™')).toBeVisible();
    await expect(page.locator('text=AutoOffer™')).toBeVisible();
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await expect(page.locator('text=Live Dashboard')).toBeVisible();
  });
});

test.describe('OBS Browser Source', () => {
  test('should render transparent overlay page', async ({ page }) => {
    // Navigate to overlay page
    await page.goto('/overlay/demo-stream-id');
    
    // Page should load
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    
    // Check for debug info in development
    await expect(page.locator('text=Stream: demo-stream-id')).toBeVisible();
  });

  test('should display overlays when configured', async ({ page, context }) => {
    // First, set up some overlays in the studio
    const studioPage = await context.newPage();
    await studioPage.goto('/dashboard/stream/studio');
    
    // Enable lower thirds
    await studioPage.click('text=Overlay Controls');
    await studioPage.click('text=Lower Thirds');
    const toggle = studioPage.locator('input[type="checkbox"]').first();
    await toggle.check();
    
    // Now check overlay page
    await page.goto('/overlay/demo-stream-id');
    
    // Should eventually show overlay (mock WebSocket will sync)
    await expect(page.locator('text=Welcome to ConvertCast')).toBeVisible({ timeout: 10000 });
    
    await studioPage.close();
  });
});

test.describe('Studio Integration', () => {
  test('should synchronize between studio and overlay', async ({ page, context }) => {
    // Open studio in one page
    const studioPage = await context.newPage();
    await studioPage.goto('/dashboard/stream/studio');
    
    // Open overlay in another page
    await page.goto('/overlay/demo-stream-id');
    
    // Enable countdown in studio
    await studioPage.click('text=Overlay Controls');
    await studioPage.click('text=Countdown Timer');
    const toggle = studioPage.locator('input[type="checkbox"]').nth(1);
    await toggle.check();
    
    // Set countdown
    await studioPage.click('text=+5 min');
    
    // Overlay should eventually show countdown (mock WebSocket simulation)
    await expect(page.locator('text=Starting Soon')).toBeVisible({ timeout: 10000 });
    
    await studioPage.close();
  });

  test('should handle multiple overlay types simultaneously', async ({ page }) => {
    await page.goto('/dashboard/stream/studio');
    
    // Enable multiple overlays
    await page.click('text=Show Essentials');
    
    // Enable countdown
    await page.click('text=Countdown Timer');
    const countdownToggle = page.locator('input[type="checkbox"]').nth(1);
    await countdownToggle.check();
    await page.click('text=+5 min');
    
    // Enable CTA
    await page.click('text=Registration CTA');
    const ctaToggle = page.locator('input[type="checkbox"]').nth(2);
    await ctaToggle.check();
    
    // All should be visible in preview
    await expect(page.locator('text=Welcome to the Stream')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/\d{2}:\d{2}:\d{2}/')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Performance and Reliability', () => {
  test('should handle rapid overlay updates', async ({ page }) => {
    await page.goto('/dashboard/stream/studio');
    
    // Rapidly toggle overlays
    for (let i = 0; i < 5; i++) {
      await page.click('text=Hide All');
      await page.waitForTimeout(100);
      await page.click('text=Show Essentials');
      await page.waitForTimeout(100);
    }
    
    // Should still be responsive
    await expect(page.locator('text=Studio Control')).toBeVisible();
  });

  test('should maintain connection status', async ({ page }) => {
    await page.goto('/dashboard/stream/studio');
    
    // Should show connected status
    await expect(page.locator('text=Connected')).toBeVisible();
    
    // Status should remain stable
    await page.waitForTimeout(5000);
    await expect(page.locator('text=Connected')).toBeVisible();
  });

  test('should handle page refresh gracefully', async ({ page }) => {
    await page.goto('/dashboard/stream/studio');
    
    // Set up some state
    await page.click('text=EngageMax™');
    await page.fill('input[placeholder*="ask your audience"]', 'Test poll question');
    
    // Refresh page
    await page.reload();
    
    // Should load back to initial state
    await expect(page.locator('text=Studio Control')).toBeVisible();
    await expect(page.locator('text=Connected')).toBeVisible();
  });
});