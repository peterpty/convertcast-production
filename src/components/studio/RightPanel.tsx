'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { Socket } from 'socket.io-client';
import { Lock, Unlock, Pin, PinOff, Reply } from 'lucide-react';
import { ChatService } from '@/lib/supabase/chatService';
import { HotLeadPanel } from '@/components/ai/HotLeadPanel';
import { AILiveChat } from '@/components/ai/AILiveChat';
import { AutoOfferPanel } from '@/components/ai/AutoOfferPanel';
import { InsightDashboard } from '@/components/ai/InsightDashboard';
import { SmartScheduler } from '@/components/ai/SmartScheduler';
import { aiSuiteManager } from '@/lib/ai/aiSuiteManager';
import { ViewerProfile } from '@/lib/ai/scoringEngine';
import { RealTimeSuggestion, ScheduleRecommendation } from '@/lib/ai/insightEngine';
import { APP_URL } from '@/constants/app';
import { StreamCredentialsCard } from './StreamCredentialsCard';

interface ChatMessage {
  id: string;
  viewer_name: string;
  message: string;
  timestamp: string;
  is_synthetic?: boolean;
  is_private?: boolean;
  sender_id?: string;
  reply_to_user_id?: string;
  reply_to_message_id?: string;
  status?: 'active' | 'removed' | 'deleted' | 'pinned' | 'synthetic';
  intent_signals?: {
    buying_intent: number;
    engagement_score: number;
    sentiment: string;
  };
}

interface HotLead {
  id: string;
  name: string;
  email: string;
  intent_score: number;
  engagement_time: number;
  interactions: number;
  last_activity: string;
  signals: string[];
}

interface RightPanelProps {
  streamId: string;
  socket: Socket | null;
  connected: boolean;
  stream?: {
    id: string;
    mux_playback_id?: string | null;
    stream_key?: string | null;
    rtmp_server_url?: string | null;
    events?: {
      title: string;
      status: string;
    };
  };
  onOverlayTrigger?: (overlayType: string, overlayData: any) => void;
  onRefreshStreamKey?: () => Promise<void>;
  isRefreshingKey?: boolean;
}

