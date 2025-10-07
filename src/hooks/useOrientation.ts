import { useState, useEffect, useRef } from 'react';

export type OrientationType = 'portrait' | 'landscape';

export interface OrientationState {
  type: OrientationType;
  angle: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

export function useOrientation(): OrientationState {
  const getOrientation = (): OrientationState => {
    if (typeof window === 'undefined') {
      return {
        type: 'portrait',
        angle: 0,
        isLandscape: false,
        isPortrait: true,
      };
    }

    const orientation = window.screen?.orientation?.type;
    const angle = window.screen?.orientation?.angle || 0;

    // Fallback to window dimensions if orientation API not available
    const isLandscape = orientation
      ? orientation.includes('landscape')
      : window.innerWidth > window.innerHeight;

    return {
      type: isLandscape ? 'landscape' : 'portrait',
      angle,
      isLandscape,
      isPortrait: !isLandscape,
    };
  };

  const [orientation, setOrientation] = useState<OrientationState>(getOrientation);

  // Track previous state to prevent unnecessary updates
  const prevStateRef = useRef<OrientationState>(orientation);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation = getOrientation();

      // CRITICAL FIX: Only update state if values actually changed
      const prevState = prevStateRef.current;
      if (
        prevState.type !== newOrientation.type ||
        prevState.angle !== newOrientation.angle ||
        prevState.isLandscape !== newOrientation.isLandscape ||
        prevState.isPortrait !== newOrientation.isPortrait
      ) {
        prevStateRef.current = newOrientation;
        setOrientation(newOrientation);
      }
    };

    // Debounced resize handler (for fallback mode)
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }

      // Debounce resize events by 150ms
      resizeTimerRef.current = setTimeout(() => {
        handleOrientationChange();
      }, 150);
    };

    // Listen to orientation change events
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Fallback to resize event for browsers without orientation API (debounced)
    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return orientation;
}
