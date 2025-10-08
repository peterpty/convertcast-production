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
      className={`fixed bottom-20 right-4 z-[70] w-14 h-14 rounded-full
        bg-white/10 backdrop-blur-2xl border-2 border-white/20
        flex items-center justify-center
        hover:bg-white/15 active:bg-white/20
        transition-all shadow-2xl
        shadow-[0_0_30px_rgba(255,255,255,0.1)]
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