function RightPanelComponent({ streamId, socket, connected, stream, onOverlayTrigger, onRefreshStreamKey, isRefreshingKey = false }: RightPanelProps) {
  // Debug: Log stream prop
  console.log('🎛️ RightPanel stream prop:', {
    streamId,
    hasStream: !!stream,
    stream_key: stream?.stream_key ? stream.stream_key.substring(0, 8) + '...' : 'NULL',
    rtmp_server_url: stream?.rtmp_server_url || 'NULL'
  });
  const [activeTab, setActiveTab] = useState<'streaminfo' | 'chat' | 'hotleads' | 'analytics' | 'aichat' | 'offers' | 'insights' | 'scheduler'>('streaminfo');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [viewers, setViewers] = useState<ViewerProfile[]>([]);
  const [streamMetrics, setStreamMetrics] = useState<any>({});
  const [newMessage, setNewMessage] = useState('');
  const [isPrivateMessage, setIsPrivateMessage] = useState(false);
  const [replyContext, setReplyContext] = useState<{ userId: string; username: string; messageId: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize AI Suite and mock data
  useEffect(() => {
    // Initialize AI Suite Manager
    aiSuiteManager.updateConfig({
      hotLeadScoring: { enabled: true, threshold: 60, updateInterval: 3000 },
      autoOffers: { enabled: true, autoExecute: true, confidenceThreshold: 0.8 },
      syntheticChat: { enabled: true, frequency: 3, testimonials: true, trustBuilding: true }
    });

    // Generate mock viewer data with realistic AI scoring
    const mockViewers: ViewerProfile[] = [
      {
        id: '1',
        name: 'Lisa R.',
        email: 'lisa.r@example.com',
        timezone: 'US/Eastern',
        intentScore: 92,
        engagementTime: 1847,
        interactions: 12,
        lastActivity: 'Asked about advanced features',
        signals: ['High engagement', 'Feature inquiry', 'Extended viewing time', 'Multiple CTAs'],
        behaviorMetrics: {
          timeOnPage: 1847,
          scrollDepth: 0.95,
          clicksToCTA: 4,
          formEngagement: 0.8,
          chatParticipation: 8,
          pollVotes: 3,
          reactionCount: 15,
          purchaseHistory: 1,
          emailEngagement: 0.7,
          deviceType: 'desktop',
          trafficSource: 'email',
          returningVisitor: true,
          geolocation: 'US-NY'
        },
        aiPredictions: {
          conversionProbability: 0.89,
          lifetimeValue: 2450,
          optimalOfferTiming: 1200,
          preferredCommunication: 'email',
          pricesensitivity: 'low',
          decisionMakingSpeed: 'fast'
        }
      },
      {
        id: '2',
        name: 'David Chen',
        email: 'david.chen@company.com',
        timezone: 'US/Pacific',
        intentScore: 88,
        engagementTime: 1623,
        interactions: 8,
        lastActivity: 'Clicked CTA button',
        signals: ['CTA interaction', 'Return viewer', 'Business email', 'High engagement'],
        behaviorMetrics: {
          timeOnPage: 1623,
          scrollDepth: 0.87,
          clicksToCTA: 3,
          formEngagement: 0.6,
          chatParticipation: 5,
          pollVotes: 2,
          reactionCount: 8,
          purchaseHistory: 0,
          emailEngagement: 0.8,
          deviceType: 'desktop',
          trafficSource: 'direct',
          returningVisitor: true,
          geolocation: 'US-CA'
        },
        aiPredictions: {
          conversionProbability: 0.82,
          lifetimeValue: 1850,
          optimalOfferTiming: 900,
          preferredCommunication: 'email',
          pricesensitivity: 'medium',
          decisionMakingSpeed: 'medium'
        }
      },
      {
        id: '3',
        name: 'Sarah M.',
        email: 'sarah.m@startup.io',
        timezone: 'US/Eastern',
        intentScore: 85,
        engagementTime: 1456,
        interactions: 15,
        lastActivity: 'Positive feedback',
        signals: ['Startup domain', 'High praise', 'Multiple reactions', 'Active chat'],
        behaviorMetrics: {
          timeOnPage: 1456,
          scrollDepth: 0.92,
          clicksToCTA: 2,
          formEngagement: 0.9,
          chatParticipation: 12,
          pollVotes: 4,
          reactionCount: 18,
          purchaseHistory: 0,
          emailEngagement: 0.6,
          deviceType: 'mobile',
          trafficSource: 'social',
          returningVisitor: false,
          geolocation: 'US-NY'
        },
        aiPredictions: {
          conversionProbability: 0.76,
          lifetimeValue: 1200,
          optimalOfferTiming: 1800,
          preferredCommunication: 'sms',
          pricesensitivity: 'high',
          decisionMakingSpeed: 'fast'
        }
      },
      {
        id: '4',
        name: 'Michael Torres',
        email: 'michael.t@tech.com',
        timezone: 'US/Central',
        intentScore: 78,
        engagementTime: 1234,
        interactions: 6,
        lastActivity: 'Scrolled to pricing',
        signals: ['Pricing interest', 'Tech domain', 'Good engagement'],
        behaviorMetrics: {
          timeOnPage: 1234,
          scrollDepth: 0.75,
          clicksToCTA: 1,
          formEngagement: 0.4,
          chatParticipation: 3,
          pollVotes: 1,
          reactionCount: 6,
          purchaseHistory: 0,
          emailEngagement: 0.5,
          deviceType: 'desktop',
          trafficSource: 'organic',
          returningVisitor: false,
          geolocation: 'US-TX'
        },
        aiPredictions: {
          conversionProbability: 0.68,
          lifetimeValue: 980,
          optimalOfferTiming: 1500,
          preferredCommunication: 'email',
          pricesensitivity: 'medium',
          decisionMakingSpeed: 'slow'
        }
      }
    ];

    setViewers(mockViewers);
    aiSuiteManager.updateViewers(mockViewers);

    // Initialize stream metrics
    setStreamMetrics({
      startTime: new Date(),
      totalRevenue: 0,
      conversions: 0,
      avgEngagement: 0.75,
      totalViewers: mockViewers.length
    });

    // Initialize chat messages (empty - will load from Supabase)
    // Messages will be loaded via chat history and Supabase Realtime subscription

    // Legacy hot leads for compatibility
    setHotLeads([
      {
        id: '1',
        name: 'Lisa R.',
        email: 'lisa.r@example.com',
        intent_score: 92,
        engagement_time: 1847,
        interactions: 12,
        last_activity: 'Asked about advanced features',
        signals: ['High engagement', 'Feature inquiry', 'Extended viewing time']
      },
      {
        id: '2',
        name: 'David Chen',
        email: 'david.chen@company.com',
        intent_score: 88,
        engagement_time: 1623,
        interactions: 8,
        last_activity: 'Clicked CTA button',
        signals: ['CTA interaction', 'Return viewer', 'Business email']
      }
    ]);

    // Set up AI event listeners
    aiSuiteManager.onEvent('offer-triggered', (event) => {
      console.log('🎯 Auto-offer triggered:', event.data);
    });

    aiSuiteManager.onEvent('suggestion-generated', (event) => {
      console.log('💡 AI suggestion:', event.data.suggestion);
    });
  }, []);

  // Load chat history from Supabase
  useEffect(() => {
    async function loadChatHistory() {
      if (!streamId) return;

      console.log('📜 Streamer: Loading chat history...');
      // Pass null for currentUserId and isHost=true so host sees ALL messages (public + all private)
      const messages = await ChatService.getMessages(streamId, 50, null, true);

      if (messages.length > 0) {
        console.log(`✅ Streamer: Loaded ${messages.length} messages`);
        const formatted = messages.map(msg => ({
          id: msg.id,
          viewer_name: msg.viewer_profiles?.first_name || 'Anonymous',
          message: msg.message,
          timestamp: msg.created_at,
          is_synthetic: msg.is_synthetic,
          is_private: msg.is_private,
          sender_id: msg.sender_id,
          status: msg.status,
          intent_signals: msg.intent_signals
        }));
        setMessages(formatted);
      }
    }

    loadChatHistory();
  }, [streamId]);

  // Subscribe to Supabase Realtime (fallback/redundancy)
  useEffect(() => {
    if (!streamId) return;

    console.log('📡 Streamer: Setting up Supabase Realtime subscription...');
    const unsubscribe = ChatService.subscribeToMessages(streamId, (message) => {
      console.log('📨 Streamer: New message from Supabase Realtime');

      const formatted: ChatMessage = {
        id: message.id,
        viewer_name: message.viewer_profiles?.first_name || 'Anonymous',
        message: message.message,
        timestamp: message.created_at,
        is_synthetic: message.is_synthetic,
        is_private: message.is_private,
        sender_id: message.sender_id,
        status: message.status,
        intent_signals: message.intent_signals
      };

      // Add if not duplicate
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, formatted];
      });
    });

    return () => {
      console.log('🔌 Streamer: Unsubscribing from Supabase Realtime');
      unsubscribe();
    };
  }, [streamId]);

  // Listen for new messages from WebSocket
  useEffect(() => {
    if (socket && connected) {
      socket.on('chat-message', (message: any) => {
        // Transform WebSocket message format to ChatMessage format
        const chatMessage: ChatMessage = {
          id: message.messageId || Date.now().toString(),
          viewer_name: message.username || 'Anonymous',
          message: message.message,
          timestamp: message.timestamp,
          is_synthetic: false,
          is_private: message.isPrivate || false,
          sender_id: message.userId,
          intent_signals: message.intent_signals
        };

        setMessages(prev => [...prev, chatMessage]);

        // Check if this is a hot lead
        if (chatMessage.intent_signals && chatMessage.intent_signals.buying_intent > 0.8) {
          // Add to hot leads if not already there
          setHotLeads(prev => {
            const exists = prev.some(lead => lead.email === `${chatMessage.viewer_name.toLowerCase().replace(' ', '.')}@example.com`);
            if (!exists) {
              const newLead: HotLead = {
                id: Date.now().toString(),
                name: chatMessage.viewer_name,
                email: `${chatMessage.viewer_name.toLowerCase().replace(' ', '.')}@example.com`,
                intent_score: Math.round(chatMessage.intent_signals!.buying_intent * 100),
                engagement_time: Math.round(Math.random() * 2000 + 500),
                interactions: Math.round(Math.random() * 20 + 1),
                last_activity: 'Recent chat activity',
                signals: ['High buying intent', 'Active chat participant']
              };
              return [newLead, ...prev].slice(0, 10); // Keep top 10
            }
            return prev;
          });
        }
      });

      return () => {
        socket.off('chat-message');
      };
    }
  }, [socket, connected]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Save message to database (Supabase Realtime will broadcast to all viewers)
    await ChatService.saveMessage(
      streamId,
      newMessage.trim(),
      'Streamer', // username
      null, // viewer_profile_id
      false, // is_synthetic
      null, // intent_signals
      isPrivateMessage || !!replyContext, // is_private (private if explicitly set OR replying)
      'streamer', // sender_id
      replyContext?.userId || null, // reply_to_user_id
      replyContext?.messageId || null // reply_to_message_id
    );

    setNewMessage('');
    setIsPrivateMessage(false); // Reset to public after sending
    setReplyContext(null); // Clear reply context
  };

  // Pin/unpin message handler
  const handlePinMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const isPinned = message.status === 'pinned';

    if (isPinned) {
      // Unpin message - set status back to active
      const success = await ChatService.unpinMessage(messageId);
      if (success) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, status: 'active' } : m
        ));
        console.log('✅ Message unpinned');
      }
    } else {
      // Pin message - first unpin any currently pinned message (only one can be pinned)
      const currentlyPinned = messages.find(m => m.status === 'pinned');
      if (currentlyPinned) {
        await ChatService.unpinMessage(currentlyPinned.id);
        setMessages(prev => prev.map(m =>
          m.id === currentlyPinned.id ? { ...m, status: 'active' } : m
        ));
      }

      // Now pin the selected message
      const success = await ChatService.pinMessage(messageId);
      if (success) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, status: 'pinned' } : m
        ));
        console.log('✅ Message pinned');
      }
    }
  };

  // Reply privately handler
  const handleReplyPrivately = (message: ChatMessage) => {
    if (!message.sender_id) return;

    setReplyContext({
      userId: message.sender_id,
      username: message.viewer_name,
      messageId: message.id
    });
    setIsPrivateMessage(true); // Ensure it's marked as private

    // Focus input field (the ref will be added when we modify the input)
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder*="message"]');
      input?.focus();
    }, 100);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  const getIntentColor = (score: number) => {
    if (score >= 90) return 'text-red-400'; // JACKPOT
    if (score >= 75) return 'text-orange-400'; // HOT
    if (score >= 60) return 'text-yellow-400'; // WARM
    return 'text-blue-400'; // COLD
  };

  const getIntentLabel = (score: number) => {
    if (score >= 90) return 'JACKPOT';
    if (score >= 75) return 'HOT LEAD';
    if (score >= 60) return 'WARM';
    return 'COLD';
  };

  // AI event handlers
  const handleTriggerOverlay = (action: string, data: any) => {
    console.log('🎭 Triggering overlay:', action, data);

    let overlayType = '';
    let overlayData: any = {};

    switch (action) {
      case 'show-auto-offer':
        overlayType = 'offer';
        overlayData = {
          id: data.trigger.id,
          title: data.template.name,
          description: data.template.headline,
          originalPrice: data.template.pricing.originalPrice,
          discountPrice: data.template.pricing.offerPrice,
          discount: Math.round((1 - data.template.pricing.offerPrice / data.template.pricing.originalPrice) * 100),
          timeLeft: 900, // 15 minutes
          active: true
        };
        break;

      case 'show-poll':
        overlayType = 'poll';
        overlayData = data.poll;
        break;

      case 'hide-poll':
        overlayType = 'poll';
        overlayData = { active: false };
        break;

      case 'hide-offer':
        overlayType = 'offer';
        overlayData = { active: false };
        break;
    }

    // Update local Studio preview via callback
    if (onOverlayTrigger) {
      onOverlayTrigger(overlayType, overlayData);
    }

    // Broadcast overlay to all viewers via WebSocket using correct event name
    if (socket && connected) {
      socket.emit('broadcast-overlay', {
        streamId,
        overlayType,
        overlayData,
        timestamp: new Date().toISOString()
      });

      console.log('📡 Studio: Broadcasting overlay:', overlayType, overlayData);
    } else {
      console.log('⚠️ Studio: Socket not connected, cannot broadcast overlay');
    }
  };

  const handleExecuteSuggestion = (suggestion: RealTimeSuggestion) => {
    console.log('⚡ Executing AI suggestion:', suggestion);
    aiSuiteManager.executeSuggestion(suggestion.id);
  };

  const handleScheduleStream = (recommendation: ScheduleRecommendation) => {
    console.log('📅 Scheduling stream:', recommendation);
    // In a real implementation, this would integrate with the scheduling system
  };

  const tabs = [
    { id: 'streaminfo' as const, name: 'Stream Info', icon: '📺', count: null },
    { id: 'chat' as const, name: 'Legacy Chat', icon: '💬', count: messages.length },
    { id: 'aichat' as const, name: 'AI Chat', icon: '🤖', count: null },
    { id: 'offers' as const, name: 'AutoOffer™', icon: '💰', count: null },
    { id: 'hotleads' as const, name: 'Hot Leads', icon: '🎯', count: viewers.filter(v => v.intentScore >= 75).length },
    { id: 'insights' as const, name: 'Insights™', icon: '🧠', count: null },
    { id: 'scheduler' as const, name: 'Scheduler™', icon: '📅', count: null },
    { id: 'analytics' as const, name: 'Analytics', icon: '📈', count: null }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Connection Status */}
      <div className="p-5 border-b border-slate-700/30 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Live Dashboard</h2>
          <div className={`flex items-center text-sm font-medium ${
            connected ? 'text-green-400' : 'text-yellow-400'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full mr-3 ${
              connected ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50'
            }`}></div>
            {connected ? 'Real-time Connected' : 'Waiting for Stream'}
          </div>
        </div>
      </div>

      {/* Tab Navigation - Scrollable */}
      <div className="border-b border-slate-700/30 bg-slate-800/20 overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center px-4 py-3 text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-purple-300 border-b-2 border-purple-400 bg-slate-800/50'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.count !== null && (
                  <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full min-w-[18px] h-5 flex items-center justify-center font-bold">
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content - Enhanced Scrolling */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stream Info Panel */}
        {activeTab === 'streaminfo' && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Stream Status Card */}
              <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">📺</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Stream Information</h3>
                    <p className="text-purple-300 text-sm">Manage your stream settings and viewer access</p>
                  </div>
                </div>
              </div>

              {/* Stream Title */}
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
                <div className="text-gray-400 text-sm font-medium mb-2">Stream Title</div>
                <div className="text-white text-lg font-semibold">
                  {stream?.events?.title || 'Live: How to 10x Your Webinar Conversions'}
                </div>
              </div>

              {/* OBS Connection Settings - Stream Credentials */}
              <StreamCredentialsCard
                streamKey={stream?.stream_key || null}
                rtmpServerUrl={stream?.rtmp_server_url || null}
                streamId={streamId}
                onRefreshKey={onRefreshStreamKey}
                isRefreshing={isRefreshingKey}
              />

              {/* Viewer URL Section */}
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-gray-400 text-sm font-medium">Viewer URL</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs font-semibold">LIVE</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-600/50 rounded-xl p-3 mb-3">
                  <div className="text-white font-mono text-sm break-all">
                    {`${typeof window !== 'undefined' ? window.location.origin : 'https://convertcast.com'}/watch/${stream?.mux_playback_id || stream?.id || 'mux_playback_67890'}`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const url = `${typeof window !== 'undefined' ? window.location.origin : APP_URL}/watch/${stream?.mux_playback_id || stream?.id || 'mux_playback_67890'}`;
                      navigator.clipboard.writeText(url).then(() => {
                        // You could add a toast notification here
                        console.log('URL copied to clipboard');
                      });
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 hover:text-white rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    <span>📋</span>
                    Copy URL
                  </button>

                  <button
                    onClick={() => {
                      const streamIdToUse = stream?.mux_playback_id || stream?.id || 'mux_playback_67890';
                      const url = `/watch/${streamIdToUse}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 hover:border-orange-500/50 text-orange-200 hover:text-white rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    <span>👁️</span>
                    Test View
                  </button>
                </div>

                <div className="mt-3 p-2 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-300 text-xs leading-relaxed">
                    <strong>💡 Pro Tip:</strong> Share this URL with your audience or test the viewer experience yourself.
                    The URL automatically updates when you start/stop your stream.
                  </p>
                </div>
              </div>

              {/* Stream Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
                  <div className="text-gray-400 text-sm font-medium mb-2">Stream ID</div>
                  <div className="text-white font-mono text-sm">
                    {stream?.id?.substring(0, 8) || 'demo-str'}...
                  </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
                  <div className="text-gray-400 text-sm font-medium mb-2">Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-semibold">
                      {stream?.events?.status?.toUpperCase() || 'LIVE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
                <div className="text-gray-400 text-sm font-medium mb-3">Quick Actions</div>
                <div className="grid grid-cols-1 gap-2">
                  <button className="flex items-center gap-3 px-3 py-2 bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 hover:border-slate-600 text-gray-200 hover:text-white rounded-lg text-sm transition-all duration-200">
                    <span>📊</span>
                    <span>View Analytics</span>
                  </button>

                  <button className="flex items-center gap-3 px-3 py-2 bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 hover:border-slate-600 text-gray-200 hover:text-white rounded-lg text-sm transition-all duration-200">
                    <span>⚙️</span>
                    <span>Stream Settings</span>
                  </button>

                  <button className="flex items-center gap-3 px-3 py-2 bg-slate-700/40 hover:bg-slate-700 border border-slate-600/40 hover:border-slate-600 text-gray-200 hover:text-white rounded-lg text-sm transition-all duration-200">
                    <span>🔗</span>
                    <span>Share Stream</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* AI Hot Leads Panel */}
        {activeTab === 'hotleads' && (
          <div className="flex-1 overflow-hidden">
            <HotLeadPanel
              viewers={viewers}
              onTriggerOverlay={handleTriggerOverlay}
            />
          </div>
        )}

        {/* AI Live Chat */}
        {activeTab === 'aichat' && (
          <div className="flex-1 overflow-hidden">
            <AILiveChat
              viewers={viewers}
              onTriggerOverlay={handleTriggerOverlay}
              streamId={streamId}
              socket={socket}
              connected={connected}
            />
          </div>
        )}

        {/* AutoOffer Panel */}
        {activeTab === 'offers' && (
          <div className="flex-1 overflow-hidden">
            <AutoOfferPanel
              viewers={viewers}
              onTriggerOverlay={handleTriggerOverlay}
            />
          </div>
        )}

        {/* Insight Dashboard */}
        {activeTab === 'insights' && (
          <div className="flex-1 overflow-hidden">
            <InsightDashboard
              viewers={viewers}
              streamMetrics={streamMetrics}
              onExecuteSuggestion={handleExecuteSuggestion}
            />
          </div>
        )}

        {/* Smart Scheduler */}
        {activeTab === 'scheduler' && (
          <div className="flex-1 overflow-hidden">
            <SmartScheduler
              onScheduleStream={handleScheduleStream}
            />
          </div>
        )}

        {/* Live Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-3 ${
                    message.is_private
                      ? 'bg-purple-900/40 border border-purple-500/40'
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {message.is_private && (
                        <Lock className="w-3 h-3 text-purple-400" />
                      )}
                      <span className="text-white font-medium text-sm">
                        {message.viewer_name}
                      </span>
                      {message.is_private && (
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                          Private
                        </span>
                      )}
                      {message.status === 'pinned' && (
                        <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}
                      {message.intent_signals && message.intent_signals.buying_intent > 0.8 && (
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          🔥 HOT
                        </span>
                      )}
                      {message.is_synthetic && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Reply Privately button - only show for viewer messages (not host messages) */}
                      {message.sender_id && message.sender_id !== 'streamer' && (
                        <button
                          onClick={() => handleReplyPrivately(message)}
                          className="p-1 rounded hover:bg-purple-700 bg-purple-600/50 transition-colors text-purple-300"
                          title="Reply privately to this viewer"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handlePinMessage(message.id)}
                        className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                          message.status === 'pinned' ? 'text-yellow-400' : 'text-gray-400'
                        }`}
                        title={message.status === 'pinned' ? 'Unpin message' : 'Pin message to stream'}
                      >
                        {message.status === 'pinned' ? (
                          <PinOff className="w-4 h-4" />
                        ) : (
                          <Pin className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-gray-400 text-xs">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-200 text-sm">{message.message}</p>
                  
                  {message.intent_signals && (
                    <div className="mt-2 flex space-x-2 text-xs">
                      <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                        Intent: {Math.round(message.intent_signals.buying_intent * 100)}%
                      </span>
                      <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded">
                        Engagement: {Math.round(message.intent_signals.engagement_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="p-3 border-t border-gray-700">
              {/* Private Message Toggle */}
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsPrivateMessage(!isPrivateMessage)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    isPrivateMessage
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:text-purple-300'
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
                {isPrivateMessage && !replyContext && (
                  <span className="text-xs text-purple-300">
                    Only visible to specific viewer
                  </span>
                )}
              </div>

              {/* Reply Context Indicator */}
              {replyContext && (
                <div className="mb-2 flex items-center justify-between bg-purple-900/30 border border-purple-500/30 rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Reply className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-purple-300">
                      Replying privately to <span className="font-semibold">{replyContext.username}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setReplyContext(null);
                      setIsPrivateMessage(false);
                    }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isPrivateMessage ? "Send private message..." : "Send a message to viewers..."}
                  className={`flex-1 px-3 py-2 bg-gray-700 border ${
                    isPrivateMessage ? 'border-purple-500' : 'border-gray-600'
                  } rounded text-white text-sm focus:outline-none focus:border-purple-500`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !connected}
                  className={`px-3 py-2 ${
                    isPrivateMessage
                      ? 'bg-purple-700 hover:bg-purple-800'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Hot Leads (Legacy - Remove if HotLeadPanel is working) */}
        {activeTab === 'hotleads_legacy' && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-3 text-white">
              <div className="font-bold text-sm mb-1">🔥 AI Hot Leads Engine</div>
              <div className="text-xs opacity-90">
                AI-powered lead scoring identifies your highest-intent viewers in real-time
              </div>
            </div>

            <div className="space-y-3">
              {hotLeads.map((lead) => (
                <div key={lead.id} className="bg-gray-800 rounded-lg p-3 border-l-4 border-red-400">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium text-sm">{lead.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        lead.intent_score >= 90 ? 'bg-red-600 text-white' :
                        lead.intent_score >= 75 ? 'bg-orange-600 text-white' :
                        'bg-yellow-600 text-black'
                      }`}>
                        {getIntentLabel(lead.intent_score)}
                      </span>
                    </div>
                    <span className={`font-bold text-sm ${getIntentColor(lead.intent_score)}`}>
                      {lead.intent_score}%
                    </span>
                  </div>
                  
                  <div className="text-gray-400 text-xs mb-2">{lead.email}</div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-gray-400">Time: </span>
                      <span className="text-white">{formatDuration(lead.engagement_time)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Interactions: </span>
                      <span className="text-white">{lead.interactions}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-300 mb-2">
                    <strong>Last Activity:</strong> {lead.last_activity}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {lead.signals.map((signal, index) => (
                      <span key={index} className="bg-purple-600/20 text-purple-400 text-xs px-2 py-1 rounded">
                        {signal}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded">
                      📧 Send Offer
                    </button>
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded">
                      📞 Follow Up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-3 text-white">
                <div className="font-bold mb-1">📈 Real-time Analytics</div>
                <div className="text-sm opacity-90">Live engagement and conversion metrics</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Active Viewers</div>
                  <div className="text-white text-xl font-bold">1,247</div>
                  <div className="text-green-400 text-xs">+12% from avg</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Engagement Rate</div>
                  <div className="text-white text-xl font-bold">87.3%</div>
                  <div className="text-green-400 text-xs">Excellent</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Hot Leads</div>
                  <div className="text-white text-xl font-bold">{hotLeads.length}</div>
                  <div className="text-orange-400 text-xs">High intent</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Conversion Rate</div>
                  <div className="text-white text-xl font-bold">23.1%</div>
                  <div className="text-purple-400 text-xs">Above target</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3">
                <h4 className="text-white font-medium mb-3 text-sm">Top Engagement Actions</h4>
                <div className="space-y-2">
                  {[
                    { action: 'Poll Participation', count: 423, percentage: 34 },
                    { action: 'Chat Messages', count: 187, percentage: 15 },
                    { action: 'Emoji Reactions', count: 891, percentage: 71 },
                    { action: 'CTA Clicks', count: 156, percentage: 13 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs">{item.action}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-xs font-medium">{item.count}</span>
                        <span className="text-purple-400 text-xs">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const RightPanel = memo(RightPanelComponent);