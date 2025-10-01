'use client';

import { useState, useEffect, useRef } from 'react';
import { convertCastAI, ViewerProfile, IntentLevel } from '@/lib/ai/scoringEngine';

interface HotLeadPanelProps {
  viewers: ViewerProfile[];
  onTriggerOverlay: (action: string, data: any) => void;
}

export function HotLeadPanel({ viewers, onTriggerOverlay }: HotLeadPanelProps) {
  const [animatingScores, setAnimatingScores] = useState<Map<string, boolean>>(new Map());
  const [selectedLead, setSelectedLead] = useState<ViewerProfile | null>(null);
  const [showActions, setShowActions] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sort viewers by intent score
  const sortedViewers = viewers
    .filter(v => v.intentScore >= 40) // Only show lukewarm and above
    .sort((a, b) => b.intentScore - a.intentScore);

  const hotLeads = viewers.filter(v => v.intentScore >= 75);
  const jackpotLeads = viewers.filter(v => v.intentScore >= 90);

  // Generate insights
  const insights = convertCastAI.generateStreamInsights(viewers);

  useEffect(() => {
    // Simulate real-time score updates
    intervalRef.current = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of score update
        const randomViewer = viewers[Math.floor(Math.random() * viewers.length)];
        if (randomViewer) {
          setAnimatingScores(prev => new Map(prev).set(randomViewer.id, true));
          setTimeout(() => {
            setAnimatingScores(prev => {
              const newMap = new Map(prev);
              newMap.delete(randomViewer.id);
              return newMap;
            });
          }, 2000);
        }
      }
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [viewers]);

  const handleLeadClick = (viewer: ViewerProfile) => {
    setSelectedLead(viewer);
    setShowActions(true);
  };

  const handleActionClick = (action: string, viewer: ViewerProfile) => {
    // Trigger overlay based on action
    if (action.includes('offer') || action.includes('discount')) {
      onTriggerOverlay('show-offer', {
        viewerId: viewer.id,
        offerType: viewer.intentScore >= 90 ? 'premium' : 'standard',
        urgency: viewer.intentScore >= 90
      });
    } else if (action.includes('chat')) {
      onTriggerOverlay('highlight-chat', { viewerId: viewer.id });
    } else if (action.includes('CTA')) {
      onTriggerOverlay('show-cta', {
        viewerId: viewer.id,
        ctaType: viewer.intentScore >= 75 ? 'urgent' : 'standard'
      });
    }
    
    setShowActions(false);
  };

  const getScoreMeterStyle = (score: number, isAnimating: boolean) => {
    const level = convertCastAI.getIntentLevel(score);
    const color = convertCastAI.getIntentColor(level);
    const rotation = (score / 100) * 180; // Semi-circle meter
    
    return {
      background: `conic-gradient(from 180deg, ${color} 0deg, ${color} ${rotation}deg, #374151 ${rotation}deg)`,
      transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
      transition: isAnimating ? 'transform 0.3s ease-in-out' : 'none'
    };
  };

  const getIntentEmoji = (level: IntentLevel): string => {
    switch (level) {
      case 'JACKPOT': return '🎰';
      case 'HOT_LEAD': return '🔥';
      case 'WARM': return '🌡️';
      case 'LUKEWARM': return '💧';
      case 'COLD': return '❄️';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header with Stats */}
      <div className="p-5 border-b border-slate-700/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center">
            🎯 AI Hot Leads Engine
          </h2>
          <div className="text-green-300 text-sm font-semibold bg-green-900/30 px-3 py-1 rounded-full border border-green-700/50">
            {insights.totalViewers} viewers
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-3 border border-red-500/30">
            <div className="text-white font-bold text-xl">{jackpotLeads.length}</div>
            <div className="text-red-200 text-xs font-semibold">JACKPOT</div>
          </div>
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-3 border border-orange-500/30">
            <div className="text-white font-bold text-xl">{hotLeads.length}</div>
            <div className="text-orange-200 text-xs font-semibold">HOT LEADS</div>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-3 border border-green-500/30">
            <div className="text-white font-bold text-xl">${Math.round(insights.revenueProjection).toLocaleString()}</div>
            <div className="text-green-200 text-xs font-semibold">PROJECTED</div>
          </div>
        </div>
      </div>

      {/* Urgent Actions */}
      {insights.urgentActions.length > 0 && (
        <div className="p-4 bg-red-900/40 border-b border-red-700/50">
          <div className="text-red-300 font-bold text-sm mb-3 animate-pulse">
            ⚡ URGENT ACTIONS REQUIRED
          </div>
          {insights.urgentActions.map((action, index) => (
            <div key={index} className="text-red-200 text-sm mb-2 animate-bounce bg-red-900/30 p-2 rounded-lg" style={{ animationDelay: `${index * 0.2}s` }}>
              {action}
            </div>
          ))}
        </div>
      )}

      {/* Viewer Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedViewers.map((viewer) => {
          const level = convertCastAI.getIntentLevel(viewer.intentScore);
          const isAnimating = animatingScores.get(viewer.id) || false;
          const timing = convertCastAI.predictOptimalTiming(viewer);
          const actions = convertCastAI.generateSuggestedActions(viewer);
          
          return (
            <div
              key={viewer.id}
              className={`relative bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border-l-4 cursor-pointer transition-all duration-300 hover:bg-slate-700/60 hover:scale-[1.02] ${
                level === 'JACKPOT' ? 'border-red-500 animate-pulse shadow-lg shadow-red-500/20' :
                level === 'HOT_LEAD' ? 'border-orange-500 shadow-lg shadow-orange-500/20' :
                level === 'WARM' ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' :
                'border-blue-500 shadow-lg shadow-blue-500/20'
              }`}
              onClick={() => handleLeadClick(viewer)}
            >
              {/* Casino-style score meter */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full border-4 border-slate-600 flex items-center justify-center shadow-lg"
                      style={getScoreMeterStyle(viewer.intentScore, isAnimating)}
                    >
                      <div className="text-white font-bold text-base">{viewer.intentScore}</div>
                    </div>
                    {isAnimating && (
                      <div className="absolute inset-0 rounded-full border-4 border-white animate-ping"></div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-semibold text-base">{viewer.name}</span>
                      <span className="text-xl">{getIntentEmoji(level)}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        level === 'JACKPOT' ? 'bg-red-600 text-white animate-pulse' :
                        level === 'HOT_LEAD' ? 'bg-orange-600 text-white' :
                        level === 'WARM' ? 'bg-yellow-600 text-black' :
                        'bg-blue-600 text-white'
                      }`}>
                        {level}
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm">{viewer.email}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white text-base font-bold">
                    {Math.round(timing.confidence * 100)}%
                  </div>
                  <div className="text-gray-300 text-sm font-medium">{timing.timing}</div>
                </div>
              </div>
              
              {/* Engagement Metrics */}
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div className="bg-slate-700/50 p-2 rounded-lg text-center">
                  <div className="text-gray-300 text-xs mb-1">Time</div>
                  <div className="text-white font-semibold">{Math.floor(viewer.engagementTime / 60)}m</div>
                </div>
                <div className="bg-slate-700/50 p-2 rounded-lg text-center">
                  <div className="text-gray-300 text-xs mb-1">Actions</div>
                  <div className="text-white font-semibold">{viewer.interactions}</div>
                </div>
                <div className="bg-slate-700/50 p-2 rounded-lg text-center">
                  <div className="text-gray-300 text-xs mb-1">LTV</div>
                  <div className="text-green-400 font-semibold">${viewer.aiPredictions.lifetimeValue}</div>
                </div>
              </div>

              {/* AI Signals */}
              <div className="flex flex-wrap gap-2 mb-3">
                {viewer.signals.slice(0, 2).map((signal, index) => (
                  <span key={index} className="bg-purple-600/30 text-purple-200 text-xs px-3 py-1.5 rounded-full border border-purple-500/50">
                    {signal}
                  </span>
                ))}
                {viewer.signals.length > 2 && (
                  <span className="text-gray-300 text-xs bg-slate-700/50 px-2 py-1 rounded-full">+{viewer.signals.length - 2} more</span>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2">
                {actions.slice(0, 2).map((action, index) => {
                  const emoji = action.split(' ')[0];
                  const text = action.substring(2);
                  return (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(action, viewer);
                      }}
                      className={`flex-1 text-sm py-2 px-3 rounded-lg font-semibold transition-all ${
                        level === 'JACKPOT' ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30' :
                        level === 'HOT_LEAD' ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/30' :
                        'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30'
                      }`}
                    >
                      {emoji} {text.slice(0, 12)}...
                    </button>
                  );
                })}
              </div>
              
              {/* Timing Indicator */}
              {timing.timing === 'immediate' && (
                <div className="absolute top-2 right-2">
                  <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                    ⚡ NOW!
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Recommendations */}
      <div className="p-5 bg-slate-800/50 border-t border-slate-700/30">
        <div className="text-purple-300 font-bold text-base mb-3 flex items-center">
          🤖 AI Recommendations
        </div>
        <div className="space-y-2">
          {insights.recommendations.slice(0, 2).map((rec, index) => (
            <div key={index} className="text-gray-200 text-sm flex items-start bg-slate-700/30 p-3 rounded-lg">
              <span className="text-purple-400 mr-3 text-base">•</span>
              {rec}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4 text-sm">
          <div className="bg-slate-700/50 px-3 py-2 rounded-lg">
            <span className="text-gray-300">Conv. Rate: </span>
            <span className="text-white font-bold">{Math.round(insights.conversionProbability * 100)}%</span>
          </div>
          <div className="bg-slate-700/50 px-3 py-2 rounded-lg">
            <span className="text-gray-300">Avg Score: </span>
            <span className="text-green-400 font-bold">{insights.averageScore}</span>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActions && selectedLead && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">{selectedLead.name}</h3>
              <button
                onClick={() => setShowActions(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {convertCastAI.generateSuggestedActions(selectedLead).map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(action, selectedLead)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}