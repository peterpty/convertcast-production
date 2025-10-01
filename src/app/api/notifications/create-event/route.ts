import { NextRequest, NextResponse } from 'next/server';
import { notificationManager } from '@/lib/notifications/notificationManager';

export async function POST(req: NextRequest) {
  try {
    const {
      title,
      date,
      time,
      duration,
      presenters = [],
      topics = [],
      registrationUrl
    } = await req.json();

    // Validate required fields
    if (!title || !date || !time || !duration || !registrationUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, time, duration, registrationUrl' },
        { status: 400 }
      );
    }

    // Validate date format
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Create event with ShowUp Surge optimization
    const event = notificationManager.createEvent({
      title,
      date: eventDate,
      time,
      duration,
      presenters: Array.isArray(presenters) ? presenters : [presenters],
      topics: Array.isArray(topics) ? topics : [topics],
      registrationUrl
    });

    console.log(`🎯 ShowUp Surge event created: ${event.title}`);

    return NextResponse.json({
      success: true,
      eventId: event.id,
      event: {
        id: event.id,
        title: event.title,
        date: event.date.toISOString(),
        time: event.time,
        duration: event.duration,
        presenters: event.presenters,
        topics: event.topics,
        registrationUrl: event.registrationUrl,
        status: event.status
      },
      showUpSurgeFeatures: {
        aiOptimization: true,
        multiChannelDelivery: ['email', 'sms', 'whatsapp', 'push'],
        nineStageSequence: true,
        behavioralTriggers: true,
        abandonedCartRecovery: true,
        expectedAttendanceBoost: '50-70%'
      }
    });

  } catch (error) {
    console.error('Create event error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (eventId) {
      // Get specific event
      const event = notificationManager.getEvent(eventId);
      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      const registrations = notificationManager.getEventRegistrations(eventId);
      const analytics = notificationManager.getEventAnalytics(eventId);

      return NextResponse.json({
        event: {
          ...event,
          date: event.date.toISOString()
        },
        registrations: registrations.map(reg => ({
          ...reg,
          registeredAt: reg.registeredAt.toISOString()
        })),
        analytics,
        showUpSurgeMetrics: {
          totalRegistrations: registrations.length,
          predictedAttendance: Math.round(registrations.length * 0.65), // 65% with ShowUp Surge
          withoutShowUpSurge: Math.round(registrations.length * 0.35), // Industry average 35%
          expectedRevenue: registrations.length * 297 * 0.65 // Assuming $297 average value
        }
      });
    } else {
      // Get all events
      const events = notificationManager.getEvents();
      const comprehensiveAnalytics = notificationManager.getComprehensiveAnalytics();

      return NextResponse.json({
        events: events.map(event => ({
          ...event,
          date: event.date.toISOString()
        })),
        analytics: comprehensiveAnalytics,
        showUpSurgeSummary: {
          totalEvents: events.length,
          averageAttendanceRate: comprehensiveAnalytics.averageAttendanceRate,
          industryComparison: comprehensiveAnalytics.showUpSurgeImpact.comparedToIndustry,
          totalNotificationsSent: comprehensiveAnalytics.totalNotificationsSent,
          projectedRevenueIncrease: comprehensiveAnalytics.showUpSurgeImpact.improvementPercentage
        }
      });
    }

  } catch (error) {
    console.error('Get events error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}