'use client';

import { useEffect, useState } from 'react';
import { CelebrationOverlay, CelebrationState } from './CelebrationOverlay';

interface OverlayState {
  lowerThirds: {
    visible: boolean;
    text: string;
    subtext: string;
    position: 'bottom-left' | 'bottom-center' | 'bottom-right';
    style: 'minimal' | 'branded' | 'elegant';
  };
  countdown: {
    visible: boolean;
    targetTime: string;
    message: string;
    style: 'digital' | 'analog' | 'text';
  };
  registrationCTA: {
    visible: boolean;
    headline: string;
    buttonText: string;
    urgency: boolean;
    position: 'top-center' | 'bottom-center' | 'side';
  };
  socialProof: {
    visible: boolean;
    type: 'viewer-count' | 'recent-signups' | 'testimonials';
    position: 'top-right' | 'bottom-left';
  };
  engageMax: {
    currentPoll: {
      id: string | null;
      question: string;
      options: string[];
      visible: boolean;
    };
    reactions: {
      enabled: boolean;
      position: 'floating' | 'bottom-bar';
    };
    smartCTA: {
      visible: boolean;
      message: string;
      action: string;
      trigger: 'time' | 'engagement' | 'manual';
    };
  };
  celebrations: {
    enabled: boolean;
    currentCelebration?: CelebrationState;
  };
}

interface ReactionItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
  timestamp: number;
}

interface OverlayRendererProps {
  overlayState: OverlayState;
  viewerCount: number;
  streamId: string;
  connected: boolean;
  reactions?: ReactionItem[];
}

