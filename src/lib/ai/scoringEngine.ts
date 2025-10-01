'use client';

export interface ViewerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  timezone: string;
  intentScore: number;
  engagementTime: number;
  interactions: number;
  lastActivity: string;
  signals: string[];
  behaviorMetrics: {
    timeOnPage: number;
    scrollDepth: number;
    clicksToCTA: number;
    formEngagement: number;
    chatParticipation: number;
    pollVotes: number;
    reactionCount: number;
    purchaseHistory: number;
    emailEngagement: number;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    trafficSource: 'direct' | 'social' | 'email' | 'paid' | 'organic';
    returningVisitor: boolean;
    geolocation: string;
  };
  aiPredictions: {
    conversionProbability: number;
    lifetimeValue: number;
    optimalOfferTiming: number;
    preferredCommunication: 'email' | 'phone' | 'sms';
    pricesensitivity: 'low' | 'medium' | 'high';
    decisionMakingSpeed: 'fast' | 'medium' | 'slow';
  };
}

export type IntentLevel = 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT_LEAD' | 'JACKPOT';

interface ScoringWeights {
  timeSpent: number;
  interactions: number;
  engagementRate: number;
  purchaseHistory: number;
  chatParticipation: number;
  formCompletion: number;
  clicksToCTA: number;
  returnVisitor: number;
  deviceQuality: number;
  trafficSource: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  timeSpent: 0.20,      // 20% - Time spent on stream/page
  interactions: 0.18,    // 18% - Polls, reactions, chat
  engagementRate: 0.15,  // 15% - Active participation rate
  purchaseHistory: 0.12, // 12% - Previous purchases
  chatParticipation: 0.10, // 10% - Chat engagement
  formCompletion: 0.08,   // 8% - Registration completion rate
  clicksToCTA: 0.07,      // 7% - CTA interaction frequency
  returnVisitor: 0.05,    // 5% - Returning vs new
  deviceQuality: 0.03,    // 3% - Desktop vs mobile scoring
  trafficSource: 0.02     // 2% - Traffic source quality
};

export class ConvertCastAI {
  private weights: ScoringWeights;
  private learningData: Map<string, ViewerProfile[]> = new Map();

