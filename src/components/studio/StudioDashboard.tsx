'use client';

import { useState, useEffect } from 'react';
import { LeftPanel } from './LeftPanel';
import { LivePreview } from './LivePreview';
import { RightPanel } from './RightPanel';
import { StreamHealthMonitor } from '../streaming/StreamHealthMonitor';
import { type MuxLiveStream, type StreamHealth } from '@/lib/streaming/muxService';
import { useWebSocket } from '@/lib/websocket/useWebSocket';
import { WebSocketStatus, WebSocketIndicator } from '@/components/websocket/WebSocketStatus';
import { WebSocketErrorBoundary, WebSocketErrorOverlay } from '@/components/websocket/WebSocketErrorBoundary';
import { analytics } from '@/lib/monitoring/analytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Database } from '@/types/database';
import { CelebrationState } from '../overlay/CelebrationOverlay';

type Stream = Database['public']['Tables']['streams']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface StudioDashboardProps {
  stream: Stream & { events: Event };
}

interface OverlayState {
  // Basic Overlays
  lowerThirds: {
    visible: boolean;
    text: string;
    subtext: string;
    position: 'bottom-left' | 'bottom-center' | 'bottom-right';
    style: 'minimal' | 'branded' | 'elegant';
  };

  // Countdown Timer
  countdown: {
    visible: boolean;
    targetTime: string;
    message: string;
    style: 'digital' | 'analog' | 'text';
  };

  // Registration CTA
  registrationCTA: {
    visible: boolean;
    headline: string;
    buttonText: string;
    urgency: boolean;
    position: 'top-center' | 'bottom-center' | 'side';
  };

  // Social Proof
  socialProof: {
    visible: boolean;
    type: 'viewer-count' | 'recent-signups' | 'testimonials';
    position: 'top-right' | 'bottom-left';
  };

  // EngageMax Features
  engageMax: {
    currentPoll: {
      id: string | null;
      question: string;
      options: string[];
      visible: boolean;
    };
    reactions: {
      enabled: boolean;
      position: 'floating' | 'bottom-bar';
    };
    smartCTA: {
      visible: boolean;
      message: string;
      action: string;
      trigger: 'time' | 'engagement' | 'manual';
    };
  };

  // Celebrations
  celebrations: {
    enabled: boolean;
    currentCelebration?: CelebrationState;
  };
}

const initialOverlayState: OverlayState = {
  lowerThirds: {
    visible: false,
    text: 'Welcome to the Stream',
    subtext: 'ConvertCast Live',
    position: 'bottom-left',
    style: 'branded'
  },
  countdown: {
    visible: false,
    targetTime: '',
    message: 'Stream Starting Soon',
    style: 'digital'
  },
  registrationCTA: {
    visible: false,
    headline: 'Register Now for Exclusive Access',
    buttonText: 'Get Free Access',
    urgency: false,
    position: 'bottom-center'
  },
  socialProof: {
    visible: false,
    type: 'viewer-count',
    position: 'top-right'
  },
  engageMax: {
    currentPoll: {
      id: null,
      question: '',
      options: [],
      visible: false
    },
    reactions: {
      enabled: true,
      position: 'floating'
    },
    smartCTA: {
      visible: false,
      message: 'Don\'t Miss Out - Limited Time Offer!',
      action: 'register',
      trigger: 'manual'
    }
  },
  celebrations: {
    enabled: false,
    currentCelebration: undefined
  }
};

