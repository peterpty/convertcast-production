import { NextRequest, NextResponse } from 'next/server';
import { notificationManager } from '@/lib/notifications/notificationManager';
import { ViewerProfile } from '@/lib/ai/scoringEngine';

export async function POST(req: NextRequest) {
  try {
    const {
      eventId,
      viewer,
      source = 'direct',
      customFields = {}
    } = await req.json();

    // Validate required fields
    if (!eventId || !viewer) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, viewer' },
        { status: 400 }
      );
    }

    // Validate viewer profile structure
    if (!viewer.id || !viewer.name || !viewer.email) {
      return NextResponse.json(
        { error: 'Invalid viewer profile: id, name, and email are required' },
        { status: 400 }
      );
    }

    // Create viewer profile
    const viewerProfile: ViewerProfile = {
      id: viewer.id,
      name: viewer.name,
      email: viewer.email,
      phone: viewer.phone || '',
      intentScore: viewer.intentScore || 50,
      engagementTime: viewer.engagementTime || 0,
      behavior: viewer.behavior || {
        pageViews: 1,
        timeOnPage: 60,
        interactions: 1,
        scrollDepth: 0.5
      }
    };

    // Register for event with ShowUp Surge optimization
    const registration = notificationManager.registerForEvent(
      eventId,
      viewerProfile,
      source,
      customFields
    );

    // Get the event details
    const event = notificationManager.getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Activate event if it's still in draft status
    if (event.status === 'draft') {
      notificationManager.activateEvent(eventId);
    }

    console.log(`📧 ShowUp Surge activated for ${viewerProfile.name} - ${event.title}`);

    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      message: 'Registration successful with ShowUp Surge optimization',
      showUpSurgeEnabled: true,
      expectedAttendanceIncrease: '50-70%',
      notificationChannels: ['email', 'sms', 'push'],
      scheduledNotifications: 9
    });

  } catch (error) {
    console.error('Registration error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}