'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if device prefers reduced performance mode
 * Returns true for:
 * - Mobile devices (iPhone, Android)
 * - Users with prefers-reduced-motion enabled
 * - Devices with reduced performance capabilities
 */
export function usePerformanceMode() {
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;

      return isMobileDevice || (hasTouch && isSmallScreen);
    };

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check if low-end device (basic heuristic)
    const isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;

    const mobile = checkMobile();
    setIsMobile(mobile);
    setIsLowPerformance(mobile || prefersReducedMotion || isLowEnd);

    // Listen for orientation/resize changes
    const handleResize = () => {
      const mobile = checkMobile();
      setIsMobile(mobile);
      setIsLowPerformance(mobile || prefersReducedMotion || isLowEnd);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isLowPerformance,
    isMobile,
    shouldReduceAnimations: isLowPerformance,
    shouldDisableBlur: isLowPerformance
  };
}