export function OverlayRenderer({ overlayState, viewerCount, streamId, connected, reactions = [] }: OverlayRendererProps) {
  const [countdown, setCountdown] = useState('');

  // Update countdown timer
  useEffect(() => {
    if (overlayState.countdown.visible && overlayState.countdown.targetTime) {
      const interval = setInterval(() => {
        const target = new Date(overlayState.countdown.targetTime);
        const now = new Date();
        const diff = target.getTime() - now.getTime();

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setCountdown('00:00:00');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [overlayState.countdown.visible, overlayState.countdown.targetTime]);

  // Note: Reactions are now managed by parent component

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'top-center': return 'top-16 left-1/2 transform -translate-x-1/2';
      case 'top-right': return 'top-16 right-16';
      case 'bottom-left': return 'bottom-16 left-16';
      case 'bottom-center': return 'bottom-16 left-1/2 transform -translate-x-1/2';
      case 'bottom-right': return 'bottom-16 right-16';
      case 'side': return 'top-1/2 right-16 transform -translate-y-1/2';
      default: return 'bottom-16 left-16';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Lower Thirds - Instagram Style */}
      {overlayState.lowerThirds.visible && (
        <div className={`absolute ${getPositionClasses(overlayState.lowerThirds.position)} pointer-events-none animate-slide-up`}>
          <div className={`px-8 py-5 rounded-3xl backdrop-blur-xl shadow-2xl transform hover:scale-102 transition-all duration-500 ${
            overlayState.lowerThirds.style === 'branded'
              ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border border-white/30'
              : overlayState.lowerThirds.style === 'elegant'
                ? 'bg-black/40 border border-white/20'
                : 'bg-white/15 border border-white/25'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            <div className="text-white font-bold text-2xl mb-2 tracking-wide drop-shadow-lg"
                 style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
              {overlayState.lowerThirds.text}
            </div>
            <div className="text-white/90 text-lg tracking-wide drop-shadow-md">
              {overlayState.lowerThirds.subtext}
            </div>
          </div>
        </div>
      )}

      {/* Countdown Timer - Instagram Style */}
      {overlayState.countdown.visible && countdown && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 pointer-events-none animate-bounce-in">
          <div className="relative bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 backdrop-blur-xl border border-white/30 rounded-3xl px-10 py-6 text-center shadow-2xl"
               style={{
                 backdropFilter: 'blur(20px)',
                 WebkitBackdropFilter: 'blur(20px)',
               }}>
            {/* Glowing ring effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/30 to-pink-400/30 animate-pulse"></div>

            <div className="relative z-10">
              <div className="text-white font-bold text-lg mb-3 drop-shadow-lg tracking-wide"
                   style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                {overlayState.countdown.message}
              </div>

              {/* Circular progress ring */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4"/>
                  <circle cx="64" cy="64" r="58" fill="none"
                          stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray="364" strokeDashoffset="100"
                          className="animate-pulse"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6"/>
                      <stop offset="50%" stopColor="#EC4899"/>
                      <stop offset="100%" stopColor="#F97316"/>
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`font-bold text-3xl text-white drop-shadow-lg ${
                    overlayState.countdown.style === 'digital' ? 'font-mono' : ''
                  }`} style={{ fontFamily: overlayState.countdown.style === 'digital' ? 'monospace' : 'Inter, -apple-system, system-ui, sans-serif' }}>
                    {countdown}
                  </div>
                </div>
              </div>

              {/* Particle effects */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration CTA - Instagram Style */}
      {overlayState.registrationCTA.visible && (
        <div className={`absolute ${getPositionClasses(overlayState.registrationCTA.position)} pointer-events-auto animate-bounce-in`}>
          <div className={`relative px-8 py-6 rounded-3xl backdrop-blur-xl shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer group ${
            overlayState.registrationCTA.urgency
              ? 'bg-gradient-to-r from-red-500/20 via-pink-500/20 to-orange-500/20 border border-red-300/50'
              : 'bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-green-500/20 border border-white/30'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            {/* Floating glow effect */}
            <div className={`absolute inset-0 rounded-3xl ${
              overlayState.registrationCTA.urgency
                ? 'bg-gradient-to-r from-red-400/20 to-orange-400/20'
                : 'bg-gradient-to-r from-purple-400/20 to-blue-400/20'
            } ${overlayState.registrationCTA.urgency ? 'animate-pulse' : 'group-hover:animate-pulse'}`}></div>

            <div className="relative z-10">
              <div className="text-white font-bold text-xl mb-4 text-center drop-shadow-lg tracking-wide"
                   style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                {overlayState.registrationCTA.headline}
              </div>

              {/* Pill-shaped button */}
              <div className={`relative overflow-hidden rounded-full px-8 py-4 text-center transform transition-all duration-300 group-hover:scale-105 ${
                overlayState.registrationCTA.urgency
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:animate-shimmer"></div>

                <span className="relative text-white font-bold text-lg drop-shadow-md tracking-wide"
                      style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                  {overlayState.registrationCTA.buttonText}
                </span>

                {/* Micro-animation sparkles */}
                <div className="absolute top-1 right-3">
                  <div className="w-1 h-1 bg-white/80 rounded-full animate-ping"></div>
                </div>
                <div className="absolute bottom-1 left-3">
                  <div className="w-1 h-1 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </div>
              </div>

              {overlayState.registrationCTA.urgency && (
                <div className="text-center mt-3 animate-bounce">
                  <div className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-300/30">
                    <span className="text-yellow-200 text-sm font-bold">⚡</span>
                    <span className="text-yellow-200 text-sm font-bold tracking-wide">LIMITED TIME</span>
                    <span className="text-yellow-200 text-sm font-bold">⚡</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Social Proof - Instagram Style */}
      {overlayState.socialProof.visible && (
        <div className={`absolute ${getPositionClasses(overlayState.socialProof.position)} pointer-events-none animate-slide-in-right`}>
          <div className="relative bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl px-6 py-4 shadow-2xl"
               style={{
                 backdropFilter: 'blur(20px)',
                 WebkitBackdropFilter: 'blur(20px)',
               }}>
            {/* Instagram notification style pulse */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></div>

            {overlayState.socialProof.type === 'viewer-count' && (
              <div className="flex items-center space-x-3">
                {/* Profile pic stack effect */}
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👥</span>
                  </div>
                  <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>

                <div>
                  <div className="text-white/80 text-sm tracking-wide"
                       style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                    Live Viewers
                  </div>
                  <div className="text-white font-bold text-xl animate-pulse drop-shadow-lg">
                    {viewerCount.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {overlayState.socialProof.type === 'recent-signups' && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-lg">🎉</span>
                </div>

                <div>
                  <div className="text-white/80 text-sm tracking-wide"
                       style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                    New Members Today
                  </div>
                  <div className="text-white font-bold text-xl">
                    <span className="text-green-400">+247</span>
                  </div>
                </div>
              </div>
            )}

            {overlayState.socialProof.type === 'testimonials' && (
              <div className="max-w-xs">
                <div className="flex items-center space-x-2 mb-2">
                  {/* Profile picture with gradient border */}
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full p-0.5">
                    <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xs">
                      SM
                    </div>
                  </div>

                  {/* Instagram-style stars */}
                  <div className="flex space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-white text-sm font-medium mb-1 drop-shadow-md"
                     style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                  "Game changing! 🚀"
                </div>
                <div className="text-white/70 text-xs tracking-wide">
                  Sarah M. • Verified
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EngageMax Poll */}
      {overlayState.engageMax.currentPoll.visible && overlayState.engageMax.currentPoll.question && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-black/95 border-4 border-purple-500 rounded-xl p-6 shadow-2xl max-w-lg">
            <div className="text-center mb-4">
              <div className="text-purple-400 font-bold text-sm mb-2">📊 LIVE POLL</div>
              <div className="text-white font-bold text-xl mb-4">{overlayState.engageMax.currentPoll.question}</div>
              
              <div className="space-y-2">
                {overlayState.engageMax.currentPoll.options.map((option, index) => {
                  // Handle both string and object formats
                  const optionText = typeof option === 'string' ? option : option.text || option;
                  return (
                    <div key={index} className="bg-purple-600/30 border border-purple-400 rounded-lg p-3 text-left hover:bg-purple-600/50 cursor-pointer transition-colors">
                      <span className="text-white font-medium">{index + 1}. {optionText}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 text-gray-400 text-sm">
                Visit stream to participate!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart CTA - Instagram Style */}
      {overlayState.engageMax.smartCTA.visible && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-auto animate-bounce-in">
          <div className="relative bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 backdrop-blur-xl border border-white/30 rounded-3xl px-8 py-6 shadow-2xl group hover:scale-105 transition-all duration-500"
               style={{
                 backdropFilter: 'blur(20px)',
                 WebkitBackdropFilter: 'blur(20px)',
               }}>
            {/* Floating glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-orange-400/30 animate-pulse"></div>

            <div className="relative z-10 text-center">
              <div className="text-white font-bold text-xl mb-4 drop-shadow-lg tracking-wide"
                   style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                {overlayState.engageMax.smartCTA.message}
              </div>

              {/* Instagram-style pill button */}
              <div className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-8 py-4 cursor-pointer transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                {/* Shimmer animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform -skew-x-12 group-hover:animate-shimmer"></div>

                <div className="relative flex items-center justify-center space-x-2">
                  <span className="text-white font-bold text-lg drop-shadow-md tracking-wide"
                        style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
                    ACT NOW
                  </span>
                  <div className="w-2 h-2 bg-white/80 rounded-full animate-ping"></div>
                </div>

                {/* Micro-interactions */}
                <div className="absolute top-0 left-1/4 w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
                <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
              </div>

              {/* Heart animation like Instagram Live */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="animate-bounce text-red-500 text-xl" style={{ animationDelay: '0.2s' }}>💖</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Reactions - Instagram Style */}
      {overlayState.engageMax.reactions.enabled && overlayState.engageMax.reactions.position === 'floating' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {reactions.map((reaction) => (
            <div
              key={reaction.id}
              className="absolute animate-heart-float"
              style={{
                left: `${reaction.x}%`,
                top: `${reaction.y}%`,
                fontSize: '2rem',
                opacity: Math.max(0, 1 - (Date.now() - reaction.timestamp) / 10000),
                animationDuration: '4s',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}
            >
              {/* Instagram-style heart with glow */}
              <div className="relative">
                <div className="absolute inset-0 blur-sm opacity-50">{reaction.emoji}</div>
                <div className="relative">{reaction.emoji}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Bar Reactions - Instagram Style */}
      {overlayState.engageMax.reactions.enabled && overlayState.engageMax.reactions.position === 'bottom-bar' && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xl rounded-full px-8 py-4 flex space-x-6 border border-white/20"
               style={{
                 backdropFilter: 'blur(20px)',
                 WebkitBackdropFilter: 'blur(20px)',
               }}>
            {['❤️', '👍', '👏', '🔥', '😍', '🤯'].map((emoji, index) => (
              <div
                key={index}
                className="relative text-2xl transform hover:scale-125 transition-transform duration-200"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Glow effect */}
                <div className="absolute inset-0 blur-sm opacity-60 animate-pulse"
                     style={{ animationDelay: `${index * 0.3}s` }}>
                  {emoji}
                </div>

                {/* Main emoji with bounce */}
                <div className="relative animate-bounce"
                     style={{
                       animationDelay: `${index * 0.2}s`,
                       filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
                     }}>
                  {emoji}
                </div>

                {/* Sparkle effect */}
                {index % 2 === 0 && (
                  <div className="absolute -top-1 -right-1 w-1 h-1 bg-white/80 rounded-full animate-ping"
                       style={{ animationDelay: `${index * 0.4}s` }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Celebrations Overlay */}
      {overlayState.celebrations.enabled && overlayState.celebrations.currentCelebration && (
        <CelebrationOverlay
          celebration={overlayState.celebrations.currentCelebration}
          onComplete={() => {
            // Clear the celebration after it completes
            // This would typically be handled by the parent component
            console.log('Celebration completed');
          }}
        />
      )}

      {/* Connection Status Indicator (for debugging) */}
      {!connected && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-sm">
          ⚠️ Disconnected
        </div>
      )}
    </div>
  );
}