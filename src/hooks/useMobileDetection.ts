'use client';

import { useState, useEffect } from 'react';

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

      setState({
        isMobile,
        isTouch,
        screenSize,
      });

      console.log('📱 Mobile Detection:', {
        isMobile,
        isTouch,
        screenSize,
        minDimension,
        maxDimension,
        userAgent: isMobileUA,
        hasCoarsePointer,
      });
    };

    // Initial detection
    detectMobile();

    // Re-detect on resize (but state should remain consistent due to logic)
    window.addEventListener('resize', detectMobile);
    window.addEventListener('orientationchange', detectMobile);

    return () => {
      window.removeEventListener('resize', detectMobile);
      window.removeEventListener('orientationchange', detectMobile);
    };
  }, []);

  return state;
}
