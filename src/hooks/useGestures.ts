import { useEffect, useRef, useState } from 'react';

export interface SwipeDirection {
  direction: 'up' | 'down' | 'left' | 'right' | null;
  distance: number;
  velocity: number;
}

export interface GestureHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

export function useGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: GestureHandlers
) {
  const [swipeState, setSwipeState] = useState<SwipeDirection>({
    direction: null,
    distance: 0,
    velocity: 0,
  });

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const threshold = handlers.threshold || 50; // minimum distance for swipe
  const velocityThreshold = handlers.velocityThreshold || 0.3; // minimum velocity

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Calculate velocity
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Determine direction
      let direction: SwipeDirection['direction'] = null;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        direction = deltaY > 0 ? 'down' : 'up';
      } else {
        direction = deltaX > 0 ? 'right' : 'left';
      }

      setSwipeState({ direction, distance, velocity });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Calculate final velocity
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Check for double tap
      const now = Date.now();
      if (now - lastTapRef.current < 300 && distance < 10) {
        handlers.onDoubleTap?.();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }

      // Trigger swipe handlers
      if (distance >= threshold && velocity >= velocityThreshold) {
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          // Vertical swipe
          if (deltaY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        } else {
          // Horizontal swipe
          if (deltaX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        }
      }

      // Reset
      touchStartRef.current = null;
      setSwipeState({ direction: null, distance: 0, velocity: 0 });
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers, threshold, velocityThreshold]);

  return swipeState;
}
