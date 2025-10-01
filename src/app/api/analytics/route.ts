import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics API endpoint
 * Receives and processes analytics events from the frontend
 */

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, events } = data;

    if (!sessionId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid analytics data' },
        { status: 400 }
      );
    }

    // Process events based on type
    const processedEvents = events.map(event => {
      const processed = {
        ...event,
        processed_at: new Date().toISOString(),
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent') || '',
      };

      // Add additional processing based on event type
      switch (event.type) {
        case 'streaming_analytics':
          // Process streaming metrics
          processed.category = 'streaming';
          break;

        case 'conversion':
          // Process conversion events
          processed.category = 'business';
          processed.value = event.data.value || 0;
          break;

        case 'error':
          // Process error events
          processed.category = 'error';
          processed.severity = event.data.severity || 'medium';
          break;

        case 'performance':
          // Process performance metrics
          processed.category = 'performance';
          break;

        default:
          processed.category = 'general';
      }

      return processed;
    });

    // In production, you would:
    // 1. Send to your analytics service (Google Analytics, Mixpanel, etc.)
    // 2. Store in your database for custom analytics
    // 3. Send to monitoring services (DataDog, New Relic, etc.)
    // 4. Trigger alerts for critical errors

    // For now, we'll log and simulate storage
    console.log(`📊 Analytics batch received: ${events.length} events for session ${sessionId}`);

    // Log different event types with appropriate detail
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📈 Event breakdown:', eventsByType);

    // Log critical errors immediately
    const criticalErrors = events.filter(e =>
      e.type === 'error' && e.data.severity === 'critical'
    );

    if (criticalErrors.length > 0) {
      console.error('🚨 CRITICAL ERRORS DETECTED:', criticalErrors);
      // In production: send to monitoring service, trigger alerts
    }

    // Simulate async processing
    setTimeout(() => {
      // This would be where you batch process to external services
      processAnalyticsAsync(sessionId, processedEvents);
    }, 0);

    return NextResponse.json({
      success: true,
      processed: events.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics data' },
      { status: 500 }
    );
  }
}

/**
 * Extract client IP address
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address
  return request.ip || 'unknown';
}

/**
 * Async processing of analytics data
 * This would integrate with external services in production
 */
async function processAnalyticsAsync(sessionId: string, events: any[]) {
  try {
    // Example integrations (would be actual API calls in production):

    // 1. Google Analytics 4
    const gaEvents = events
      .filter(e => ['custom_event', 'conversion', 'engagement'].includes(e.type))
      .map(formatForGA4);

    if (gaEvents.length > 0) {
      console.log('📊 Would send to GA4:', gaEvents.length, 'events');
      // await sendToGA4(gaEvents);
    }

    // 2. Business Intelligence Database
    const biEvents = events.filter(e =>
      ['streaming_analytics', 'business_metrics', 'conversion'].includes(e.type)
    );

    if (biEvents.length > 0) {
      console.log('💼 Would store in BI database:', biEvents.length, 'events');
      // await storeInDatabase(biEvents);
    }

    // 3. Error Monitoring (Sentry, Rollbar, etc.)
    const errorEvents = events.filter(e => e.type === 'error');

    if (errorEvents.length > 0) {
      console.log('🐛 Would send to error monitoring:', errorEvents.length, 'errors');
      // await sendToSentry(errorEvents);
    }

    // 4. Performance Monitoring
    const performanceEvents = events.filter(e => e.type === 'performance');

    if (performanceEvents.length > 0) {
      console.log('⚡ Would send to performance monitoring:', performanceEvents.length, 'metrics');
      // await sendToDataDog(performanceEvents);
    }

    // 5. Real-time Analytics Dashboard
    const realtimeEvents = events.filter(e =>
      ['streaming_analytics', 'engagement'].includes(e.type)
    );

    if (realtimeEvents.length > 0) {
      console.log('📡 Would update real-time dashboard:', realtimeEvents.length, 'events');
      // await updateRealtimeDashboard(realtimeEvents);
    }

  } catch (error) {
    console.error('Failed to process analytics async:', error);
    // In production: retry logic, dead letter queue, etc.
  }
}

/**
 * Format events for Google Analytics 4
 */
function formatForGA4(event: any) {
  const baseEvent = {
    client_id: event.sessionId,
    timestamp_micros: new Date(event.timestamp).getTime() * 1000,
  };

  switch (event.type) {
    case 'custom_event':
      return {
        ...baseEvent,
        name: event.data.eventName,
        params: event.data.properties
      };

    case 'conversion':
      return {
        ...baseEvent,
        name: 'conversion',
        params: {
          conversion_type: event.data.type,
          value: event.data.value || 0,
          currency: 'USD'
        }
      };

    case 'engagement':
      return {
        ...baseEvent,
        name: 'engagement',
        params: {
          action: event.data.action,
          duration: event.data.duration || 0
        }
      };

    default:
      return {
        ...baseEvent,
        name: 'generic_event',
        params: event.data
      };
  }
}