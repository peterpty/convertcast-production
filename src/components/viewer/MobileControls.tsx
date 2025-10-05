'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize, Wifi, WifiOff, Volume2, VolumeX, MessageCircle } from 'lucide-react';

export interface NetworkQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  label: string;
  color: string;
}

export interface MobileControlsProps {
  isFullscreen?: boolean;
  isMuted?: boolean;
  onFullscreenToggle?: () => void;
  onMuteToggle?: () => void;
  onChatToggle?: () => void;
  networkQuality?: NetworkQuality['level'];
  autoHideDelay?: number;
  className?: string;
}

const networkQualities: Record<NetworkQuality['level'], { label: string; color: string; icon: typeof Wifi }> = {
  excellent: { label: 'Excellent', color: 'text-green-400', icon: Wifi },
  good: { label: 'Good', color: 'text-green-400', icon: Wifi },
  fair: { label: 'Fair', color: 'text-yellow-400', icon: Wifi },
  poor: { label: 'Poor', color: 'text-orange-400', icon: Wifi },
  offline: { label: 'Offline', color: 'text-red-400', icon: WifiOff },
};

export function MobileControls({
  isFullscreen = false,
  isMuted = false,
  onFullscreenToggle,
  onMuteToggle,
  onChatToggle,
  networkQuality = 'good',
  autoHideDelay = 3000,
  className = '',
}: MobileControlsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const quality = networkQualities[networkQuality];
  const NetworkIcon = quality.icon;

  // Auto-hide logic
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
      setIsVisible(true);

      // Clear existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Set new timeout
      hideTimeoutRef.current = setTimeout(() => {
        if (!isFullscreen) return; // Only auto-hide in fullscreen
        setIsVisible(false);
      }, autoHideDelay);
    };

    // Activity listeners
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleActivity);
      container.addEventListener('touchmove', handleActivity);
      container.addEventListener('click', handleActivity);
    }

    // Initial timeout
    handleActivity();

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleActivity);
        container.removeEventListener('touchmove', handleActivity);
        container.removeEventListener('click', handleActivity);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [autoHideDelay, isFullscreen]);

  const handleFullscreen = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    onFullscreenToggle?.();
  };

  const handleMute = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    onMuteToggle?.();
  };

  const handleChat = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    onChatToggle?.();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Top Bar - Network Quality */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm z-[60] safe-area-top"
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

            {/* Bottom Bar - Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent backdrop-blur-sm z-[60] safe-area-bottom"
            >
              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center gap-3">
                  {/* Volume Toggle */}
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

                  {/* Chat Toggle (Mobile Only) */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleChat}
                    className="md:hidden w-11 h-11 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10 active:bg-black/60 transition-colors"
                    aria-label="Toggle chat"
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                  </motion.button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3">
                  {/* Fullscreen Toggle */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleFullscreen}
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
