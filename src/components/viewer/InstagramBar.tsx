'use client';

import { useState, FormEvent, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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

// Memoized input component to prevent re-renders from parent
const ChatInput = memo(({
  message,
  onMessageChange,
  onSubmit,
  isPrivate,
  isLandscape,
  connected,
}: {
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isPrivate: boolean;
  isLandscape: boolean;
  connected: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const wasFocusedRef = useRef(false);

  // CRITICAL FIX: Restore focus after re-renders
  useEffect(() => {
    if (wasFocusedRef.current && inputRef.current && document.activeElement !== inputRef.current) {
      // Input was focused before re-render but lost focus - restore it
      inputRef.current.focus();
    }
  });

  const handleFocus = () => {
    wasFocusedRef.current = true;
  };

  const handleBlur = () => {
    wasFocusedRef.current = false;
  };

  return (
    <form onSubmit={onSubmit} className="flex-1 relative">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
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
    </form>
  );
});

ChatInput.displayName = 'ChatInput';

// Memoize entire component to prevent re-renders when parent updates
const InstagramBarComponent = ({
  onSendMessage,
  onReaction,
  onShare,
  onMoreMenu,
  connected = true,
  className = '',
  isVisible = true, // Default to visible
}: InstagramBarProps) => {
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const orientation = useOrientation();
  const keyboardState = useKeyboardDetection();

  const isLandscape = orientation.isLandscape;

  // Calculate bottom position based on keyboard
  const bottomPosition = keyboardState.isOpen ? keyboardState.height : 0;

  // Memoize handlers to prevent re-renders of child components
  const handleMessageChange = useCallback((value: string) => {
    setMessage(value);
  }, []);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !connected) return;

    onSendMessage(message.trim(), isPrivate);
    setMessage('');
  }, [message, connected, isPrivate, onSendMessage]);

  const handleReaction = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    onReaction();
  }, [onReaction]);

  const handleTogglePrivate = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(30);
    setIsPrivate(prev => !prev);
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    onShare();
  }, [onShare]);

  const handleMoreMenu = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(50);
    onMoreMenu();
  }, [onMoreMenu]);

  // Button size based on orientation
  const buttonSize = isLandscape ? 'w-9 h-9' : 'w-11 h-11';
  const iconSize = isLandscape ? 'w-4 h-4' : 'w-5 h-5';

  // Only apply auto-hide in landscape mode
  const shouldShow = !isLandscape || isVisible;

  // CRITICAL FIX: Don't unmount when hidden - use CSS/animation instead
  // Unmounting destroys the input element and causes focus loss
  return (
    <motion.div
      initial={isLandscape ? { y: 100, opacity: 0 } : false}
      animate={
        isLandscape
          ? shouldShow
            ? { y: 0, opacity: 1 }
            : { y: 100, opacity: 0 }
          : {}
      }
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`fixed left-0 right-0 z-50 transition-all duration-200
        bg-black/40 backdrop-blur-2xl border-t border-white/10
        ${isLandscape ? 'instagram-bar-landscape' : 'instagram-bar-portrait'}
        ${className}`}
      style={{
        bottom: `max(${bottomPosition}px, env(safe-area-inset-bottom, 0px))`,
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
        pointerEvents: shouldShow ? 'auto' : 'none', // Disable interactions when hidden
        visibility: shouldShow ? 'visible' : 'hidden', // Hide but keep in DOM
      }}
    >
      <div
        className={`flex items-center gap-2 ${
          isLandscape ? 'px-3 py-2' : 'px-4 py-2.5'
        }`}
      >
        {/* Memoized Chat Input - Prevents re-renders from keyboard/orientation changes */}
        <ChatInput
          message={message}
          onMessageChange={handleMessageChange}
          onSubmit={handleSubmit}
          isPrivate={isPrivate}
          isLandscape={isLandscape}
          connected={connected}
        />

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
      </div>

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
};

// Export memoized version to prevent unnecessary re-renders
export const InstagramBar = memo(InstagramBarComponent);
