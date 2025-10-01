import { NextRequest, NextResponse } from 'next/server';
import { insightEngine } from '@/lib/analytics/insightEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const priority = searchParams.get('priority') as 'high' | 'medium' | 'low' | null;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get optimization recommendations
    const recommendations = insightEngine.getOptimizationRecommendations(eventId || undefined);

    // Filter by priority if specified
    let filteredRecommendations = recommendations;
    if (priority) {
      filteredRecommendations = recommendations.filter(rec => rec.priority === priority);
    }

    // Apply limit
    const limitedRecommendations = filteredRecommendations.slice(0, limit);

    return NextResponse.json({
      success: true,
      eventId,
      priority,
      recommendations: limitedRecommendations.map(rec => ({
        ...rec,
        timestamp: rec.timestamp.toISOString(),
        implementedAt: rec.implementedAt ? rec.implementedAt.toISOString() : null
      })),
      totalCount: recommendations.length,
      priorityCounts: {
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Optimization recommendations error:', error);

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
      recommendationId,
      action,
      feedback
    } = await req.json();

    if (!recommendationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: recommendationId, action' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['implement', 'dismiss', 'postpone'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: implement, dismiss, or postpone' },
        { status: 400 }
      );
    }

    // Handle recommendation action
    const success = insightEngine.handleRecommendationAction(recommendationId, action, feedback);

    if (!success) {
      return NextResponse.json(
        { error: 'Recommendation not found or action failed' },
        { status: 404 }
      );
    }

    console.log(`🎯 Optimization recommendation ${action}ed: ${recommendationId}`);

    return NextResponse.json({
      success: true,
      message: `Recommendation ${action}ed successfully`,
      recommendationId,
      action,
      feedback: feedback || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Handle recommendation error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}