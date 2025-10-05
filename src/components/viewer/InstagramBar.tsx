'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, Unlock, Share2, MoreVertical, Send } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';

export interface InstagramBarProps {
  onSendMessage: (message: string, isPrivate: boolean) => void;
  onReaction: () => void;
  onShare: () => void;
  onMoreMenu: () => void;
  connected?: boolean;
  className?: string;
}

export function InstagramBar({
  onSendMessage,
  onReaction,
  onShare,
  onMoreMenu,
  connected = true,
  className = '',
}: InstagramBarProps) {
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const orientation = useOrientation();

  const isLandscape = orientation.isLandscape;

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

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 pb-safe
        bg-gradient-to-t from-black/95 via-black/80 to-transparent
        backdrop-blur-2xl border-t border-white/10
        ${isLandscape ? 'instagram-bar-landscape' : 'instagram-bar-portrait'}
        ${className}`}
    >
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 ${
          isLandscape ? 'px-4 py-2' : 'px-4 py-2.5'
        }`}
      >
        {/* Main Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isPrivate ? "Private message..." : "Add a comment..."}
            disabled={!connected}
            className={`w-full bg-white/10 backdrop-blur-md
              border ${isPrivate ? 'border-purple-400/60' : 'border-white/20'}
              rounded-full
              ${isLandscape ? 'px-3 py-2 pr-8 text-xs' : 'px-4 py-2.5 pr-10 text-sm'}
              text-white placeholder-white/60
              focus:bg-white/15 focus:border-white/30
              ${isPrivate ? 'focus:border-purple-400' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 outline-none`}
          />

          {/* Send button (shows when typing) */}
          <AnimatePresence>
            {message.trim() && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                disabled={!connected}
                className={`absolute ${isLandscape ? 'right-1.5' : 'right-2'} top-1/2 -translate-y-1/2
                  ${isLandscape ? 'w-6 h-6' : 'w-7 h-7'} rounded-full
                  ${isPrivate ? 'bg-purple-500' : 'bg-purple-600'}
                  hover:bg-purple-700
                  disabled:bg-gray-600 disabled:cursor-not-allowed
                  flex items-center justify-center
                  active:scale-95 transition-all`}
              >
                <Send className={`${isLandscape ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Reaction Button */}
        <motion.button
          type="button"
          onClick={handleReaction}
          whileTap={{ scale: 0.9 }}
          className={`${buttonSize} rounded-full
            bg-white/10 backdrop-blur-md border border-white/10
            flex items-center justify-center
            hover:bg-white/15 active:bg-white/20
            transition-colors`}
          aria-label="Send reaction"
        >
          <Heart className={`${iconSize} text-white`} />
        </motion.button>

        {/* Private Message Toggle */}
        <motion.button
          type="button"
          onClick={handleTogglePrivate}
          whileTap={{ scale: 0.9 }}
          className={`${buttonSize} rounded-full
            backdrop-blur-md border
            flex items-center justify-center
            transition-all
            ${
              isPrivate
                ? 'bg-purple-500 border-purple-400'
                : 'bg-white/10 border-white/10 hover:bg-white/15'
            }`}
          aria-label={isPrivate ? 'Switch to public' : 'Switch to private'}
        >
          {isPrivate ? (
            <Lock className={`${iconSize} text-white`} />
          ) : (
            <Unlock className={`${iconSize} text-white`} />
          )}
        </motion.button>

        {/* Share Button */}
        <motion.button
          type="button"
          onClick={handleShare}
          whileTap={{ scale: 0.9 }}
          className={`${buttonSize} rounded-full
            bg-white/10 backdrop-blur-md border border-white/10
            flex items-center justify-center
            hover:bg-white/15 active:bg-white/20
            transition-colors`}
          aria-label="Share stream"
        >
          <Share2 className={`${iconSize} text-white`} />
        </motion.button>

        {/* More Menu Button */}
        <motion.button
          type="button"
          onClick={handleMoreMenu}
          whileTap={{ scale: 0.9 }}
          className={`${buttonSize} rounded-full
            bg-white/10 backdrop-blur-md border border-white/10
            flex items-center justify-center
            hover:bg-white/15 active:bg-white/20
            transition-colors`}
          aria-label="More options"
        >
          <MoreVertical className={`${iconSize} text-white`} />
        </motion.button>
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
    </div>
  );
}
