'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Send, Unlock, Heart, Pin, Reply } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  isPrivate?: boolean;
  isPinned?: boolean;
  isReply?: boolean;
  timestamp: number;
}

export interface MobileChatStackProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, isPrivate: boolean) => void;
  onReaction: () => void;
  connected?: boolean;
}

export function MobileChatStack({
  messages,
  onSendMessage,
  onReaction,
  connected = true,
}: MobileChatStackProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const orientation = useOrientation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Show only last 5 messages (or 6 if one is pinned)
  const pinnedMessage = messages.find(m => m.isPinned);
  const regularMessages = messages.filter(m => !m.isPinned).slice(-5);
  const visibleMessages = pinnedMessage ? [pinnedMessage, ...regularMessages] : regularMessages;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !connected) return;

    onSendMessage(inputMessage.trim(), isPrivate);
    setInputMessage('');
    setIsPrivate(false);

    // Keep focus on input after sending
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleFocus = () => {
    // Scroll container into view when keyboard opens
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 300);
  };

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 pointer-events-none">
      {/* Message Stack - Bottom to Top */}
      <div className="px-3 pb-2 flex flex-col-reverse gap-2 max-h-[40vh] overflow-hidden">
        <AnimatePresence initial={false}>
          {visibleMessages.slice().reverse().map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.8 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
                mass: 0.8,
              }}
              className="pointer-events-auto"
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Chat Input Bar */}
      <div className="pointer-events-auto bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-xl pt-3 pb-safe">
        <form onSubmit={handleSubmit} className="px-3 pb-3">
          <div className="flex items-center gap-2">
            {/* Input Field */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onFocus={handleFocus}
                placeholder={isPrivate ? "Private message..." : "Add a comment..."}
                disabled={!connected}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                className={`w-full pl-4 pr-12 py-3 rounded-full
                  bg-white/10 backdrop-blur-md border-2
                  ${isPrivate ? 'border-purple-400/60' : 'border-white/20'}
                  text-white placeholder-white/60
                  focus:bg-white/15 focus:border-white/30
                  ${isPrivate ? 'focus:border-purple-400' : ''}
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all outline-none text-base`}
                style={{ fontSize: '16px' }} // Prevent iOS zoom
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!connected || !inputMessage.trim()}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${inputMessage.trim() && connected
                    ? isPrivate ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-700/50'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all shadow-lg`}
              >
                <Send className={`w-5 h-5 ${inputMessage.trim() && connected ? 'text-white' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`w-11 h-11 rounded-full flex items-center justify-center
                backdrop-blur-md border-2 transition-all shrink-0
                ${isPrivate
                  ? 'bg-purple-500 border-purple-400'
                  : 'bg-white/10 border-white/20 hover:bg-white/15'
                }`}
              aria-label={isPrivate ? 'Switch to public' : 'Switch to private'}
            >
              {isPrivate ? (
                <Lock className="w-4 h-4 text-white" />
              ) : (
                <Unlock className="w-4 h-4 text-white" />
              )}
            </button>

            <button
              type="button"
              onClick={onReaction}
              className="w-11 h-11 rounded-full flex items-center justify-center
                bg-white/10 backdrop-blur-md border-2 border-white/20
                hover:bg-white/15 active:bg-white/20 transition-all shrink-0"
              aria-label="Send reaction"
            >
              <Heart className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Private Message Indicator */}
          {isPrivate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-center"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5
                bg-purple-500/20 backdrop-blur-md rounded-full border border-purple-400/30">
                <Lock className="w-3 h-3 text-purple-300" />
                <span className="text-xs text-purple-200">
                  Only visible to host
                </span>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { username, message: text, isPrivate, isPinned, isReply } = message;

  return (
    <div
      className={`inline-flex items-baseline gap-2 max-w-[85%]
        ${isPrivate ? 'bg-purple-900/70' : isPinned ? 'bg-gradient-to-r from-purple-900/70 to-pink-900/70' : 'bg-black/70'}
        backdrop-blur-2xl border rounded-2xl px-3 py-1.5
        ${isPrivate ? 'border-purple-400/50' : isPinned ? 'border-purple-400/60' : 'border-white/30'}
        shadow-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]`}
      style={{
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Pinned Indicator */}
      {isPinned && (
        <Pin className="w-3 h-3 text-purple-300 flex-shrink-0" />
      )}

      {/* Reply Indicator */}
      {isReply && !isPinned && (
        <Reply className="w-3 h-3 text-purple-300 flex-shrink-0" />
      )}

      {/* Private Indicator */}
      {isPrivate && (
        <Lock className="w-3 h-3 text-purple-300 flex-shrink-0" />
      )}

      {/* Username */}
      <span className={`font-semibold text-sm flex-shrink-0
        ${isPrivate ? 'text-purple-200' : isPinned ? 'text-white' : 'text-white'}`}>
        {username}
      </span>

      {/* Message */}
      <span className="text-white text-sm break-words">
        {text}
      </span>
    </div>
  );
}
