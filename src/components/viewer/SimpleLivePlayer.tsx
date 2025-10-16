'use client';

import { useRef, useState, useEffect, forwardRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Maximize, Minimize, Wifi, WifiOff } from 'lucide-react';

export interface SimpleLivePlayerProps {
  playbackId: string;
  streamId: string;
  streamTitle: string;
  isMuted: boolean;
  onMuteToggle: () => void;
  className?: string;
  networkQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  isMobile?: boolean;
}

export const SimpleLivePlayer = forwardRef<any, SimpleLivePlayerProps>(
  ({ playbackId, streamId, streamTitle, isMuted, onMuteToggle, className = '', networkQuality = 'good', isMobile = false }, ref) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout>();
    const shouldLockOrientationRef = useRef(false);

    const networkQualities = {
      excellent: { label: 'Excellent', color: 'text-green-400', icon: Wifi },
      good: { label: 'Good', color: 'text-green-400', icon: Wifi },
      fair: { label: 'Fair', color: 'text-yellow-400', icon: Wifi },
      poor: { label: 'Poor', color: 'text-orange-400', icon: Wifi },
      offline: { label: 'Offline', color: 'text-red-400', icon: WifiOff },
    };

    const quality = networkQualities[networkQuality];
    const NetworkIcon = quality.icon;

    // Auto-hide controls
    const resetHideTimer = () => {
      setShowControls(true);

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleActivity = () => {
        resetHideTimer();
      };

      container.addEventListener('mousemove', handleActivity);
      container.addEventListener('touchstart', handleActivity);
      container.addEventListener('click', handleActivity);

      // Initial show
      resetHideTimer();

      return () => {
        container.removeEventListener('mousemove', handleActivity);
        container.removeEventListener('touchstart', handleActivity);
        container.removeEventListener('click', handleActivity);
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
      };
    }, []);

    // Fullscreen handlers
    const toggleFullscreen = async () => {
      const container = containerRef.current;
      if (!container) return;

      try {
        const doc: any = document;
        const elem: any = container;

        const isCurrentlyFullscreen = !!(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        );

        if (!isCurrentlyFullscreen) {
          // Set flag to lock orientation after fullscreen is established
          if (isMobile) {
            shouldLockOrientationRef.current = true;
          }

          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
          } else if (elem.webkitEnterFullscreen) {
            elem.webkitEnterFullscreen();
          } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
          } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
          }
          setIsFullscreen(true);
        } else {
          shouldLockOrientationRef.current = false;

          if (doc.exitFullscreen) {
            await doc.exitFullscreen();
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
          } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
          } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
          }
          setIsFullscreen(false);
        }

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    };

    // Listen for fullscreen changes
    useEffect(() => {
      const handleFullscreenChange = async () => {
        const doc: any = document;
        const isFullscreen = !!(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        );
        setIsFullscreen(isFullscreen);

        // Lock orientation to landscape AFTER fullscreen is established on mobile
        if (isFullscreen && isMobile && shouldLockOrientationRef.current) {
          shouldLockOrientationRef.current = false; // Reset flag
          if (screen.orientation?.lock) {
            try {
              await screen.orientation.lock('landscape');
              console.log('✅ Orientation locked to landscape');
            } catch (err) {
              console.log('⚠️ Orientation lock not supported or failed:', err);
            }
          }
        }

        // Unlock orientation when exiting fullscreen on mobile
        if (!isFullscreen && isMobile && screen.orientation?.unlock) {
          try {
            screen.orientation.unlock();
            console.log('✅ Orientation unlocked');
          } catch (err) {
            console.log('⚠️ Orientation unlock failed:', err);
          }
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      };
    }, [isMobile]);

    const handleMute = () => {
      if (navigator.vibrate) navigator.vibrate(30);
      onMuteToggle();
    };

    return (
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden ${className}`}
        style={{ cursor: showControls ? 'default' : 'none' }}
      >
        {/* MuxPlayer - Controls Fully Disabled */}
        <MuxPlayer
          ref={ref}
          streamType="live"
          playbackId={playbackId}
          targetLiveWindow={0}
          metadata={{
            video_id: streamId,
            video_title: streamTitle,
            viewer_user_id: 'anonymous',
          }}
          autoPlay="muted"
          muted={isMuted}
          controls={false}
          className="w-full h-full"
          style={{
            width: '100%',
            height: '100%',
            '--media-object-fit': 'contain',
          } as React.CSSProperties}
          onPlay={() => console.log('🔴 LIVE: Stream started playing')}
          onPause={() => {
            // Prevent pausing on live streams - immediately resume
            console.log('⚠️ LIVE: Pause blocked - resuming playback');
            const player = ref as any;
            if (player?.current?.media) {
              setTimeout(() => {
                player.current.media.play().catch((err: any) => {
                  console.log('Auto-resume failed (expected if user-initiated):', err);
                });
              }, 100);
            }
          }}
          onError={(error) => console.error('Stream error:', error)}
        />

        {/* Custom Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <>
              {/* Top Bar - Network Quality & Live Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm z-50 pointer-events-none"
              >
                <div className="flex items-center justify-between">
                  {/* Network Quality Indicator */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                    <NetworkIcon className={`w-4 h-4 ${quality.color}`} />
                    <span className={`text-xs font-medium ${quality.color}`}>{quality.label}</span>
                  </div>

                  {/* Live Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/90 backdrop-blur-md rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Live</span>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Bar - Mute & Fullscreen Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm z-50"
              >
                <div className="flex items-center justify-between">
                  {/* Mute Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMute}
                    className="w-11 h-11 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 active:bg-black/60 transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </motion.button>

                  {/* Fullscreen Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleFullscreen}
                    className="w-11 h-11 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 active:bg-black/60 transition-colors"
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize className="w-5 h-5 text-white" />
                    ) : (
                      <Maximize className="w-5 h-5 text-white" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

SimpleLivePlayer.displayName = 'SimpleLivePlayer';
