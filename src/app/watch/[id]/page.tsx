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
import { InstagramBar } from '@/components/viewer/InstagramBar';
import { FloatingComments, type FloatingComment } from '@/components/viewer/FloatingComments';
import { TouchReactions } from '@/components/viewer/TouchReactions';
import { MobileControls } from '@/components/viewer/MobileControls';
import { RotateScreen } from '@/components/viewer/RotateScreen';
import { useOrientation } from '@/hooks/useOrientation';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import { useLandscapeLock } from '@/hooks/useLandscapeLock';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import '@/styles/instagram-overlays.css';
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
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const muxPlayerRef = useRef<any>(null);
  const orientation = useOrientation();
  const keyboardState = useKeyboardDetection();
  const landscapeLock = useLandscapeLock();
  const { isMobile: isMobileDevice } = useMobileDetection();

  // Generate a unique viewer ID for this session
  const [viewerId] = useState(`Viewer ${Math.floor(Math.random() * 9000) + 1000}`);

  const [streamData, setStreamData] = useState<StreamWithEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isPrivateMessage, setIsPrivateMessage] = useState(false);
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    heart: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    clap: 0,
    fire: 0,
    hundred: 0,
    rocket: 0
  });
  const [viewerCount, setViewerCount] = useState(0);
  const [overlayData, setOverlayData] = useState<any>(null);
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; x: number; y: number; timestamp: number }>>([]);

  // Mobile-specific state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted

  // Use robust mobile detection that survives rotation
  const isMobileView = isMobileDevice;

  // Lock body scroll on mobile landscape for immersive experience
  useEffect(() => {
    if (isMobileView && orientation.isLandscape) {
      document.body.classList.add('mobile-landscape-lock');
    } else {
      document.body.classList.remove('mobile-landscape-lock');
    }

    return () => {
      document.body.classList.remove('mobile-landscape-lock');
    };
  }, [isMobileView, orientation.isLandscape]);

  // LIVE-LOCK: Force player to always stay at live edge, prevent seeking
  useEffect(() => {
    const player = muxPlayerRef.current;
    if (!player) return;

    let lastLivePosition = 0;

    // Monitor and enforce live position
    const enforceLivePosition = () => {
      try {
        const mediaEl = player.media;
        if (!mediaEl) return;

        // For live streams, duration - currentTime = latency from live edge
        const latencyFromLive = mediaEl.duration - mediaEl.currentTime;

        // If viewer has drifted more than 3 seconds from live, snap back
        if (latencyFromLive > 3) {
          console.log('🔒 Live-lock: Snapping back to live edge (drift:', latencyFromLive.toFixed(2), 's)');
          mediaEl.currentTime = mediaEl.duration;
        }

        lastLivePosition = mediaEl.currentTime;
      } catch (err) {
        // Silently handle errors
      }
    };

    // Check live position every second
    const interval = setInterval(enforceLivePosition, 1000);

    // Block seek attempts via timeupdate
    const preventSeekBack = (e: Event) => {
      try {
        const mediaEl = player.media;
        if (!mediaEl) return;

        const currentTime = mediaEl.currentTime;

        // If user seeked backward (more than 1 second), snap to live
        if (lastLivePosition - currentTime > 1) {
          console.log('🔒 Live-lock: Blocked seek attempt');
          mediaEl.currentTime = mediaEl.duration;

          // Haptic feedback to indicate blocking
          if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
          }
        }

        lastLivePosition = currentTime;
      } catch (err) {
        // Silently handle errors
      }
    };

    // Block keyboard seeking
    const preventKeyboardSeek = (e: KeyboardEvent) => {
      const seekKeys = ['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '];

      if (seekKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();

        console.log('🔒 Live-lock: Blocked keyboard seek:', e.key);

        // Visual feedback
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      }
    };

    // Attach listeners
    if (player.media) {
      player.media.addEventListener('timeupdate', preventSeekBack);
      player.media.addEventListener('seeking', (e: Event) => {
        e.preventDefault();
        if (player.media) {
          player.media.currentTime = player.media.duration;
        }
      });
    }

    document.addEventListener('keydown', preventKeyboardSeek);

    return () => {
      clearInterval(interval);
      if (player.media) {
        player.media.removeEventListener('timeupdate', preventSeekBack);
      }
      document.removeEventListener('keydown', preventKeyboardSeek);
    };
  }, [muxPlayerRef.current]);

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
  const {
    connected,
    connectionStatus,
    error: websocketError,
    sendChatMessage,
    sendReaction,
    eventLog,
    websocketUrl
  } = useWebSocket({
    streamId: streamId,
    userType: 'viewer',
    userId: viewerId,
    onViewerCountUpdate: (count: number) => setViewerCount(count),
    onOverlayUpdate: (data: any) => {
      console.log('📡 Overlay received in viewer:', data);
      setOverlayData(data);
    },
    onChatMessage: (message: any) => {
      const isHost = message.username === 'Streamer' || message.userId === 'streamer';

      if (message.isPrivate && message.userId !== viewerId && !isHost) {
        console.log('🔒 Filtering out private message from another viewer');
        return;
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
      console.log('📡 Received WebSocket reaction:', reaction);

      if (reaction.userId === viewerId || reaction.userId?.startsWith('local-')) {
        console.log('⏭️ Skipping own reaction to avoid duplication');
        return;
      }

      const emojiMap: { [key: string]: string } = {
        heart: '❤️',
        laugh: '😂',
        wow: '😮',
        sad: '😢',
        clap: '👏',
        fire: '🔥',
        hundred: '💯',
        rocket: '🚀',
        thumbs: '👍',
        star: '⭐',
        love: '😍',
        cool: '😎',
        party: '🎉',
        mind: '🤯'
      };

      const emoji = emojiMap[reaction.reactionType] || '❤️';

      const newReaction = {
        id: `remote-${Date.now()}-${Math.random()}`,
        emoji,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        timestamp: Date.now()
      };

      console.log('✨ Adding remote reaction:', newReaction);
      setFloatingReactions(prev => [...prev, newReaction].slice(-20));

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

  // Clean up old floating reactions after 10 seconds
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setFloatingReactions(prev => prev.filter(reaction => now - reaction.timestamp < 10000));
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // Load stream data from Supabase
  useEffect(() => {
    async function loadStreamData() {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Viewer: Looking up stream:', streamId);

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

  // Instagram-style rapid reaction handler
  const handleReaction = (type: string) => {
    console.log('🎯 Reaction clicked:', type);

    setReactions(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));

    const emojiMap: { [key: string]: string } = {
      heart: '❤️',
      laugh: '😂',
      wow: '😮',
      sad: '😢',
      clap: '👏',
      fire: '🔥',
      hundred: '💯',
      rocket: '🚀',
      thumbs: '👍',
      star: '⭐',
      love: '😍',
      cool: '😎',
      party: '🎉',
      mind: '🤯'
    };

    const emoji = emojiMap[type] || '❤️';

    const newReaction = {
      id: `local-${Date.now()}-${Math.random()}`,
      emoji,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      timestamp: Date.now()
    };

    console.log('✨ Adding floating reaction:', newReaction);
    setFloatingReactions(prev => {
      const updated = [...prev, newReaction].slice(-20);
      console.log('📊 Current floating reactions:', updated.length);
      return updated;
    });

    if (connected) {
      sendReaction(type);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (connected) {
      sendChatMessage(newMessage, viewerId, isPrivateMessage);
    } else {
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
    setIsPrivateMessage(false);
  };

  // Fullscreen handlers
  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mute/unmute handler
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Network quality (mock for now, can be enhanced with real metrics)
  const networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline' = connected ? 'good' : 'offline';

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

  // Chat content component (reused in both mobile and desktop)
  const ChatContent = () => (
    <>
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
        className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 hide-scrollbar smooth-scroll"
        style={{ maxHeight: isMobileView ? 'calc(60vh - 10rem)' : 'calc(100vh - 16rem)' }}
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
      <div className="p-4 border-t border-purple-500/20 mobile-safe-bottom">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsPrivateMessage(!isPrivateMessage)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-target ${
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
            className={`p-2 touch-target ${
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
    </>
  );

  return (
    <WebSocketErrorBoundary
      connectionStatus={connectionStatus}
      error={websocketError}
      isStudio={false}
    >
      {/* Landscape Lock: Show rotate prompt on mobile in portrait mode */}
      {isMobileDevice && <RotateScreen />}

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Header - Hidden on Mobile Landscape for Immersive View */}
        <div className={`bg-gradient-to-r from-slate-900/50 to-purple-950/30 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-40 mobile-safe-top ${isMobileView ? 'py-2' : 'py-4'} ${isMobileView && orientation.isLandscape ? 'mobile-landscape-hide' : ''}`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 text-purple-200">
                  <Users className={`${isMobileView ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span className={`${isMobileView ? 'text-xs' : 'text-sm'}`}>{viewerCount.toLocaleString()}</span>
                </div>
                {!isMobileView && (
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
                )}
              </div>

              <h1 className={`${isMobileView ? 'text-sm' : 'text-lg'} font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent truncate max-w-[50vw]`}>
                {streamData.events.title}
              </h1>

              {!isMobileView && (
                <div className="flex items-center gap-2">
                  <button className="p-2 text-purple-200 hover:text-white hover:bg-purple-600/20 rounded-lg transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-purple-200 hover:text-white hover:bg-purple-600/20 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Mobile First */}
        <div className={`${isMobileView && orientation.isLandscape ? '' : 'container mx-auto md:px-4 md:py-6'}`}>
          <div className={`${isMobileView ? '' : 'grid lg:grid-cols-4 gap-6'}`}>
            {/* Video Player - Fullscreen on Mobile Landscape */}
            <div className={`${isMobileView ? '' : 'lg:col-span-3'}`}>
              <div
                ref={videoContainerRef}
                className={`relative bg-black overflow-hidden ${
                  isMobileView && orientation.isLandscape
                    ? 'video-immersive-container'
                    : isMobileView
                    ? ''
                    : 'rounded-2xl shadow-2xl'
                }`}
              >
                <div className={`${
                  isMobileView && orientation.isLandscape
                    ? 'w-full h-full'
                    : isMobileView
                    ? 'w-full h-[56vw] max-h-[70vh]'
                    : 'aspect-video'
                }`}>
                  {streamData.mux_playback_id ? (
                    <MuxPlayer
                      ref={muxPlayerRef}
                      streamType="live"
                      playbackId={streamData.mux_playback_id}
                      targetLiveWindow={0}
                      metadata={{
                        video_id: streamData.id,
                        video_title: streamData.events.title,
                        viewer_user_id: 'anonymous'
                      }}
                      autoPlay="muted"
                      muted={isMuted}
                      accentColor="#9f6aff"
                      primaryColor="#9f6aff"
                      secondaryColor="#a855f7"
                      className="w-full h-full video-mobile-optimized live-locked-player"
                      style={{
                        borderRadius: isMobileView && orientation.isLandscape ? '0' : isMobileView ? '0' : '1rem',
                        '--controls': isMobileView ? 'none' : 'auto',
                        '--media-object-fit': 'contain', // Always contain to show full video
                        '--seek-backward-button': 'none',
                        '--seek-forward-button': 'none',
                        '--time-range': isMobileView ? 'none' : 'auto',
                        width: '100%',
                        height: '100%',
                      }}
                      onPlay={() => console.log('Stream started playing')}
                      onPause={() => console.log('Stream paused')}
                      onError={(error) => console.error('Stream error:', error)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <div className="text-center">
                        <Play className="w-16 h-16 text-white/50 mx-auto mb-4" />
                        <p className="text-white/70">Stream not available</p>
                      </div>
                    </div>
                  )}

                  {/* Floating Reactions */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {floatingReactions.length > 0 && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {floatingReactions.map((reaction) => (
                          <div
                            key={reaction.id}
                            className="absolute animate-heart-float"
                            style={{
                              left: `${reaction.x}%`,
                              top: `${reaction.y}%`,
                              fontSize: isMobileView ? '2.5rem' : '3rem',
                              opacity: Math.max(0, 1 - (Date.now() - reaction.timestamp) / 10000),
                              animationDuration: '4s',
                              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                              zIndex: 30
                            }}
                          >
                            <div className="relative">
                              <div className="absolute inset-0 blur-sm opacity-50">{reaction.emoji}</div>
                              <div className="relative">{reaction.emoji}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Interactive Overlays from Studio */}
                  {overlayState && (
                    <div className="absolute inset-0 z-20 pointer-events-none">
                      <OverlayRenderer
                        overlayState={overlayState}
                        viewerCount={viewerCount}
                        streamId={streamId}
                        connected={connected}
                        reactions={[]}
                      />
                    </div>
                  )}

                  {/* Mobile Controls Overlay - Only show in portrait, not landscape (already fullscreen) */}
                  {isMobileView && !orientation.isLandscape && (
                    <MobileControls
                      isFullscreen={isFullscreen}
                      isMuted={isMuted}
                      onFullscreenToggle={toggleFullscreen}
                      onMuteToggle={toggleMute}
                      onChatToggle={() => setIsChatOpen(true)}
                      networkQuality={networkQuality}
                      className="absolute inset-0 z-30"
                    />
                  )}
                </div>
              </div>

              {/* Touch Reactions - Mobile Portrait Only (hidden in landscape for immersive view) */}
              {isMobileView && !orientation.isLandscape && (
                <TouchReactions
                  onReaction={handleReaction}
                  className="sticky bottom-0 z-30"
                />
              )}

              {/* Desktop Reaction Bar */}
              {!isMobileView && (
                <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 shadow-2xl mt-6">
                  <div className="flex items-center justify-center gap-3">
                    {[
                      { type: 'heart', emoji: '❤️' },
                      { type: 'laugh', emoji: '😂' },
                      { type: 'wow', emoji: '😮' },
                      { type: 'clap', emoji: '👏' },
                      { type: 'fire', emoji: '🔥' },
                      { type: 'rocket', emoji: '🚀' }
                    ].map(({ type, emoji }) => (
                      <motion.button
                        key={type}
                        onClick={() => handleReaction(type)}
                        whileTap={{ scale: 1.4 }}
                        whileHover={{ scale: 1.15 }}
                        className="relative w-14 h-14 flex items-center justify-center hover:bg-purple-600/10 rounded-full transition-colors"
                      >
                        <span className="text-4xl filter drop-shadow-lg">
                          {emoji}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Sidebar - Desktop Only */}
            {!isMobileView && (
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl sticky top-24 h-[calc(100vh-8rem)] flex flex-col">
                  <ChatContent />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Comments - Mobile Only */}
        {isMobileView && (
          <FloatingComments
            messages={chatMessages.slice(-10).map((msg): FloatingComment => ({
              id: msg.id,
              username: msg.viewer_profiles
                ? `${msg.viewer_profiles.first_name} ${msg.viewer_profiles.last_name}`
                : 'Anonymous',
              message: msg.message,
              isPrivate: msg.is_private,
              timestamp: new Date(msg.created_at).getTime(),
            }))}
            onCommentClick={() => {
              // TODO: Open full chat modal
              setIsChatOpen(true);
            }}
            keyboardHeight={keyboardState.height}
          />
        )}

        {/* Instagram Bar - Mobile Only */}
        {isMobileView && (
          <InstagramBar
            onSendMessage={(message, isPrivate) => {
              if (connected) {
                sendChatMessage(message, viewerId, isPrivate);
              }
            }}
            onReaction={() => {
              handleReaction('heart');
            }}
            onShare={async () => {
              if (navigator.share && streamData) {
                try {
                  await navigator.share({
                    title: streamData.events.title,
                    text: `Watch ${streamData.events.title} live!`,
                    url: window.location.href,
                  });
                } catch (err) {
                  // User cancelled or share failed
                  console.log('Share cancelled');
                }
              } else {
                // Fallback: Copy to clipboard
                navigator.clipboard?.writeText(window.location.href);
              }
            }}
            onMoreMenu={() => {
              // TODO: Open more menu
              console.log('Open more menu');
            }}
            connected={connected}
          />
        )}
      </div>

      {/* WebSocket Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && !isMobileView && (
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
