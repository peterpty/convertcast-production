import { NextRequest, NextResponse } from 'next/server';
import { insightEngine } from '@/lib/analytics/insightEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const horizon = searchParams.get('horizon') || '7d';

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required parameter: eventId' },
        { status: 400 }
      );
    }

    // Get AI predictions
    const predictions = insightEngine.getPredictions(eventId);

    return NextResponse.json({
      success: true,
      eventId,
      horizon,
      predictions: {
        attendance: predictions.attendance || {
          predicted: 0,
          confidence: 0,
          range: { min: 0, max: 0 },
          factors: []
        },
        revenue: predictions.revenue || {
          predicted: 0,
          confidence: 0,
          range: { min: 0, max: 0 },
          factors: []
        },
        engagement: predictions.engagement || {
          predicted: 0,
          confidence: 0,
          range: { min: 0, max: 0 },
          factors: []
        },
        conversions: predictions.conversions || {
          predicted: 0,
          confidence: 0,
          range: { min: 0, max: 0 },
          factors: []
        }
      },
      accuracy: predictions.accuracy || 0,
      lastUpdated: predictions.lastUpdated?.toISOString() || new Date().toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Predictions error:', error);

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
      trainingData,
      recalibrate
    } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required parameter: eventId' },
        { status: 400 }
      );
    }

    // Force recalibration of predictions if requested
    if (recalibrate || trainingData) {
      insightEngine.updatePredictionModels(eventId, trainingData || []);

      console.log(`🧠 InsightEngine™ predictions recalibrated for event ${eventId}`);
    }

    // Get updated predictions
    const predictions = insightEngine.getPredictions(eventId);

    return NextResponse.json({
      success: true,
      message: recalibrate ? 'Predictions recalibrated successfully' : 'Predictions retrieved successfully',
      eventId,
      predictions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update predictions error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}