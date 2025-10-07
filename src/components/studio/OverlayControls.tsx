'use client';

import { useState } from 'react';
import { CelebrationControls } from './CelebrationControls';
import { CelebrationState } from '../overlay/CelebrationOverlay';

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
    link?: string;
  };
  socialProof: {
    visible: boolean;
    type: 'viewer-count' | 'recent-signups' | 'testimonials';
    position: 'top-right' | 'bottom-left';
  };
  engageMax: any;
  celebrations: {
    enabled: boolean;
    currentCelebration?: CelebrationState;
  };
}

interface OverlayControlsProps {
  overlayState: OverlayState;
  onUpdate: (updates: Partial<OverlayState>) => void;
  connected?: boolean;
  connectionStatus?: string;
}

export function OverlayControls({ overlayState, onUpdate, connected = true, connectionStatus }: OverlayControlsProps) {
  const [activeSection, setActiveSection] = useState<string>('lowerThirds');

  const sections = [
    { id: 'lowerThirds', name: 'Lower Thirds', icon: '🏷️' },
    { id: 'countdown', name: 'Countdown Timer', icon: '⏰' },
    { id: 'registrationCTA', name: 'Registration CTA', icon: '🎯' },
    { id: 'socialProof', name: 'Social Proof', icon: '👥' },
    { id: 'celebrations', name: 'Celebrations', icon: '🎉' }
  ];

  return (
    <div className="p-5 space-y-6">
      {/* Connection Warning */}
      {!connected && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <p className="text-red-400 text-sm font-medium">
              Cannot broadcast overlays - WebSocket disconnected
            </p>
          </div>
          <p className="text-red-300 text-xs mt-1">
            Overlays will work locally but won't reach viewers
          </p>
        </div>
      )}

      {/* Section Selector */}
      <div className="grid grid-cols-3 gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`p-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeSection === section.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'bg-slate-700/60 text-gray-300 hover:bg-slate-600/60 hover:text-white'
            }`}
          >
            <div className="text-xl mb-2">{section.icon}</div>
            <div className="leading-tight">{section.name}</div>
          </button>
        ))}
      </div>

      {/* Lower Thirds Controls */}
      {activeSection === 'lowerThirds' && (
        <div className="space-y-6 bg-slate-800/30 rounded-xl p-5 border border-slate-700/30">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Lower Third</h3>
            <label className={`relative inline-flex items-center ${connected ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
              <input
                type="checkbox"
                checked={overlayState.lowerThirds.visible}
                onChange={(e) => {
                  if (connected) {
                    onUpdate({
                      lowerThirds: { ...overlayState.lowerThirds, visible: e.target.checked }
                    });
                  }
                }}
                disabled={!connected}
                className="sr-only peer"
              />
              <div className={`w-12 h-7 ${connected ? 'bg-slate-600' : 'bg-slate-700'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all ${connected ? 'peer-checked:bg-purple-600' : 'peer-checked:bg-gray-600'} shadow-lg`}></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3">Main Text</label>
              <input
                type="text"
                value={overlayState.lowerThirds.text}
                onChange={(e) => {
                  if (connected) {
                    onUpdate({
                      lowerThirds: { ...overlayState.lowerThirds, text: e.target.value }
                    });
                  }
                }}
                disabled={!connected}
                className={`w-full px-4 py-3 ${connected ? 'bg-slate-700/60 border-slate-600/50' : 'bg-slate-800/60 border-slate-700/50'} border rounded-xl text-white focus:outline-none ${connected ? 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' : ''} transition-all ${!connected ? 'cursor-not-allowed opacity-60' : ''}`}
                placeholder={connected ? "Enter main text" : "Connection required"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subtext</label>
              <input
                type="text"
                value={overlayState.lowerThirds.subtext}
                onChange={(e) => onUpdate({
                  lowerThirds: { ...overlayState.lowerThirds, subtext: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                placeholder="Enter subtext"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <select
                value={overlayState.lowerThirds.position}
                onChange={(e) => onUpdate({
                  lowerThirds: { ...overlayState.lowerThirds, position: e.target.value as any }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
              >
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
              <div className="grid grid-cols-3 gap-2">
                {['minimal', 'branded', 'elegant'].map((style) => (
                  <button
                    key={style}
                    onClick={() => onUpdate({
                      lowerThirds: { ...overlayState.lowerThirds, style: style as any }
                    })}
                    className={`p-2 rounded text-xs font-medium capitalize ${
                      overlayState.lowerThirds.style === style
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Countdown Timer Controls */}
      {activeSection === 'countdown' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Countdown Timer</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={overlayState.countdown.visible}
                onChange={(e) => onUpdate({
                  countdown: { ...overlayState.countdown, visible: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Time</label>
              <input
                type="datetime-local"
                value={overlayState.countdown.targetTime}
                onChange={(e) => onUpdate({
                  countdown: { ...overlayState.countdown, targetTime: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <input
                type="text"
                value={overlayState.countdown.message}
                onChange={(e) => onUpdate({
                  countdown: { ...overlayState.countdown, message: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                placeholder="Countdown message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
              <div className="grid grid-cols-3 gap-2">
                {['digital', 'analog', 'text'].map((style) => (
                  <button
                    key={style}
                    onClick={() => onUpdate({
                      countdown: { ...overlayState.countdown, style: style as any }
                    })}
                    className={`p-2 rounded text-xs font-medium capitalize ${
                      overlayState.countdown.style === style
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Time Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '5 min', minutes: 5 },
                { label: '10 min', minutes: 10 },
                { label: '30 min', minutes: 30 }
              ].map(({ label, minutes }) => (
                <button
                  key={label}
                  onClick={() => {
                    const targetTime = new Date(Date.now() + minutes * 60000);
                    onUpdate({
                      countdown: {
                        ...overlayState.countdown,
                        targetTime: targetTime.toISOString().slice(0, -1),
                        visible: true
                      }
                    });
                  }}
                  className="p-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                >
                  +{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Registration CTA Controls */}
      {activeSection === 'registrationCTA' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Registration CTA</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={overlayState.registrationCTA.visible}
                onChange={(e) => onUpdate({
                  registrationCTA: { ...overlayState.registrationCTA, visible: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Headline</label>
              <input
                type="text"
                value={overlayState.registrationCTA.headline}
                onChange={(e) => onUpdate({
                  registrationCTA: { ...overlayState.registrationCTA, headline: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                placeholder="CTA headline"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Button Text</label>
              <input
                type="text"
                value={overlayState.registrationCTA.buttonText}
                onChange={(e) => onUpdate({
                  registrationCTA: { ...overlayState.registrationCTA, buttonText: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                placeholder="Button text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Link URL (Optional)
                <span className="text-gray-400 text-xs ml-2">Viewers can click to visit</span>
              </label>
              <input
                type="url"
                value={overlayState.registrationCTA.link || ''}
                onChange={(e) => onUpdate({
                  registrationCTA: { ...overlayState.registrationCTA, link: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                placeholder="https://example.com or example.com"
              />
              <p className="text-xs text-gray-400 mt-1">
                💡 Tip: Enter a registration page, product link, or any URL
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Urgency Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={overlayState.registrationCTA.urgency}
                  onChange={(e) => onUpdate({
                    registrationCTA: { ...overlayState.registrationCTA, urgency: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Social Proof Controls */}
      {activeSection === 'socialProof' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Social Proof</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={overlayState.socialProof.visible}
                onChange={(e) => onUpdate({
                  socialProof: { ...overlayState.socialProof, visible: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={overlayState.socialProof.type}
                onChange={(e) => onUpdate({
                  socialProof: { ...overlayState.socialProof, type: e.target.value as any }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
              >
                <option value="viewer-count">Viewer Count</option>
                <option value="recent-signups">Recent Signups</option>
                <option value="testimonials">Testimonials</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <select
                value={overlayState.socialProof.position}
                onChange={(e) => onUpdate({
                  socialProof: { ...overlayState.socialProof, position: e.target.value as any }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
              >
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Celebrations Controls */}
      {activeSection === 'celebrations' && (
        <CelebrationControls
          enabled={overlayState.celebrations.enabled}
          onToggleEnabled={(enabled) => onUpdate({
            celebrations: { ...overlayState.celebrations, enabled }
          })}
          onTriggerCelebration={(celebration) => onUpdate({
            celebrations: { ...overlayState.celebrations, currentCelebration: celebration }
          })}
        />
      )}

      {/* Quick Actions */}
      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-white font-medium mb-3">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              // Hide all overlays
              onUpdate({
                lowerThirds: { ...overlayState.lowerThirds, visible: false },
                countdown: { ...overlayState.countdown, visible: false },
                registrationCTA: { ...overlayState.registrationCTA, visible: false },
                socialProof: { ...overlayState.socialProof, visible: false }
              });
            }}
            className="p-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
          >
            Hide All
          </button>
          <button
            onClick={() => {
              // Show essential overlays
              onUpdate({
                lowerThirds: { ...overlayState.lowerThirds, visible: true },
                socialProof: { ...overlayState.socialProof, visible: true, type: 'viewer-count' }
              });
            }}
            className="p-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
          >
            Show Essentials
          </button>
        </div>
      </div>
    </div>
  );
}