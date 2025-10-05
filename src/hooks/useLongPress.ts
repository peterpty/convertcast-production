'use client';

import { useCallback, useRef, useState } from 'react';

export interface LongPressOptions {
  threshold?: number; // ms before long press triggers
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

export interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useLongPress(
  callback: () => void,
  options: LongPressOptions = {}
): [boolean, LongPressHandlers] {
  const { threshold = 500, onStart, onFinish, onCancel } = options;
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const isPressed = useRef(false);

  const start = useCallback(() => {
    isPressed.current = true;
    setIsLongPressing(false);
    onStart?.();

    timerRef.current = setTimeout(() => {
      if (isPressed.current) {
        setIsLongPressing(true);
        callback();
        onFinish?.();

        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, threshold);
  }, [callback, threshold, onStart, onFinish]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    isPressed.current = false;
    setIsLongPressing(false);
    onCancel?.();
  }, [onCancel]);

  const handlers: LongPressHandlers = {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      start();
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.preventDefault();
      cancel();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      cancel();
    },
    onTouchStart: (e: React.TouchEvent) => {
      start();
    },
    onTouchEnd: (e: React.TouchEvent) => {
      cancel();
    },
  };

  return [isLongPressing, handlers];
}
