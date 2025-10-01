'use client';

import { motion } from 'framer-motion';

interface ConvertCastLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConvertCastLogo({ size = 'md', className = '' }: ConvertCastLogoProps) {
  const dimensions = {
    sm: { container: 32, icon: 20 },
    md: { container: 40, icon: 24 },
    lg: { container: 48, icon: 28 }
  };

  const { container, icon } = dimensions[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <motion.div
        className="relative rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 shadow-lg"
        style={{
          width: container,
          height: container
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-400/30 to-transparent" />

        {/* Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            className="text-white"
          >
            <path
              d="M8 5.14v13.72a1 1 0 0 0 1.5.87l11-6.86a1 1 0 0 0 0-1.74L9.5 4.27A1 1 0 0 0 8 5.14z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Shine Effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </motion.div>

      {/* Logo Text */}
      <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
        ConvertCast
      </span>
    </div>
  );
}