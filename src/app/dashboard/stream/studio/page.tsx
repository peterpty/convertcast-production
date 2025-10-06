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

        // If specific stream ID provided, query for that stream. Otherwise, get most recent stream.
        if (streamId) {
          console.log('🎯 Loading specific stream by ID:', streamId);
          query = query.eq('id', streamId);
        } else {
          console.log('📋 Loading most recent stream (any status)');
          query = query
            .order('created_at', { ascending: false })
            .limit(1);
        }

        const { data: stream, error: streamError } = await query.single();

        if (streamError && streamError.code !== 'PGRST116') {
          throw streamError;
        }

        if (!stream) {
          // NO STREAM IN DATABASE - CREATE ONE FOR THIS USER
          console.log('🔍 No stream in database. Creating user stream...');

          // Step 1: Get or create user's event (client-side, RLS will ensure user's own event)
          let userEvent;

          const { data: existingEvents, error: eventQueryError } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (eventQueryError) {
            console.error('❌ Error querying events:', eventQueryError);
            throw new Error('Failed to query events');
          }

          if (existingEvents && existingEvents.length > 0) {
            userEvent = existingEvents[0];
            console.log('✅ Found existing event:', userEvent.id);
          } else {
            // Create a new event
            console.log('📝 Creating new event for user...');
            const now = new Date();
            const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            const { data: newEvent, error: createEventError } = await supabase
              .from('events')
              .insert({
                user_id: user.id,
                title: 'My Live Stream',
                description: 'Live streaming event powered by ConvertCast',
                scheduled_start: now.toISOString(),
                scheduled_end: endTime.toISOString(),
                status: 'scheduled',
                timezone: 'UTC',
                registration_required: false
              })
              .select()
              .single();

            if (createEventError || !newEvent) {
              console.error('❌ Error creating event:', createEventError);
              throw new Error('Failed to create event');
            }

            userEvent = newEvent;
            console.log('✅ Created new event:', userEvent.id);
          }

          // Step 2: Create Mux stream via API (uses service role to create stream in Mux + DB)
          console.log('🎬 Creating Mux stream via API...');

          const createStreamResponse = await fetch('/api/mux/stream/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              eventId: userEvent.id,
              userId: user.id,
              eventTitle: userEvent.title
            }),
            credentials: 'include'
          });

          if (!createStreamResponse.ok) {
            const errorData = await createStreamResponse.json();
            console.error('❌ Failed to create stream:', errorData);
            throw new Error(errorData.error || 'Failed to create stream');
          }

          const createStreamData = await createStreamResponse.json();
          console.log('✅ Stream created:', createStreamData.stream.id);

          // Step 3: Query the created stream from database (RLS will filter to user's own)
          const { data: newStream, error: newStreamError } = await supabase
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
            .eq('id', createStreamData.stream.database_id)
            .single();

          if (newStreamError || !newStream) {
            console.error('❌ Error loading created stream:', newStreamError);
            throw new Error('Failed to load created stream');
          }

          setActiveStream(newStream as Stream & { events: Event });
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