'use client';

import { useState, useEffect, useRef } from 'react';

export interface MobileDetectionState {
  isMobile: boolean;
  isTouch: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

export function useMobileDetection(): MobileDetectionState {
  const [state, setState] = useState<MobileDetectionState>({
    isMobile: false,
    isTouch: false,
    screenSize: 'desktop',
  });

  // Track previous state to prevent unnecessary updates
  const prevStateRef = useRef<MobileDetectionState>(state);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const detectMobile = () => {
      // Multi-factor mobile detection that survives rotation

      // 1. Check if touch device
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;

      // 2. Check screen dimensions (use smaller dimension to handle rotation)
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const maxDimension = Math.max(window.innerWidth, window.innerHeight);

      // 3. User agent check (fallback)
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

      // 4. Media query for pointer type
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

      // Mobile if:
      // - Has touch AND (small screen OR mobile UA OR coarse pointer)
      // - OR small screen with mobile UA
      const isMobile =
        (isTouch && (minDimension < 768 || isMobileUA || hasCoarsePointer)) ||
        (minDimension < 768 && isMobileUA);

      // Determine screen size category
      let screenSize: 'mobile' | 'tablet' | 'desktop';
      if (minDimension < 768) {
        screenSize = 'mobile';
      } else if (maxDimension < 1024) {
        screenSize = 'tablet';
      } else {
        screenSize = 'desktop';
      }

      const newState: MobileDetectionState = {
        isMobile,
        isTouch,
        screenSize,
      };

      // CRITICAL FIX: Only update state if values actually changed
      // This prevents re-renders from keyboard opening/closing
      const prevState = prevStateRef.current;
      if (
        prevState.isMobile !== newState.isMobile ||
        prevState.isTouch !== newState.isTouch ||
        prevState.screenSize !== newState.screenSize
      ) {
        console.log('📱 Mobile Detection Changed:', {
          from: prevState,
          to: newState,
          minDimension,
          maxDimension,
          userAgent: isMobileUA,
          hasCoarsePointer,
        });

        prevStateRef.current = newState;
        setState(newState);
      }
    };

    // Debounced resize handler to prevent rapid re-renders during keyboard animation
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }

      // Debounce resize events by 150ms
      resizeTimerRef.current = setTimeout(() => {
        detectMobile();
      }, 150);
    };

    // Initial detection
    detectMobile();

    // Re-detect on resize with debouncing
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', detectMobile); // No debounce for orientation change

    return () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', detectMobile);
    };
  }, []);

  return state;
}
