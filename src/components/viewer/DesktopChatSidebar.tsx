'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Send, Lock, Unlock, MessageSquare, Pin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  is_private: boolean;
  is_synthetic?: boolean;
  sender_id: string | null;
  status: string;
  reply_to_user_id?: string | null;
  viewer_profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface DesktopChatSidebarProps {
  messages: ChatMessage[];
  connected: boolean;
  viewerId: string;
  onSendMessage: (message: string, isPrivate: boolean) => Promise<void>;
  onPinMessage?: (messageId: string) => void;
}

/**
 * Desktop Chat Sidebar with Liquid Glass Design
 *
 * Production-Ready Features:
 * - Memoized to prevent unnecessary re-renders
 * - Controlled input with stable refs
 * - Glassmorphism design
 * - Private messaging
 * - Message pinning
 * - Auto-scroll
 */
const DesktopChatSidebar: React.FC<DesktopChatSidebarProps> = memo(({
  messages,
  connected,
  viewerId,
  onSendMessage,
  onPinMessage,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isPrivateMessage, setIsPrivateMessage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message with loading state
  const handleSend = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!newMessage.trim() || isSending || !connected) {
      console.log('⏸️ Cannot send:', {
        empty: !newMessage.trim(),
        sending: isSending,
        disconnected: !connected
      });
      return;
    }

    setIsSending(true);
    console.log('📤 Desktop chat attempting to send:', {
      message: newMessage.substring(0, 50),
      is_private: isPrivateMessage,
      viewer_id: viewerId
    });

    try {
      await onSendMessage(newMessage.trim(), isPrivateMessage);
      console.log('✅ Desktop chat message sent successfully');
      setNewMessage('');
      setIsPrivateMessage(false);

      // Keep focus on input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (error: any) {
      console.error('❌ Desktop chat send failed:', {
        error_message: error?.message,
        error_stack: error?.stack,
        full_error: error
      });
      alert(`Failed to send: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  }, [newMessage, isPrivateMessage, isSending, connected, onSendMessage, viewerId]);

  // Toggle private mode
  const togglePrivate = useCallback(() => {
    setIsPrivateMessage(prev => !prev);
  }, []);

  // Handle Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Pinned message (only one can be pinned)
  const pinnedMessage = messages.find(msg => msg.status === 'pinned');

  return (
    <div className="h-full flex flex-col">
      {/* Liquid Glass Header */}
      <div className="relative p-6 border-b border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent"></div>
        <div className="relative flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-3">
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <span className="bg-gradient-to-r from-purple-200 via-purple-100 to-white bg-clip-text text-transparent">
              Live Chat
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-xs text-purple-200/70">
              {messages.length}
            </span>
          </div>
        </div>
      </div>

      {/* Pinned Message */}
      <AnimatePresence>
        {pinnedMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative overflow-hidden border-b border-purple-400/30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-purple-500/10 to-transparent backdrop-blur-sm"></div>
            <div className="relative p-4">
              <div className="flex items-start gap-3">
                <Pin className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-purple-300">
                      {pinnedMessage.viewer_profiles
                        ? `${pinnedMessage.viewer_profiles.first_name} ${pinnedMessage.viewer_profiles.last_name}`
                        : pinnedMessage.sender_id === 'streamer'
                        ? 'Host'
                        : 'Anonymous'}
                    </span>
                    <span className="text-xs text-purple-400 font-bold">PINNED</span>
                  </div>
                  <p className="text-sm text-white/90 break-words">{pinnedMessage.message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent space-y-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(168, 85, 247, 0.3) transparent' }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full"></div>
              <MessageSquare className="relative w-12 h-12 text-purple-300/40" />
            </div>
            <p className="text-purple-200/50 text-sm">No messages yet</p>
            <p className="text-purple-300/40 text-xs mt-1">Be the first to chat!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === viewerId;
              const isHost = message.sender_id === 'streamer';
              const displayName = message.viewer_profiles
                ? `${message.viewer_profiles.first_name} ${message.viewer_profiles.last_name}`
                : isHost
                ? 'Host'
                : 'Anonymous';
              const messageTime = new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative ${
                    message.is_private
                      ? 'bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-transparent backdrop-blur-xl border border-purple-400/30 rounded-xl p-3'
                      : 'hover:bg-white/5 rounded-lg p-2 transition-colors'
                  }`}
                >
                  {/* Liquid glass effect for private messages */}
                  {message.is_private && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl pointer-events-none"></div>
                  )}

                  <div className="relative">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {message.is_private && (
                        <Lock className="w-3 h-3 text-purple-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${
                        isHost
                          ? 'text-purple-400 font-bold'
                          : isOwnMessage
                          ? 'text-purple-200'
                          : 'text-gray-300'
                      }`}>
                        {displayName}
                        {isOwnMessage && !isHost && ' (You)'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {messageTime}
                      </span>
                      {message.is_private && (
                        <span className="text-xs text-purple-400 font-medium">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/90 break-words leading-relaxed">
                      {message.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Liquid Glass Input Section */}
      <div className="relative p-4 border-t border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl">
        {/* Ambient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative space-y-3">
          {/* Private Message Toggle */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={togglePrivate}
              disabled={isSending}
              className={`group relative px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 overflow-hidden ${
                isPrivateMessage
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {/* Button background with liquid glass effect */}
              <div className={`absolute inset-0 transition-all duration-300 ${
                isPrivateMessage
                  ? 'bg-gradient-to-r from-purple-600/90 via-purple-500/80 to-purple-600/90 opacity-100'
                  : 'bg-white/10 opacity-0 group-hover:opacity-100'
              }`}></div>

              {/* Glass shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50"></div>

              <div className="relative flex items-center gap-2">
                {isPrivateMessage ? (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Private to Host</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>Public Message</span>
                  </>
                )}
              </div>
            </button>

            {isPrivateMessage && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs text-purple-300"
              >
                Only host will see this
              </motion.span>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSend} className="relative">
            <div className="relative group">
              {/* Input container with liquid glass effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border transition-all duration-300 ${
                isPrivateMessage
                  ? 'border-purple-400/50 shadow-lg shadow-purple-500/20'
                  : 'border-white/20 group-focus-within:border-purple-400/50'
              }`}></div>

              {/* Glass shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent rounded-2xl pointer-events-none"></div>

              <div className="relative flex gap-2 p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isPrivateMessage ? "Private message to host..." : "Type a message..."}
                  disabled={!connected || isSending}
                  className="flex-1 px-4 py-3 bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !connected || isSending}
                  className="relative group/btn p-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
                >
                  {/* Button background */}
                  <div className={`absolute inset-0 transition-all duration-300 ${
                    isPrivateMessage
                      ? 'bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600'
                      : 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600'
                  } group-hover/btn:scale-110 group-disabled/btn:scale-100`}></div>

                  {/* Glass shine */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>

                  <Send className={`relative w-4 h-4 text-white transition-transform ${
                    isSending ? 'animate-pulse' : 'group-hover/btn:translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </form>

          {/* Connection Status */}
          {!connected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span className="text-xs text-red-400/80">
                Reconnecting to chat...
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
});

DesktopChatSidebar.displayName = 'DesktopChatSidebar';

export default DesktopChatSidebar;
