import { NextRequest, NextResponse } from 'next/server';
import { insightEngine } from '@/lib/analytics/insightEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const eventId = searchParams.get('eventId');

    // Get real-time metrics
    const metrics = insightEngine.getRealTimeMetrics(eventId || undefined, timeframe);

    return NextResponse.json({
      success: true,
      timeframe,
      metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics metrics error:', error);

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
      eventId,
      viewerId,
      interaction,
      timestamp
    } = await req.json();

    // Validate required fields
    if (!eventId || !viewerId || !interaction) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, viewerId, interaction' },
        { status: 400 }
      );
    }

    // Track viewer interaction
    insightEngine.trackViewerInteraction({
      id: viewerId,
      email: interaction.email || '',
      engagementScore: interaction.engagementScore || 0,
      conversionProbability: interaction.conversionProbability || 0,
      lastInteraction: timestamp ? new Date(timestamp) : new Date(),
      preferences: interaction.preferences || {},
      behaviors: interaction.behaviors || []
    }, {
      eventId,
      type: interaction.type,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      value: interaction.value || 0,
      metadata: interaction.metadata || {}
    });

    console.log(`📊 InsightEngine™ tracked interaction: ${interaction.type} for viewer ${viewerId}`);

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully',
      timestamp: new Date().toISOString()
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