'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import Cookies from 'js-cookie';

type Event = Database['public']['Tables']['events']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function StreamPage({ params }: PageProps) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    async function initializeStream() {
      try {
        const resolvedParams = await params;
        setEventId(resolvedParams.eventId);

        // Check for access token
        let accessToken = token;
        if (!accessToken) {
          // Check cookie
          const registrationCookie = Cookies.get(`convertcast_reg_${resolvedParams.eventId}`);
          if (registrationCookie) {
            const regData = JSON.parse(registrationCookie);
            accessToken = regData.access_token;
          }
        }

        if (!accessToken) {
          // Redirect to registration
          router.push(`/join/${resolvedParams.eventId}`);
          return;
        }

        // Validate access token and get registration
        const { data: registrationData, error: regError } = await supabase
          .from('registrations')
          .select('*, events(*)')
          .eq('event_id', resolvedParams.eventId)
          .eq('access_token', accessToken)
          .single();

        if (regError || !registrationData) {
          console.error('Registration validation failed:', regError);
          // Redirect to registration if token is invalid
          router.push(`/join/${resolvedParams.eventId}`);
          return;
        }

        setRegistration(registrationData);
        setEvent(registrationData.events as Event);

      } catch (err) {
        console.error('Stream initialization error:', err);
        setError('Failed to access stream');
      } finally {
        setLoading(false);
      }
    }

    initializeStream();
  }, [params, token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md px-6">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/join/${eventId}`)}
            className="bg-white text-red-900 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
          >
            Register for Event
          </button>
        </div>
      </div>
    );
  }

  if (!event || !registration) {
    return null;
  }

  const eventStart = new Date(event.scheduled_start);
  const now = new Date();
  const isLive = event.status === 'live';
  const isUpcoming = eventStart > now;
  const hasEnded = event.status === 'ended';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-purple-600">
                ConvertCast
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isLive 
                  ? 'bg-red-100 text-red-800'
                  : isUpcoming 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {isLive ? '🔴 LIVE' : isUpcoming ? '⏰ Upcoming' : '✅ Ended'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>
          <p className="text-gray-600 mb-8">
            {event.description}
          </p>

          {/* Stream Status */}
          {isLive ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🎥</div>
              <h2 className="text-2xl font-bold text-red-900 mb-2">Stream is Live!</h2>
              <p className="text-red-700 mb-4">
                The webinar is currently broadcasting. Video player would appear here.
              </p>
              <div className="bg-black aspect-video rounded-lg flex items-center justify-center">
                <p className="text-white text-xl">📹 Live Video Stream</p>
              </div>
            </div>
          ) : isUpcoming ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">⏰</div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Get Ready!</h2>
              <p className="text-green-700 mb-4">
                The webinar starts at {eventStart.toLocaleString()}.
                You'll be notified when it begins.
              </p>
              <div className="text-2xl font-mono font-bold text-green-800">
                {eventStart.toLocaleDateString()} at {eventStart.toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Ended</h2>
              <p className="text-gray-700">
                This webinar has concluded. Thank you for attending!
              </p>
            </div>
          )}

          {/* Registration Details */}
          <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">
              ✅ Successfully Registered
            </h3>
            <p className="text-purple-700 text-sm">
              Access Token: <code className="bg-white px-2 py-1 rounded text-xs font-mono">
                {registration.access_token?.slice(0, 20)}...
              </code>
            </p>
            <p className="text-purple-600 text-xs mt-1">
              🎯 ShowUp Surge™ is active and optimizing your experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}