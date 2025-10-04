'use client';

import { useState, useEffect } from 'react';
import { StudioDashboard } from '@/components/studio/StudioDashboard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Stream = Database['public']['Tables']['streams']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

export default function StreamStudioPage() {
  const [activeStream, setActiveStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to load stream (extracted so we can call it after setup)
  // If streamId is provided, load that specific stream. Otherwise, load latest active stream.
  async function loadActiveStream(streamId?: string) {
    try {
      setLoading(true);

      console.log('🔄 loadActiveStream called with streamId:', streamId);

      // ALWAYS USE REAL MUX STREAMS (MOCK MODE DISABLED FOR PRODUCTION TESTING)
      console.log('✅ Using REAL Mux streams (mock mode disabled)');

      // Get the user's stream
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        let query = supabase
          .from('streams')
          .select(`
            *,
            events!inner (
              id,
              title,
              description,
              scheduled_start,
              scheduled_end,
              status,
              user_id
            )
          `)
          .eq('events.user_id', user.id);

        // If specific stream ID provided, query for that stream. Otherwise, get most recent active/live stream.
        if (streamId) {
          console.log('🎯 Loading specific stream by ID:', streamId);
          query = query.eq('id', streamId);
        } else {
          console.log('📋 Loading most recent active/live stream');
          query = query
            .in('status', ['active', 'live'])
            .order('created_at', { ascending: false })
            .limit(1);
        }

        const { data: stream, error: streamError } = await query.single();

        if (streamError && streamError.code !== 'PGRST116') {
          throw streamError;
        }

        if (!stream) {
          // NO STREAM IN DATABASE - LOAD LATEST FROM MUX (DON'T CREATE NEW!)
          console.log('🔍 No stream in database. Loading LATEST from Mux...');

          // Get LATEST Mux stream (the one you're already using!)
          const muxLatestResponse = await fetch('/api/mux/stream/latest');

          if (!muxLatestResponse.ok) {
            throw new Error('Failed to load Mux stream');
          }

          const muxLatestData = await muxLatestResponse.json();
          const existingStream = muxLatestData.stream;

          console.log('✅ Using EXISTING Mux stream:', existingStream.id);
          console.log('🔑 Stream key:', existingStream.stream_key);
          console.log('📊 Real Mux status:', existingStream.status);

          // Format Mux data - USE REAL STATUS FROM MUX
          setActiveStream({
            id: existingStream.id,
            mux_stream_id: existingStream.id,
            mux_playback_id: existingStream.playback_id,
            stream_key: existingStream.stream_key,
            rtmp_server_url: existingStream.rtmp_server_url,
            status: existingStream.status || 'idle', // ← USE REAL STATUS FROM MUX
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            event_id: 'mux-direct-event',
            peak_viewers: 0,
            total_viewers: 0,
            viewer_count: 0,
            engagemax_config: {
              polls_enabled: true,
              quizzes_enabled: true,
              reactions_enabled: true,
              ctas_enabled: true
            },
            autooffer_config: {
              experiments_enabled: true,
              dynamic_pricing: true,
              behavioral_triggers: true
            },
            chat_config: {
              enabled: true,
              moderated: false,
              ai_responses: true
            },
            events: {
              id: 'mux-direct-event',
              title: 'Live: How to 10x Your Webinar Conversions',
              description: 'AI-powered live streaming event',
              scheduled_start: new Date().toISOString(),
              scheduled_end: new Date(Date.now() + 3600000).toISOString(),
              status: existingStream.status === 'active' ? 'live' : 'scheduled'
            } as Event
          } as Stream & { events: Event });

          setLoading(false);
          return;
        }

        setActiveStream(stream as Stream & { events: Event });
      } catch (err) {
        console.error('Failed to load stream:', err);
        setError('Failed to load streaming studio');
      } finally{
        setLoading(false);
      }
    }

  useEffect(() => {
    loadActiveStream();
  }, []);

  if (loading) {
    return (
      <DashboardLayout
        title="Streaming Studio"
        description="AI-powered live streaming controls"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent mb-2">
              Loading Studio...
            </h2>
            <p className="text-purple-200/80">Initializing AI-powered streaming features</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !activeStream) {
    return (
      <DashboardLayout
        title="Streaming Studio"
        description="AI-powered live streaming controls"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-red-500/30 rounded-3xl p-12 text-center shadow-2xl max-w-md">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Studio Unavailable</h2>
            <p className="text-red-200/80 mb-8 leading-relaxed">
              {error || 'No active stream found. Please create a stream first.'}
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // NO WIZARD - Always show studio (stream is created immediately on page load)
  return (
    <DashboardLayout
      title="Streaming Studio"
      description="AI-powered live streaming controls"
    >
      <div className="h-[calc(100vh-120px)] min-h-[1500px] overflow-hidden">
        <StudioDashboard stream={activeStream} />
      </div>
    </DashboardLayout>
  );
}