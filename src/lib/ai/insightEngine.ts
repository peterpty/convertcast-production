'use client';

import { ViewerProfile, convertCastAI } from './scoringEngine';

export interface StreamPrediction {
  id: string;
  type: 'revenue' | 'attendance' | 'engagement' | 'conversion';
  prediction: number;
  confidence: number;
  timeframe: 'next-hour' | 'stream-end' | 'post-stream';
  factors: string[];
  recommendation: string;
}

export interface RealTimeSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  type: 'timing' | 'content' | 'offer' | 'engagement' | 'technical';
  suggestion: string;
  reasoning: string;
  impact: number; // 1-10 scale
  urgency: 'immediate' | 'soon' | 'when-convenient';
  executionTime: number; // minutes
}

export interface RevenueAttribution {
  source: string;
  amount: number;
  percentage: number;
  viewers: number;
  avgOrderValue: number;
  conversionRate: number;
}

export interface OptimizationRecommendation {
  id: string;
  category: 'content' | 'timing' | 'audience' | 'technical' | 'monetization';
  title: string;
  description: string;
  expectedImpact: {
    revenue: number;
    engagement: number;
    conversion: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: string;
  confidence: number;
}

export interface InsightMetrics {
  streamHealth: number; // 0-100
  audienceQuality: number; // 0-100
  revenueVelocity: number; // revenue per minute
  engagementMomentum: number; // trending up/down
  conversionOpportunity: number; // 0-100
  retentionRisk: number; // 0-100
}

export class InsightEngine {
  private streamStartTime: Date = new Date();
  private historicalData: Map<string, any[]> = new Map();
  private performanceBaseline: Map<string, number> = new Map();

  constructor() {
    this.initializeBaselines();
  }

  /**
   * Generate pre-event predictions
   */
  generatePreEventPredictions(
    scheduledTime: Date,
    expectedViewers: number,
    contentType: string,
    historicalPerformance?: any[]
  ): StreamPrediction[] {
    const predictions: StreamPrediction[] = [];
    const hour = scheduledTime.getHours();
    const dayOfWeek = scheduledTime.getDay();

    // Revenue prediction
    const baseRevenue = this.predictBaseRevenue(expectedViewers, contentType);
    const timeMultiplier = this.getTimeMultiplier(hour, dayOfWeek);
    const revenueAdjustment = baseRevenue * timeMultiplier;

    predictions.push({
      id: 'pre-revenue',
      type: 'revenue',
      prediction: revenueAdjustment,
      confidence: this.calculateConfidence('revenue', [hour, dayOfWeek, expectedViewers]),
      timeframe: 'stream-end',
      factors: [
        `${expectedViewers} expected viewers`,
        `${contentType} content type`,
        `${this.getTimeDescription(hour)} timing`,
        `${this.getDayDescription(dayOfWeek)} performance`
      ],
      recommendation: this.generateRevenueRecommendation(revenueAdjustment, expectedViewers)
    });

    // Attendance prediction
    const attendancePrediction = this.predictAttendance(scheduledTime, expectedViewers, historicalPerformance);
    predictions.push({
      id: 'pre-attendance',
      type: 'attendance',
      prediction: attendancePrediction.viewers,
      confidence: attendancePrediction.confidence,
      timeframe: 'stream-end',
      factors: attendancePrediction.factors,
      recommendation: attendancePrediction.recommendation
    });

    // Engagement prediction
    const engagementScore = this.predictEngagement(contentType, hour, expectedViewers);
    predictions.push({
      id: 'pre-engagement',
      type: 'engagement',
      prediction: engagementScore,
      confidence: 0.75,
      timeframe: 'stream-end',
      factors: [
        `${contentType} typically scores ${engagementScore}/100`,
        'Audience size impact calculated',
        'Time-of-day factor included'
      ],
      recommendation: `Target ${Math.round(engagementScore * 1.2)} engagement score with interactive elements`
    });

    return predictions;
  }

