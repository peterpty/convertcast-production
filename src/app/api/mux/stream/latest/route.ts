import { NextResponse } from 'next/server';
import { muxProductionService } from '@/lib/streaming/muxProductionService';

export async function GET() {
  try {
    console.log('🔍 Getting latest active Mux stream...');

    // Get all live streams from Mux, sorted by creation date
    const streams = await (muxProductionService as any).mux.video.liveStreams.list({
      limit: 5, // Get last 5 streams
    });

    if (!streams.data || streams.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No streams found',
        message: 'No active streams in your Mux account'
      }, { status: 404 });
    }

    // Get the most recent stream (first in the list as they're sorted by created_at desc)
    const latestStream = streams.data[0];

    console.log('✅ Latest stream found:', latestStream.id);
    console.log('🔑 Stream key:', latestStream.stream_key);

    const playbackId = latestStream.playback_ids?.[0]?.id || '';
    console.log('🎬 Playback ID:', playbackId);
    console.log('📺 Full playback_ids array:', latestStream.playback_ids);

    const streamData = {
      id: latestStream.id,
      rtmp_server_url: 'rtmp://global-live.mux.com/app',
      stream_key: latestStream.stream_key,
      playback_id: playbackId,
      status: latestStream.status,
      max_continuous_duration: latestStream.max_continuous_duration,
      created_at: latestStream.created_at
    };

    console.log('📤 Returning stream data:', streamData);

    return NextResponse.json({
      success: true,
      stream: streamData,
      message: 'Latest stream retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to get latest stream:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}