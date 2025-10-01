'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Users, Maximize, Settings, Eye, EyeOff } from 'lucide-react';
import Hls from 'hls.js';
import { OverlayRenderer } from '@/components/overlay/OverlayRenderer';

interface OverlayState {
  lowerThirds: {
    visible: boolean;
    text: string;
    subtext: string;
    position: 'bottom-left' | 'bottom-center' | 'bottom-right';
    style: 'minimal' | 'branded' | 'elegant';
  };
  countdown: {
    visible: boolean;
    targetTime: string;
    message: string;
    style: 'digital' | 'analog' | 'text';
  };
  registrationCTA: {
    visible: boolean;
    headline: string;
    buttonText: string;
    urgency: boolean;
    position: 'top-center' | 'bottom-center' | 'side';
  };
  socialProof: {
    visible: boolean;
    type: 'viewer-count' | 'recent-signups' | 'testimonials';
    position: 'top-right' | 'bottom-left';
  };
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
}

interface LivePreviewProps {
  streamId: string;
  overlayState: OverlayState;
  viewerCount: number;
  muxPlaybackId?: string;
  isLive?: boolean;
}

export function LivePreview({ streamId, overlayState, viewerCount, muxPlaybackId, isLive = false }: LivePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scale, setScale] = useState(1);
  const [showOverlays, setShowOverlays] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Handle window resize for responsive scaling
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth - 32;
        const containerHeight = container.clientHeight - 32;

        const scaleX = containerWidth / 1920; // Base 1920 width
        const scaleY = containerHeight / 1080; // Base 1080 height
        const newScale = Math.min(scaleX, scaleY, 1);

        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // HLS Stream Management
  useEffect(() => {
    if (!muxPlaybackId || !videoRef.current) {
      // Clean up existing HLS instance if playback ID is removed
      if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
      }
      return;
    }

    const video = videoRef.current;
    const url = `https://stream.mux.com/${muxPlaybackId}.m3u8`;
    setStreamUrl(url);

    console.log('🎬 Initializing HLS player for stream:', muxPlaybackId);
    console.log('📡 Stream URL:', url);

    // Initialize HLS if supported
    if (Hls.isSupported()) {
      // Clean up previous instance
      if (hlsInstance) {
        hlsInstance.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1, // Auto quality
        capLevelToPlayerSize: true,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 5,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        debug: process.env.NODE_ENV === 'development'
      });

      // HLS Event Handlers
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('✅ HLS: Media attached');
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('✅ HLS: Manifest parsed', data);
        setVideoError(null);
        setVideoReady(true);
        setRetryAttempts(0);
        setIsRetrying(false);
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        console.log('✅ HLS: Level loaded', data.details);
      });

      hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        console.log('✅ HLS: Fragment loaded', data.frag.url);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 HLS: Attempting to recover network error');
              setVideoError('Network error - retrying...');

              // Retry logic for network errors
              if (retryAttempts < 3) {
                setIsRetrying(true);
                setTimeout(() => {
                  hls.startLoad();
                  setRetryAttempts(prev => prev + 1);
                }, 2000 * (retryAttempts + 1)); // Exponential backoff
              } else {
                setVideoError('Stream unavailable - please check your connection');
                setVideoReady(false);
              }
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 HLS: Attempting to recover media error');
              setVideoError('Media error - recovering...');
              hls.recoverMediaError();
              break;

            default:
              console.error('❌ HLS: Unrecoverable error');
              setVideoError(`Playback failed: ${data.details}`);
              setVideoReady(false);
              hls.destroy();
              break;
          }
        } else {
          console.warn('⚠️ HLS: Non-fatal error:', data.details);
        }
      });

      // Attach HLS to video and load source
      hls.attachMedia(video);
      hls.loadSource(url);
      setHlsInstance(hls);

      console.log('🚀 HLS player initialized');

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      console.log('🍎 Using Safari native HLS support');
      video.src = url;
      setVideoError(null);
      setVideoReady(true);
    } else {
      console.error('❌ HLS not supported in this browser');
      setVideoError('HLS streaming not supported in this browser');
      setVideoReady(false);
    }

    // Cleanup function
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
      }
    };
  }, [muxPlaybackId, retryAttempts]);



  return (
    <motion.div
      ref={containerRef}
      className="h-full w-full flex items-center justify-center bg-slate-950/50 relative overflow-hidden p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Clean Video Container - Narrower Width */}
      <div
        className="relative rounded-lg sm:rounded-xl overflow-hidden border border-slate-700/30 bg-slate-900/50 h-full max-w-[85%] w-full mx-auto"
        style={{
          aspectRatio: '16/9'
        }}
      >
        {/* Actual Video Stream or Demo */}
        {muxPlaybackId ? (
          <div className="w-full h-full bg-black relative">
            {/* HLS Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              controls
              onLoadedData={() => {
                console.log('✅ Video: Loaded data');
                if (!hlsInstance) {
                  setVideoReady(true);
                  setVideoError(null);
                }
              }}
              onCanPlay={() => {
                console.log('✅ Video: Can play');
                if (!hlsInstance) {
                  setVideoReady(true);
                }
              }}
              onWaiting={() => {
                console.log('⏳ Video: Waiting/buffering');
              }}
              onPlaying={() => {
                console.log('▶️ Video: Playing');
                setVideoReady(true);
              }}
              onError={(e) => {
                console.error('❌ Video element error:', e);
                if (!hlsInstance) {
                  setVideoError('Video playback failed');
                }
              }}
            >
              <p className="text-white p-4">
                Your browser does not support HLS video streaming.
                <br />Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </video>

            {/* Stream Debug Info */}
            <div className="absolute top-3 left-3 bg-black/80 text-white text-xs p-3 rounded-lg">
              <div className="font-medium mb-1">Stream Debug Info:</div>
              <div>📺 Playback ID: <span className="text-blue-300">{muxPlaybackId}</span></div>
              <div>🔗 Stream URL: <span className="text-green-300 break-all">https://stream.mux.com/{muxPlaybackId}.m3u8</span></div>
              <div>📊 Status: <span className={videoReady ? 'text-green-300' : 'text-yellow-300'}>{videoReady ? '✅ Ready' : '⏳ Loading'}</span></div>
              <div>🔴 Live: <span className={isLive ? 'text-red-300' : 'text-gray-300'}>{isLive ? 'YES' : 'NO'}</span></div>
              {videoError && <div className="text-red-300 mt-1">❌ {videoError}</div>}
            </div>

            {/* Stream Status Indicator */}
            <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-3 py-2 rounded-lg">
              {videoError ? (
                <span className="text-red-300">⚠️ Error</span>
              ) : videoReady ? (
                <span className="text-green-300">🔴 Live</span>
              ) : (
                <span className="text-yellow-300">⏳ Connecting</span>
              )}
            </div>
          </div>
        ) : (
          /* Professional Demo Video Background */
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center relative">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-500/20 to-blue-500/20"></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/0 to-transparent"></div>
            </div>

            {/* Demo Content */}
            <div className="text-center z-10 relative">
              <motion.div
                className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                animate={{
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 10px 25px -5px rgba(139, 92, 246, 0.3)',
                    '0 20px 35px -5px rgba(139, 92, 246, 0.5)',
                    '0 10px 25px -5px rgba(139, 92, 246, 0.3)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Play className="w-12 h-12 text-white ml-1" fill="currentColor" />
              </motion.div>

              <motion.h3
                className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Live Stream Preview
              </motion.h3>

              <motion.p
                className="text-lg text-gray-400 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {isLive ? 'Connecting to live stream...' : 'Demo Mode • 1920 × 1080'}
              </motion.p>

              <motion.div
                className="flex items-center justify-center gap-3 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{viewerCount.toLocaleString()}</span>
                </div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <span>Stream ID: {streamId.slice(0, 8)}...</span>
              </motion.div>
            </div>
          </div>
        )}

        {/* Instagram-Style DOM Overlays - Only show if overlays are enabled */}
        <AnimatePresence>
          {showOverlays && (
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <OverlayRenderer
                overlayState={overlayState}
                viewerCount={viewerCount}
                streamId={streamId}
                connected={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Professional Control Overlay */}
        <motion.div
          className="absolute top-4 left-4 right-4 flex justify-between items-start z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <motion.div
              className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 backdrop-blur-md ${
                isLive
                  ? 'bg-red-600/90 text-white'
                  : 'bg-slate-800/90 text-gray-300 border border-slate-600'
              }`}
              animate={isLive ? {
                boxShadow: [
                  '0 0 0 0 rgba(239, 68, 68, 0.7)',
                  '0 0 0 10px rgba(239, 68, 68, 0)',
                ]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-white animate-pulse' : 'bg-gray-500'
              }`}></div>
              {isLive ? 'LIVE' : 'PREVIEW'}
            </motion.div>

            {/* Viewer Count */}
            <div className="px-3 py-1 rounded-full bg-slate-800/90 backdrop-blur-md text-white text-sm font-medium flex items-center gap-2">
              <Users className="w-3 h-3" />
              <span>{viewerCount.toLocaleString()}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Toggle Overlays */}
            <motion.button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
                showOverlays
                  ? 'bg-purple-600/90 text-white'
                  : 'bg-slate-700/90 text-gray-300 hover:bg-slate-600/90'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={showOverlays ? 'Hide Overlays' : 'Show Overlays'}
            >
              {showOverlays ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>

            {/* Settings */}
            <motion.button
              className="p-2 rounded-lg bg-slate-700/90 backdrop-blur-md text-gray-300 hover:bg-slate-600/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Preview Settings"
            >
              <Settings className="w-4 h-4" />
            </motion.button>

            {/* Fullscreen */}
            <motion.button
              className="p-2 rounded-lg bg-slate-700/90 backdrop-blur-md text-gray-300 hover:bg-slate-600/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Fullscreen Preview"
            >
              <Maximize className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Bottom Status Bar */}
        <motion.div
          className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Resolution Info */}
          <div className="px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-gray-300 text-sm">
            1920 × 1080 • 100%
          </div>

          {/* Connection Status */}
          {videoError ? (
            <div className="px-3 py-1 rounded-lg bg-red-900/80 backdrop-blur-md text-red-200 text-sm">
              {videoError}
            </div>
          ) : videoReady && muxPlaybackId ? (
            <div className="px-3 py-1 rounded-lg bg-green-900/80 backdrop-blur-md text-green-200 text-sm">
              Connected
            </div>
          ) : (
            <div className="px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-gray-300 text-sm">
              Demo Mode
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}