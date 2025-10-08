'use client';

import { useState, useEffect, useRef } from 'react';

export interface KeyboardState {
  isOpen: boolean;
  height: number;
}

export function useKeyboardDetection(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
  });

  // Track previous state to prevent unnecessary updates
  const prevStateRef = useRef<KeyboardState>(keyboardState);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Visual Viewport API for keyboard detection
    const handleViewportResize = () => {
      if (!window.visualViewport) return;

      const viewport = window.visualViewport;
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const viewportOffsetTop = viewport.offsetTop || 0;
      const isLandscape = window.innerWidth > window.innerHeight;

      // Keyboard is considered open if viewport height is significantly smaller than window height
      // Threshold: 60% for landscape (smaller keyboards), 75% for portrait
      const threshold = isLandscape ? 0.60 : 0.75;
      const isKeyboardOpen = viewportHeight < windowHeight * threshold || viewportOffsetTop > 0;

      // Calculate actual keyboard height accounting for iOS viewport offset
      const keyboardHeight = isKeyboardOpen
        ? Math.max(windowHeight - viewportHeight, viewportOffsetTop + (windowHeight - viewportHeight))
        : 0;

      const newState: KeyboardState = {
        isOpen: isKeyboardOpen,
        height: keyboardHeight,
      };

      // CRITICAL FIX: Only update state if values actually changed
      // Round height to prevent minor pixel differences from causing updates
      const prevState = prevStateRef.current;
      const heightDiff = Math.abs(prevState.height - newState.height);

      if (prevState.isOpen !== newState.isOpen || heightDiff > 10) {
        // Clear any pending update
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }

        // Debounce state updates slightly to prevent rapid changes during animation
        updateTimerRef.current = setTimeout(() => {
          prevStateRef.current = newState;
          setKeyboardState(newState);
        }, 50);
      }
    };

    // Fallback for browsers without visualViewport API
    const handleWindowResize = () => {
      if (window.visualViewport) return; // Skip if visualViewport is available

      const currentHeight = window.innerHeight;
      const screenHeight = window.screen.height;

      // Simple heuristic: keyboard is open if window height is much smaller than screen
      const isKeyboardOpen = currentHeight < screenHeight * 0.6;
      const keyboardHeight = isKeyboardOpen ? screenHeight - currentHeight : 0;

      const newState: KeyboardState = {
        isOpen: isKeyboardOpen,
        height: keyboardHeight,
      };

      // Only update if changed
      const prevState = prevStateRef.current;
      const heightDiff = Math.abs(prevState.height - newState.height);

      if (prevState.isOpen !== newState.isOpen || heightDiff > 10) {
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }

        updateTimerRef.current = setTimeout(() => {
          prevStateRef.current = newState;
          setKeyboardState(newState);
        }, 50);
      }
    };

    // Use visualViewport API if available (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);

      // Initial check
      handleViewportResize();

      return () => {
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportResize);
          window.visualViewport.removeEventListener('scroll', handleViewportResize);
        }
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleWindowResize);

      // Initial check
      handleWindowResize();

      return () => {
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }
        window.removeEventListener('resize', handleWindowResize);
      };
    }
  }, []);

  return keyboardState;
}
