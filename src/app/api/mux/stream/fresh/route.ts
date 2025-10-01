import { NextResponse } from 'next/server';
import { muxProductionService } from '@/lib/streaming/muxProductionService';

export async function POST() {
  try {
    console.log('🆕 Creating fresh Mux stream for OBS testing...');

    // Create a completely new stream
    const freshStream = await muxProductionService.createLiveStream('OBS Connection Test');

    console.log('✅ Fresh stream created:', freshStream.id);

    // Test the fresh stream immediately
    const testResults = {
      stream_created: true,
      stream_id: freshStream.id,
      stream_key: freshStream.stream_key,
      rtmp_url: freshStream.rtmp_server_url,
      status: freshStream.status,
      created_timestamp: new Date().toISOString()
    };

    // Return comprehensive details for OBS
    return NextResponse.json({
      success: true,
      message: 'Fresh stream created and ready for OBS',
      stream: freshStream,
      obs_settings: {
        service: 'Custom...',
        server: freshStream.rtmp_server_url,
        stream_key: freshStream.stream_key
      },
      test_results: testResults,
      troubleshooting_steps: [
        '1. In OBS: File → Settings → Stream',
        '2. Service: Custom...',
        `3. Server: ${freshStream.rtmp_server_url}`,
        `4. Stream Key: ${freshStream.stream_key}`,
        '5. Click OK, then Start Streaming',
        '6. If still failing, check Windows Firewall and antivirus'
      ],
      network_diagnostics: {
        rtmp_port: 1935,
        protocol: 'RTMP',
        server_host: 'global-live.mux.com',
        firewall_note: 'Ensure port 1935 (RTMP) is not blocked by firewall'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to create fresh stream:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to create fresh stream for testing',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}