'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Reply, Heart } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';
import { useLongPress } from '@/hooks/useLongPress';

export interface FloatingComment {
  id: string;
  username: string;
  message: string;
  isPrivate?: boolean;
  timestamp: number;
}

export interface FloatingCommentsProps {
  messages: FloatingComment[];
  onCommentClick?: (comment: FloatingComment) => void;
  onReply?: (comment: FloatingComment) => void;
  onReaction?: (comment: FloatingComment, reaction: string) => void;
  onLike?: (comment: FloatingComment) => void;
  maxVisible?: number;
  messageLifetime?: number;
  keyboardHeight?: number;
  className?: string;
  celebrateNewUsers?: boolean;
}

interface EnhancedFloatingComment extends FloatingComment {
  index: number;
  isFirstMessage?: boolean;
}

export function FloatingComments({
  messages,
  onCommentClick,
  onReply,
  onReaction,
  onLike,
  maxVisible = 6,
  messageLifetime = 12000,
  keyboardHeight = 0,
  className = '',
  celebrateNewUsers = true,
}: FloatingCommentsProps) {
  const [visibleMessages, setVisibleMessages] = useState<EnhancedFloatingComment[]>([]);
  const [seenUsernames, setSeenUsernames] = useState<Set<string>>(new Set());
  const [reactionMenuFor, setReactionMenuFor] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const orientation = useOrientation();

  const isLandscape = orientation.isLandscape;

  // Manage visible messages with auto-expiry and celebration
  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    // Check if message already exists
    if (visibleMessages.some(m => m.id === latestMessage.id)) return;

    // Check if this is first message from this user
    const isFirstMessage = celebrateNewUsers && !seenUsernames.has(latestMessage.username);

    if (isFirstMessage) {
      setSeenUsernames(prev => new Set([...prev, latestMessage.username]));
    }

    // Add new message with enhanced metadata
    setVisibleMessages(prev => {
      const newIndex = prev.length;
      const enhancedMessage: EnhancedFloatingComment = {
        ...latestMessage,
        index: newIndex,
        isFirstMessage,
      };

      const updated = [...prev, enhancedMessage];
      // Keep only the last N messages with updated indices
      return updated.slice(-maxVisible).map((msg, idx) => ({
        ...msg,
        index: idx,
      }));
    });

    // Auto-remove after lifetime
    const timeout = setTimeout(() => {
      setVisibleMessages(prev => prev.filter(m => m.id !== latestMessage.id));
    }, messageLifetime);

    return () => clearTimeout(timeout);
  }, [messages, maxVisible, messageLifetime, celebrateNewUsers, seenUsernames]);

  const handleCommentTap = useCallback((comment: FloatingComment, e: React.MouseEvent | React.TouchEvent) => {
    // Single tap - quick reply
    if (navigator.vibrate) navigator.vibrate(30);
    onReply?.(comment);
    onCommentClick?.(comment);
  }, [onReply, onCommentClick]);

  const handleCommentDoubleTap = useCallback((comment: FloatingComment) => {
    // Double tap - like with heart
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    setLikedComments(prev => new Set([...prev, comment.id]));
    onLike?.(comment);
  }, [onLike]);

  const handleLongPress = useCallback((comment: FloatingComment) => {
    // Long press - show reaction menu
    if (navigator.vibrate) navigator.vibrate(50);
    setReactionMenuFor(comment.id);
  }, []);

  const handleReactionSelect = useCallback((comment: FloatingComment, reaction: string) => {
    if (navigator.vibrate) navigator.vibrate(30);
    onReaction?.(comment, reaction);
    setReactionMenuFor(null);
  }, [onReaction]);

  // Calculate bottom position based on keyboard and orientation
  const bottomPosition = isLandscape
    ? keyboardHeight > 0 ? keyboardHeight + 64 : 64
    : keyboardHeight > 0 ? keyboardHeight + 80 : 80;

  return (
    <div
      className={`fixed left-4 z-40 pointer-events-none
        ${isLandscape ? 'right-auto max-w-[60vw]' : 'right-4'}
        ${className}`}
      style={{
        bottom: `${bottomPosition}px`,
      }}
    >
      {/* Container with fade gradient at top */}
      <div
        className={`flex flex-col-reverse gap-2
          ${isLandscape ? 'max-h-[25vh]' : 'max-h-[40vh]'}
          overflow-hidden
          floating-comments-fade`}
      >
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((comment) => {
            // Stagger delay based on index for smooth entrance
            const staggerDelay = comment.index * 0.05;
            const isLiked = likedComments.has(comment.id);
            const showReactionMenu = reactionMenuFor === comment.id;

            return (
              <div key={comment.id} className="relative">
                <motion.div
                  layout
                  initial={{
                    opacity: 0,
                    y: 30,
                    scale: 0.8,
                    rotate: comment.isFirstMessage ? -5 : 0,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: comment.isFirstMessage ? [0.8, 1.1, 1] : 1,
                    rotate: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
                    x: -60,
                    transition: {
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: comment.isFirstMessage ? 400 : 500,
                    damping: comment.isFirstMessage ? 25 : 30,
                    mass: 0.8,
                    delay: staggerDelay,
                  }}
                  onClick={(e) => handleCommentTap(comment, e)}
                  onDoubleClick={() => handleCommentDoubleTap(comment)}
                  className="pointer-events-auto cursor-pointer"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CommentBubble
                    comment={comment}
                    isLandscape={isLandscape}
                    isLiked={isLiked}
                    onLongPress={() => handleLongPress(comment)}
                  />
                </motion.div>

                {/* Reaction Menu Popup */}
                <AnimatePresence>
                  {showReactionMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="absolute left-0 top-full mt-2 flex gap-2 bg-black/90 backdrop-blur-xl border border-purple-400/30 rounded-full px-3 py-2 shadow-2xl z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['❤️', '😂', '🔥', '👏', '😮', '💯'].map((emoji) => (
                        <motion.button
                          key={emoji}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleReactionSelect(comment, emoji)}
                          className="text-2xl hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Like Heart Animation */}
                {isLiked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1.2, 1, 0.8],
                      y: [0, -30],
                    }}
                    transition={{ duration: 1.5 }}
                    className="absolute right-2 top-1/2 pointer-events-none"
                  >
                    <Heart className="w-8 h-8 fill-red-500 text-red-500" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CommentBubbleProps {
  comment: EnhancedFloatingComment;
  isLandscape?: boolean;
  isLiked?: boolean;
  onLongPress?: () => void;
}

function CommentBubble({
  comment,
  isLandscape,
  isLiked,
  onLongPress,
}: CommentBubbleProps) {
  const { username, message, isPrivate, isFirstMessage: isCelebrated } = comment;
  const [isPressed, longPressHandlers] = useLongPress(() => {
    onLongPress?.();
  }, { threshold: 500 });
  return (
    <div className="relative">
      {/* Celebration Sparkles for First-Time Commenters */}
      {isCelebrated && (
        <>
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1, 0], rotate: 360 }}
            transition={{ duration: 1, times: [0, 0.5, 1], ease: 'easeOut' }}
            className="absolute -top-2 -right-2 text-yellow-400 text-xl pointer-events-none"
          >
            ✨
          </motion.div>
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: [0, 1, 0], rotate: -360 }}
            transition={{ duration: 1.2, times: [0, 0.5, 1], ease: 'easeOut', delay: 0.2 }}
            className="absolute -top-1 -left-1 text-pink-400 text-lg pointer-events-none"
          >
            ⭐
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.4, 1], ease: 'easeOut', delay: 0.3 }}
            className="absolute -bottom-1 -right-1 text-purple-400 text-sm pointer-events-none"
          >
            💫
          </motion.div>
        </>
      )}

      <div
        {...longPressHandlers}
        className={`inline-flex items-baseline gap-2 relative select-none
          ${isPrivate ? 'bg-purple-600/40' : isCelebrated ? 'bg-gradient-to-r from-purple-600/50 to-pink-600/50' : 'bg-black/40'}
          backdrop-blur-xl
          border ${isPrivate ? 'border-purple-400/30' : isCelebrated ? 'border-purple-400/50' : isLiked ? 'border-red-400/50' : 'border-white/10'}
          rounded-2xl
          ${isLandscape ? 'px-2.5 py-1 max-w-[300px]' : 'px-3 py-1.5 max-w-[85%]'}
          shadow-lg
          hover:bg-black/50 transition-all duration-200
          ${isCelebrated ? 'ring-2 ring-purple-400/30 ring-offset-2 ring-offset-transparent' : ''}
          ${isPressed ? 'scale-95 brightness-110' : ''}
          ${isLiked ? 'bg-gradient-to-r from-red-600/20 to-pink-600/20' : ''}`}
      >
        {/* Private indicator */}
        {isPrivate && (
          <Lock className={`${isLandscape ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-purple-300 flex-shrink-0`} />
        )}

        {/* Celebration badge for first-time commenter */}
        {isCelebrated && !isPrivate && (
          <span className="text-xs">🎉</span>
        )}

        {/* Username */}
        <span
          className={`${isPrivate ? 'text-purple-200' : isCelebrated ? 'text-white font-bold' : 'text-white/90'}
            font-semibold ${isLandscape ? 'text-xs' : 'text-sm'}
            flex-shrink-0`}
        >
          {username}
        </span>

        {/* Message */}
        <span
          className={`text-white ${isLandscape ? 'text-xs' : 'text-sm'}
            break-words`}
        >
          {message}
        </span>
      </div>
    </div>
  );
}