  constructor(customWeights?: Partial<ScoringWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...customWeights };
  }

  /**
   * Calculate real-time intent score (0-100)
   */
  calculateIntentScore(viewer: ViewerProfile): number {
    const metrics = viewer.behaviorMetrics;
    let score = 0;

    // Time spent scoring (0-25 points)
    const timeScore = Math.min((metrics.timeOnPage / 300) * 25, 25); // Max at 5 minutes
    score += timeScore * this.weights.timeSpent;

    // Interaction scoring (0-20 points)
    const totalInteractions = metrics.pollVotes + metrics.reactionCount + metrics.chatParticipation;
    const interactionScore = Math.min((totalInteractions / 10) * 20, 20);
    score += interactionScore * this.weights.interactions;

    // Engagement rate (0-15 points)
    const engagementRate = this.calculateEngagementRate(viewer);
    score += (engagementRate * 15) * this.weights.engagementRate;

    // Purchase history (0-12 points)
    const purchaseScore = Math.min(metrics.purchaseHistory * 4, 12);
    score += purchaseScore * this.weights.purchaseHistory;

    // Chat participation (0-10 points)
    const chatScore = Math.min(metrics.chatParticipation * 2, 10);
    score += chatScore * this.weights.chatParticipation;

    // Form completion signals (0-8 points)
    const formScore = metrics.formEngagement * 8;
    score += formScore * this.weights.formCompletion;

    // CTA clicks (0-7 points)
    const ctaScore = Math.min(metrics.clicksToCTA * 2, 7);
    score += ctaScore * this.weights.clicksToCTA;

    // Returning visitor bonus (0-5 points)
    const returnBonus = metrics.returningVisitor ? 5 : 0;
    score += returnBonus * this.weights.returnVisitor;

    // Device quality (0-3 points)
    const deviceScore = metrics.deviceType === 'desktop' ? 3 : metrics.deviceType === 'tablet' ? 2 : 1;
    score += deviceScore * this.weights.deviceQuality;

    // Traffic source quality (0-2 points)
    const sourceScore = this.getTrafficSourceScore(metrics.trafficSource);
    score += sourceScore * this.weights.trafficSource;

    // Apply AI learning adjustments
    score = this.applyAIAdjustments(viewer, score);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Get intent level classification
   */
  getIntentLevel(score: number): IntentLevel {
    if (score >= 90) return 'JACKPOT';      // 90-100: Ready to buy now
    if (score >= 75) return 'HOT_LEAD';     // 75-89: High buying intent
    if (score >= 60) return 'WARM';         // 60-74: Interested and engaged
    if (score >= 40) return 'LUKEWARM';     // 40-59: Some interest
    return 'COLD';                          // 0-39: Low intent
  }

  /**
   * Get color for intent level
   */
  getIntentColor(level: IntentLevel): string {
    switch (level) {
      case 'JACKPOT': return '#DC2626';    // Red
      case 'HOT_LEAD': return '#EA580C';   // Orange
      case 'WARM': return '#D97706';       // Yellow
      case 'LUKEWARM': return '#0891B2';   // Blue
      case 'COLD': return '#6B7280';       // Gray
    }
  }

  /**
   * Generate suggested actions for viewer
   */
  generateSuggestedActions(viewer: ViewerProfile): string[] {
    const score = viewer.intentScore;
    const level = this.getIntentLevel(score);
    const actions: string[] = [];

    switch (level) {
      case 'JACKPOT':
        actions.push('🎯 Send premium offer immediately');
        actions.push('📞 Trigger phone call sequence');
        actions.push('⚡ Show urgency-based CTA');
        actions.push('💎 Offer exclusive VIP access');
        break;
        
      case 'HOT_LEAD':
        actions.push('💰 Display limited-time discount');
        actions.push('📧 Add to priority email sequence');
        actions.push('🔥 Show social proof overlay');
        actions.push('⏰ Create scarcity messaging');
        break;
        
      case 'WARM':
        actions.push('📚 Offer valuable content upgrade');
        actions.push('💬 Engage in chat conversation');
        actions.push('🎁 Present lead magnet');
        actions.push('📊 Share case study overlay');
        break;
        
      case 'LUKEWARM':
        actions.push('🎯 Show targeted poll question');
        actions.push('📹 Display testimonial video');
        actions.push('💡 Share educational content');
        actions.push('🔄 Retarget with follow-up');
        break;
        
      case 'COLD':
        actions.push('👋 Welcome message in chat');
        actions.push('🎪 Engage with interactive poll');
        actions.push('📱 Show mobile-friendly CTA');
        actions.push('🔔 Add to nurture sequence');
        break;
    }

    return actions;
  }

  /**
   * Predict optimal offer timing
   */
  predictOptimalTiming(viewer: ViewerProfile): {
    timing: 'immediate' | 'mid-stream' | 'closing' | 'follow-up';
    confidence: number;
    reasoning: string;
  } {
    const score = viewer.intentScore;
    const metrics = viewer.behaviorMetrics;
    
    if (score >= 90) {
      return {
        timing: 'immediate',
        confidence: 0.95,
        reasoning: 'Extremely high intent - strike while hot!'
      };
    }
    
    if (score >= 75 && metrics.timeOnPage > 600) {
      return {
        timing: 'mid-stream',
        confidence: 0.87,
        reasoning: 'High engagement maintained - perfect timing'
      };
    }
    
    if (score >= 60) {
      return {
        timing: 'closing',
        confidence: 0.72,
        reasoning: 'Building interest - close with strong offer'
      };
    }
    
    return {
      timing: 'follow-up',
      confidence: 0.58,
      reasoning: 'Needs more nurturing - follow up sequence'
    };
  }

  /**
   * Generate AI insights for streamer
   */
  generateStreamInsights(viewers: ViewerProfile[]): {
    totalViewers: number;
    hotLeads: number;
    averageScore: number;
    conversionProbability: number;
    revenueProjection: number;
    recommendations: string[];
    urgentActions: string[];
  } {
    const hotLeads = viewers.filter(v => v.intentScore >= 75);
    const jackpotLeads = viewers.filter(v => v.intentScore >= 90);
    const averageScore = viewers.reduce((sum, v) => sum + v.intentScore, 0) / viewers.length;
    
    const recommendations: string[] = [];
    const urgentActions: string[] = [];
    
    // Generate recommendations based on audience composition
    const hotPercent = (hotLeads.length / viewers.length) * 100;
    
    if (jackpotLeads.length > 0) {
      urgentActions.push(`🎯 ${jackpotLeads.length} JACKPOT leads ready - trigger premium offers now!`);
    }
    
    if (hotPercent > 30) {
      recommendations.push('🔥 High-intent audience - perfect time for offers');
      recommendations.push('💰 Consider premium pricing strategy');
    } else if (hotPercent > 15) {
      recommendations.push('⚡ Good engagement - build more urgency');
      recommendations.push('🎯 Focus on mid-tier offers');
    } else {
      recommendations.push('📈 Build more engagement with polls/questions');
      recommendations.push('🎁 Lead magnets to capture interest');
    }
    
    return {
      totalViewers: viewers.length,
      hotLeads: hotLeads.length,
      averageScore: Math.round(averageScore),
      conversionProbability: this.calculateConversionProbability(viewers),
      revenueProjection: this.calculateRevenueProjection(viewers),
      recommendations,
      urgentActions
    };
  }

  private calculateEngagementRate(viewer: ViewerProfile): number {
    const metrics = viewer.behaviorMetrics;
    const totalPossibleActions = 10; // Arbitrary max for normalization
    const actualActions = metrics.pollVotes + metrics.reactionCount + 
                         (metrics.chatParticipation > 0 ? 1 : 0) + 
                         (metrics.clicksToCTA > 0 ? 1 : 0) +
                         (metrics.formEngagement > 0 ? 1 : 0);
    
    return Math.min(actualActions / totalPossibleActions, 1);
  }

  private getTrafficSourceScore(source: string): number {
    switch (source) {
      case 'direct': return 2;
      case 'email': return 1.8;
      case 'paid': return 1.5;
      case 'social': return 1.2;
      case 'organic': return 1;
      default: return 1;
    }
  }

  private applyAIAdjustments(viewer: ViewerProfile, baseScore: number): number {
    // Apply machine learning adjustments based on historical data
    let adjustment = 0;
    
    // Time-of-day adjustment
    const hour = new Date().getHours();
    if (hour >= 10 && hour <= 16) adjustment += 2; // Business hours boost
    
    // Geographic adjustment
    if (viewer.behaviorMetrics.geolocation.includes('US') || 
        viewer.behaviorMetrics.geolocation.includes('UK') ||
        viewer.behaviorMetrics.geolocation.includes('CA')) {
      adjustment += 3; // Higher purchasing power regions
    }
    
    // Email domain quality
    if (viewer.email.includes('@gmail.') || viewer.email.includes('@outlook.')) {
      adjustment += 1;
    } else if (viewer.email.match(/\.(com|org|net)$/)) {
      adjustment += 2; // Business domains
    }
    
    return baseScore + adjustment;
  }

  private calculateConversionProbability(viewers: ViewerProfile[]): number {
    const averageScore = viewers.reduce((sum, v) => sum + v.intentScore, 0) / viewers.length;
    const hotLeadPercent = viewers.filter(v => v.intentScore >= 75).length / viewers.length;
    
    return Math.min((averageScore / 100) * 0.7 + hotLeadPercent * 0.3, 0.95);
  }

  private calculateRevenueProjection(viewers: ViewerProfile[]): number {
    // Base revenue per viewer by intent level
    const revenueMap = {
      'JACKPOT': 497,
      'HOT_LEAD': 297,
      'WARM': 97,
      'LUKEWARM': 27,
      'COLD': 7
    };
    
    return viewers.reduce((total, viewer) => {
      const level = this.getIntentLevel(viewer.intentScore);
      return total + (revenueMap[level] * viewer.aiPredictions.conversionProbability);
    }, 0);
  }
}

// Export singleton instance
export const convertCastAI = new ConvertCastAI();