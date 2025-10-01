'use client';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  score: number;
  confidence: number;
  factors: OptimizationFactor[];
  predictedMetrics: {
    expectedViewers: number;
    engagementScore: number;
    revenueProjection: number;
    conversionRate: number;
  };
}

export interface OptimizationFactor {
  type: 'timezone' | 'audience' | 'competition' | 'historical' | 'seasonal' | 'behavioral';
  name: string;
  impact: number; // -100 to +100
  weight: number; // 0 to 1
  description: string;
}

export interface ScheduleRecommendation {
  id: string;
  recommendedTime: Date;
  score: number;
  confidence: number;
  reasoning: string;
  alternativeSlots: TimeSlot[];
  optimizationTips: string[];
  expectedOutcome: {
    viewers: number;
    revenue: number;
    engagement: number;
  };
}

export interface AudienceProfile {
  primaryTimezone: string;
  secondaryTimezones: string[];
  peakHours: number[];
  weekdayPreference: number; // 0-6, Sunday to Saturday
  deviceUsage: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  historicalEngagement: Map<string, number>; // time slot -> engagement score
  seasonalPatterns: Map<string, number>; // month/season -> multiplier
}

export interface CompetitionAnalysis {
  competitorSchedules: Map<string, Date[]>;
  marketSaturation: Map<string, number>; // time slot -> saturation level
  opportunityWindows: TimeSlot[];
}

const DEFAULT_PEAK_HOURS = [10, 11, 14, 15, 19, 20, 21]; // Common high-engagement hours
const TIMEZONE_WEIGHTS = {
  'US/Eastern': 0.3,
  'US/Central': 0.2,
  'US/Mountain': 0.1,
  'US/Pacific': 0.25,
  'Europe/London': 0.08,
  'Europe/Berlin': 0.05,
  'Asia/Tokyo': 0.02
};

export class SmartScheduler {
  private audienceProfile: AudienceProfile;
  private historicalData: Map<string, any[]> = new Map();
  private competitionData: CompetitionAnalysis;

  constructor(audienceProfile?: Partial<AudienceProfile>) {
    this.audienceProfile = {
      primaryTimezone: 'US/Eastern',
      secondaryTimezones: ['US/Central', 'US/Pacific'],
      peakHours: DEFAULT_PEAK_HOURS,
      weekdayPreference: 2, // Tuesday default
      deviceUsage: { mobile: 0.6, desktop: 0.35, tablet: 0.05 },
      historicalEngagement: new Map(),
      seasonalPatterns: new Map(),
      ...audienceProfile
    };

    this.competitionData = {
      competitorSchedules: new Map(),
      marketSaturation: new Map(),
      opportunityWindows: []
    };

    this.initializeHistoricalData();
  }

