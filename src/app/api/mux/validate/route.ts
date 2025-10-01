import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    const configured = process.env.NEXT_PUBLIC_MUX_CONFIGURED;

    console.log('🔍 Validating Mux credentials...');
    console.log('Token ID present:', !!tokenId);
    console.log('Token Secret present:', !!tokenSecret);
    console.log('Configured flag:', configured);

    // Check if credentials are present
    if (!tokenId || !tokenSecret) {
      return NextResponse.json({
        valid: false,
        status: 'missing_credentials',
        message: 'MUX_TOKEN_ID and/or MUX_TOKEN_SECRET not found in environment variables',
        instructions: [
          '1. Go to https://dashboard.mux.com/settings/access-tokens',
          '2. Create a new token with "Mux Video" permissions',
          '3. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET to .env.local',
          '4. Set NEXT_PUBLIC_MUX_CONFIGURED=true',
          '5. Restart the server'
        ]
      }, { status: 400 });
    }

    // Check for placeholder values
    const placeholderValues = [
      'demo-token-id',
      'your-production-mux-token-id',
      'your-mux-token-id',
      'your-mux-token-id-here',
      'placeholder'
    ];

    const isPlaceholder = placeholderValues.some(placeholder =>
      tokenId.includes(placeholder) || tokenSecret.includes(placeholder)
    );

    if (isPlaceholder) {
      return NextResponse.json({
        valid: false,
        status: 'placeholder_credentials',
        message: 'Placeholder Mux credentials detected. Please use real credentials from your Mux dashboard.',
        tokenId: tokenId.substring(0, 8) + '...',
        instructions: [
          '1. Login to https://dashboard.mux.com',
          '2. Go to Settings → Access Tokens',
          '3. Create a new token with "Mux Video" permissions',
          '4. Replace the placeholder values in .env.local',
          '5. Set NEXT_PUBLIC_MUX_CONFIGURED=true',
          '6. Restart the server'
        ]
      }, { status: 400 });
    }

    // Check configured flag
    if (configured !== 'true') {
      return NextResponse.json({
        valid: false,
        status: 'not_configured',
        message: 'NEXT_PUBLIC_MUX_CONFIGURED is not set to "true"',
        instructions: [
          '1. Set NEXT_PUBLIC_MUX_CONFIGURED=true in .env.local',
          '2. Restart the server'
        ]
      }, { status: 400 });
    }

    // Credentials look valid
    return NextResponse.json({
      valid: true,
      status: 'ready',
      message: 'Mux credentials appear valid and ready for production use',
      tokenId: tokenId.substring(0, 8) + '...',
      configured: configured === 'true',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error validating Mux credentials:', error);

    return NextResponse.json({
      valid: false,
      status: 'validation_error',
      message: 'Error validating Mux credentials',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}