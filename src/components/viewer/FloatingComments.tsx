'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';

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
  maxVisible?: number;
  messageLifetime?: number;
  keyboardHeight?: number;
  className?: string;
}

export function FloatingComments({
  messages,
  onCommentClick,
  maxVisible = 5,
  messageLifetime = 8000,
  keyboardHeight = 0,
  className = '',
}: FloatingCommentsProps) {
  const [visibleMessages, setVisibleMessages] = useState<FloatingComment[]>([]);
  const orientation = useOrientation();

  const isLandscape = orientation.isLandscape;

  // Manage visible messages with auto-expiry
  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    // Check if message already exists
    if (visibleMessages.some(m => m.id === latestMessage.id)) return;

    // Add new message
    setVisibleMessages(prev => {
      const updated = [...prev, latestMessage];
      // Keep only the last N messages
      return updated.slice(-maxVisible);
    });

    // Auto-remove after lifetime
    const timeout = setTimeout(() => {
      setVisibleMessages(prev => prev.filter(m => m.id !== latestMessage.id));
    }, messageLifetime);

    return () => clearTimeout(timeout);
  }, [messages, maxVisible, messageLifetime]);

  const handleCommentClick = (comment: FloatingComment) => {
    if (navigator.vibrate) navigator.vibrate(30);
    onCommentClick?.(comment);
  };

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
          {visibleMessages.map((comment, index) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
              onClick={() => handleCommentClick(comment)}
              className="pointer-events-auto cursor-pointer"
            >
              <CommentBubble
                username={comment.username}
                message={comment.message}
                isPrivate={comment.isPrivate}
                isLandscape={isLandscape}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CommentBubbleProps {
  username: string;
  message: string;
  isPrivate?: boolean;
  isLandscape?: boolean;
}

function CommentBubble({
  username,
  message,
  isPrivate,
  isLandscape,
}: CommentBubbleProps) {
  return (
    <div
      className={`inline-flex items-baseline gap-2
        ${isPrivate ? 'bg-purple-600/40' : 'bg-black/40'}
        backdrop-blur-xl
        border ${isPrivate ? 'border-purple-400/30' : 'border-white/10'}
        rounded-2xl
        ${isLandscape ? 'px-2.5 py-1 max-w-[300px]' : 'px-3 py-1.5 max-w-[85%]'}
        shadow-lg
        hover:bg-black/50 transition-colors`}
    >
      {/* Private indicator */}
      {isPrivate && (
        <Lock className={`${isLandscape ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-purple-300 flex-shrink-0`} />
      )}

      {/* Username */}
      <span
        className={`${isPrivate ? 'text-purple-200' : 'text-white/90'}
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
  );
}
