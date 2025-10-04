import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    // Listen to orientation change events
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Fallback to resize event for browsers without orientation API
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
}
