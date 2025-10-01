import { NextRequest, NextResponse } from 'next/server';
import { notificationManager } from '@/lib/notifications/notificationManager';
import { showUpSurgeEngine } from '@/lib/notifications/showUpSurgeEngine';

export async function POST(req: NextRequest) {
  try {
    const {
      registrationId,
      notificationId,
      interaction,
      profileId
    } = await req.json();

    // Validate required fields
    if (!registrationId || !interaction) {
      return NextResponse.json(
        { error: 'Missing required fields: registrationId, interaction' },
        { status: 400 }
      );
    }

    // Validate interaction structure
    if (!interaction.type || !['opened', 'clicked', 'attended', 'no-show'].includes(interaction.type)) {
      return NextResponse.json(
        { error: 'Invalid interaction type. Must be: opened, clicked, attended, or no-show' },
        { status: 400 }
      );
    }

    const timestamp = interaction.timestamp ? new Date(interaction.timestamp) : new Date();

    // Track different types of interactions
    switch (interaction.type) {
      case 'opened':
      case 'clicked':
        // Track email/notification interaction
        if (notificationId) {
          notificationManager.trackInteraction(registrationId, notificationId, {
            type: interaction.type,
            timestamp,
            userAgent: req.headers.get('user-agent') || undefined,
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
          });
        }

        // Update ShowUp Surge profile
        if (profileId) {
          showUpSurgeEngine.updateProfileFromInteraction(profileId, {
            type: interaction.type === 'opened' ? 'email-open' : 'email-click',
            timestamp,
            channel: 'email'
          });
        }
        break;

      case 'attended':
        // Mark attendance
        notificationManager.markAttendance(registrationId, true);

        if (profileId) {
          showUpSurgeEngine.updateProfileFromInteraction(profileId, {
            type: 'event-join',
            timestamp,
            channel: 'email'
          });
        }
        break;

      case 'no-show':
        // Mark no-show
        notificationManager.markAttendance(registrationId, false);

        if (profileId) {
          showUpSurgeEngine.updateProfileFromInteraction(profileId, {
            type: 'no-show',
            timestamp,
            channel: 'email'
          });
        }
        break;
    }

    console.log(`📊 Interaction tracked: ${interaction.type} for registration ${registrationId}`);

    return NextResponse.json({
      success: true,
      message: `Interaction ${interaction.type} tracked successfully`,
      timestamp: timestamp.toISOString()
    });

  } catch (error) {
    console.error('Track interaction error:', error);

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

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing eventId parameter' },
        { status: 400 }
      );
    }

    // Get event analytics
    const analytics = notificationManager.getEventAnalytics(eventId);
    if (!analytics) {
      return NextResponse.json(
        { error: 'Event not found or no analytics available' },
        { status: 404 }
      );
    }

    // Get comprehensive analytics
    const comprehensiveAnalytics = notificationManager.getComprehensiveAnalytics();

    return NextResponse.json({
      eventAnalytics: analytics,
      comprehensiveAnalytics,
      showUpSurgePerformance: {
        attendanceRate: analytics.attendanceRate,
        industryComparison: analytics.attendanceRate >= 0.6 ? 'Excellent (60%+)' :
                           analytics.attendanceRate >= 0.45 ? 'Above Average (45-60%)' :
                           analytics.attendanceRate >= 0.3 ? 'Average (30-45%)' : 'Below Average (<30%)',
        improvementVsBaseline: `+${Math.round((analytics.attendanceRate - 0.35) / 0.35 * 100)}%`
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}