import { NextResponse } from 'next/server';
import { muxProductionService } from '@/lib/streaming/muxProductionService';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Checking all active Mux streams...');

    // Get all live streams from Mux
    const streams = await muxProductionService.mux.video.liveStreams.list();

    console.log('📋 Active Mux streams:', streams.data?.length || 0);

    const streamDetails = streams.data?.map((stream: any) => ({
      id: stream.id,
      stream_key: stream.stream_key,
      status: stream.status,
      rtmp_server_url: 'rtmp://global-live.mux.com/live',
      playback_ids: stream.playback_ids,
      created_at: stream.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      total_streams: streams.data?.length || 0,
      streams: streamDetails,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to debug streams:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}