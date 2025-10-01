'use client';

import { useState, useEffect } from 'react';
import { ViewerProfile } from '@/lib/ai/scoringEngine';
import {
  insightEngine,
  StreamPrediction,
  RealTimeSuggestion,
  RevenueAttribution,
  OptimizationRecommendation,
  InsightMetrics
} from '@/lib/ai/insightEngine';

interface InsightDashboardProps {
  viewers: ViewerProfile[];
  streamMetrics: any;
  onExecuteSuggestion: (suggestion: RealTimeSuggestion) => void;
}

export function InsightDashboard({ viewers, streamMetrics, onExecuteSuggestion }: InsightDashboardProps) {
  const [metrics, setMetrics] = useState<InsightMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<RealTimeSuggestion[]>([]);
  const [revenueAttribution, setRevenueAttribution] = useState<RevenueAttribution[]>([]);
  const [optimizations, setOptimizations] = useState<OptimizationRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'insights' | 'suggestions' | 'revenue' | 'optimizations'>('insights');
  const [executedSuggestions, setExecutedSuggestions] = useState<Set<string>>(new Set());

  // Update insights every 10 seconds
  useEffect(() => {
    const updateInsights = () => {
      const newMetrics = insightEngine.calculateInsightMetrics(viewers, streamMetrics);
      const newSuggestions = insightEngine.generateRealTimeSuggestions(viewers, streamMetrics);
      const newAttribution = insightEngine.calculateRevenueAttribution(viewers, streamMetrics?.totalRevenue || 0);
      const newOptimizations = insightEngine.generateOptimizationRecommendations(viewers, streamMetrics);

      setMetrics(newMetrics);
      setSuggestions(newSuggestions);
      setRevenueAttribution(newAttribution);
      setOptimizations(newOptimizations);
    };

    updateInsights();
    const interval = setInterval(updateInsights, 10000);

    return () => clearInterval(interval);
  }, [viewers, streamMetrics]);

  const handleExecuteSuggestion = (suggestion: RealTimeSuggestion) => {
    setExecutedSuggestions(prev => new Set(prev.add(suggestion.id)));
    onExecuteSuggestion(suggestion);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    if (score >= 40) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg flex items-center">
            🧠 InsightEngine™ Dashboard
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-green-400 text-sm">AI Active</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2">
          {[
            { id: 'insights', label: '📊 Insights', count: null },
            { id: 'suggestions', label: '💡 Suggestions', count: suggestions.filter(s => s.priority === 'high').length },
            { id: 'revenue', label: '💰 Revenue', count: null },
            { id: 'optimizations', label: '⚡ Optimize', count: optimizations.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="bg-red-500 text-white rounded-full text-xs px-1">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'insights' && metrics && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Stream Health</div>
                <div className={`text-2xl font-bold ${getHealthColor(metrics.streamHealth)}`}>
                  {metrics.streamHealth}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${getHealthBg(metrics.streamHealth)}`}
                    style={{ width: `${metrics.streamHealth}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Audience Quality</div>
                <div className={`text-2xl font-bold ${getHealthColor(metrics.audienceQuality)}`}>
                  {metrics.audienceQuality}%
                </div>
                <div className="text-gray-400 text-xs">
                  Avg Intent: {Math.round(viewers.reduce((sum, v) => sum + v.intentScore, 0) / Math.max(viewers.length, 1))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-1">Revenue Velocity</div>
                <div className="text-2xl font-bold text-green-400">
                  ${Math.round(metrics.revenueVelocity)}/min
                </div>
                <div className="text-gray-400 text-xs">
                  ${Math.round(metrics.revenueVelocity * 60)}/hour projected
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-2">Engagement Momentum</div>
                <div className="flex items-center justify-between">
                  <span className="text-white text-lg font-bold">{metrics.engagementMomentum}%</span>
                  <span className={`text-sm ${metrics.engagementMomentum > 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.engagementMomentum > 50 ? '📈' : '📉'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-gray-400 text-xs mb-2">Conversion Opportunity</div>
                <div className="flex items-center justify-between">
                  <span className="text-white text-lg font-bold">{metrics.conversionOpportunity}%</span>
                  <span className={`text-sm ${metrics.conversionOpportunity > 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {metrics.conversionOpportunity > 20 ? '🎯' : '⏳'}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time Insights */}
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-purple-400 font-bold text-sm mb-2">🔍 Real-time Analysis</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Hot Leads:</span>
                  <span className="text-orange-400 font-bold">
                    {viewers.filter(v => v.intentScore >= 75).length} viewers
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg. Engagement Time:</span>
                  <span className="text-white">
                    {Math.round(viewers.reduce((sum, v) => sum + v.engagementTime, 0) / Math.max(viewers.length, 1) / 60)}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Retention Risk:</span>
                  <span className={`${metrics.retentionRisk > 70 ? 'text-red-400' : 'text-green-400'}`}>
                    {metrics.retentionRisk}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                🎯 No immediate suggestions - stream is performing well!
              </div>
            ) : (
              suggestions.map((suggestion) => {
                const isExecuted = executedSuggestions.has(suggestion.id);
                return (
                  <div
                    key={suggestion.id}
                    className={`border rounded-lg p-3 ${getPriorityColor(suggestion.priority)} ${
                      isExecuted ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded ${
                            suggestion.priority === 'high' ? 'bg-red-600' :
                            suggestion.priority === 'medium' ? 'bg-yellow-600' :
                            'bg-blue-600'
                          } text-white font-bold`}>
                            {suggestion.priority.toUpperCase()}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {suggestion.urgency} • {suggestion.executionTime}min
                          </span>
                        </div>
                        <div className="text-white font-medium text-sm mb-1">
                          {suggestion.suggestion}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {suggestion.reasoning}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="text-white font-bold">
                          {suggestion.impact}/10
                        </div>
                        <div className="text-gray-400 text-xs">impact</div>
                      </div>
                    </div>

                    {!isExecuted && (
                      <button
                        onClick={() => handleExecuteSuggestion(suggestion)}
                        className={`w-full py-2 rounded text-white text-sm font-medium transition-colors ${
                          suggestion.priority === 'high' ? 'bg-red-600 hover:bg-red-700' :
                          suggestion.priority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' :
                          'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Execute Suggestion
                      </button>
                    )}

                    {isExecuted && (
                      <div className="text-center text-green-400 text-sm font-medium py-2">
                        ✅ Executed
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-green-400 font-bold text-sm mb-2">💰 Revenue Attribution</div>
              {revenueAttribution.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  No revenue data available yet
                </div>
              ) : (
                <div className="space-y-2">
                  {revenueAttribution.map((attr, index) => (
                    <div key={attr.source} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                      <div>
                        <div className="text-white font-medium">{attr.source}</div>
                        <div className="text-gray-400 text-xs">
                          {attr.viewers} viewers • {Math.round(attr.conversionRate * 100)}% conversion
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">
                          {formatCurrency(attr.amount)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {Math.round(attr.percentage)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-yellow-400 font-bold text-sm mb-2">📊 Revenue Metrics</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-400 text-xs">Total Revenue</div>
                  <div className="text-white text-lg font-bold">
                    {formatCurrency(streamMetrics?.totalRevenue || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs">Avg. Order Value</div>
                  <div className="text-white text-lg font-bold">
                    {formatCurrency(
                      revenueAttribution.length > 0 ?
                      revenueAttribution.reduce((sum, attr) => sum + attr.avgOrderValue, 0) / revenueAttribution.length :
                      0
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'optimizations' && (
          <div className="space-y-3">
            {optimizations.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                ⚡ No optimization opportunities identified yet
              </div>
            ) : (
              optimizations.map((opt) => (
                <div key={opt.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-white font-medium">{opt.title}</div>
                      <div className="text-gray-400 text-sm">{opt.description}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-purple-400 font-bold text-sm">
                        {Math.round(opt.confidence * 100)}%
                      </div>
                      <div className="text-gray-400 text-xs">confidence</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-center">
                      <div className="text-green-400 font-bold">+{opt.expectedImpact.revenue}%</div>
                      <div className="text-gray-400 text-xs">Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold">+{opt.expectedImpact.engagement}%</div>
                      <div className="text-gray-400 text-xs">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold">+{opt.expectedImpact.conversion}%</div>
                      <div className="text-gray-400 text-xs">Conversion</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span className={`px-2 py-1 rounded ${
                      opt.difficulty === 'easy' ? 'bg-green-900 text-green-400' :
                      opt.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-400' :
                      'bg-red-900 text-red-400'
                    }`}>
                      {opt.difficulty}
                    </span>
                    <span>{opt.timeToImplement}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>
            AI Analysis: {viewers.length} viewers • {suggestions.filter(s => s.priority === 'high').length} urgent
          </span>
          <span>
            Updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}