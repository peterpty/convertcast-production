'use client';

import { useState, useEffect } from 'react';

export interface KeyboardState {
  isOpen: boolean;
  height: number;
}

export function useKeyboardDetection(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Visual Viewport API for keyboard detection
    const handleViewportResize = () => {
      if (!window.visualViewport) return;

      const viewport = window.visualViewport;
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;

      // Keyboard is considered open if viewport height is significantly smaller than window height
      // Threshold: 75% of window height
      const isKeyboardOpen = viewportHeight < windowHeight * 0.75;
      const keyboardHeight = isKeyboardOpen ? windowHeight - viewportHeight : 0;

      setKeyboardState({
        isOpen: isKeyboardOpen,
        height: keyboardHeight,
      });
    };

    // Fallback for browsers without visualViewport API
    const handleWindowResize = () => {
      if (window.visualViewport) return; // Skip if visualViewport is available

      const currentHeight = window.innerHeight;
      const screenHeight = window.screen.height;

      // Simple heuristic: keyboard is open if window height is much smaller than screen
      const isKeyboardOpen = currentHeight < screenHeight * 0.6;
      const keyboardHeight = isKeyboardOpen ? screenHeight - currentHeight : 0;

      setKeyboardState({
        isOpen: isKeyboardOpen,
        height: keyboardHeight,
      });
    };

    // Use visualViewport API if available (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);

      // Initial check
      handleViewportResize();

      return () => {
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
        window.removeEventListener('resize', handleWindowResize);
      };
    }
  }, []);

  return keyboardState;
}