  /**
   * Find optimal time slots for a given date range
   */
  findOptimalTimeSlots(
    startDate: Date,
    endDate: Date,
    duration: number, // minutes
    contentType: 'educational' | 'product-demo' | 'webinar' | 'workshop' | 'entertainment' = 'webinar'
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Generate slots for each day in 30-minute increments from 8 AM to 10 PM
      for (let hour = 8; hour <= 22; hour += 0.5) {
        const slotStart = new Date(current);
        slotStart.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        // Skip if slot extends beyond reasonable hours
        if (slotEnd.getHours() > 23) continue;

        const slot = this.analyzeTimeSlot(slotStart, slotEnd, contentType);
        if (slot.score > 50) { // Only include reasonably good slots
          slots.push(slot);
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return slots.sort((a, b) => b.score - a.score).slice(0, 20); // Top 20 slots
  }

  /**
   * Get AI-powered schedule recommendation
   */
  getScheduleRecommendation(
    preferredDate?: Date,
    contentType: 'educational' | 'product-demo' | 'webinar' | 'workshop' | 'entertainment' = 'webinar',
    duration: number = 60,
    audienceGoal: number = 100
  ): ScheduleRecommendation {
    const searchStart = preferredDate || new Date();
    const searchEnd = new Date(searchStart);
    searchEnd.setDate(searchEnd.getDate() + 14); // Search 2 weeks ahead

    const slots = this.findOptimalTimeSlots(searchStart, searchEnd, duration, contentType);
    const bestSlot = slots[0];

    if (!bestSlot) {
      throw new Error('No suitable time slots found');
    }

    const optimizationTips = this.generateOptimizationTips(bestSlot, contentType, audienceGoal);

    return {
      id: `rec-${Date.now()}`,
      recommendedTime: bestSlot.startTime,
      score: bestSlot.score,
      confidence: bestSlot.confidence,
      reasoning: this.generateRecommendationReasoning(bestSlot),
      alternativeSlots: slots.slice(1, 4), // Top 3 alternatives
      optimizationTips,
      expectedOutcome: {
        viewers: bestSlot.predictedMetrics.expectedViewers,
        revenue: bestSlot.predictedMetrics.revenueProjection,
        engagement: bestSlot.predictedMetrics.engagementScore
      }
    };
  }

  /**
   * Analyze a specific time slot
   */
  private analyzeTimeSlot(startTime: Date, endTime: Date, contentType: string): TimeSlot {
    const factors = this.calculateOptimizationFactors(startTime, contentType);
    const score = this.calculateTimeSlotScore(factors);
    const confidence = this.calculateConfidence(factors);
    const predictedMetrics = this.predictSlotMetrics(startTime, factors, contentType);

    return {
      startTime,
      endTime,
      score,
      confidence,
      factors,
      predictedMetrics
    };
  }

  /**
   * Calculate optimization factors for a time slot
   */
  private calculateOptimizationFactors(startTime: Date, contentType: string): OptimizationFactor[] {
    const factors: OptimizationFactor[] = [];
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay();
    const month = startTime.getMonth();

    // Timezone alignment factor
    const timezoneScore = this.calculateTimezoneAlignment(startTime);
    factors.push({
      type: 'timezone',
      name: 'Timezone Alignment',
      impact: timezoneScore,
      weight: 0.25,
      description: `${timezoneScore > 0 ? 'Good' : 'Poor'} alignment with primary audience timezones`
    });

    // Peak hours factor
    const isPeakHour = this.audienceProfile.peakHours.includes(hour);
    factors.push({
      type: 'audience',
      name: 'Peak Hours',
      impact: isPeakHour ? 40 : -20,
      weight: 0.2,
      description: isPeakHour ? 'During peak engagement hours' : 'Outside peak hours'
    });

    // Day of week factor
    const dayScore = this.calculateDayOfWeekScore(dayOfWeek, contentType);
    factors.push({
      type: 'audience',
      name: 'Day of Week',
      impact: dayScore,
      weight: 0.15,
      description: this.getDayDescription(dayOfWeek, dayScore)
    });

    // Historical performance
    const historicalKey = `${dayOfWeek}-${hour}`;
    const historicalScore = this.audienceProfile.historicalEngagement.get(historicalKey) || 0;
    factors.push({
      type: 'historical',
      name: 'Historical Performance',
      impact: historicalScore,
      weight: 0.2,
      description: `${historicalScore > 0 ? 'Strong' : 'Weak'} historical performance for this slot`
    });

    // Competition factor
    const competitionScore = this.calculateCompetitionScore(startTime);
    factors.push({
      type: 'competition',
      name: 'Market Competition',
      impact: competitionScore,
      weight: 0.1,
      description: competitionScore < 0 ? 'High competition expected' : 'Low competition window'
    });

    // Seasonal factor
    const seasonalScore = this.calculateSeasonalScore(month, contentType);
    factors.push({
      type: 'seasonal',
      name: 'Seasonal Trends',
      impact: seasonalScore,
      weight: 0.1,
      description: `${seasonalScore > 0 ? 'Favorable' : 'Unfavorable'} seasonal trends`
    });

    return factors;
  }

  /**
   * Calculate overall score for a time slot
   */
  private calculateTimeSlotScore(factors: OptimizationFactor[]): number {
    let weightedScore = 0;
    let totalWeight = 0;

    factors.forEach(factor => {
      weightedScore += (factor.impact * factor.weight);
      totalWeight += factor.weight;
    });

    const normalizedScore = (weightedScore / totalWeight);
    return Math.max(0, Math.min(100, 50 + normalizedScore)); // Normalize to 0-100
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(factors: OptimizationFactor[]): number {
    const historicalFactor = factors.find(f => f.type === 'historical');
    const dataStrength = historicalFactor ? Math.abs(historicalFactor.impact) / 100 : 0.5;

    const factorConsistency = this.calculateFactorConsistency(factors);

    return Math.min(0.95, 0.6 + (dataStrength * 0.2) + (factorConsistency * 0.2));
  }

  /**
   * Predict metrics for a time slot
   */
  private predictSlotMetrics(startTime: Date, factors: OptimizationFactor[], contentType: string): TimeSlot['predictedMetrics'] {
    const baseViewers = this.getBaseViewerCount(contentType);
    const totalImpact = factors.reduce((sum, f) => sum + (f.impact * f.weight), 0);
    const multiplier = 1 + (totalImpact / 100);

    return {
      expectedViewers: Math.round(baseViewers * multiplier),
      engagementScore: Math.min(100, Math.max(20, 65 + totalImpact)),
      revenueProjection: this.calculateRevenueProjection(baseViewers * multiplier, contentType, factors),
      conversionRate: this.calculateConversionRate(factors, contentType)
    };
  }

  /**
   * Generate optimization tips
   */
  private generateOptimizationTips(slot: TimeSlot, contentType: string, audienceGoal: number): string[] {
    const tips: string[] = [];

    // Timing-specific tips
    const hour = slot.startTime.getHours();
    if (hour < 10) {
      tips.push('Morning slot - emphasize productivity and learning benefits');
    } else if (hour > 19) {
      tips.push('Evening slot - focus on convenience and accessibility');
    } else {
      tips.push('Prime time slot - leverage high engagement for premium offers');
    }

    // Audience size tips
    if (slot.predictedMetrics.expectedViewers < audienceGoal * 0.8) {
      tips.push('Boost promotion 48 hours before to increase attendance');
      tips.push('Consider social media campaigns targeting your primary timezone');
    } else if (slot.predictedMetrics.expectedViewers > audienceGoal * 1.2) {
      tips.push('Prepare for high attendance - ensure technical capacity');
      tips.push('Consider premium pricing given high demand');
    }

    // Engagement optimization
    const engagementFactor = slot.factors.find(f => f.name === 'Peak Hours');
    if (engagementFactor && engagementFactor.impact < 0) {
      tips.push('Use interactive elements to compensate for off-peak timing');
      tips.push('Send reminder notifications 30 minutes before start');
    }

    // Competition handling
    const competitionFactor = slot.factors.find(f => f.name === 'Market Competition');
    if (competitionFactor && competitionFactor.impact < -20) {
      tips.push('Differentiate your content from competitors active at this time');
      tips.push('Emphasize unique value proposition in promotional materials');
    }

    return tips.slice(0, 4); // Return top 4 tips
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateRecommendationReasoning(slot: TimeSlot): string {
    const topFactors = slot.factors
      .filter(f => Math.abs(f.impact) > 15)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 3);

    const positiveFactors = topFactors.filter(f => f.impact > 0);
    const negativeFactors = topFactors.filter(f => f.impact < 0);

    let reasoning = `This ${this.getTimeDescription(slot.startTime)} slot scores ${slot.score}/100 based on AI analysis. `;

    if (positiveFactors.length > 0) {
      reasoning += `Key advantages: ${positiveFactors.map(f => f.name.toLowerCase()).join(', ')}. `;
    }

    if (negativeFactors.length > 0) {
      reasoning += `Consider: ${negativeFactors.map(f => f.name.toLowerCase()).join(', ')} may impact performance. `;
    }

    reasoning += `Expected: ${slot.predictedMetrics.expectedViewers} viewers with ${slot.predictedMetrics.engagementScore}% engagement.`;

    return reasoning;
  }

  // Helper methods
  private calculateTimezoneAlignment(startTime: Date): number {
    const hour = startTime.getHours();
    const utcHour = startTime.getUTCHours();

    // Check alignment with primary timezone audiences
    let score = 0;

    // US Eastern: good hours 9-21 local
    const easternHour = (utcHour - 5 + 24) % 24;
    if (easternHour >= 9 && easternHour <= 21) score += 30 * TIMEZONE_WEIGHTS['US/Eastern'];

    // US Pacific: good hours 9-21 local
    const pacificHour = (utcHour - 8 + 24) % 24;
    if (pacificHour >= 9 && pacificHour <= 21) score += 30 * TIMEZONE_WEIGHTS['US/Pacific'];

    // Europe: good hours 10-20 local
    const londonHour = (utcHour + 0) % 24;
    if (londonHour >= 10 && londonHour <= 20) score += 30 * TIMEZONE_WEIGHTS['Europe/London'];

    return Math.round(score - 15); // Normalize around 0
  }

  private calculateDayOfWeekScore(dayOfWeek: number, contentType: string): number {
    const businessDays = [1, 2, 3, 4]; // Mon-Thu
    const weekendDays = [0, 6]; // Sun, Sat

    if (contentType === 'educational' || contentType === 'webinar') {
      return businessDays.includes(dayOfWeek) ? 25 : -15;
    } else if (contentType === 'entertainment') {
      return weekendDays.includes(dayOfWeek) ? 20 : 0;
    }

    return businessDays.includes(dayOfWeek) ? 15 : -5;
  }

  private calculateCompetitionScore(startTime: Date): number {
    // Simplified competition analysis
    const hour = startTime.getHours();
    const dayOfWeek = startTime.getDay();

    // High competition during prime business hours on weekdays
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 14 && hour <= 16) {
      return -25; // High competition
    }

    // Medium competition during evening hours
    if (hour >= 19 && hour <= 21) {
      return -10; // Medium competition
    }

    return 10; // Low competition
  }

  private calculateSeasonalScore(month: number, contentType: string): number {
    // Simplified seasonal analysis
    const seasonalMultipliers: { [key: number]: number } = {
      0: -10, // January - post-holiday low
      1: 15,  // February - planning season
      2: 20,  // March - spring motivation
      3: 10,  // April
      4: 5,   // May
      5: -15, // June - summer distraction
      6: -20, // July - vacation season
      7: -15, // August - late summer
      8: 25,  // September - back to business
      9: 20,  // October - strong engagement
      10: 15, // November - pre-holiday push
      11: -5  // December - holiday distraction
    };

    return seasonalMultipliers[month] || 0;
  }

  private calculateFactorConsistency(factors: OptimizationFactor[]): number {
    const impacts = factors.map(f => f.impact);
    const positiveCount = impacts.filter(i => i > 0).length;
    const negativeCount = impacts.filter(i => i < 0).length;
    const total = impacts.length;

    // Higher consistency when factors align
    return Math.abs(positiveCount - negativeCount) / total;
  }

  private getBaseViewerCount(contentType: string): number {
    const baseCounts = {
      'educational': 75,
      'product-demo': 120,
      'webinar': 100,
      'workshop': 85,
      'entertainment': 60
    };

    return baseCounts[contentType as keyof typeof baseCounts] || 100;
  }

  private calculateRevenueProjection(viewers: number, contentType: string, factors: OptimizationFactor[]): number {
    const revenuePerViewer = {
      'educational': 35,
      'product-demo': 55,
      'webinar': 45,
      'workshop': 65,
      'entertainment': 25
    };

    const baseRevenue = viewers * (revenuePerViewer[contentType as keyof typeof revenuePerViewer] || 40);

    // Adjust based on factors
    const qualityBonus = factors.find(f => f.name === 'Peak Hours')?.impact || 0;
    const multiplier = 1 + (qualityBonus / 200);

    return Math.round(baseRevenue * multiplier);
  }

  private calculateConversionRate(factors: OptimizationFactor[], contentType: string): number {
    const baseRates = {
      'educational': 0.12,
      'product-demo': 0.18,
      'webinar': 0.15,
      'workshop': 0.22,
      'entertainment': 0.08
    };

    const baseRate = baseRates[contentType as keyof typeof baseRates] || 0.15;
    const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0);

    return Math.max(0.05, Math.min(0.35, baseRate + (totalImpact / 500)));
  }

  private initializeHistoricalData(): void {
    // Initialize with sample historical data
    // In real implementation, this would load from database
    const sampleData = [
      { slot: '2-10', score: 25 }, // Tuesday 10 AM
      { slot: '2-14', score: 45 }, // Tuesday 2 PM
      { slot: '2-19', score: 35 }, // Tuesday 7 PM
      { slot: '3-10', score: 30 }, // Wednesday 10 AM
      { slot: '3-14', score: 50 }, // Wednesday 2 PM
      { slot: '4-14', score: 40 }, // Thursday 2 PM
    ];

    sampleData.forEach(data => {
      this.audienceProfile.historicalEngagement.set(data.slot, data.score);
    });
  }

  private getTimeDescription(date: Date): string {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private getDayDescription(dayOfWeek: number, score: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[dayOfWeek];

    if (score > 15) return `${day} - excellent day for your content type`;
    if (score > 0) return `${day} - good day for engagement`;
    if (score > -15) return `${day} - average performance expected`;
    return `${day} - consider alternative days`;
  }
}

// Export singleton instance
export const smartScheduler = new SmartScheduler();