'use client';

import { useEffect, useState } from 'react';

export interface LandscapeLockState {
  isLocked: boolean;
  isSupported: boolean;
  error: string | null;
  currentOrientation: OrientationType;
}

export function useLandscapeLock(): LandscapeLockState {
  const [state, setState] = useState<LandscapeLockState>({
    isLocked: false,
    isSupported: false,
    error: null,
    currentOrientation: 'unknown',
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Check if Screen Orientation API is supported
    const isSupported = 'orientation' in screen && 'lock' in screen.orientation;

    setState(prev => ({ ...prev, isSupported }));

    const attemptLock = async () => {
      if (!isSupported) {
        console.log('Screen Orientation Lock API not supported');
        return;
      }

      try {
        // Attempt to lock to landscape
        await screen.orientation.lock('landscape');
        console.log('✅ Successfully locked to landscape orientation');

        setState(prev => ({
          ...prev,
          isLocked: true,
          error: null,
          currentOrientation: screen.orientation.type as OrientationType,
        }));
      } catch (error) {
        // Lock failed - this is expected on desktop and some mobile browsers
        const errorMessage = error instanceof Error ? error.message : 'Failed to lock orientation';
        console.log('⚠️ Orientation lock not available:', errorMessage);

        setState(prev => ({
          ...prev,
          isLocked: false,
          error: errorMessage,
          currentOrientation: screen.orientation?.type as OrientationType || 'unknown',
        }));
      }
    };

    // Handle orientation changes
    const handleOrientationChange = () => {
      if (screen.orientation) {
        setState(prev => ({
          ...prev,
          currentOrientation: screen.orientation.type as OrientationType,
        }));
      }
    };

    // Try to lock when component mounts
    attemptLock();

    // Listen for orientation changes
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }

    // Cleanup: unlock on unmount
    return () => {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);

        // Unlock if we locked it
        if (state.isLocked && 'unlock' in screen.orientation) {
          screen.orientation.unlock();
          console.log('🔓 Unlocked screen orientation');
        }
      }
    };
  }, []);

  return state;
}
