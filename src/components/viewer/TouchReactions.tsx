'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export interface Reaction {
  id: string;
  emoji: string;
  label: string;
  gradient: string;
}

export const defaultReactions: Reaction[] = [
  { id: 'heart', emoji: '❤️', label: 'Love', gradient: 'from-red-500 to-pink-500' },
  { id: 'fire', emoji: '🔥', label: 'Fire', gradient: 'from-orange-500 to-red-500' },
  { id: 'clap', emoji: '👏', label: 'Clap', gradient: 'from-yellow-500 to-orange-500' },
  { id: 'star', emoji: '⭐', label: 'Star', gradient: 'from-yellow-400 to-yellow-600' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket', gradient: 'from-blue-500 to-purple-500' },
  { id: 'hundred', emoji: '💯', label: '100', gradient: 'from-purple-500 to-pink-500' },
];

export interface TouchReactionsProps {
  reactions?: Reaction[];
  onReaction: (reactionId: string) => void;
  className?: string;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

export function TouchReactions({
  reactions = defaultReactions,
  onReaction,
  className = '',
}: TouchReactionsProps) {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleReaction = (reaction: Reaction) => {
    // Haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Trigger callback
    onReaction(reaction.id);

    // Create floating emoji
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newEmoji: FloatingEmoji = {
        id: `${reaction.id}-${Date.now()}`,
        emoji: reaction.emoji,
        x: Math.random() * rect.width,
        y: rect.height / 2,
      };

      setFloatingEmojis((prev) => [...prev, newEmoji]);

      // Remove after animation
      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
      }, 4000);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Reaction Buttons */}
      <div className="flex items-center justify-around gap-2 px-4 py-3 bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-xl border-y border-purple-500/20">
        {reactions.map((reaction) => (
          <motion.button
            key={reaction.id}
            onClick={() => handleReaction(reaction)}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            className="group relative"
            aria-label={reaction.label}
          >
            {/* Touch Target (44x44px minimum for accessibility) */}
            <div className="relative w-12 h-12 md:w-10 md:h-10 flex items-center justify-center">
              {/* Glow Effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${reaction.gradient} rounded-full opacity-0 group-hover:opacity-20 group-active:opacity-30 blur-lg transition-opacity`}
              />

              {/* Button Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-full border border-purple-400/20 group-hover:border-purple-400/40 group-active:scale-95 transition-all" />

              {/* Emoji */}
              <span className="relative text-2xl md:text-xl filter drop-shadow-lg">
                {reaction.emoji}
              </span>
            </div>

            {/* Tooltip (hidden on mobile, shown on desktop) */}
            <div className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm border border-purple-400/30 rounded-lg text-xs text-purple-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {reaction.label}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Floating Emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingEmojis.map((emoji) => (
          <motion.div
            key={emoji.id}
            initial={{ opacity: 0, y: emoji.y, x: emoji.x, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: emoji.y - 150,
              x: emoji.x + (Math.random() - 0.5) * 40,
              scale: [0.8, 1, 0.3],
              rotate: (Math.random() - 0.5) * 30,
            }}
            transition={{
              duration: 4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="absolute text-4xl filter drop-shadow-lg"
          >
            {emoji.emoji}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
