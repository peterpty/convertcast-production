import { NextRequest, NextResponse } from 'next/server';
import { insightEngine } from '@/lib/analytics/insightEngine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const timeframe = searchParams.get('timeframe') || '30d';

    // Get revenue attribution data
    const revenueData = insightEngine.getRevenueAttribution(eventId || undefined, timeframe);

    return NextResponse.json({
      success: true,
      eventId,
      timeframe,
      revenueAttribution: {
        total: revenueData.total || 0,
        bySource: revenueData.bySource || [],
        byFeature: revenueData.byFeature || [],
        conversionFunnel: revenueData.conversionFunnel || [],
        trends: revenueData.trends || []
      },
      brandedFeatureImpact: {
        engageMax: {
          revenue: revenueData.brandedFeatures?.engageMax?.revenue || 0,
          improvement: revenueData.brandedFeatures?.engageMax?.improvement || 0,
          roi: revenueData.brandedFeatures?.engageMax?.roi || 0
        },
        autoOffer: {
          revenue: revenueData.brandedFeatures?.autoOffer?.revenue || 0,
          improvement: revenueData.brandedFeatures?.autoOffer?.improvement || 0,
          roi: revenueData.brandedFeatures?.autoOffer?.roi || 0
        },
        showUpSurge: {
          revenue: revenueData.brandedFeatures?.showUpSurge?.revenue || 0,
          improvement: revenueData.brandedFeatures?.showUpSurge?.improvement || 0,
          roi: revenueData.brandedFeatures?.showUpSurge?.roi || 0
        },
        insightEngine: {
          revenue: revenueData.brandedFeatures?.insightEngine?.revenue || 0,
          improvement: revenueData.brandedFeatures?.insightEngine?.improvement || 0,
          roi: revenueData.brandedFeatures?.insightEngine?.roi || 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revenue attribution error:', error);

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
      transactionId,
      amount,
      source,
      feature,
      metadata
    } = await req.json();

    // Validate required fields
    if (!eventId || !transactionId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, transactionId, amount' },
        { status: 400 }
      );
    }

    // Track revenue transaction
    insightEngine.trackRevenueTransaction({
      id: transactionId,
      eventId,
      amount,
      source: source || 'unknown',
      feature: feature || null,
      timestamp: new Date(),
      metadata: metadata || {}
    });

    console.log(`💰 Revenue tracked: $${amount} from ${source || 'unknown'} for event ${eventId}`);

    return NextResponse.json({
      success: true,
      message: 'Revenue transaction tracked successfully',
      transactionId,
      amount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Track revenue error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}