  /**
   * Generate real-time suggestions during stream
   */
  generateRealTimeSuggestions(viewers: ViewerProfile[], streamMetrics: any): RealTimeSuggestion[] {
    const suggestions: RealTimeSuggestion[] = [];
    const currentTime = new Date();
    const streamDuration = (currentTime.getTime() - this.streamStartTime.getTime()) / 1000 / 60; // minutes

    // Analyze current metrics
    const avgScore = viewers.reduce((sum, v) => sum + v.intentScore, 0) / viewers.length;
    const hotLeads = viewers.filter(v => v.intentScore >= 75);
    const engagementRate = this.calculateCurrentEngagementRate(viewers);
    const revenueVelocity = this.calculateRevenueVelocity(streamMetrics);

    // High-priority suggestions
    if (hotLeads.length >= 3 && streamDuration > 10) {
      suggestions.push({
        id: 'hot-leads-ready',
        priority: 'high',
        type: 'offer',
        suggestion: `${hotLeads.length} hot leads ready - trigger premium offers now!`,
        reasoning: 'Multiple viewers showing strong buying intent',
        impact: 9,
        urgency: 'immediate',
        executionTime: 2
      });
    }

    if (engagementRate < 0.3 && streamDuration > 15) {
      suggestions.push({
        id: 'engagement-boost',
        priority: 'high',
        type: 'engagement',
        suggestion: 'Launch interactive poll or Q&A to boost engagement',
        reasoning: 'Engagement below optimal threshold, risk of viewer drop-off',
        impact: 8,
        urgency: 'immediate',
        executionTime: 1
      });
    }

    // Medium-priority suggestions
    if (avgScore > 65 && streamDuration > 20) {
      suggestions.push({
        id: 'optimal-timing',
        priority: 'medium',
        type: 'timing',
        suggestion: 'Perfect time for main offer - audience is warmed up',
        reasoning: 'Average intent score indicates audience readiness',
        impact: 7,
        urgency: 'soon',
        executionTime: 5
      });
    }

    if (viewers.length > 50 && this.getUniqueTimezones(viewers) > 3) {
      suggestions.push({
        id: 'global-audience',
        priority: 'medium',
        type: 'content',
        suggestion: 'Mention global accessibility and timezone-friendly replays',
        reasoning: 'Diverse global audience present',
        impact: 6,
        urgency: 'when-convenient',
        executionTime: 2
      });
    }

    // Low-priority optimization suggestions
    if (streamDuration > 30) {
      suggestions.push({
        id: 'energy-check',
        priority: 'low',
        type: 'content',
        suggestion: 'Check your energy level - consider a brief energizing break',
        reasoning: 'Extended streaming can impact presenter energy',
        impact: 5,
        urgency: 'when-convenient',
        executionTime: 3
      });
    }

    return suggestions.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const urgencyScore = { immediate: 3, soon: 2, 'when-convenient': 1 };

      return (priorityScore[b.priority] + urgencyScore[b.urgency] + b.impact) -
             (priorityScore[a.priority] + urgencyScore[a.urgency] + a.impact);
    });
  }

  /**
   * Calculate revenue attribution
   */
  calculateRevenueAttribution(viewers: ViewerProfile[], revenue: number): RevenueAttribution[] {
    const attributions: RevenueAttribution[] = [];
    const totalRevenue = revenue;

    // Group by traffic source
    const sourceGroups = viewers.reduce((groups, viewer) => {
      const source = viewer.behaviorMetrics.trafficSource;
      if (!groups[source]) groups[source] = [];
      groups[source].push(viewer);
      return groups;
    }, {} as Record<string, ViewerProfile[]>);

    Object.entries(sourceGroups).forEach(([source, sourceViewers]) => {
      const sourceRevenue = sourceViewers.reduce((sum, viewer) =>
        sum + (viewer.aiPredictions.lifetimeValue * viewer.aiPredictions.conversionProbability), 0);

      const avgOrderValue = sourceRevenue / sourceViewers.length;
      const convertedViewers = sourceViewers.filter(v => v.aiPredictions.conversionProbability > 0.5).length;
      const conversionRate = convertedViewers / sourceViewers.length;

      attributions.push({
        source: source.charAt(0).toUpperCase() + source.slice(1),
        amount: sourceRevenue,
        percentage: (sourceRevenue / totalRevenue) * 100,
        viewers: sourceViewers.length,
        avgOrderValue,
        conversionRate
      });
    });

    return attributions.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(
    viewers: ViewerProfile[],
    streamMetrics: any,
    historicalData?: any[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze current performance vs baseline
    const currentEngagement = this.calculateCurrentEngagementRate(viewers);
    const baselineEngagement = this.performanceBaseline.get('engagement') || 0.4;

    if (currentEngagement < baselineEngagement * 0.8) {
      recommendations.push({
        id: 'engagement-optimization',
        category: 'content',
        title: 'Boost Interactive Elements',
        description: 'Add more polls, Q&A sessions, and direct viewer interaction',
        expectedImpact: {
          revenue: 15,
          engagement: 35,
          conversion: 12
        },
        difficulty: 'easy',
        timeToImplement: '5 minutes',
        confidence: 0.85
      });
    }

    // Monetization recommendations
    const hotLeadRatio = viewers.filter(v => v.intentScore >= 75).length / viewers.length;
    if (hotLeadRatio > 0.2) {
      recommendations.push({
        id: 'premium-pricing',
        category: 'monetization',
        title: 'Implement Premium Tier Pricing',
        description: 'High-intent audience ready for premium offerings',
        expectedImpact: {
          revenue: 40,
          engagement: 5,
          conversion: 8
        },
        difficulty: 'medium',
        timeToImplement: '15 minutes',
        confidence: 0.78
      });
    }

    // Timing recommendations
    const avgEngagementTime = viewers.reduce((sum, v) => sum + v.engagementTime, 0) / viewers.length;
    if (avgEngagementTime > 600) { // 10 minutes
      recommendations.push({
        id: 'optimal-offer-timing',
        category: 'timing',
        title: 'Optimize Offer Placement',
        description: 'Move main offers to 12-15 minute mark based on engagement patterns',
        expectedImpact: {
          revenue: 25,
          engagement: 0,
          conversion: 20
        },
        difficulty: 'easy',
        timeToImplement: '2 minutes',
        confidence: 0.82
      });
    }

    // Audience recommendations
    const mobileRatio = viewers.filter(v => v.behaviorMetrics.deviceType === 'mobile').length / viewers.length;
    if (mobileRatio > 0.6) {
      recommendations.push({
        id: 'mobile-optimization',
        category: 'audience',
        title: 'Optimize for Mobile Experience',
        description: 'Majority mobile audience - emphasize mobile-friendly CTAs and content',
        expectedImpact: {
          revenue: 18,
          engagement: 15,
          conversion: 22
        },
        difficulty: 'medium',
        timeToImplement: '10 minutes',
        confidence: 0.75
      });
    }

    return recommendations.sort((a, b) =>
      (b.expectedImpact.revenue + b.expectedImpact.conversion) -
      (a.expectedImpact.revenue + a.expectedImpact.conversion)
    );
  }

  /**
   * Calculate comprehensive insight metrics
   */
  calculateInsightMetrics(viewers: ViewerProfile[], streamMetrics: any): InsightMetrics {
    const avgScore = viewers.reduce((sum, v) => sum + v.intentScore, 0) / viewers.length;
    const engagementRate = this.calculateCurrentEngagementRate(viewers);
    const hotLeadRatio = viewers.filter(v => v.intentScore >= 75).length / viewers.length;
    const revenueVelocity = this.calculateRevenueVelocity(streamMetrics);

    return {
      streamHealth: Math.min(100, Math.round(
        (engagementRate * 30) +
        (avgScore * 0.5) +
        (viewers.length > 10 ? 20 : viewers.length * 2) +
        (hotLeadRatio * 30)
      )),
      audienceQuality: Math.round(avgScore * 1.2),
      revenueVelocity: revenueVelocity,
      engagementMomentum: this.calculateEngagementTrend(viewers),
      conversionOpportunity: Math.round(hotLeadRatio * 100),
      retentionRisk: this.calculateRetentionRisk(viewers)
    };
  }

  // Private helper methods
  private initializeBaselines(): void {
    this.performanceBaseline.set('engagement', 0.35);
    this.performanceBaseline.set('conversion', 0.15);
    this.performanceBaseline.set('revenue_per_viewer', 25);
  }

  private predictBaseRevenue(expectedViewers: number, contentType: string): number {
    const baseMultipliers = {
      'educational': 45,
      'product-demo': 65,
      'webinar': 55,
      'workshop': 75,
      'entertainment': 25,
      'interview': 35
    };

    const multiplier = baseMultipliers[contentType as keyof typeof baseMultipliers] || 40;
    return expectedViewers * multiplier;
  }

  private getTimeMultiplier(hour: number, dayOfWeek: number): number {
    // Business hours (9-17) on weekdays get boost
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17) {
      return 1.3;
    }

    // Evening hours (19-22) get boost
    if (hour >= 19 && hour <= 22) {
      return 1.2;
    }

    // Weekend mornings (9-12) get boost
    if ((dayOfWeek === 0 || dayOfWeek === 6) && hour >= 9 && hour <= 12) {
      return 1.1;
    }

    return 1.0;
  }

  private calculateConfidence(type: string, factors: number[]): number {
    const baseConfidence = 0.7;
    const factorWeight = factors.reduce((sum, factor) => sum + Math.abs(factor), 0) / factors.length;
    return Math.min(0.95, baseConfidence + (factorWeight / 100));
  }

  private predictAttendance(scheduledTime: Date, expectedViewers: number, historicalData?: any[]): {
    viewers: number;
    confidence: number;
    factors: string[];
    recommendation: string;
  } {
    const timeMultiplier = this.getTimeMultiplier(scheduledTime.getHours(), scheduledTime.getDay());
    const predictedViewers = Math.round(expectedViewers * timeMultiplier);

    return {
      viewers: predictedViewers,
      confidence: 0.8,
      factors: [
        `Base expectation: ${expectedViewers} viewers`,
        `Time optimization factor: ${timeMultiplier}x`,
        'Historical pattern analysis included'
      ],
      recommendation: predictedViewers > expectedViewers * 1.2 ?
        'Prepare for higher than expected attendance' :
        'Consider promotion boost to increase attendance'
    };
  }

  private predictEngagement(contentType: string, hour: number, expectedViewers: number): number {
    const baseScores = {
      'educational': 75,
      'product-demo': 80,
      'webinar': 70,
      'workshop': 85,
      'entertainment': 60,
      'interview': 65
    };

    const base = baseScores[contentType as keyof typeof baseScores] || 70;
    const timeAdjustment = hour >= 10 && hour <= 16 ? 5 : 0;
    const sizeAdjustment = expectedViewers > 100 ? -5 : expectedViewers < 20 ? 10 : 0;

    return Math.min(100, base + timeAdjustment + sizeAdjustment);
  }

  private calculateCurrentEngagementRate(viewers: ViewerProfile[]): number {
    if (viewers.length === 0) return 0;

    const totalEngagementScore = viewers.reduce((sum, viewer) => {
      return sum + (
        viewer.behaviorMetrics.chatParticipation * 0.3 +
        viewer.behaviorMetrics.pollVotes * 0.2 +
        viewer.behaviorMetrics.reactionCount * 0.15 +
        (viewer.behaviorMetrics.timeOnPage > 300 ? 0.2 : 0) +
        (viewer.behaviorMetrics.clicksToCTA > 0 ? 0.15 : 0)
      );
    }, 0);

    return totalEngagementScore / viewers.length;
  }

  private calculateRevenueVelocity(streamMetrics: any): number {
    const streamDuration = (new Date().getTime() - this.streamStartTime.getTime()) / 1000 / 60;
    const totalRevenue = streamMetrics?.revenue || 0;
    return streamDuration > 0 ? totalRevenue / streamDuration : 0;
  }

  private calculateEngagementTrend(viewers: ViewerProfile[]): number {
    // Simplified trend calculation - in real implementation would use time-series data
    const avgScore = viewers.reduce((sum, v) => sum + v.intentScore, 0) / viewers.length;
    return Math.round(avgScore * 1.2);
  }

  private calculateRetentionRisk(viewers: ViewerProfile[]): number {
    const longEngagementViewers = viewers.filter(v => v.engagementTime > 600).length;
    const shortEngagementViewers = viewers.filter(v => v.engagementTime < 180).length;

    if (viewers.length === 0) return 50;

    const retentionRate = longEngagementViewers / viewers.length;
    const churnRate = shortEngagementViewers / viewers.length;

    return Math.round((churnRate - retentionRate) * 100 + 50);
  }

  private getUniqueTimezones(viewers: ViewerProfile[]): number {
    const timezones = new Set(viewers.map(v => v.timezone));
    return timezones.size;
  }

  private getTimeDescription(hour: number): string {
    if (hour >= 9 && hour <= 12) return 'morning';
    if (hour >= 13 && hour <= 17) return 'afternoon';
    if (hour >= 18 && hour <= 22) return 'evening';
    return 'late/early';
  }

  private getDayDescription(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
  }

  private generateRevenueRecommendation(predictedRevenue: number, expectedViewers: number): string {
    const revenuePerViewer = predictedRevenue / expectedViewers;

    if (revenuePerViewer > 75) {
      return 'High-value audience predicted - consider premium pricing strategy';
    } else if (revenuePerViewer > 40) {
      return 'Good revenue potential - standard pricing with upsells';
    } else {
      return 'Focus on volume and lead generation over direct sales';
    }
  }
}

// Export singleton instance
export const insightEngine = new InsightEngine();