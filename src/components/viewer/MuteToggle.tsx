'use client';

import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

export interface MuteToggleProps {
  isMuted: boolean;
  onToggle: () => void;
  className?: string;
}

export function MuteToggle({ isMuted, onToggle, className = '' }: MuteToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={`fixed top-20 right-4 z-[60] w-12 h-12 rounded-full
        bg-black/60 backdrop-blur-xl border border-white/20
        flex items-center justify-center
        hover:bg-black/80 active:bg-black/90
        transition-all shadow-2xl
        ${className}`}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6 text-white" />
      ) : (
        <Volume2 className="w-6 h-6 text-white" />
      )}
    </motion.button>
  );
}
