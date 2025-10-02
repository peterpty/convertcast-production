'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { ChatService } from '@/lib/supabase/chatService';
import type { Database } from '@/types/database';
import MuxPlayer from '@mux/mux-player-react';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
import { WebSocketErrorBoundary } from '@/components/websocket/WebSocketErrorBoundary';
import { WebSocketDebugPanel } from '@/components/debug/WebSocketDebugPanel';
import { OverlayRenderer } from '@/components/overlay/OverlayRenderer';
import {
  Users,
  Heart,
  ThumbsUp,
  Star,
  MessageSquare,
  Send,
  Share2,
  Settings,
  Play,
  AlertCircle,
  Lock,
  Unlock
} from 'lucide-react';

type Stream = Database['public']['Tables']['streams']['Row'];
type Event = Database['public']['Tables']['events']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

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
  is_private?: boolean;
  sender_id?: string;
  status: 'active' | 'removed' | 'deleted' | 'pinned' | 'synthetic';
}

export default function LiveViewerPage() {
  const params = useParams();
  const streamId = params.id as string;
  const chatRef = useRef<HTMLDivElement>(null);

  // Generate a unique viewer ID for this session
  const [viewerId] = useState(`Viewer ${Math.floor(Math.random() * 9000) + 1000}`);

  const [streamData, setStreamData] = useState<StreamWithEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPrivateMessage, setIsPrivateMessage] = useState(false);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({ heart: 0, thumbs: 0, star: 0 });
  const [userReacted, setUserReacted] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [overlayData, setOverlayData] = useState<any>(null);

  // Transform WebSocket overlay data to OverlayState format
  const overlayState = overlayData ? {
    lowerThirds: overlayData.overlayType === 'lowerThirds' ? {
      visible: overlayData.overlayData?.visible !== false,
      text: overlayData.overlayData?.text || '',
      subtext: overlayData.overlayData?.subtext || '',
      position: overlayData.overlayData?.position || 'bottom-left' as const,
      style: overlayData.overlayData?.style || 'branded' as const
    } : { visible: false, text: '', subtext: '', position: 'bottom-left' as const, style: 'branded' as const },
    countdown: overlayData.overlayType === 'countdown' ? {
      visible: overlayData.overlayData?.visible !== false,
      targetTime: overlayData.overlayData?.targetTime || '',
      message: overlayData.overlayData?.message || '',
      style: overlayData.overlayData?.style || 'digital' as const
    } : { visible: false, targetTime: '', message: '', style: 'digital' as const },
    registrationCTA: overlayData.overlayType === 'registrationCTA' ? {
      visible: overlayData.overlayData?.visible !== false,
      headline: overlayData.overlayData?.headline || '',
      buttonText: overlayData.overlayData?.buttonText || '',
      urgency: overlayData.overlayData?.urgency || false,
      position: overlayData.overlayData?.position || 'bottom-center' as const
    } : { visible: false, headline: '', buttonText: '', urgency: false, position: 'bottom-center' as const },
    socialProof: overlayData.overlayType === 'socialProof' ? {
      visible: overlayData.overlayData?.visible !== false,
      type: overlayData.overlayData?.type || 'viewer-count' as const,
      position: overlayData.overlayData?.position || 'top-right' as const
    } : { visible: false, type: 'viewer-count' as const, position: 'top-right' as const },
    engageMax: {
      currentPoll: overlayData.overlayType === 'poll' ? {
        id: overlayData.overlayData?.id || null,
        question: overlayData.overlayData?.question || '',
        options: overlayData.overlayData?.options || [],
        visible: overlayData.overlayData?.active !== false
      } : {
        id: null,
        question: '',
        options: [],
        visible: false
      },
      reactions: { enabled: true, position: 'floating' as const },
      smartCTA: overlayData.overlayType === 'offer' ? {
        visible: overlayData.overlayData?.active !== false,
        message: overlayData.overlayData?.description || overlayData.overlayData?.title || '',
        action: 'register',
        trigger: 'manual' as const
      } : {
        visible: false,
        message: '',
        action: 'register',
        trigger: 'manual' as const
      }
    },
    celebrations: overlayData.overlayType === 'celebrations' ? {
      enabled: overlayData.overlayData?.enabled !== false,
      currentCelebration: overlayData.overlayData?.currentCelebration
    } : { enabled: false }
  } : null;

  // WebSocket connection for real-time features
  // CRITICAL: Use actual database stream ID, not playback ID from URL
  const {
    connected,
    connectionStatus,
    error: websocketError,
    sendChatMessage,
    sendReaction,
    eventLog,
    websocketUrl
  } = useWebSocket({
    streamId: streamId, // Use playback ID directly for consistent room matching
    userType: 'viewer',
    onViewerCountUpdate: (count: number) => setViewerCount(count),
    onOverlayUpdate: (data: any) => {
      console.log('📡 Overlay received in viewer:', data);
      setOverlayData(data);
    },
    onChatMessage: (message: any) => {
      // Detect if message is from streamer/host
      const isHost = message.username === 'Streamer' || message.userId === 'streamer';

      // Filter private messages - only show if:
      // 1. Message is public (not private)
      // 2. Message is from the current viewer (message.userId === viewerId)
      // 3. Message is from the host (isHost === true)
      if (message.isPrivate && message.userId !== viewerId && !isHost) {
        console.log('🔒 Filtering out private message from another viewer');
        return; // Don't show private messages from other viewers
      }

      const chatMessage: ChatMessageWithProfile = {
        id: message.id || Date.now().toString(),
        message: message.message,
        created_at: message.timestamp || new Date().toISOString(),
        is_synthetic: false,
        is_private: message.isPrivate || false,
        sender_id: message.userId,
        status: 'active',
        viewer_profiles: {
          first_name: isHost ? 'Host' : (message.username || 'Anonymous'),
          last_name: isHost ? '' : ''
        }
      };
      setChatMessages(prev => [...prev, chatMessage]);
    },
    onViewerReaction: (reaction: any) => {
      setReactions(prev => ({
        ...prev,
        [reaction.reactionType]: (prev[reaction.reactionType] || 0) + 1
      }));
    },
    onError: (error: string) => {
      console.error('Viewer WebSocket error:', error);
    }
  });

  // Load chat history from Supabase
  useEffect(() => {
    async function loadChatHistory() {
      if (!streamId) return;

      console.log('📜 Loading chat history for stream:', streamId);
      const messages = await ChatService.getMessages(streamId, 50);

      if (messages.length > 0) {
        console.log(`✅ Loaded ${messages.length} chat messages from history`);
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          message: msg.message,
          created_at: msg.created_at,
          is_synthetic: msg.is_synthetic,
          status: msg.status,
          viewer_profiles: msg.viewer_profiles
        }));
        setChatMessages(formattedMessages);
      }
    }

    loadChatHistory();
  }, [streamId]);

  // Subscribe to Supabase Realtime for chat messages (fallback/redundancy)
  useEffect(() => {
    if (!streamId) return;

    console.log('📡 Setting up Supabase Realtime subscription for chat...');
    const unsubscribe = ChatService.subscribeToMessages(streamId, (message) => {
      console.log('📨 New message from Supabase Realtime:', message);

      // Add message if not already present (avoid duplicates from WebSocket)
      setChatMessages(prev => {
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    return () => {
      console.log('🔌 Cleaning up Supabase Realtime subscription');
      unsubscribe();
    };
  }, [streamId]);

  // Load stream data from Supabase
  useEffect(() => {
    async function loadStreamData() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Viewer: Looking up stream:', streamId);

        // Try by mux_playback_id first
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
          .single();

        let stream = muxResult.data;
        let streamError = muxResult.error;

        if (!stream) {
          // Fallback: Create minimal stream data if database lookup fails
          if (streamId.length > 20 && (streamId.includes('_') || streamId.length > 30)) {
            console.log('⚠️ Viewer: Database lookup failed, creating minimal fallback data');
            stream = {
              id: streamId,
              mux_playback_id: streamId,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              event_id: 'unknown',
              mux_stream_id: null,
              viewer_count: 0,
              peak_viewers: 0,
              events: {
                id: 'unknown',
                title: 'Live Stream',
                description: '',
                scheduled_start: new Date().toISOString(),
                scheduled_end: new Date(Date.now() + 3600000).toISOString(),
                status: 'live',
                user_id: 'unknown'
              }
            } as StreamWithEvent;
            streamError = null;
          }
        }

        if (streamError || !stream) {
          setError('Stream not found or not available');
          setLoading(false);
          return;
        }

        setStreamData(stream as StreamWithEvent);
        setViewerCount(stream.viewer_count || 0);
        setLoading(false);
        console.log('✅ Viewer: Loaded stream data with', stream.viewer_count || 0, 'viewers');
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

      // Send reaction via WebSocket
      if (connected) {
        sendReaction(type);
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (connected) {
      // Send message via WebSocket with unique viewer ID and private flag
      sendChatMessage(newMessage, viewerId, isPrivateMessage);
    } else {
      // Fallback: local message only
      const mockMessage: ChatMessageWithProfile = {
        id: Date.now().toString(),
        message: newMessage,
        created_at: new Date().toISOString(),
        is_synthetic: false,
        is_private: isPrivateMessage,
        sender_id: viewerId,
        status: 'active',
        viewer_profiles: { first_name: viewerId, last_name: '' }
      };
      setChatMessages(prev => [...prev, mockMessage]);
    }

    setNewMessage('');
    setIsPrivateMessage(false); // Reset to public after sending
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

  if (error || !streamData) {
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
    <WebSocketErrorBoundary
      connectionStatus={connectionStatus}
      error={websocketError}
      isStudio={false}
    >
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
              {/* WebSocket Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                  connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-yellow-400 animate-pulse' :
                  'bg-red-400'
                }`}></div>
                <span className="text-xs text-gray-400">
                  {connectionStatus === 'connected' ? 'Live' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'reconnecting' ? 'Reconnecting...' :
                   'Offline'}
                </span>
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
                      viewer_user_id: 'anonymous'
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
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-red-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                </div>

                {/* Interactive Overlays from Studio */}
                {overlayState && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <OverlayRenderer
                      overlayState={overlayState}
                      viewerCount={viewerCount}
                      streamId={streamId}
                      connected={connected}
                    />
                  </div>
                )}
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
                    {chatMessages.length} messages
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatRef}
                className="flex-1 p-4 h-[calc(100vh-16rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30"
              >
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-purple-300/60 py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet. Be the first to chat!</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => {
                      const displayName = message.viewer_profiles
                        ? `${message.viewer_profiles.first_name} ${message.viewer_profiles.last_name}`
                        : 'Anonymous Viewer';

                      const messageTime = new Date(message.created_at).toLocaleTimeString();
                      const isOwnMessage = message.sender_id === viewerId;

                      return (
                        <div
                          key={message.id}
                          className={`${message.is_private ? 'bg-purple-900/30 border border-purple-500/30 rounded-lg p-2' : ''}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.is_private && (
                              <Lock className="w-3 h-3 text-purple-400" />
                            )}
                            <span className="text-xs font-medium text-purple-200">
                              {displayName}
                              {isOwnMessage && ' (You)'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {messageTime}
                            </span>
                            {message.is_private && (
                              <span className="text-xs text-purple-400 font-medium">
                                Private
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-white">{message.message}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-purple-500/20">
                {/* Private Message Toggle */}
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsPrivateMessage(!isPrivateMessage)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isPrivateMessage
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700/50 text-gray-400 hover:text-purple-300'
                    }`}
                  >
                    {isPrivateMessage ? (
                      <>
                        <Lock className="w-3 h-3" />
                        Private Message
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        Public Message
                      </>
                    )}
                  </button>
                  {isPrivateMessage && (
                    <span className="text-xs text-purple-300">
                      Only visible to host
                    </span>
                  )}
                </div>

                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isPrivateMessage ? "Send private message to host..." : "Type a message..."}
                    className={`flex-1 px-3 py-2 bg-slate-700/50 border ${
                      isPrivateMessage ? 'border-purple-400' : 'border-purple-500/30'
                    } rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-400`}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || !connected}
                    className={`p-2 ${
                      isPrivateMessage
                        ? 'bg-purple-700 hover:bg-purple-800'
                        : connected
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-600'
                    } disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors`}
                    title={!connected ? 'Connection required to send messages' : ''}
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

      {/* WebSocket Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <WebSocketDebugPanel
          connected={connected}
          connectionStatus={connectionStatus}
          error={websocketError}
          streamId={streamId}
          websocketUrl={websocketUrl}
          eventLog={eventLog}
        />
      )}
    </WebSocketErrorBoundary>
  );
}