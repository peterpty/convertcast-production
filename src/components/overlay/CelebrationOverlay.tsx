'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CelebrationPreset {
  id: string;
  name: string;
  gifUrl: string;
  soundUrl?: string;
  message: string;
}

export interface CelebrationState {
  visible: boolean;
  gifUrl: string;
  soundUrl?: string;
  message: string;
  displayDuration?: number; // in seconds, default 5
  volume?: number; // 0-100, default 70
}

interface CelebrationOverlayProps {
  celebration: CelebrationState;
  onComplete?: () => void;
}

export function CelebrationOverlay({ celebration, onComplete }: CelebrationOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (celebration.visible) {
      setIsVisible(true);
      setIsPlaying(true);

      // Play sound if provided
      if (celebration.soundUrl && audioRef.current) {
        audioRef.current.volume = (celebration.volume || 70) / 100;
        audioRef.current.play().catch(console.error);
      }

      // Auto-hide after duration
      const duration = (celebration.displayDuration || 5) * 1000;
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      setIsVisible(false);
    }
  }, [celebration.visible, celebration.soundUrl, celebration.displayDuration, celebration.volume]);

  const handleAnimationComplete = () => {
    if (!isVisible) {
      setIsPlaying(false);
      onComplete?.();
    }
  };

  if (!celebration.visible) return null;

  return (
    <>
      {/* Audio element for sound effects */}
      {celebration.soundUrl && (
        <audio ref={audioRef} preload="auto">
          <source src={celebration.soundUrl} type="audio/mpeg" />
          <source src={celebration.soundUrl} type="audio/wav" />
          <source src={celebration.soundUrl} type="audio/ogg" />
        </audio>
      )}

      <AnimatePresence onExitComplete={handleAnimationComplete}>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Instagram-style celebration container */}
            <motion.div
              className="relative flex flex-col items-center max-w-md w-full mx-4"
              initial={{ scale: 0.3, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.3, y: -50 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.6
              }}
            >
              {/* GIF Container with Instagram-style frame */}
              <motion.div
                className="relative mb-6 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl border border-white/30"
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  background: 'rgba(255, 255, 255, 0.1)'
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {/* Glowing ring effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-orange-400/30 animate-pulse"></div>

                {/* GIF Display */}
                <div className="relative z-10 p-2">
                  <motion.img
                    src={celebration.gifUrl}
                    alt="Celebration"
                    className="w-full max-w-[400px] h-auto rounded-2xl shadow-lg"
                    style={{
                      maxHeight: '300px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    onError={(e) => {
                      console.error('Failed to load celebration GIF:', celebration.gifUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Sparkle particles */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-white/80 rounded-full animate-ping"></div>
                <div className="absolute top-4 right-4 w-1 h-1 bg-yellow-300/80 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-pink-300/80 rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
              </motion.div>

              {/* Message in Instagram-style pill */}
              {celebration.message && (
                <motion.div
                  className="relative px-8 py-4 rounded-full backdrop-blur-xl shadow-2xl text-center max-w-sm"
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(249, 115, 22, 0.2) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {/* Floating glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-orange-400/20 animate-pulse"></div>

                  <div className="relative z-10">
                    <span
                      className="text-white font-bold text-xl tracking-wide drop-shadow-lg"
                      style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}
                    >
                      {celebration.message}
                    </span>

                    {/* Heart animation like Instagram Live */}
                    <div className="absolute -top-3 -right-3">
                      <motion.div
                        className="text-2xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        💖
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Confetti-like particles floating around */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      background: ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#F59E0B', '#EF4444'][i],
                      left: `${20 + i * 15}%`,
                      top: `${10 + (i % 2) * 70}%`,
                    }}
                    animate={{
                      y: [-20, -40, -20],
                      x: [0, 10, 0],
                      opacity: [0.6, 1, 0.6],
                      scale: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Sound visualization waves */}
            {isPlaying && celebration.soundUrl && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-end space-x-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-white/60 rounded-full"
                    animate={{
                      height: [8, 24, 8],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Utility function to replace placeholders in messages
export function replacePlaceholders(message: string, replacements: { [key: string]: string }): string {
  let result = message;
  Object.entries(replacements).forEach(([placeholder, value]) => {
    const regex = new RegExp(`\\[${placeholder.toUpperCase()}\\]`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}

// Preset celebration templates
export const defaultCelebrationPresets: Omit<CelebrationPreset, 'id'>[] = [
  {
    name: "Big Win",
    gifUrl: "https://media.giphy.com/media/26tknCqiJrBQG6bxC/giphy.gif", // Celebration dance
    message: "🎉 AMAZING [NAME]! 🎉"
  },
  {
    name: "New Follower",
    gifUrl: "https://media.giphy.com/media/3o7aCRloybJlXpNjSU/giphy.gif", // Welcome gesture
    message: "Welcome [NAME]! Thanks for following! 💜"
  },
  {
    name: "Goal Reached",
    gifUrl: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", // Success celebration
    message: "We did it! Goal reached thanks to [NAME]! 🚀"
  },
  {
    name: "Free Gift Winner",
    gifUrl: "https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif", // Elaine dancing
    message: "Way to go [NAME]! You got a free gift! 🎁"
  }
];