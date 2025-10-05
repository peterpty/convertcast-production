'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Smartphone } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';

export interface RotateScreenProps {
  forceShow?: boolean;
  className?: string;
}

export function RotateScreen({ forceShow = false, className = '' }: RotateScreenProps) {
  const orientation = useOrientation();

  // Show rotate prompt if in portrait mode
  const shouldShow = forceShow || orientation.isPortrait;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-950 backdrop-blur-xl flex items-center justify-center ${className}`}
        >
          <div className="text-center px-8 max-w-md">
            {/* Rotating Phone Icon */}
            <motion.div
              animate={{
                rotate: [0, -90, -90, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'easeInOut',
              }}
              className="mb-8 relative mx-auto w-24 h-24"
            >
              <div className="absolute inset-0 bg-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border-2 border-purple-500/30 shadow-2xl">
                <Smartphone className="w-12 h-12 text-purple-300 mx-auto" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent"
            >
              Rotate Your Device
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-purple-200/80 mb-6"
            >
              For the best viewing experience, please rotate your device to landscape mode
            </motion.p>

            {/* Rotating Arrow Icon */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full border border-purple-400/30"
            >
              <RotateCw className="w-8 h-8 text-purple-400" />
            </motion.div>

            {/* Helper Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-sm text-purple-300/60"
            >
              Turn off rotation lock if needed
            </motion.p>
          </div>

          {/* Ambient Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
