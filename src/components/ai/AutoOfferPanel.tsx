'use client';

import { useState, useEffect } from 'react';
import { ViewerProfile } from '@/lib/ai/scoringEngine';
import { autoOfferEngine, OfferTrigger, OfferTemplate } from '@/lib/ai/autoOfferEngine';

interface AutoOfferPanelProps {
  viewers: ViewerProfile[];
  onTriggerOverlay: (action: string, data: any) => void;
}

export function AutoOfferPanel({ viewers, onTriggerOverlay }: AutoOfferPanelProps) {
  const [triggers, setTriggers] = useState<OfferTrigger[]>([]);
  const [activeOffers, setActiveOffers] = useState<Map<string, OfferTrigger>>(new Map());
  const [config, setConfig] = useState(autoOfferEngine.getConfig());
  const [analytics, setAnalytics] = useState(autoOfferEngine.getPerformanceAnalytics());
  const [autoMode, setAutoMode] = useState(true);

  // Auto-analyze viewers for offer opportunities
  useEffect(() => {
    if (!autoMode) return;

    const interval = setInterval(() => {
      const newTriggers: OfferTrigger[] = [];

      viewers.forEach(viewer => {
        const trigger = autoOfferEngine.analyzeViewer(viewer);
        if (trigger) {
          newTriggers.push(trigger);

          // Auto-execute high confidence offers
          if (trigger.confidence >= 0.8) {
            handleTriggerOffer(trigger);
          }
        }
      });

      if (newTriggers.length > 0) {
        setTriggers(prev => [...prev.slice(-19), ...newTriggers].slice(-20)); // Keep last 20
      }

      // Update analytics
      setAnalytics(autoOfferEngine.getPerformanceAnalytics());
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [viewers, autoMode]);

  const handleTriggerOffer = (trigger: OfferTrigger) => {
    // Trigger overlay with offer
    onTriggerOverlay('show-auto-offer', {
      trigger,
      template: trigger.offerTemplate,
      viewerId: trigger.viewerId,
      confidence: trigger.confidence
    });

    // Track as active offer
    setActiveOffers(prev => new Map(prev.set(trigger.viewerId, trigger)));

    // Mark as viewed (auto-tracking)
    setTimeout(() => {
      autoOfferEngine.handleOfferInteraction(trigger.viewerId, 'viewed');
    }, 1000);
  };

  const handleManualTrigger = (viewer: ViewerProfile, offerType: 'jackpot' | 'hot' | 'warm' | 'nurture') => {
    const offers = config.offers;
    let template: OfferTemplate;

    switch (offerType) {
      case 'jackpot':
        template = offers.jackpotOffer;
        break;
      case 'hot':
        template = offers.hotLeadOffer;
        break;
      case 'warm':
        template = offers.warmLeadOffer;
        break;
      case 'nurture':
        template = offers.nurturingOffer;
        break;
    }

    const trigger: OfferTrigger = {
      id: `manual-${viewer.id}-${Date.now()}`,
      viewerId: viewer.id,
      offerTemplate: template,
      triggerTime: new Date(),
      triggerReason: 'Manual trigger by streamer',
      confidence: 1.0,
      context: {
        viewerScore: viewer.intentScore,
        engagementTime: viewer.engagementTime,
        lastActivity: viewer.lastActivity,
        previousOffers: 0
      }
    };

    handleTriggerOffer(trigger);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getOfferColor = (template: OfferTemplate) => {
    switch (template.style) {
      case 'urgent': return 'border-red-500 bg-red-900/20';
      case 'premium': return 'border-purple-500 bg-purple-900/20';
      case 'exclusive': return 'border-yellow-500 bg-yellow-900/20';
      default: return 'border-green-500 bg-green-900/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg flex items-center">
            🎯 AutoOffer™ Engine
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${autoMode ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <label className="text-white text-sm flex items-center">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                className="mr-2"
              />
              Auto Mode
            </label>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-2">
            <div className="text-white font-bold text-lg">{analytics.totalTriggers}</div>
            <div className="text-blue-200 text-xs">OFFERS</div>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-2">
            <div className="text-white font-bold text-lg">{Math.round(analytics.conversionRate * 100)}%</div>
            <div className="text-green-200 text-xs">CONVERSION</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-2">
            <div className="text-white font-bold text-lg">{formatCurrency(analytics.totalRevenue).replace('$', '')}</div>
            <div className="text-yellow-200 text-xs">REVENUE</div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-2">
            <div className="text-white font-bold text-sm">{activeOffers.size}</div>
            <div className="text-purple-200 text-xs">ACTIVE</div>
          </div>
        </div>
      </div>

      {/* Recent Triggers */}
      {triggers.length > 0 && (
        <div className="p-3 border-b border-gray-700">
          <div className="text-purple-400 font-bold text-sm mb-2">
            ⚡ Recent Triggers
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {triggers.slice(-5).reverse().map((trigger, index) => (
              <div key={trigger.id} className="text-xs bg-gray-800 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-white">{trigger.offerTemplate.name}</span>
                  <span className={`font-mono ${getConfidenceColor(trigger.confidence)}`}>
                    {Math.round(trigger.confidence * 100)}%
                  </span>
                </div>
                <div className="text-gray-400">
                  {trigger.triggerReason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Viewers */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-orange-400 font-bold text-sm mb-3">
          🎯 Offer Opportunities
        </div>

        <div className="space-y-2">
          {viewers
            .filter(v => v.intentScore >= 40)
            .sort((a, b) => b.intentScore - a.intentScore)
            .slice(0, 10)
            .map((viewer) => {
              const isActive = activeOffers.has(viewer.id);
              const trigger = autoOfferEngine.analyzeViewer(viewer);
              const shouldShow = trigger?.confidence >= 0.5;

              return (
                <div
                  key={viewer.id}
                  className={`bg-gray-800 rounded-xl p-3 border-l-4 ${
                    isActive ? 'border-yellow-500 bg-yellow-900/10' :
                    shouldShow ? 'border-green-500' : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-white font-medium text-sm">{viewer.name}</div>
                      <div className="text-gray-400 text-xs">Score: {viewer.intentScore}</div>
                    </div>
                    {trigger && (
                      <div className="text-right">
                        <div className={`text-sm font-mono ${getConfidenceColor(trigger.confidence)}`}>
                          {Math.round(trigger.confidence * 100)}%
                        </div>
                        <div className="text-gray-400 text-xs">confidence</div>
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <div className="mb-2 p-2 bg-yellow-900/20 rounded border border-yellow-600">
                      <div className="text-yellow-400 text-xs font-bold">🎯 ACTIVE OFFER</div>
                      <div className="text-white text-xs">{activeOffers.get(viewer.id)?.offerTemplate.name}</div>
                    </div>
                  )}

                  {shouldShow && !isActive && (
                    <div className="mb-2 p-2 bg-green-900/20 rounded border border-green-600">
                      <div className="text-green-400 text-xs font-bold">✅ READY FOR OFFER</div>
                      <div className="text-white text-xs">{trigger.triggerReason}</div>
                    </div>
                  )}

                  {/* Manual Trigger Buttons */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleManualTrigger(viewer, 'jackpot')}
                      disabled={isActive}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs py-1 px-2 rounded font-medium transition-colors"
                    >
                      🎰 Jackpot
                    </button>
                    <button
                      onClick={() => handleManualTrigger(viewer, 'hot')}
                      disabled={isActive}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white text-xs py-1 px-2 rounded font-medium transition-colors"
                    >
                      🔥 Hot
                    </button>
                    <button
                      onClick={() => handleManualTrigger(viewer, 'warm')}
                      disabled={isActive}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-xs py-1 px-2 rounded font-medium transition-colors"
                    >
                      🌡️ Warm
                    </button>
                    <button
                      onClick={() => handleManualTrigger(viewer, 'nurture')}
                      disabled={isActive}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs py-1 px-2 rounded font-medium transition-colors"
                    >
                      🎁 Nurture
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Offer Templates */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="text-purple-400 font-medium text-sm mb-2">
          📋 Offer Templates:
        </div>
        <div className="space-y-1">
          {Object.entries(config.offers).map(([key, offer]) => (
            <div key={offer.id} className={`text-xs p-2 rounded border ${getOfferColor(offer)}`}>
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{offer.name}</span>
                <span className="text-green-400">
                  {formatCurrency(offer.pricing.offerPrice)}
                </span>
              </div>
              <div className="text-gray-400">
                {offer.headline}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <span>Best: {analytics.bestPerformingOffer}</span>
          <span>Auto-trigger at 80%+ confidence</span>
        </div>
      </div>
    </div>
  );
}