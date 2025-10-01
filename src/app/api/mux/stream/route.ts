import { NextRequest, NextResponse } from 'next/server';
import { muxProductionService } from '@/lib/streaming/muxProductionService';

export async function POST(request: NextRequest) {
  try {
    // Enhanced request parsing with better error handling
    let requestBody;
    try {
      const rawBody = await request.text();
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Empty request body');
      }
      requestBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: 'Request body must be valid JSON with eventTitle field',
          code: 'INVALID_REQUEST_BODY',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const { eventTitle } = requestBody;

    if (!eventTitle || typeof eventTitle !== 'string' || eventTitle.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Event title is required and must be a non-empty string',
          code: 'INVALID_EVENT_TITLE'
        },
        { status: 400 }
      );
    }

    console.log('🎬 Creating production live stream for event:', eventTitle);

    // Create live stream using production Mux service
    const stream = await muxProductionService.createLiveStream(eventTitle.trim());

    console.log('✅ Production live stream created successfully:', stream.id);

    return NextResponse.json({
      success: true,
      stream: stream,
      message: 'Production Mux stream created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ PRODUCTION ERROR - Failed to create live stream:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConfigError = errorMessage.includes('MUX_TOKEN') || errorMessage.includes('credentials');

    return NextResponse.json(
      {
        error: 'Failed to create live stream',
        details: errorMessage,
        code: isConfigError ? 'MUX_CONFIG_ERROR' : 'STREAM_CREATION_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}

export async function GET() {
  try {
    const configStatus = muxProductionService.getConfigurationStatus();

    if (!configStatus.configured) {
      return NextResponse.json(
        {
          error: 'Mux service not configured for production',
          details: configStatus.error,
          code: 'MUX_NOT_CONFIGURED',
          instructions: [
            '1. Sign up for a Mux account at https://mux.com',
            '2. Go to Settings -> Access Tokens in Mux Dashboard',
            '3. Create a new token with Video permissions',
            '4. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET in environment variables',
            '5. Restart the application'
          ]
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      configured: true,
      status: 'Production Mux streaming ready',
      service: 'mux-production',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ PRODUCTION ERROR - Failed to get Mux status:', error);

    return NextResponse.json(
      {
        error: 'Failed to get Mux configuration status',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'CONFIG_CHECK_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}