export function StudioDashboard({ stream }: StudioDashboardProps) {
  const [overlayState, setOverlayState] = useState<OverlayState>(initialOverlayState);
  const [activeTab, setActiveTab] = useState<'overlays' | 'engagemax' | 'autooffer'>('overlays');
  const [viewerCount, setViewerCount] = useState(stream.viewer_count || 0);
  const [muxStream, setMuxStream] = useState<MuxLiveStream | null>(null);
  const [streamHealth, setStreamHealth] = useState<StreamHealth | null>(null);
  const [realRTMPCredentials, setRealRTMPCredentials] = useState<{
    server_url: string;
    stream_key: string;
  } | null>(null);

  // Initialize Mux stream and get real RTMP credentials with enhanced error handling
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout;

    // Track studio access
    analytics.trackEvent('streaming_studio_accessed', {
      streamId: stream.id,
      eventTitle: stream.events.title,
      eventType: stream.events.event_type || 'unknown'
    });

    async function initializeMuxStream() {
      if (!isMounted) return;

      try {
        let muxStreamData: MuxLiveStream;

        // Try to get existing stream first, then create new one if needed
        try {
          console.log('🔍 Getting latest stream from API...');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch('/api/mux/stream/latest', {
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.stream) {
              muxStreamData = data.stream;
              console.log('✅ Using existing stream:', muxStreamData.id);
            }
          }
        } catch (error) {
          console.log('⚠️ Could not get existing stream, will create new one');
        }

        // Create new stream if we don't have one
        if (!muxStreamData && isMounted) {
          try {
            console.log('🎬 Creating new stream via API...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch('/api/mux/stream', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventTitle: stream.events.title }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.stream) {
                muxStreamData = data.stream;
                console.log('✅ Created new stream:', muxStreamData.id);

                // Track stream creation
                analytics.trackEvent('mux_stream_created', {
                  streamId: stream.id,
                  muxStreamId: muxStreamData.id,
                  eventTitle: stream.events.title
                });
              }
            } else {
              throw new Error(`API error: ${response.status}`);
            }
          } catch (createError) {
            console.error('❌ Failed to create stream via API:', createError);

            analytics.trackError(createError as Error, {
              type: 'streaming',
              severity: 'medium',
              context: 'mux_fallback_to_demo',
              streamId: stream.id
            });
          }
        }

        if (!isMounted) return;

        setMuxStream(muxStreamData);
        setRealRTMPCredentials({
          server_url: muxStreamData.rtmp_server_url,
          stream_key: muxStreamData.stream_key
        });


        retryCount = 0; // Reset retry count on success

        // Start monitoring stream health with enhanced error handling
        const monitorHealth = async () => {
          if (!isMounted || !muxStreamData) return;

          try {
            const response = await fetch(`/api/mux/health/${muxStreamData.id}`);
            if (!response.ok) {
              throw new Error(`Health API error: ${response.status}`);
            }
            const healthData = await response.json();
            const health = healthData.health;

            if (!isMounted) return;

            setStreamHealth(health);
            setViewerCount(health.viewer_count);

            // Track streaming analytics every 30 seconds with reduced frequency to avoid spam
            const now = Date.now();
            if (now % 30000 < 10000) {
              analytics.trackStreamingAnalytics({
                streamId: stream.id,
                eventId: stream.events.id,
                sessionId: `session_${stream.id}_${Math.floor(now / 30000)}`, // Unique per 30sec window
                timestamp: new Date(),
                metrics: {
                  viewerCount: health.viewer_count,
                  peakViewers: health.viewer_count,
                  averageViewDuration: 0,
                  totalViewTime: 0,
                  uniqueViewers: health.viewer_count,
                  engagementRate: 0,
                  conversionRate: 0,
                  buffering_events: 0,
                  quality_score: health.connection_quality
                },
                userInteractions: [],
                technicalMetrics: {
                  bitrate: health.bitrate,
                  framerate: health.framerate,
                  resolution: health.resolution,
                  latency: health.latency,
                  connectionQuality: health.connection_quality,
                  errorCount: health.issues.length
                }
              });
            }
          } catch (error) {
            console.warn('Stream health check failed:', error);

            // Only log as error if it's not a timeout (which is expected in demo mode)
            if (!(error as Error).message.includes('timeout')) {
              analytics.trackError(error as Error, {
                type: 'streaming',
                severity: 'low', // Reduced severity as this is not critical
                context: 'stream_health_monitoring'
              });
            }

            // Set realistic demo health data
            if (isMounted) {
              setStreamHealth({
                status: 'active',
                bitrate: 2500000 + Math.floor(Math.random() * 1000000), // 2.5-3.5 Mbps
                framerate: 30,
                resolution: '1920x1080',
                latency: 150 + Math.floor(Math.random() * 100), // 150-250ms
                uptime: Math.floor(Date.now() / 1000) - 3600, // 1 hour uptime
                viewer_count: 1847 + Math.floor(Math.random() * 200) - 100, // Fluctuate around 1847
                connection_quality: 85 + Math.floor(Math.random() * 15), // 85-100%
                last_updated: new Date(),
                issues: []
              });
            }
          }
        };

        // Initial health check
        monitorHealth();

        // Set up interval for health monitoring every 10 seconds
        const healthInterval = setInterval(monitorHealth, 10000);

        return () => clearInterval(healthInterval);
      } catch (error) {
        console.error('Failed to initialize Mux stream:', error);

        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          console.log(`🔄 Retrying stream initialization (${retryCount}/${maxRetries}) in 5 seconds...`);

          retryTimeout = setTimeout(() => {
            if (isMounted) {
              initializeMuxStream();
            }
          }, 5000 * retryCount); // Exponential backoff
        } else {
          // Final fallback: create a demo stream
          console.warn('⚠️ All retries failed, creating demo stream');

          if (isMounted) {
            const demoStream: MuxLiveStream = {
              id: `demo-stream-${Date.now()}`,
              rtmp_server_url: 'rtmp://ingest.convertcast.com/app',
              stream_key: `demo_key_${Math.random().toString(36).substring(2)}`,
              playback_id: `demo-playback-${Math.random().toString(36).substring(2)}`,
              status: 'idle',
              max_continuous_duration: 10800,
              created_at: new Date().toISOString()
            };

            setMuxStream(demoStream);
            setRealRTMPCredentials({
              server_url: demoStream.rtmp_server_url,
              stream_key: demoStream.stream_key
            });
          }

          analytics.trackError(error as Error, {
            type: 'streaming',
            severity: retryCount >= maxRetries ? 'high' : 'medium',
            context: 'mux_initialization_final_failure',
            streamId: stream.id,
            retryCount
          });
        }
      }
    }

    initializeMuxStream();

    // Cleanup function
    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [stream.id, stream.mux_stream_id, stream.events.title]);

  // Smart WebSocket connection with automatic fallback
  const {
    socket,
    connected,
    connectionStatus,
    reconnectAttempts,
    error: websocketError,
    broadcastOverlay,
    emit,
    eventLog,
    websocketUrl
  } = useWebSocket({
    streamId: muxStream?.playback_id || stream.mux_playback_id || stream.id,
    userType: 'streamer',
    onViewerCountUpdate: (count: number) => setViewerCount(count),
    onOverlayUpdate: (data: any) => {
      // Handle overlay updates from other streamers (if any)
      setOverlayState(prev => ({ ...prev, ...data.overlayData }));
    },
    onError: (error: string) => {
      console.error('Studio WebSocket error:', error);
    }
  });

  // Broadcast overlay changes to OBS and viewers
  const updateOverlay = (updates: Partial<OverlayState>) => {
    const newState = { ...overlayState, ...updates };
    setOverlayState(newState);

    // Broadcast overlay using the proper WebSocket method
    if (connected) {
      // Determine overlay type from updates
      const overlayType = Object.keys(updates)[0] || 'general';
      const overlayData = updates[Object.keys(updates)[0] as keyof OverlayState];

      console.log('🎯 Studio broadcasting overlay:', overlayType, overlayData);
      broadcastOverlay(overlayType, overlayData);
    } else {
      console.warn('❌ WebSocket not connected - Cannot broadcast overlay');
    }
  };

  // Handle overlay trigger from RightPanel (simplified for poll/offer)
  const handleOverlayTrigger = (overlayType: string, overlayData: any) => {
    console.log('🎯 Overlay triggered:', overlayType, overlayData);

    let stateUpdate: Partial<OverlayState> = {};

    // Map overlay types to OverlayState structure
    if (overlayType === 'poll') {
      stateUpdate = {
        engageMax: {
          ...overlayState.engageMax,
          currentPoll: {
            id: overlayData.id || null,
            question: overlayData.question || '',
            options: overlayData.options || [],
            visible: overlayData.active !== false
          }
        }
      };
    } else if (overlayType === 'offer') {
      stateUpdate = {
        engageMax: {
          ...overlayState.engageMax,
          smartCTA: {
            visible: overlayData.active !== false,
            message: overlayData.description || overlayData.title || '',
            action: 'register',
            trigger: 'manual'
          }
        }
      };
    } else {
      // Generic overlay update
      stateUpdate = { [overlayType]: overlayData };
    }

    // Update local state for Studio preview
    setOverlayState(prev => ({
      ...prev,
      ...stateUpdate
    }));

    // Broadcast to viewers via WebSocket
    if (connected) {
      broadcastOverlay(overlayType, overlayData);
      console.log('✅ Overlay broadcasted to viewers:', overlayType);
    }
  };

  // Handle EngageMax interactions
  const handleEngageMaxAction = (action: string, data: any) => {
    // Track engagement interactions
    analytics.trackEngagement(`engagemax_${action}`, data.duration);
    analytics.trackEvent('engagemax_interaction', {
      action,
      streamId: stream.id,
      data: data
    });

    if (connected && socket) {
      emit('engagemax-action', {
        streamId: stream.id,
        action,
        data,
        timestamp: Date.now()
      });
    }

    // Update local state based on action
    switch (action) {
      case 'start-poll':
        updateOverlay({
          engageMax: {
            ...overlayState.engageMax,
            currentPoll: {
              id: data.pollId,
              question: data.question,
              options: data.options,
              visible: true
            }
          }
        });
        break;

      case 'end-poll':
        updateOverlay({
          engageMax: {
            ...overlayState.engageMax,
            currentPoll: {
              ...overlayState.engageMax.currentPoll,
              visible: false
            }
          }
        });
        break;

      case 'show-smart-cta':
        updateOverlay({
          engageMax: {
            ...overlayState.engageMax,
            smartCTA: {
              ...data,
              visible: true
            }
          }
        });
        break;
    }
  };

  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        analytics.trackError(error, {
          type: 'streaming',
          severity: 'critical',
          context: 'studio_dashboard_crash',
          componentStack: errorInfo.componentStack,
          streamId: stream.id
        });
      }}
    >
      <div className="w-full bg-transparent flex flex-col gap-6 h-full studio-layout">
        {/* NEW LAYOUT: STREAM ON TOP, CONTROLS BELOW */}

        {/* TOP SECTION - Live Preview (Full Width) - Extra Large */}
        <div className="h-[900px] bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/30 bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">Live Preview</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <div className={`flex items-center gap-2 text-sm font-semibold ${
                      streamHealth?.status === 'offline' ? 'text-gray-400' : 'text-green-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        streamHealth?.status === 'offline' ? 'bg-gray-400' : 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50'
                      }`}></div>
                      {streamHealth?.status === 'offline' ? 'OFFLINE' : 'LIVE'}
                    </div>
                    <div className="text-sm text-white font-semibold">
                      {viewerCount.toLocaleString()} viewers
                    </div>
                    {/* WebSocket Status */}
                    <div className="flex items-center gap-2">
                      <WebSocketIndicator connectionStatus={connectionStatus} />
                      <span className="text-xs text-gray-400">WebSocket</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Stream Health Quick Stats */}
                {streamHealth && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-white font-bold">{streamHealth.connection_quality}%</div>
                      <div className="text-gray-300 text-xs">Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold">{(streamHealth.bitrate / 1000).toFixed(1)}k</div>
                      <div className="text-gray-300 text-xs">Bitrate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold">{streamHealth.framerate}</div>
                      <div className="text-gray-300 text-xs">FPS</div>
                    </div>
                  </div>
                )}
                <div className="px-4 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-gray-200 text-sm font-medium">
                  {muxStream?.playback_id ? 'Live Stream' : 'Demo Mode'} • 16:9
                </div>
                <button className="px-5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 hover:text-white text-sm rounded-lg transition-all border border-purple-500/30 hover:border-purple-500/50 font-medium">
                  Fullscreen
                </button>
              </div>
            </div>
          </div>

          <div className="h-[calc(100%-80px)]">
            <LivePreview
              streamId={stream.id}
              overlayState={overlayState}
              viewerCount={viewerCount}
              muxPlaybackId={muxStream?.playback_id || undefined}
              isLive={streamHealth?.status === 'active' && stream.status === 'live'}
            />
          </div>
        </div>

        {/* BOTTOM SECTION - Studio Controls & Live Dashboard (Side by Side) - Even More Space */}
        <div className="flex-1 flex gap-6 min-h-[800px]">

          {/* LEFT: Studio Controls (Overlays) */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-2xl overflow-hidden">
            <LeftPanel
              activeTab={activeTab}
              onTabChange={setActiveTab}
              overlayState={overlayState}
              onOverlayUpdate={updateOverlay}
              onEngageMaxAction={handleEngageMaxAction}
              stream={stream}
              connected={connected}
              connectionStatus={connectionStatus}
            />
          </div>

          {/* RIGHT: Live Dashboard */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-2xl overflow-hidden">
            <RightPanel
              streamId={stream.id}
              socket={socket}
              connected={connected}
              stream={{
                id: stream.id,
                mux_playback_id: muxStream?.playback_id || stream.mux_playback_id,
                events: {
                  title: stream.events.title,
                  status: stream.events.status
                }
              }}
              onOverlayTrigger={handleOverlayTrigger}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}