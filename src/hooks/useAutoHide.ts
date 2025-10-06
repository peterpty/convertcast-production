'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AutoHideOptions {
  /** Time in milliseconds before hiding (default: 3000) */
  timeout?: number;
  /** Initially visible (default: true) */
  initiallyVisible?: boolean;
}

export interface AutoHideResult {
  /** Whether controls should be visible */
  isVisible: boolean;
  /** Show the controls */
  show: () => void;
  /** Hide the controls */
  hide: () => void;
  /** Toggle visibility */
  toggle: () => void;
}

/**
 * Hook to auto-hide UI elements after inactivity
 * Perfect for video player controls that should hide during playback
 */
export function useAutoHide(options: AutoHideOptions = {}): AutoHideResult {
  const { timeout = 3000, initiallyVisible = true } = options;
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const show = useCallback(() => {
    setIsVisible(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to hide
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, timeout);
  }, [timeout]);

  const hide = useCallback(() => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }, [isVisible, show, hide]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isVisible, show, hide, toggle };
}
