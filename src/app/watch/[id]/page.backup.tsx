'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import { supabase } from '@/lib/supabase/client';
import { useSmartWebSocket } from '@/lib/websocket/useWebSocket';
import type { Database } from '@/types/database';
import MuxPlayer from '@mux/mux-player-react';
import {
  Users,
  Heart,
  ThumbsUp,
  Star,
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
  Maximize,
  Share2,
  Gift,
  Zap,
  TrendingUp,
  Target,
  Award,
  Clock,
  Play,
  Pause,
  Settings,
  Download,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

type Stream = Database['public']['Tables']['streams']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ViewerProfile = Database['public']['Tables']['viewer_profiles']['Row'];

interface StreamWithEvent extends Stream {
  events: Event;
}

interface ChatMessageWithProfile {
  id: string;
  message: string;
  created_at: string;
  viewer_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  is_synthetic: boolean;
  status: 'active' | 'removed' | 'deleted' | 'pinned' | 'synthetic';
}

interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  active: boolean;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  discount: number;
  timeLeft: number;
  active: boolean;
}

export default function LiveViewerPage() {
  const params = useParams();
  const streamId = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const [streamData, setStreamData] = useState<StreamWithEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({ heart: 0, thumbs: 0, star: 0 });
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [userReacted, setUserReacted] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewerProfile, setViewerProfile] = useState<ViewerProfile | null>(null);

  // Smart WebSocket connection with automatic fallback
  const { connected, emit: sendWebSocketMessage, isMockMode } = useSmartWebSocket({
    streamId: streamId,
    onViewerCountUpdate: (count: number) => {
      setViewerCount(count);
    },
    onOverlayUpdate: (overlayState: any) => {
      console.log('📡 Viewer: Received overlay update:', overlayState);

      // Update polls
      if (overlayState.poll) {
        setCurrentPoll(overlayState.poll);
      }

      // Update offers
      if (overlayState.offer) {
        setCurrentOffer(overlayState.offer);
      }

      // Clear overlays when they're disabled
      if (overlayState.poll === null) {
        setCurrentPoll(null);
      }
      if (overlayState.offer === null) {
        setCurrentOffer(null);
      }
    },
    onChatMessage: (message: any) => {
      console.log('📡 Viewer: Received chat message:', message);
      // Chat is already handled by Supabase subscription, but could add WebSocket chat here
    }
  });

  // Load stream data from Supabase
  useEffect(() => {
    async function loadStreamData() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Viewer: Looking up stream:', streamId);

        // Get stream with event data - comprehensive lookup strategy
        let stream, streamError;

        // Try by mux_playback_id first
        console.log('📡 Viewer: Trying mux_playback_id lookup...');
        const muxResult = await supabase
          .from('streams')
          .select(`
            *,
            events (
              id,
              title,
              description,
              scheduled_start,
              scheduled_end,
              status,
              user_id
            )
          `)
          .eq('mux_playback_id', streamId)
          .single(); // Remove status filter initially

        if (muxResult.data) {
          console.log('✅ Viewer: Found by mux_playback_id:', muxResult.data.id);
          stream = muxResult.data;
          streamError = muxResult.error;
        } else {
          console.log('⚠️ Viewer: mux_playback_id lookup failed, trying stream ID...');

          // Fallback to lookup by stream id
          const idResult = await supabase
            .from('streams')
            .select(`
              *,
              events (
                id,
                title,
                description,
                scheduled_start,
                scheduled_end,
                status,
                user_id
              )
            `)
            .eq('id', streamId)
            .single(); // Remove status filter initially

          if (idResult.data) {
            console.log('✅ Viewer: Found by stream ID:', idResult.data.id);
            stream = idResult.data;
            streamError = idResult.error;
          } else {
            console.log('⚠️ Viewer: Database lookup failed, checking for demo stream...');

            // Special handling for demo streams
            if (streamId === 'mux_playback_67890' || streamId === 'demo-stream-id') {
              console.log('📺 Viewer: Using demo stream data');
              stream = {
                id: 'demo-stream-id',
                mux_playback_id: 'mux_playback_67890',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                event_id: 'demo-event-id',
                mux_stream_id: null,
                viewer_count: 1847,
                peak_viewers: 1847,
                events: {
                  id: 'demo-event-id',
                  title: 'Live: How to 10x Your Webinar Conversions',
                  description: 'Complete ConvertCast Studio demo featuring all 6 AI-powered features working in real-time',
                  scheduled_start: new Date().toISOString(),
                  scheduled_end: new Date(Date.now() + 3600000).toISOString(),
                  status: 'live',
                  user_id: 'demo-user'
                }
              };
              streamError = null;
            } else {
              console.log('🔧 Viewer: No database match, checking if this is a valid Mux stream ID...');

              // Final fallback: if this looks like a Mux stream/playback ID, create demo data
              if (streamId.length > 20 && (streamId.includes('_') || streamId.length > 30)) {
                console.log('🎯 Viewer: Creating fallback stream data for Mux ID:', streamId);
                stream = {
                  id: streamId,
                  mux_playback_id: streamId,
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  event_id: 'fallback-event-id',
                  mux_stream_id: null,
                  viewer_count: 1847,
                  peak_viewers: 1847,
                  events: {
                    id: 'fallback-event-id',
                    title: 'Live: How to 10x Your Webinar Conversions',
                    description: 'Live streaming session - testing viewer experience',
                    scheduled_start: new Date().toISOString(),
                    scheduled_end: new Date(Date.now() + 3600000).toISOString(),
                    status: 'live',
                    user_id: 'demo-user'
                  }
                };
                streamError = null;
                console.log('✅ Viewer: Using fallback data for stream:', streamId);
              } else {
                stream = idResult.data;
                streamError = idResult.error || new Error('Stream not found in database');
              }
            }
          }
        }

        if (streamError) {
          console.error('Stream fetch error:', streamError);
          setError('Stream not found or not available');
          setLoading(false);
          return;
        }

        if (!stream || !stream.events) {
          setError('Stream not found or not available');
          setLoading(false);
          return;
        }

        setStreamData(stream as StreamWithEvent);
        setViewerCount(stream.peak_viewers || 0);

        // Load recent chat messages using the actual stream database ID
        const { data: messages, error: chatError } = await supabase
          .from('chat_messages')
          .select(`
            id,
            message,
            created_at,
            is_synthetic,
            status,
            viewer_profiles (
              first_name,
              last_name
            )
          `)
          .eq('stream_id', stream.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);

        if (chatError) {
          console.error('Chat fetch error:', chatError);
        } else if (messages) {
          setChatMessages(messages.reverse() as ChatMessageWithProfile[]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading stream:', err);
        setError('Failed to load stream');
        setLoading(false);
      }
    }

    if (streamId) {
      loadStreamData();
    }
  }, [streamId]);

  // Set up real-time chat subscription
  useEffect(() => {
    if (!streamData) return;

    const channel = supabase
      .channel(`stream:${streamData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `stream_id=eq.${streamData.id}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;

          // Fetch viewer profile for the new message
          let messageWithProfile: ChatMessageWithProfile = {
            id: newMessage.id,
            message: newMessage.message,
            created_at: newMessage.created_at,
            is_synthetic: newMessage.is_synthetic,
            status: newMessage.status,
            viewer_profiles: null
          };

          if (newMessage.viewer_profile_id) {
            const { data: profile } = await supabase
              .from('viewer_profiles')
              .select('first_name, last_name')
              .eq('id', newMessage.viewer_profile_id)
              .single();

            if (profile) {
              messageWithProfile.viewer_profiles = profile;
            }
          }

          setChatMessages(prev => [...prev.slice(-49), messageWithProfile]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamData, streamId]);

  // Update viewer count periodically
  useEffect(() => {
    if (!streamData) return;

    const interval = setInterval(async () => {
      try {
        const { data: stream } = await supabase
          .from('streams')
          .select('peak_viewers')
          .eq('id', streamId)
          .single();

        if (stream) {
          setViewerCount(stream.peak_viewers + Math.floor(Math.random() * 20) - 5);
        }
      } catch (err) {
        console.error('Error updating viewer count:', err);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [streamData, streamId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !streamData) return;

    try {
      // Create viewer profile if it doesn't exist
      let currentViewerProfile = viewerProfile;
      if (!currentViewerProfile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('viewer_profiles')
          .insert({
            email: `viewer_${Date.now()}@example.com`,
            first_name: 'Anonymous',
            last_name: 'Viewer',
            phone: '',
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating viewer profile:', profileError);
          return;
        }

        currentViewerProfile = newProfile;
        setViewerProfile(newProfile);
      }

      // Send message to database
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          stream_id: streamId,
          viewer_profile_id: currentViewerProfile.id,
          message: newMessage,
          status: 'active',
          is_synthetic: false,
          intent_signals: {}
        });

      if (messageError) {
        console.error('Error sending message:', messageError);
        return;
      }

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleReaction = (type: string) => {
    if (userReacted === type) {
      setUserReacted(null);
      setReactions(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
    } else {
      if (userReacted) {
        setReactions(prev => ({ ...prev, [userReacted]: Math.max(0, prev[userReacted] - 1) }));
      }
      setUserReacted(type);
      setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    }
  };

  const votePoll = (optionId: string) => {
    if (!currentPoll) return;

    setCurrentPoll(prev => {
      if (!prev) return null;
      return {
        ...prev,
        options: prev.options.map(opt =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        ),
        totalVotes: prev.totalVotes + 1
      };
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Loading Live Stream...
          </h2>
        </div>
      </div>
    );
  }

  if (error || (!loading && !streamData)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Stream Not Available</h2>
          <p className="text-purple-200/80">{error || 'This stream may have ended or is not yet started.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{streamData ? `${streamData.events.title} - ConvertCast Live` : 'Loading Stream - ConvertCast'}</title>
        <meta name="description" content={streamData?.events.description || 'Watch live streaming events on ConvertCast'} />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={streamData ? `${streamData.events.title} - ConvertCast Live` : 'Live Stream'} />
        <meta property="og:description" content={streamData?.events.description || 'Join us for an interactive live streaming experience'} />
        <meta property="og:type" content="video.live_stream" />
        <meta property="og:url" content={`https://convertcast.com/watch/${streamId}`} />
        <meta property="og:site_name" content="ConvertCast" />
        <meta property="og:image" content={streamData?.mux_playback_id ? `https://image.mux.com/${streamData.mux_playback_id}/thumbnail.png?width=1200&height=630&fit_mode=smartcrop` : '/og-default.png'} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ConvertCast" />
        <meta name="twitter:title" content={streamData ? `${streamData.events.title} - ConvertCast Live` : 'Live Stream'} />
        <meta name="twitter:description" content={streamData?.events.description || 'Join us for an interactive live streaming experience'} />
        <meta name="twitter:image" content={streamData?.mux_playback_id ? `https://image.mux.com/${streamData.mux_playback_id}/thumbnail.png?width=1200&height=630&fit_mode=smartcrop` : '/og-default.png'} />

        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#9f6aff" />
        <link rel="canonical" href={`https://convertcast.com/watch/${streamId}`} />

        {/* Structured Data for Live Stream */}
        {streamData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "VideoObject",
                "name": streamData.events.title,
                "description": streamData.events.description || '',
                "thumbnailUrl": streamData.mux_playback_id
                  ? `https://image.mux.com/${streamData.mux_playback_id}/thumbnail.png`
                  : '',
                "uploadDate": streamData.created_at,
                "duration": "PT0H0M0S",
                "embedUrl": `https://convertcast.com/watch/${streamId}`,
                "interactionStatistic": {
                  "@type": "InteractionCounter",
                  "interactionType": { "@type": "WatchAction" },
                  "userInteractionCount": viewerCount
                },
                "isLiveBroadcast": streamData.status === 'active',
                "publication": [{
                  "@type": "BroadcastEvent",
                  "name": streamData.events.title,
                  "startDate": streamData.events.scheduled_start,
                  "endDate": streamData.events.scheduled_end,
                  "isLiveBroadcast": streamData.status === 'active'
                }]
              })
            }}
          />
        )}
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/50 to-purple-950/30 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-purple-200">
                <Users className="w-4 h-4" />
                <span className="text-sm">{viewerCount.toLocaleString()} watching</span>
              </div>
            </div>

            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              {streamData.events.title}
            </h1>

            <div className="flex items-center gap-2">
              <button className="p-2 text-purple-200 hover:text-white hover:bg-purple-600/20 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-purple-200 hover:text-white hover:bg-purple-600/20 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Container */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-video">
                {streamData.mux_playback_id ? (
                  <MuxPlayer
                    streamType="live"
                    playbackId={streamData.mux_playback_id}
                    metadata={{
                      video_id: streamData.id,
                      video_title: streamData.events.title,
                      viewer_user_id: viewerProfile?.id || 'anonymous'
                    }}
                    autoPlay="muted"
                    accentColor="#9f6aff"
                    className="w-full h-full"
                    style={{
                      borderRadius: '1rem',
                      '--loading-icon': 'none'
                    }}
                    onPlay={() => console.log('Stream started playing')}
                    onPause={() => console.log('Stream paused')}
                    onError={(error) => console.error('Stream error:', error)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-white/50 mx-auto mb-4" />
                      <p className="text-white/70">Stream not available</p>
                    </div>
                  </div>
                )}

                {/* Live Overlay */}
                <div className="absolute top-4 right-4">
                  <div className="bg-red-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>
              </div>
            </div>

            {/* Reaction Bar */}
            <div className="flex items-center justify-between bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <span className="text-purple-300 text-sm">React:</span>
                <div className="flex gap-2">
                  {[
                    { type: 'heart', icon: Heart, count: reactions.heart + 156 },
                    { type: 'thumbs', icon: ThumbsUp, count: reactions.thumbs + 89 },
                    { type: 'star', icon: Star, count: reactions.star + 67 }
                  ].map(({ type, icon: Icon, count }) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        userReacted === type
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700/50 text-purple-200 hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-purple-300">
                {viewerCount.toLocaleString()} viewers reacted
              </div>
            </div>

            {/* Current Poll */}
            <AnimatePresence>
              {currentPoll && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Live Poll</h3>
                    <span className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded-full">
                      {currentPoll.totalVotes} votes
                    </span>
                  </div>

                  <h4 className="text-white mb-4">{currentPoll.question}</h4>

                  <div className="space-y-3">
                    {currentPoll.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => votePoll(option.id)}
                        className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white group-hover:text-blue-300">{option.text}</span>
                          <span className="text-blue-400 font-semibold">{Math.round((option.votes / currentPoll.totalVotes) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(option.votes / currentPoll.totalVotes) * 100}%` }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Special Offer */}
            <AnimatePresence>
              {currentOffer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gradient-to-br from-green-800/40 to-emerald-900/40 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Exclusive Live Offer</h3>
                    <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                      LIMITED TIME
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{currentOffer.title}</h4>
                      <p className="text-green-200/80 mb-4">{currentOffer.description}</p>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-2xl font-bold text-green-400">
                          ${currentOffer.discountPrice}
                        </div>
                        <div className="text-lg text-gray-400 line-through">
                          ${currentOffer.originalPrice}
                        </div>
                        <div className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                          {currentOffer.discount}% OFF
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-2">
                        <Clock className="w-5 h-5 inline mr-2" />
                        15:23
                      </div>
                      <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-200">
                        Claim Offer Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl sticky top-24 h-[calc(100vh-8rem)]">
              {/* Chat Header */}
              <div className="p-4 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Live Chat
                  </h3>
                  <div className="text-xs text-purple-300">
                    {chatMessages.length} messages{connected ? '' : ' (disconnected)'}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatRef}
                className="flex-1 p-4 h-[calc(100vh-16rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30"
              >
                <div className="space-y-3">
                  {chatMessages.map((message) => {
                    const displayName = message.viewer_profiles
                      ? `${message.viewer_profiles.first_name} ${message.viewer_profiles.last_name}`
                      : message.is_synthetic
                        ? 'ConvertCast AI'
                        : 'Anonymous Viewer';

                    const messageTime = new Date(message.created_at).toLocaleTimeString();

                    return (
                      <div key={message.id} className={`${
                        message.status === 'synthetic' || message.is_synthetic
                          ? 'bg-purple-600/20 border border-purple-500/30 rounded-lg p-2'
                          : ''
                      }`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${
                              message.is_synthetic ? 'text-purple-300' :
                              displayName.includes('Anonymous') ? 'text-gray-400' :
                              'text-purple-200'
                            }`}>
                              {displayName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {messageTime}
                            </span>
                          </div>
                          <div className="text-sm text-white">{message.message}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-purple-500/20">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}