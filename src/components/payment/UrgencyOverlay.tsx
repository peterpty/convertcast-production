'use client';

import { useState, useEffect } from 'react';
import { PaymentOffer } from '@/lib/payment/paymentEngine';
import { ViewerProfile } from '@/lib/ai/scoringEngine';

interface UrgencyOverlayProps {
  offer: PaymentOffer;
  viewer: ViewerProfile;
  onTriggerCheckout: () => void;
  onDismiss: () => void;
  position?: 'top' | 'center' | 'bottom';
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
}

interface ScarcityIndicatorProps {
  remaining: number;
  total: number;
  message: string;
  animated?: boolean;
}

const ScarcityIndicator = ({ remaining, total, message, animated = true }: ScarcityIndicatorProps) => {
  const percentage = (remaining / total) * 100;
  const isLow = percentage < 20;
  const isCritical = percentage < 10;

  return (
    <div className="relative bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl border border-red-300/30 rounded-3xl p-4 mb-4"
         style={{
           backdropFilter: 'blur(20px)',
           WebkitBackdropFilter: 'blur(20px)',
         }}>
      {/* Floating glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-400/20 to-orange-400/20 animate-pulse"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-bold text-sm tracking-wide flex items-center space-x-2"
                style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
            <span className="text-red-400">🔥</span>
            <span>{message}</span>
          </span>
          <div className="flex items-center space-x-2">
            <span className={`font-mono text-xl font-bold ${isCritical ? 'text-red-300 animate-pulse' : isLow ? 'text-orange-300' : 'text-yellow-300'}`}>
              {remaining}
            </span>
            <span className="text-white/60 text-sm">left</span>
          </div>
        </div>

        {/* Instagram story-style progress bar */}
        <div className="relative">
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isCritical ? 'bg-gradient-to-r from-red-400 to-red-500' :
                isLow ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                'bg-gradient-to-r from-green-400 to-yellow-400'
              } ${animated ? 'animate-pulse' : ''}`}
              style={{
                width: `${Math.max(percentage, 5)}%`,
                boxShadow: isCritical ? '0 0 20px rgba(239, 68, 68, 0.6)' : isLow ? '0 0 15px rgba(251, 146, 60, 0.4)' : '0 0 10px rgba(34, 197, 94, 0.3)'
              }}
            />
          </div>

          {/* Glowing edges */}
          {isCritical && (
            <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-gradient-to-r from-red-400 to-red-500"></div>
          )}
        </div>

        {isCritical && (
          <div className="text-center mt-3 animate-bounce">
            <div className="inline-flex items-center space-x-1 px-3 py-1 bg-red-500/20 rounded-full border border-red-300/30">
              <span className="text-red-300 text-xs font-bold">⚠️</span>
              <span className="text-red-300 text-xs font-bold tracking-wide">ALMOST SOLD OUT</span>
              <span className="text-red-300 text-xs font-bold">⚠️</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CountdownTimerProps {
  timeLeft: number;
  onExpired: () => void;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}

const CountdownTimer = ({ timeLeft, onExpired, intensity }: CountdownTimerProps) => {
  const [seconds, setSeconds] = useState(timeLeft);

  useEffect(() => {
    if (seconds <= 0) {
      onExpired();
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onExpired]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return { display: `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`, unit: '' };
    }
    if (minutes > 0) {
      return { display: `${minutes}:${secs.toString().padStart(2, '0')}`, unit: 'min' };
    }
    return { display: secs.toString(), unit: 'sec' };
  };

  const timeDisplay = formatTime(seconds);
  const isCritical = seconds < 300; // Last 5 minutes
  const isUrgent = seconds < 60; // Last minute

  const getIntensityStyles = () => {
    switch (intensity) {
      case 'extreme':
        return {
          container: 'animate-bounce',
          timer: isUrgent ? 'text-red-300 text-4xl animate-pulse' : isCritical ? 'text-red-400 text-3xl' : 'text-orange-400 text-2xl',
          background: 'bg-gradient-to-r from-red-600 to-red-700',
          border: 'border-red-400'
        };
      case 'high':
        return {
          container: isCritical ? 'animate-pulse' : '',
          timer: isUrgent ? 'text-red-400 text-3xl animate-pulse' : isCritical ? 'text-orange-400 text-2xl' : 'text-yellow-400 text-xl',
          background: 'bg-gradient-to-r from-orange-600 to-red-600',
          border: 'border-orange-400'
        };
      case 'medium':
        return {
          container: '',
          timer: isCritical ? 'text-orange-400 text-2xl' : 'text-yellow-400 text-xl',
          background: 'bg-gradient-to-r from-yellow-600 to-orange-600',
          border: 'border-yellow-400'
        };
      default:
        return {
          container: '',
          timer: 'text-yellow-400 text-lg',
          background: 'bg-gradient-to-r from-blue-600 to-purple-600',
          border: 'border-blue-400'
        };
    }
  };

  const styles = getIntensityStyles();

  return (
    <div className={`relative backdrop-blur-xl border border-white/30 rounded-3xl p-6 text-center ${styles.container}`}
         style={{
           backdropFilter: 'blur(20px)',
           WebkitBackdropFilter: 'blur(20px)',
           background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(249, 115, 22, 0.2) 100%)'
         }}>
      {/* Floating glow effect */}
      <div className={`absolute inset-0 rounded-3xl ${styles.background} opacity-30 ${styles.container}`}></div>

      <div className="relative z-10">
        {/* Circular progress ring for Instagram style */}
        <div className="relative w-20 h-20 mx-auto mb-3">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
            <circle cx="40" cy="40" r="35" fill="none"
                    stroke={isUrgent ? '#EF4444' : isCritical ? '#F97316' : '#8B5CF6'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="220" strokeDashoffset={`${220 * (1 - (seconds % 60) / 60)}`}
                    className={isUrgent ? 'animate-pulse' : ''}/>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`font-mono font-bold ${styles.timer}`}
                 style={{ fontFamily: 'Inter, -apple-system, system-ui, monospace' }}>
              {timeDisplay.display}
            </div>
          </div>
        </div>

        <div className="text-white font-bold text-sm mb-2 tracking-wide"
             style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
          {isUrgent ? '🚨 FINAL SECONDS!' : isCritical ? '⏰ HURRY!' : '⌛ Limited Time'}
        </div>

        {timeDisplay.unit && (
          <div className="text-white/70 text-xs tracking-wide">{timeDisplay.unit}</div>
        )}

        {/* Particle effects */}
        {isUrgent && (
          <>
            <div className="absolute top-2 left-2 w-1 h-1 bg-red-400 rounded-full animate-ping"></div>
            <div className="absolute top-2 right-2 w-1 h-1 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </>
        )}
      </div>
    </div>
  );
};

export function UrgencyOverlay({
  offer,
  viewer,
  onTriggerCheckout,
  onDismiss,
  position = 'center',
  intensity = 'medium'
}: UrgencyOverlayProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    // Add pulse animation based on intensity
    const pulseInterval = setInterval(() => {
      setShowPulse(prev => !prev);
    }, intensity === 'extreme' ? 500 : intensity === 'high' ? 1000 : 2000);

    return () => clearInterval(pulseInterval);
  }, [intensity]);

  const handleExpired = () => {
    setTimeout(() => {
      onDismiss();
    }, 2000);
  };

  if (dismissed) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
  };

  const getIntensityClasses = () => {
    switch (intensity) {
      case 'extreme':
        return 'border-red-500 bg-gradient-to-b from-red-900/95 to-black/95 shadow-red-500/50';
      case 'high':
        return 'border-orange-500 bg-gradient-to-b from-orange-900/95 to-black/95 shadow-orange-500/50';
      case 'medium':
        return 'border-yellow-500 bg-gradient-to-b from-yellow-900/90 to-black/90 shadow-yellow-500/30';
      default:
        return 'border-blue-500 bg-gradient-to-b from-blue-900/90 to-black/90 shadow-blue-500/30';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className={`absolute ${getPositionClasses()} pointer-events-auto animate-bounce-in`}>
        <div className={`relative backdrop-blur-xl border border-white/30 rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-500 ${showPulse && intensity === 'extreme' ? 'animate-pulse' : ''}`}
             style={{
               backdropFilter: 'blur(20px)',
               WebkitBackdropFilter: 'blur(20px)',
               background: intensity === 'extreme'
                 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 127, 0.2) 50%, rgba(147, 51, 234, 0.2) 100%)'
                 : intensity === 'high'
                 ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(168, 85, 247, 0.2) 100%)'
                 : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(249, 115, 22, 0.2) 100%)'
             }}>
          {/* Instagram-style close button */}
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss();
            }}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 backdrop-blur-sm transition-all duration-200 transform hover:scale-110"
            style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}
          >
            ×
          </button>

          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-2xl mb-2">
              {intensity === 'extreme' ? '🚨' : intensity === 'high' ? '🔥' : intensity === 'medium' ? '⚡' : '💎'}
            </div>
            <h2 className="text-white text-xl font-bold">
              {offer.name}
            </h2>
            <p className="text-gray-300 text-sm mt-1">
              {offer.description}
            </p>
          </div>

          {/* Countdown Timer */}
          {offer.urgency.enabled && offer.urgency.timeLeft && (
            <div className="mb-4">
              <CountdownTimer
                timeLeft={offer.urgency.timeLeft}
                onExpired={handleExpired}
                intensity={intensity}
              />
            </div>
          )}

          {/* Scarcity Indicator */}
          {offer.scarcity.enabled && offer.scarcity.remaining && (
            <ScarcityIndicator
              remaining={offer.scarcity.remaining}
              total={offer.scarcity.remaining + 50} // Simulate total
              message={offer.scarcity.message}
              animated={intensity === 'high' || intensity === 'extreme'}
            />
          )}

          {/* Pricing Display */}
          <div className="bg-black/50 rounded-xl p-4 mb-4 text-center">
            {offer.discountPercentage && offer.discountPercentage > 0 && (
              <div className="mb-2">
                <span className={`
                  px-3 py-1 rounded-full text-sm font-bold
                  ${intensity === 'extreme' ? 'bg-red-600 text-white animate-pulse' :
                    intensity === 'high' ? 'bg-orange-600 text-white' :
                    'bg-yellow-600 text-black'}
                `}>
                  {offer.discountPercentage}% OFF
                </span>
              </div>
            )}

            <div className="flex items-center justify-center space-x-3">
              {offer.discountPercentage && offer.discountPercentage > 0 && (
                <span className="text-gray-400 line-through text-lg">
                  {offer.currency === 'USD' ? '$' : '€'}{offer.basePrice}
                </span>
              )}
              <span className="text-white text-3xl font-bold">
                {offer.currency === 'USD' ? '$' : '€'}{offer.finalPrice}
              </span>
            </div>

            {offer.discountPercentage && offer.discountPercentage > 0 && (
              <p className="text-green-400 text-sm mt-2 font-medium">
                Save {offer.currency === 'USD' ? '$' : '€'}{offer.basePrice - offer.finalPrice}!
              </p>
            )}
          </div>

          {/* Instagram-style Action Button */}
          <button
            onClick={onTriggerCheckout}
            className={`relative w-full py-5 rounded-full font-bold text-lg transition-all transform hover:scale-105 group overflow-hidden
              ${intensity === 'extreme' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' :
                intensity === 'high' ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' :
                intensity === 'medium' ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' :
                'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'}
              text-white shadow-2xl ${intensity === 'extreme' ? 'animate-pulse' : ''}
            `}
            style={{
              boxShadow: intensity === 'extreme' ? '0 10px 40px rgba(239, 68, 68, 0.4)' :
                         intensity === 'high' ? '0 10px 40px rgba(251, 146, 60, 0.3)' :
                         '0 10px 40px rgba(139, 92, 246, 0.2)'
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform -skew-x-12 group-hover:animate-shimmer"></div>

            <div className="relative flex items-center justify-center space-x-3">
              {intensity === 'extreme' && <span className="animate-bounce text-xl">🚀</span>}
              <span className="tracking-wide drop-shadow-md"
                    style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                {intensity === 'extreme' ? 'CLAIM NOW!' :
                 intensity === 'high' ? 'GET INSTANT ACCESS' :
                 intensity === 'medium' ? 'Start Now' :
                 'Learn More'}
              </span>

              {/* Sparkle effects */}
              <div className="absolute top-1 right-4 w-1 h-1 bg-white/80 rounded-full animate-ping"></div>
              <div className="absolute bottom-1 left-4 w-1 h-1 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-4 mt-4 text-gray-400 text-xs">
            <div className="flex items-center space-x-1">
              <span>🔒</span>
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>⚡</span>
              <span>Instant</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🛡️</span>
              <span>Guaranteed</span>
            </div>
          </div>

          {/* Intensity-specific messages */}
          {intensity === 'extreme' && (
            <div className="text-center mt-3">
              <p className="text-red-300 text-xs font-bold animate-pulse">
                ⚠️ THIS PRICE WILL NEVER BE AVAILABLE AGAIN!
              </p>
            </div>
          )}

          {viewer.intentScore >= 90 && (
            <div className="text-center mt-3">
              <p className="text-purple-300 text-xs">
                🎯 VIP Access: You qualify for our most exclusive program
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Preset configurations for different urgency levels
export const urgencyPresets = {
  low: {
    intensity: 'low' as const,
    position: 'bottom' as const
  },
  medium: {
    intensity: 'medium' as const,
    position: 'center' as const
  },
  high: {
    intensity: 'high' as const,
    position: 'center' as const
  },
  extreme: {
    intensity: 'extreme' as const,
    position: 'center' as const
  }
};