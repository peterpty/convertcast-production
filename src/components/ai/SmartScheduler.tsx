'use client';

import { useState, useEffect } from 'react';
import { smartScheduler, ScheduleRecommendation, TimeSlot } from '@/lib/ai/smartScheduler';

interface SmartSchedulerProps {
  onScheduleStream: (recommendation: ScheduleRecommendation) => void;
}

export function SmartScheduler({ onScheduleStream }: SmartSchedulerProps) {
  const [recommendation, setRecommendation] = useState<ScheduleRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<'educational' | 'product-demo' | 'webinar' | 'workshop' | 'entertainment'>('webinar');
  const [duration, setDuration] = useState(60);
  const [audienceGoal, setAudienceGoal] = useState(100);
  const [preferredDate, setPreferredDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // Auto-generate recommendation on component mount
    generateRecommendation();
  }, []);

  const generateRecommendation = async () => {
    setLoading(true);

    try {
      const prefDate = preferredDate ? new Date(preferredDate) : undefined;
      const rec = smartScheduler.getScheduleRecommendation(
        prefDate,
        contentType,
        duration,
        audienceGoal
      );

      setRecommendation(rec);
      setSelectedSlot(null);

      // Also get all time slots for the grid view
      const startDate = prefDate || new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7); // Next 7 days

      const slots = smartScheduler.findOptimalTimeSlots(startDate, endDate, duration, contentType);
      setTimeSlots(slots.slice(0, 21)); // Show 3 weeks worth

    } catch (error) {
      console.error('Failed to generate recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleNow = () => {
    if (recommendation) {
      onScheduleStream(recommendation);
    }
  };

  const handleSelectAlternative = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-900/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-900/20';
    if (score >= 40) return 'text-orange-400 bg-orange-900/20';
    return 'text-red-400 bg-red-900/20';
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
            📅 SmartScheduler™ AI
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-blue-400 text-sm">Optimizing</span>
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as any)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
            >
              <option value="webinar">Webinar</option>
              <option value="workshop">Workshop</option>
              <option value="product-demo">Product Demo</option>
              <option value="educational">Educational</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min="15"
              max="180"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Audience Goal</label>
            <input
              type="number"
              value={audienceGoal}
              onChange={(e) => setAudienceGoal(parseInt(e.target.value))}
              min="10"
              max="1000"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Preferred Date</label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        <button
          onClick={generateRecommendation}
          disabled={loading}
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded font-medium text-sm transition-colors"
        >
          {loading ? 'Analyzing...' : '🤖 Generate AI Recommendation'}
        </button>
      </div>

      {/* Main Recommendation */}
      {recommendation && (
        <div className="p-4 border-b border-gray-700">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-500">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-blue-400 font-bold text-sm mb-1">🎯 AI RECOMMENDATION</div>
                <div className="text-white font-bold text-lg">
                  {formatDateTime(recommendation.recommendedTime)}
                </div>
                <div className="text-gray-300 text-sm">
                  {recommendation.reasoning}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(recommendation.score).split(' ')[0]}`}>
                  {recommendation.score}
                </div>
                <div className="text-gray-400 text-xs">AI Score</div>
              </div>
            </div>

            {/* Expected Outcome */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-white font-bold">{recommendation.expectedOutcome.viewers}</div>
                <div className="text-gray-400 text-xs">Expected Viewers</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold">${recommendation.expectedOutcome.revenue}</div>
                <div className="text-gray-400 text-xs">Revenue Projection</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-400 font-bold">{recommendation.expectedOutcome.engagement}%</div>
                <div className="text-gray-400 text-xs">Engagement Score</div>
              </div>
            </div>

            {/* Optimization Tips */}
            <div className="mb-3">
              <div className="text-purple-400 font-bold text-xs mb-2">💡 AI Optimization Tips:</div>
              <div className="space-y-1">
                {recommendation.optimizationTips.slice(0, 2).map((tip, index) => (
                  <div key={index} className="text-gray-300 text-xs flex items-start">
                    <span className="text-purple-400 mr-2">•</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleScheduleNow}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium text-sm transition-colors"
              >
                📅 Schedule This Time
              </button>
              <div className="flex items-center">
                <div className={`text-xs ${getConfidenceColor(recommendation.confidence)}`}>
                  {Math.round(recommendation.confidence * 100)}% confidence
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Time Slots */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-orange-400 font-bold text-sm mb-3">
          ⏰ Alternative Time Slots
        </div>

        {selectedSlot && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-orange-500">
            <div className="text-orange-400 font-bold text-xs mb-1">SELECTED ALTERNATIVE</div>
            <div className="text-white font-medium mb-2">
              {formatDateTime(selectedSlot.startTime)}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div>
                <div className="text-white font-bold">{selectedSlot.predictedMetrics.expectedViewers}</div>
                <div className="text-gray-400 text-xs">Viewers</div>
              </div>
              <div>
                <div className="text-green-400 font-bold">${selectedSlot.predictedMetrics.revenueProjection}</div>
                <div className="text-gray-400 text-xs">Revenue</div>
              </div>
              <div>
                <div className={`font-bold ${getScoreColor(selectedSlot.score).split(' ')[0]}`}>
                  {selectedSlot.score}
                </div>
                <div className="text-gray-400 text-xs">Score</div>
              </div>
            </div>
            <button
              onClick={() => {
                if (recommendation) {
                  const altRec = {
                    ...recommendation,
                    recommendedTime: selectedSlot.startTime,
                    score: selectedSlot.score,
                    confidence: selectedSlot.confidence,
                    expectedOutcome: {
                      viewers: selectedSlot.predictedMetrics.expectedViewers,
                      revenue: selectedSlot.predictedMetrics.revenueProjection,
                      engagement: selectedSlot.predictedMetrics.engagementScore
                    }
                  };
                  onScheduleStream(altRec);
                }
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded font-medium text-sm transition-colors"
            >
              Schedule Alternative
            </button>
          </div>
        )}

        {/* Time Slot Grid */}
        <div className="space-y-2">
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              onClick={() => handleSelectAlternative(slot)}
              className={`bg-gray-800 rounded-lg p-3 border cursor-pointer transition-all hover:bg-gray-700 ${
                selectedSlot === slot ? 'border-orange-500 bg-orange-900/20' : 'border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-medium text-sm">
                  {formatDateTime(slot.startTime)}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${getScoreColor(slot.score)}`}>
                  {slot.score}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div>
                  <span className="text-gray-400">Viewers: </span>
                  <span className="text-white">{slot.predictedMetrics.expectedViewers}</span>
                </div>
                <div>
                  <span className="text-gray-400">Revenue: </span>
                  <span className="text-green-400">${slot.predictedMetrics.revenueProjection}</span>
                </div>
                <div>
                  <span className="text-gray-400">Engage: </span>
                  <span className="text-yellow-400">{slot.predictedMetrics.engagementScore}%</span>
                </div>
              </div>

              {/* Top factors */}
              <div className="flex flex-wrap gap-1">
                {slot.factors
                  .filter(f => Math.abs(f.impact) > 10)
                  .slice(0, 3)
                  .map((factor, fIndex) => (
                    <span
                      key={fIndex}
                      className={`text-xs px-2 py-1 rounded ${
                        factor.impact > 0 ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                      }`}
                    >
                      {factor.name}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>
            AI analyzed {timeSlots.length} time slots • Best score: {timeSlots[0]?.score || 0}
          </span>
          <span>
            Timezone-optimized for global audience
          </span>
        </div>
      </div>
    </div>
  );
}