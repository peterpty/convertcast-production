import { NextResponse } from 'next/server';
import { muxProductionService } from '@/lib/streaming/muxProductionService';

export async function GET() {
  try {
    console.log('🔍 COMPREHENSIVE MUX VERIFICATION...');

    const verification = {
      timestamp: new Date().toISOString(),
      account_status: {} as any,
      stream_validation: {} as any,
      rtmp_configuration: {} as any,
      recommendations: [] as string[]
    };

    // 1. Verify Mux Account and Credentials
    try {
      console.log('1️⃣ Verifying Mux account access...');

      // Check if we can list streams (basic account verification)
      const allStreams = await (muxProductionService as any).mux.video.liveStreams.list({ limit: 1 });

      verification.account_status = {
        credentials_valid: true,
        total_streams_in_account: allStreams.data?.length || 0,
        api_access: 'working',
        account_type: 'paid' // Since we have streams
      };

      console.log('✅ Mux account verification passed');
    } catch (error) {
      verification.account_status = {
        credentials_valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        api_access: 'failed'
      };
      verification.recommendations.push('CRITICAL: Mux API credentials invalid or expired');
      console.error('❌ Mux account verification failed:', error);
    }

    // 2. Create a test stream and verify its properties
    try {
      console.log('2️⃣ Creating verification test stream...');

      const testStream = await muxProductionService.createLiveStream('RTMP Connection Test - ' + Date.now());

      verification.stream_validation = {
        stream_created: true,
        stream_id: testStream.id,
        stream_key: testStream.stream_key,
        rtmp_url: testStream.rtmp_server_url,
        status: testStream.status,
        playback_id: testStream.playback_id,
        max_duration: testStream.max_continuous_duration
      };

      // 3. Verify the stream can be retrieved
      const retrievedStream = await muxProductionService.getLiveStream(testStream.id);
      verification.stream_validation.retrieval_test = {
        success: true,
        matches_created: retrievedStream.id === testStream.id,
        retrieved_status: retrievedStream.status
      };

      console.log('✅ Stream creation and retrieval verified');
    } catch (error) {
      verification.stream_validation = {
        stream_created: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      verification.recommendations.push('CRITICAL: Cannot create or retrieve Mux streams');
      console.error('❌ Stream validation failed:', error);
    }

    // 4. Check RTMP configuration specifics
    verification.rtmp_configuration = {
      expected_rtmp_url: 'rtmp://global-live.mux.com/live',
      actual_rtmp_url: verification.stream_validation.rtmp_url,
      rtmp_port: 1935,
      protocol: 'RTMP',
      authentication_method: 'stream_key',
      stream_key_format: 'UUID-v4-like',

      // Check if our RTMP URL matches expected
      rtmp_url_correct: verification.stream_validation.rtmp_url === 'rtmp://global-live.mux.com/live',

      // Validate stream key format (should be UUID-like)
      stream_key_format_valid: verification.stream_validation.stream_key ?
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(verification.stream_validation.stream_key) : false
    };

    // 5. Check for common Mux configuration issues
    const issues = [];

    if (verification.stream_validation.status !== 'idle') {
      issues.push(`Stream status is "${verification.stream_validation.status}" instead of "idle"`);
    }

    if (!verification.rtmp_configuration.rtmp_url_correct) {
      issues.push('RTMP URL does not match expected Mux endpoint');
    }

    if (!verification.rtmp_configuration.stream_key_format_valid) {
      issues.push('Stream key format appears invalid');
    }

    verification.rtmp_configuration.potential_issues = issues;

    // 6. Generate recommendations
    if (verification.account_status.credentials_valid && verification.stream_validation.stream_created) {
      if (issues.length === 0) {
        verification.recommendations.push('✅ Mux integration appears correct - issue may be client-side (OBS/firewall)');
        verification.recommendations.push('Try: Restart OBS completely');
        verification.recommendations.push('Try: Test with different streaming software (XSplit, Streamlabs)');
        verification.recommendations.push('Try: Check OBS logs for specific RTMP error messages');
      } else {
        verification.recommendations.push('⚠️ Mux configuration issues detected (see potential_issues)');
      }
    }

    // 7. Provide exact OBS settings for testing
    const obsSettings = verification.stream_validation.stream_created ? {
      service: 'Custom...',
      server: verification.stream_validation.rtmp_url,
      stream_key: verification.stream_validation.stream_key,
      note: 'Use these EXACT settings - copy/paste to avoid typos'
    } : null;

    return NextResponse.json({
      success: true,
      verification: verification,
      obs_test_settings: obsSettings,
      next_actions: verification.recommendations.length === 1 && verification.recommendations[0].includes('✅') ? [
        'Copy the exact stream key from obs_test_settings',
        'Restart OBS Studio completely',
        'Set Service to "Custom..."',
        'Paste the exact server and stream key',
        'Check OBS Studio logs if still failing'
      ] : [
        'Fix Mux configuration issues first',
        'Verify Mux account has live streaming enabled',
        'Check Mux dashboard for any account restrictions'
      ]
    });

  } catch (error) {
    console.error('❌ Comprehensive verification failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Critical failure during Mux verification',
      emergency_actions: [
        'Check Mux credentials in .env.local',
        'Verify Mux account is active and has streaming permissions',
        'Test Mux dashboard directly at https://dashboard.mux.com'
      ]
    }, { status: 500 });
  }
}