'use client';

import { useState, useRef } from 'react';
import { CelebrationPreset, CelebrationState, defaultCelebrationPresets, replacePlaceholders } from '../overlay/CelebrationOverlay';

interface CelebrationControlsProps {
  onTriggerCelebration: (celebration: CelebrationState) => void;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

export function CelebrationControls({ onTriggerCelebration, enabled, onToggleEnabled }: CelebrationControlsProps) {
  const [presets, setPresets] = useState<CelebrationPreset[]>(
    defaultCelebrationPresets.map((preset, index) => ({
      id: `preset-${index}`,
      ...preset
    }))
  );

  const [showAdHocForm, setShowAdHocForm] = useState(false);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [showSoundSearch, setShowSoundSearch] = useState(false);

  const [adHocForm, setAdHocForm] = useState({
    gifUrl: '',
    soundUrl: '',
    message: '',
    displayDuration: 5,
    volume: 70,
    name: '[NAME]'
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleTriggerPreset = (preset: CelebrationPreset) => {
    const celebration: CelebrationState = {
      visible: true,
      gifUrl: preset.gifUrl,
      soundUrl: preset.soundUrl,
      message: replacePlaceholders(preset.message, { name: adHocForm.name }),
      displayDuration: 5,
      volume: 70
    };
    onTriggerCelebration(celebration);
  };

  const handleTriggerAdHoc = () => {
    const celebration: CelebrationState = {
      visible: true,
      gifUrl: adHocForm.gifUrl,
      soundUrl: adHocForm.soundUrl || undefined,
      message: replacePlaceholders(adHocForm.message, { name: adHocForm.name }),
      displayDuration: adHocForm.displayDuration,
      volume: adHocForm.volume
    };
    onTriggerCelebration(celebration);
    setShowAdHocForm(false);
  };

  const handleSavePreset = () => {
    if (presets.length >= 5) {
      alert('Maximum 5 presets allowed. Delete one to add another.');
      return;
    }

    const newPreset: CelebrationPreset = {
      id: `custom-${Date.now()}`,
      name: `Custom ${presets.length + 1}`,
      gifUrl: adHocForm.gifUrl,
      soundUrl: adHocForm.soundUrl || undefined,
      message: adHocForm.message
    };

    setPresets([...presets, newPreset]);
    setShowAdHocForm(false);
  };

  const handleDeletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
    if (selectedPresetId === id) {
      setSelectedPresetId('');
    }
  };

  const handlePreviewSound = async (soundUrl?: string) => {
    if (!soundUrl) return;

    if (audioRef.current) {
      audioRef.current.src = soundUrl;
      audioRef.current.volume = adHocForm.volume / 100;
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Failed to preview sound:', error);
      }
    }
  };

  return (
    <div className="space-y-6 bg-slate-800/30 rounded-xl p-5 border border-slate-700/30">
      {/* Header with Master Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎉</div>
          <h3 className="text-white font-bold text-lg">Celebrations</h3>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-7 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600 shadow-lg"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Preset Management Area */}
          <div className="space-y-4">
            <h4 className="text-gray-200 font-semibold text-sm uppercase tracking-wide">Preset Celebrations ({presets.length}/5)</h4>
            <div className="grid grid-cols-1 gap-3">
              {presets.map((preset) => (
                <div key={preset.id} className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded overflow-hidden bg-slate-600">
                        <img
                          src={preset.gifUrl}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="32" viewBox="0 0 48 32"><rect width="48" height="32" fill="%23374151"/><text x="24" y="16" text-anchor="middle" dominant-baseline="central" fill="%239CA3AF" font-size="8">GIF</text></svg>';
                          }}
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{preset.name}</div>
                        <div className="text-gray-400 text-xs truncate max-w-[200px]">{preset.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {preset.soundUrl && (
                        <button
                          onClick={() => handlePreviewSound(preset.soundUrl)}
                          className="p-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                          title="Preview Sound"
                        >
                          🔊
                        </button>
                      )}
                      <button
                        onClick={() => handleTriggerPreset(preset)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Trigger
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                        title="Delete Preset"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {presets.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <div className="text-4xl mb-2">🎭</div>
                  <div className="text-sm">No celebration presets yet</div>
                </div>
              )}
            </div>
          </div>

          {/* Ad-hoc Creation Form */}
          <div className="space-y-4">
            <button
              onClick={() => setShowAdHocForm(!showAdHocForm)}
              className="w-full px-4 py-3 bg-slate-700/60 hover:bg-slate-600/60 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>✨</span>
              <span>{showAdHocForm ? 'Hide' : 'Create'} Custom Celebration</span>
              <span className={`transform transition-transform ${showAdHocForm ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showAdHocForm && (
              <div className="bg-slate-700/30 rounded-xl p-4 space-y-4 border border-slate-600/30">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Name/Username</label>
                    <input
                      type="text"
                      value={adHocForm.name}
                      onChange={(e) => setAdHocForm({ ...adHocForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500/50 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Duration (seconds)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={adHocForm.displayDuration}
                      onChange={(e) => setAdHocForm({ ...adHocForm, displayDuration: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500/50 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Message</label>
                  <input
                    type="text"
                    value={adHocForm.message}
                    onChange={(e) => setAdHocForm({ ...adHocForm, message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500/50 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    placeholder="Use [NAME] for dynamic replacement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">GIF URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={adHocForm.gifUrl}
                      onChange={(e) => setAdHocForm({ ...adHocForm, gifUrl: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-600/60 border border-slate-500/50 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      placeholder="https://media.giphy.com/..."
                    />
                    <button
                      onClick={() => setShowGifSearch(!showGifSearch)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                    >
                      🔍 Search
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Sound URL (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={adHocForm.soundUrl}
                      onChange={(e) => setAdHocForm({ ...adHocForm, soundUrl: e.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-600/60 border border-slate-500/50 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      placeholder="https://example.com/sound.mp3"
                    />
                    <button
                      onClick={() => handlePreviewSound(adHocForm.soundUrl)}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                      disabled={!adHocForm.soundUrl}
                    >
                      🔊
                    </button>
                    <button
                      onClick={() => setShowSoundSearch(!showSoundSearch)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                    >
                      🔍 Search
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Volume: {adHocForm.volume}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={adHocForm.volume}
                    onChange={(e) => setAdHocForm({ ...adHocForm, volume: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                {/* Search Panels (Collapsed for now) */}
                {showGifSearch && (
                  <div className="bg-slate-600/30 rounded-lg p-3 border border-slate-500/30">
                    <div className="text-center text-gray-400 text-sm">
                      🚧 GIF Search integration coming soon!
                      <br />
                      <span className="text-xs">For now, use Giphy.com to find GIFs and paste the URL above</span>
                    </div>
                  </div>
                )}

                {showSoundSearch && (
                  <div className="bg-slate-600/30 rounded-lg p-3 border border-slate-500/30">
                    <div className="text-center text-gray-400 text-sm">
                      🚧 Sound Search integration coming soon!
                      <br />
                      <span className="text-xs">For now, use Freesound.org or similar to find sounds and paste the URL above</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleTriggerAdHoc}
                    disabled={!adHocForm.gifUrl || !adHocForm.message}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:text-gray-400 text-white font-medium rounded-lg transition-colors"
                  >
                    🎉 Trigger Now
                  </button>
                  <button
                    onClick={handleSavePreset}
                    disabled={!adHocForm.gifUrl || !adHocForm.message || presets.length >= 5}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:text-gray-400 text-white font-medium rounded-lg transition-colors"
                  >
                    💾 Save as Preset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Trigger Buttons */}
          <div className="space-y-3">
            <h4 className="text-gray-200 font-semibold text-sm uppercase tracking-wide">Quick Triggers</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTriggerPreset(presets[0] || {
                  id: 'default',
                  name: 'Big Win',
                  gifUrl: 'https://media.giphy.com/media/26tknCqiJrBQG6bxC/giphy.gif',
                  message: '🎉 AMAZING! 🎉'
                })}
                className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all transform hover:scale-105"
              >
                🏆 Big Win
              </button>
              <button
                onClick={() => handleTriggerPreset(presets[1] || {
                  id: 'default-follower',
                  name: 'New Follower',
                  gifUrl: 'https://media.giphy.com/media/3o7aCRloybJlXpNjSU/giphy.gif',
                  message: 'Welcome! Thanks for following! 💜'
                })}
                className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all transform hover:scale-105"
              >
                👋 New Follower
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hidden audio element for previewing sounds */}
      <audio ref={audioRef} />

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          background: #9f6aff;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          background: #9f6aff;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}