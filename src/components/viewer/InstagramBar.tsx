'use client';

import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, Unlock, Share2, MoreVertical, Send } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';

export interface InstagramBarProps {
  onSendMessage: (message: string, isPrivate: boolean) => void;
  onReaction: () => void;
  onShare: () => void;
  onMoreMenu: () => void;
  connected?: boolean;
  className?: string;
  isVisible?: boolean; // For auto-hide functionality
}

export function InstagramBar({
  onSendMessage,
  onReaction,
  onShare,
  onMoreMenu,
  connected = true,
  className = '',
  isVisible = true, // Default to visible
}: InstagramBarProps) {
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const orientation = useOrientation();
  const keyboardState = useKeyboardDetection();

  const isLandscape = orientation.isLandscape;

  // Calculate bottom position based on keyboard
  const bottomPosition = keyboardState.isOpen ? keyboardState.height : 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !connected) return;

    onSendMessage(message.trim(), isPrivate);
    setMessage('');
  };

  const handleReaction = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    onReaction();
  };

  const handleTogglePrivate = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    setIsPrivate(!isPrivate);
  };

  const handleShare = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    onShare();
  };

  const handleMoreMenu = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    onMoreMenu();
  };

  // Button size based on orientation
  const buttonSize = isLandscape ? 'w-9 h-9' : 'w-11 h-11';
  const iconSize = isLandscape ? 'w-4 h-4' : 'w-5 h-5';

  // Only apply auto-hide in landscape mode
  const shouldShow = !isLandscape || isVisible;

  if (!shouldShow) return null;

  return (
    <motion.div
      initial={isLandscape ? { y: 100, opacity: 0 } : false}
      animate={isLandscape ? { y: 0, opacity: 1 } : {}}
      exit={isLandscape ? { y: 100, opacity: 0 } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`fixed left-0 right-0 z-50 transition-all duration-200
        bg-gradient-to-t from-black/95 via-black/80 to-transparent
        backdrop-blur-2xl border-t border-white/10
        ${isLandscape ? 'instagram-bar-landscape' : 'instagram-bar-portrait'}
        ${className}`}
      style={{
        bottom: `max(${bottomPosition}px, env(safe-area-inset-bottom, 0px))`,
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 ${
          isLandscape ? 'px-3 py-2' : 'px-4 py-2.5'
        }`}
      >
        {/* Main Input with inline send button */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isPrivate ? "Private message..." : "Add a comment..."}
            disabled={!connected}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            className={`w-full bg-white/10 backdrop-blur-md
              border ${isPrivate ? 'border-purple-400/60' : 'border-white/20'}
              rounded-full
              ${isLandscape ? 'pl-3 pr-12 py-2 text-sm' : 'pl-4 pr-14 py-3 text-base'}
              text-white placeholder-white/60
              focus:bg-white/15 focus:border-white/30
              ${isPrivate ? 'focus:border-purple-400' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 outline-none`}
            style={{
              fontSize: isLandscape ? '14px' : '16px', // Prevent iOS zoom on focus
            }}
          />

          {/* Send button - ALWAYS visible, larger hit target */}
          <button
            type="submit"
            disabled={!connected || !message.trim()}
            className={`absolute ${isLandscape ? 'right-1' : 'right-1.5'} top-1/2 -translate-y-1/2
              ${isLandscape ? 'w-8 h-8' : 'w-10 h-10'} rounded-full
              ${message.trim() && connected
                ? isPrivate ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gray-700/50'}
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
              active:scale-95 transition-all shadow-lg`}
          >
            <Send className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'} ${message.trim() && connected ? 'text-white' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Compact action buttons - smaller in landscape */}
        <div className="flex items-center gap-1.5">
          {/* Private Message Toggle */}
          <motion.button
            type="button"
            onClick={handleTogglePrivate}
            whileTap={{ scale: 0.9 }}
            className={`${isLandscape ? 'w-8 h-8' : 'w-10 h-10'} rounded-full
              backdrop-blur-md border
              flex items-center justify-center
              transition-all shrink-0
              ${
                isPrivate
                  ? 'bg-purple-500 border-purple-400'
                  : 'bg-white/10 border-white/10 hover:bg-white/15'
              }`}
            aria-label={isPrivate ? 'Switch to public' : 'Switch to private'}
          >
            {isPrivate ? (
              <Lock className={`${isLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />
            ) : (
              <Unlock className={`${isLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />
            )}
          </motion.button>

          {/* Reaction Button */}
          <motion.button
            type="button"
            onClick={handleReaction}
            whileTap={{ scale: 0.9 }}
            className={`${isLandscape ? 'w-8 h-8' : 'w-10 h-10'} rounded-full
              bg-white/10 backdrop-blur-md border border-white/10
              flex items-center justify-center shrink-0
              hover:bg-white/15 active:bg-white/20
              transition-colors`}
            aria-label="Send reaction"
          >
            <Heart className={`${isLandscape ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />
          </motion.button>
        </div>
      </form>

      {/* Private Message Indicator */}
      <AnimatePresence>
        {isPrivate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2 text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1
              bg-purple-500/20 backdrop-blur-md rounded-full border border-purple-400/30">
              <Lock className="w-3 h-3 text-purple-300" />
              <span className="text-xs text-purple-200">
                Only visible to host
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
