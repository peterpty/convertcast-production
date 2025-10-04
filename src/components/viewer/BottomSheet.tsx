'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface BottomSheetProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  peekHeight?: number;
  maxHeight?: number;
  onOpenChange?: (open: boolean) => void;
}

export function BottomSheet({
  children,
  defaultOpen = false,
  peekHeight = 60,
  maxHeight = 80, // percentage of viewport
  onOpenChange,
}: BottomSheetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Calculate heights
  const closedHeight = 0;
  const peekedHeight = peekHeight;
  const openHeight = typeof window !== 'undefined' ? (window.innerHeight * maxHeight) / 100 : 500;

  useEffect(() => {
    const height = isOpen ? openHeight : peekedHeight;
    controls.start({
      y: `calc(100% - ${height}px)`,
      transition: { type: 'spring', damping: 30, stiffness: 300 },
    });
  }, [isOpen, openHeight, peekedHeight, controls]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);

    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Determine next state based on drag
    if (velocity > 500 || offset > 100) {
      // Swipe down - close or minimize
      const newState = false;
      setIsOpen(newState);
      onOpenChange?.(newState);
    } else if (velocity < -500 || offset < -100) {
      // Swipe up - open
      const newState = true;
      setIsOpen(newState);
      onOpenChange?.(newState);
    } else {
      // Return to current state
      controls.start({
        y: `calc(100% - ${isOpen ? openHeight : peekedHeight}px)`,
        transition: { type: 'spring', damping: 30, stiffness: 300 },
      });
    }
  };

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleOpen}
        />
      )}

      {/* Bottom Sheet */}
      <motion.div
        ref={sheetRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ y: `calc(100% - ${peekedHeight}px)` }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-slate-900/95 to-slate-950/98 backdrop-blur-xl border-t border-purple-500/30 rounded-t-3xl shadow-2xl z-50 md:hidden"
        style={{
          height: '100dvh',
          touchAction: isDragging ? 'none' : 'auto',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing"
          onClick={toggleOpen}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-1.5 bg-purple-400/50 rounded-full" />
            <div className="flex items-center gap-2 text-purple-300/70 text-sm">
              {isOpen ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Swipe down to minimize</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Swipe up for chat</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{
            height: `calc(${openHeight}px - 60px)`,
            maxHeight: `calc(100dvh - ${peekedHeight + 60}px)`,
          }}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}
