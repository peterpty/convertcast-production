import { NextRequest, NextResponse } from 'next/server';
import { insightEngine } from '@/lib/analytics/insightEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const active = searchParams.get('active') === 'true';

    // Get perfect moment alerts
    const alerts = insightEngine.getPerfectMomentAlerts(eventId || undefined, active);

    // Apply limit
    const limitedAlerts = alerts.slice(0, limit);

    return NextResponse.json({
      success: true,
      alerts: limitedAlerts.map(alert => ({
        ...alert,
        timestamp: alert.timestamp.toISOString(),
        expiresAt: alert.expiresAt ? alert.expiresAt.toISOString() : null
      })),
      totalCount: alerts.length,
      activeCount: alerts.filter(a => a.isActive).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Perfect moment alerts error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      alertId,
      action
    } = await req.json();

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, action' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['acknowledge', 'dismiss', 'snooze'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: acknowledge, dismiss, or snooze' },
        { status: 400 }
      );
    }

    // Handle alert action
    const success = insightEngine.handlePerfectMomentAlert(alertId, action);

    if (!success) {
      return NextResponse.json(
        { error: 'Alert not found or action failed' },
        { status: 404 }
      );
    }

    console.log(`⚡ Perfect moment alert ${action}d: ${alertId}`);

    return NextResponse.json({
      success: true,
      message: `Alert ${action}d successfully`,
      alertId,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Handle alert error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}