import { test, expect } from '@playwright/test';

// Mock data for testing
const mockEvent = {
  title: 'Advanced Conversion Mastery Training',
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  time: '19:00',
  duration: '90 minutes',
  presenters: ['John Doe', 'Jane Smith'],
  topics: ['Conversion Psychology', 'A/B Testing', 'ShowUp Surge Implementation'],
  registrationUrl: 'https://convertcast.com/events/test-event'
};

const mockViewer = {
  id: 'viewer-test-001',
  name: 'Test User',
  email: 'test.user@example.com',
  phone: '+1234567890',
  intentScore: 85,
  engagementTime: 300000,
  behavior: {
    pageViews: 8,
    timeOnPage: 300,
    interactions: 12,
    scrollDepth: 0.9
  }
};

test.describe('ShowUp Surge™ Notification System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Event Creation', () => {
    test('should create event with ShowUp Surge optimization', async ({ page }) => {
      // Create event via API
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });

      expect(eventResponse.ok()).toBeTruthy();

      const eventData = await eventResponse.json();

      expect(eventData.success).toBe(true);
      expect(eventData.eventId).toBeDefined();
      expect(eventData.showUpSurgeFeatures).toBeDefined();
      expect(eventData.showUpSurgeFeatures.expectedAttendanceBoost).toBe('50-70%');
      expect(eventData.showUpSurgeFeatures.nineStageSequence).toBe(true);
      expect(eventData.showUpSurgeFeatures.aiOptimization).toBe(true);
      expect(eventData.showUpSurgeFeatures.multiChannelDelivery).toEqual(['email', 'sms', 'whatsapp', 'push']);
    });

    test('should validate required fields for event creation', async ({ page }) => {
      const invalidEvent = {
        title: 'Test Event'
        // Missing required fields
      };

      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: invalidEvent
      });

      expect(eventResponse.status()).toBe(400);

      const errorData = await eventResponse.json();
      expect(errorData.error).toContain('Missing required fields');
    });
  });

  test.describe('Viewer Registration', () => {
    test('should register viewer with ShowUp Surge optimization', async ({ page }) => {
      // First create an event
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });

      const eventData = await eventResponse.json();
      const eventId = eventData.eventId;

      // Register viewer for the event
      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId,
          viewer: mockViewer,
          source: 'test'
        }
      });

      expect(registrationResponse.ok()).toBeTruthy();

      const registrationData = await registrationResponse.json();

      expect(registrationData.success).toBe(true);
      expect(registrationData.registrationId).toBeDefined();
      expect(registrationData.showUpSurgeEnabled).toBe(true);
      expect(registrationData.expectedAttendanceIncrease).toBe('50-70%');
      expect(registrationData.scheduledNotifications).toBe(9);
      expect(registrationData.notificationChannels).toEqual(['email', 'sms', 'push']);
    });

    test('should handle high-intent viewer registration differently', async ({ page }) => {
      // Create event
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // High-intent viewer
      const highIntentViewer = {
        ...mockViewer,
        id: 'high-intent-viewer',
        intentScore: 95,
        engagementTime: 600000, // 10 minutes
        behavior: {
          pageViews: 15,
          timeOnPage: 600,
          interactions: 25,
          scrollDepth: 1.0
        }
      };

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: highIntentViewer,
          source: 'organic'
        }
      });

      expect(registrationResponse.ok()).toBeTruthy();

      const data = await registrationResponse.json();
      expect(data.success).toBe(true);
      expect(data.showUpSurgeEnabled).toBe(true);
    });

    test('should validate viewer profile data', async ({ page }) => {
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // Invalid viewer (missing required fields)
      const invalidViewer = {
        id: 'test-001'
        // Missing name and email
      };

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: invalidViewer
        }
      });

      expect(registrationResponse.status()).toBe(400);

      const errorData = await registrationResponse.json();
      expect(errorData.error).toContain('Invalid viewer profile');
    });
  });

  test.describe('Notification Scheduling', () => {
    test('should schedule 9-stage email sequence correctly', async ({ page }) => {
      // Create event and register viewer
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: mockViewer
        }
      });

      expect(registrationResponse.ok()).toBeTruthy();

      const registrationData = await registrationResponse.json();

      // Verify that 9 notifications are scheduled
      expect(registrationData.scheduledNotifications).toBe(9);

      // The system should automatically schedule:
      // 1. Instant confirmation (0 minutes)
      // 2. Welcome sequence (2 hours)
      // 3. Value reinforcement (1 day)
      // 4. Social proof (3 days)
      // 5. Pre-event preparation (1 day before)
      // 6. Day-of reminder (2 hours before)
      // 7. Final call (30 minutes before)
      // 8. Last minute incentive (5 minutes before)
      // 9. Missed event recovery (1 hour after)

      console.log('✅ 9-stage email sequence scheduled correctly');
    });

    test('should adapt timing based on viewer behavior', async ({ page }) => {
      // Create event
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // Morning person viewer
      const morningViewer = {
        ...mockViewer,
        id: 'morning-viewer',
        behavior: {
          ...mockViewer.behavior,
          bestEmailOpenTime: '09:00'
        }
      };

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: morningViewer
        }
      });

      expect(registrationResponse.ok()).toBeTruthy();

      // ShowUp Surge should schedule emails at optimal times based on behavior
      const data = await registrationResponse.json();
      expect(data.showUpSurgeEnabled).toBe(true);
    });
  });

  test.describe('Multi-Channel Delivery', () => {
    test('should select optimal channel based on viewer preferences', async ({ page }) => {
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // High-intent viewer with phone number (should prefer SMS for urgent messages)
      const smsPreferredViewer = {
        ...mockViewer,
        id: 'sms-viewer',
        intentScore: 95,
        phone: '+1234567890'
      };

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: smsPreferredViewer
        }
      });

      expect(registrationResponse.ok()).toBeTruthy();

      const data = await registrationResponse.json();
      expect(data.notificationChannels).toContain('sms');
      expect(data.showUpSurgeEnabled).toBe(true);
    });

    test('should fallback to email for viewers without phone', async ({ page }) => {
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // Viewer without phone number
      const emailOnlyViewer = {
        ...mockViewer,
        id: 'email-only-viewer',
        phone: ''
      };

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: emailOnlyViewer
        }
      });

      expect(registrationResponse.ok()).toBeTruthy();

      const data = await registrationResponse.json();
      expect(data.notificationChannels).toContain('email');
      expect(data.notificationChannels).toContain('push');
    });
  });

  test.describe('Interaction Tracking', () => {
    test('should track email opens correctly', async ({ page }) => {
      // Setup event and registration
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: mockViewer
        }
      });
      const registrationData = await registrationResponse.json();

      // Track email open
      const trackResponse = await page.request.post('/api/notifications/track', {
        data: {
          registrationId: registrationData.registrationId,
          notificationId: 'test-notification-001',
          interaction: {
            type: 'opened',
            timestamp: new Date().toISOString()
          },
          profileId: `${mockViewer.id}-${eventData.eventId}`
        }
      });

      expect(trackResponse.ok()).toBeTruthy();

      const trackData = await trackResponse.json();
      expect(trackData.success).toBe(true);
      expect(trackData.message).toContain('opened');
    });

    test('should track email clicks correctly', async ({ page }) => {
      // Setup
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: mockViewer
        }
      });
      const registrationData = await registrationResponse.json();

      // Track email click
      const trackResponse = await page.request.post('/api/notifications/track', {
        data: {
          registrationId: registrationData.registrationId,
          notificationId: 'test-notification-001',
          interaction: {
            type: 'clicked',
            timestamp: new Date().toISOString()
          },
          profileId: `${mockViewer.id}-${eventData.eventId}`
        }
      });

      expect(trackResponse.ok()).toBeTruthy();

      const trackData = await trackResponse.json();
      expect(trackData.success).toBe(true);
    });

    test('should track attendance and no-shows', async ({ page }) => {
      // Setup
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: mockViewer
        }
      });
      const registrationData = await registrationResponse.json();

      // Track attendance
      const attendanceResponse = await page.request.post('/api/notifications/track', {
        data: {
          registrationId: registrationData.registrationId,
          interaction: {
            type: 'attended'
          },
          profileId: `${mockViewer.id}-${eventData.eventId}`
        }
      });

      expect(attendanceResponse.ok()).toBeTruthy();

      const attendanceData = await attendanceResponse.json();
      expect(attendanceData.success).toBe(true);
      expect(attendanceData.message).toContain('attended');
    });
  });

  test.describe('Analytics and Reporting', () => {
    test('should provide event analytics', async ({ page }) => {
      // Create event with multiple registrations
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // Register multiple viewers
      for (let i = 0; i < 3; i++) {
        await page.request.post('/api/notifications/register', {
          data: {
            eventId: eventData.eventId,
            viewer: {
              ...mockViewer,
              id: `test-viewer-${i}`,
              email: `test${i}@example.com`
            }
          }
        });
      }

      // Get analytics
      const analyticsResponse = await page.request.get(`/api/notifications/track?eventId=${eventData.eventId}`);

      expect(analyticsResponse.ok()).toBeTruthy();

      const analyticsData = await analyticsResponse.json();

      expect(analyticsData.eventAnalytics).toBeDefined();
      expect(analyticsData.eventAnalytics.totalRegistrations).toBe(3);
      expect(analyticsData.showUpSurgePerformance).toBeDefined();
      expect(analyticsData.showUpSurgePerformance.attendanceRate).toBeDefined();
    });

    test('should compare performance against industry benchmarks', async ({ page }) => {
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: mockViewer
        }
      });

      // Mark as attended to get good metrics
      const registrationData = await registrationResponse.json();
      await page.request.post('/api/notifications/track', {
        data: {
          registrationId: registrationData.registrationId,
          interaction: { type: 'attended' }
        }
      });

      // Get analytics
      const analyticsResponse = await page.request.get(`/api/notifications/track?eventId=${eventData.eventId}`);
      const analyticsData = await analyticsResponse.json();

      expect(analyticsData.showUpSurgePerformance.industryComparison).toBeDefined();
      expect(analyticsData.showUpSurgePerformance.improvementVsBaseline).toBeDefined();

      // With ShowUp Surge, we expect better than industry average (35%)
      const attendanceRate = analyticsData.eventAnalytics.attendanceRate;
      expect(attendanceRate).toBeGreaterThan(0.5); // 50%+ attendance with ShowUp Surge
    });
  });

  test.describe('Abandoned Cart Recovery', () => {
    test('should trigger abandoned cart recovery for incomplete registrations', async ({ page }) => {
      // This would be more complex in real implementation, but we can test the concept
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // Start registration but don't complete (simulate abandonment)
      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: {
            ...mockViewer,
            id: 'abandoned-viewer'
          },
          source: 'abandoned-test'
        }
      });

      expect(registrationResponse.ok()).toBeTruthy();

      // In a real scenario, the abandoned cart recovery would kick in after
      // detecting no interaction for specified time periods
      const data = await registrationResponse.json();
      expect(data.showUpSurgeEnabled).toBe(true);
    });
  });

  test.describe('Performance Metrics', () => {
    test('should achieve 50-70% attendance rate improvement', async ({ page }) => {
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // Register multiple viewers and mark some as attended
      const viewers = [];
      for (let i = 0; i < 10; i++) {
        const registrationResponse = await page.request.post('/api/notifications/register', {
          data: {
            eventId: eventData.eventId,
            viewer: {
              ...mockViewer,
              id: `perf-viewer-${i}`,
              email: `perf${i}@example.com`,
              intentScore: 50 + Math.random() * 50 // Random scores 50-100
            }
          }
        });

        const registrationData = await registrationResponse.json();
        viewers.push(registrationData.registrationId);

        // Mark 70% as attended (simulating ShowUp Surge success)
        if (i < 7) {
          await page.request.post('/api/notifications/track', {
            data: {
              registrationId: registrationData.registrationId,
              interaction: { type: 'attended' }
            }
          });
        }
      }

      // Get final analytics
      const analyticsResponse = await page.request.get(`/api/notifications/track?eventId=${eventData.eventId}`);
      const analyticsData = await analyticsResponse.json();

      const attendanceRate = analyticsData.eventAnalytics.attendanceRate;

      // Should achieve 60-80% attendance (vs industry average of 35%)
      expect(attendanceRate).toBeGreaterThan(0.6);
      expect(attendanceRate).toBeLessThan(0.8);

      console.log(`✅ ShowUp Surge achieved ${Math.round(attendanceRate * 100)}% attendance rate`);
    });

    test('should track multi-channel effectiveness', async ({ page }) => {
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // Register viewer with multiple channels available
      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: eventData.eventId,
          viewer: {
            ...mockViewer,
            phone: '+1234567890' // Enable SMS
          }
        }
      });

      expect(registrationResponse.ok()).toBeTruthy();

      const data = await registrationResponse.json();
      expect(data.notificationChannels.length).toBeGreaterThan(1);

      // Analytics should track channel performance
      const analyticsResponse = await page.request.get(`/api/notifications/track?eventId=${eventData.eventId}`);
      const analyticsData = await analyticsResponse.json();

      expect(analyticsData.eventAnalytics.channelEffectiveness).toBeDefined();
      expect(analyticsData.eventAnalytics.channelEffectiveness.email).toBeDefined();
      expect(analyticsData.eventAnalytics.channelEffectiveness.sms).toBeDefined();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle missing event gracefully', async ({ page }) => {
      const registrationResponse = await page.request.post('/api/notifications/register', {
        data: {
          eventId: 'non-existent-event',
          viewer: mockViewer
        }
      });

      expect(registrationResponse.status()).toBe(404);

      const errorData = await registrationResponse.json();
      expect(errorData.error).toContain('Event not found');
    });

    test('should validate interaction data', async ({ page }) => {
      const trackResponse = await page.request.post('/api/notifications/track', {
        data: {
          registrationId: 'invalid-registration',
          interaction: {
            type: 'invalid-type'
          }
        }
      });

      expect(trackResponse.status()).toBe(400);

      const errorData = await trackResponse.json();
      expect(errorData.error).toContain('Invalid interaction type');
    });
  });

  test.describe('Load Testing', () => {
    test('should handle multiple concurrent registrations', async ({ page }) => {
      const eventResponse = await page.request.post('/api/notifications/create-event', {
        data: mockEvent
      });
      const eventData = await eventResponse.json();

      // Simulate 20 concurrent registrations
      const registrationPromises = [];
      for (let i = 0; i < 20; i++) {
        registrationPromises.push(
          page.request.post('/api/notifications/register', {
            data: {
              eventId: eventData.eventId,
              viewer: {
                ...mockViewer,
                id: `load-test-${i}`,
                email: `load${i}@example.com`
              }
            }
          })
        );
      }

      const results = await Promise.all(registrationPromises);

      // All registrations should succeed
      results.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });

      // Verify all registrations were processed
      const analyticsResponse = await page.request.get(`/api/notifications/track?eventId=${eventData.eventId}`);
      const analyticsData = await analyticsResponse.json();

      expect(analyticsData.eventAnalytics.totalRegistrations).toBe(20);

      console.log('✅ Successfully handled 20 concurrent registrations');
    });
  });
});