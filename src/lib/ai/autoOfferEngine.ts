'use client';

import { ViewerProfile, IntentLevel } from './scoringEngine';

export interface AutoOfferConfig {
  enabled: boolean;
  triggers: {
    scoreThreshold: number;
    engagementTime: number;
    interactionCount: number;
    timeBasedTrigger: boolean;
    behaviorBasedTrigger: boolean;
  };
  offers: {
    jackpotOffer: OfferTemplate;
    hotLeadOffer: OfferTemplate;
    warmLeadOffer: OfferTemplate;
    nurturingOffer: OfferTemplate;
  };
  timing: {
    minTimeBetweenOffers: number; // seconds
    maxOffersPerViewer: number;
    cooldownPeriod: number; // seconds
  };
}

export interface OfferTemplate {
  id: string;
  name: string;
  headline: string;
  subtext: string;
  buttonText: string;
  discount?: number;
  urgency: boolean;
  scarcity?: {
    enabled: boolean;
    remaining: number;
    message: string;
  };
  socialProof?: {
    enabled: boolean;
    message: string;
  };
  pricing: {
    originalPrice: number;
    offerPrice: number;
    currency: string;
  };
  duration: number; // seconds to display
  position: 'center' | 'top-center' | 'bottom-center' | 'side';
  style: 'urgent' | 'premium' | 'friendly' | 'exclusive';
}

export interface OfferTrigger {
  id: string;
  viewerId: string;
  offerTemplate: OfferTemplate;
  triggerTime: Date;
  triggerReason: string;
  confidence: number;
  context: {
    viewerScore: number;
    engagementTime: number;
    lastActivity: string;
    previousOffers: number;
  };
}

export interface OfferPerformance {
  offerId: string;
  triggered: number;
  viewed: number;
  clicked: number;
  converted: number;
  revenue: number;
  avgViewTime: number;
  bestPerformingTime: string;
}

const DEFAULT_OFFERS: AutoOfferConfig['offers'] = {
  jackpotOffer: {
    id: 'jackpot-premium',
    name: 'Premium VIP Access',
    headline: '🎰 JACKPOT EXCLUSIVE!',
    subtext: 'Ultra-premium access for serious players only',
    buttonText: 'CLAIM VIP ACCESS NOW',
    discount: 50,
    urgency: true,
    scarcity: {
      enabled: true,
      remaining: 3,
      message: 'Only 3 spots left at this price!'
    },
    socialProof: {
      enabled: true,
      message: '247 people claimed this in the last 24h'
    },
    pricing: {
      originalPrice: 2997,
      offerPrice: 1497,
      currency: 'USD'
    },
    duration: 45,
    position: 'center',
    style: 'urgent'
  },
  hotLeadOffer: {
    id: 'hot-lead-standard',
    name: 'Limited Time Discount',
    headline: '🔥 Hot Lead Special!',
    subtext: 'Perfect timing - this offer expires soon',
    buttonText: 'GET 40% OFF NOW',
    discount: 40,
    urgency: true,
    scarcity: {
      enabled: true,
      remaining: 12,
      message: '12 spots remaining'
    },
    pricing: {
      originalPrice: 997,
      offerPrice: 597,
      currency: 'USD'
    },
    duration: 30,
    position: 'center',
    style: 'urgent'
  },
  warmLeadOffer: {
    id: 'warm-lead-intro',
    name: 'Starter Package',
    headline: '📚 Perfect for Getting Started',
    subtext: 'Everything you need to begin your journey',
    buttonText: 'START FOR $97',
    discount: 25,
    urgency: false,
    pricing: {
      originalPrice: 297,
      offerPrice: 197,
      currency: 'USD'
    },
    duration: 25,
    position: 'bottom-center',
    style: 'friendly'
  },
  nurturingOffer: {
    id: 'nurture-lead-magnet',
    name: 'Free Lead Magnet',
    headline: '🎁 Exclusive Free Guide',
    subtext: 'Get our complete blueprint absolutely free',
    buttonText: 'DOWNLOAD FREE GUIDE',
    urgency: false,
    pricing: {
      originalPrice: 0,
      offerPrice: 0,
      currency: 'USD'
    },
    duration: 20,
    position: 'side',
    style: 'friendly'
  }
};

export class AutoOfferEngine {
  private config: AutoOfferConfig;
  private viewerHistory: Map<string, OfferTrigger[]> = new Map();
  private performance: Map<string, OfferPerformance> = new Map();
  private activeOffers: Map<string, OfferTrigger> = new Map();
  private cooldowns: Map<string, Date> = new Map();

  constructor(config?: Partial<AutoOfferConfig>) {
    this.config = {
      enabled: true,
      triggers: {
        scoreThreshold: 60,
        engagementTime: 300, // 5 minutes
        interactionCount: 3,
        timeBasedTrigger: true,
        behaviorBasedTrigger: true
      },
      offers: DEFAULT_OFFERS,
      timing: {
        minTimeBetweenOffers: 1800, // 30 minutes
        maxOffersPerViewer: 3,
        cooldownPeriod: 3600 // 1 hour
      },
      ...config
    };
  }

  /**
   * Analyze viewer and determine if offer should be triggered
   */
  analyzeViewer(viewer: ViewerProfile): OfferTrigger | null {
    if (!this.config.enabled) return null;

    // Check cooldown
    const cooldown = this.cooldowns.get(viewer.id);
    if (cooldown && new Date().getTime() - cooldown.getTime() < this.config.timing.cooldownPeriod * 1000) {
      return null;
    }

    // Check max offers per viewer
    const history = this.viewerHistory.get(viewer.id) || [];
    if (history.length >= this.config.timing.maxOffersPerViewer) {
      return null;
    }

    // Check minimum time between offers
    if (history.length > 0) {
      const lastOffer = history[history.length - 1];
      const timeSince = new Date().getTime() - lastOffer.triggerTime.getTime();
      if (timeSince < this.config.timing.minTimeBetweenOffers * 1000) {
        return null;
      }
    }

    // Analyze trigger conditions
    const triggerResult = this.shouldTriggerOffer(viewer);
    if (!triggerResult.shouldTrigger) return null;

    // Select optimal offer
    const offer = this.selectOptimalOffer(viewer, triggerResult.confidence);
    if (!offer) return null;

    // Create trigger
    const trigger: OfferTrigger = {
      id: `${viewer.id}-${Date.now()}`,
      viewerId: viewer.id,
      offerTemplate: offer,
      triggerTime: new Date(),
      triggerReason: triggerResult.reason,
      confidence: triggerResult.confidence,
      context: {
        viewerScore: viewer.intentScore,
        engagementTime: viewer.engagementTime,
        lastActivity: viewer.lastActivity,
        previousOffers: history.length
      }
    };

    // Track trigger
    this.trackOfferTrigger(trigger);

    return trigger;
  }

  /**
   * Determine if offer should be triggered for viewer
   */
  private shouldTriggerOffer(viewer: ViewerProfile): {
    shouldTrigger: boolean;
    confidence: number;
    reason: string;
  } {
    let confidence = 0;
    const reasons: string[] = [];

    // Score-based trigger
    if (viewer.intentScore >= this.config.triggers.scoreThreshold) {
      confidence += 0.3;
      reasons.push('High intent score');
    }

    // Engagement time trigger
    if (viewer.engagementTime >= this.config.triggers.engagementTime) {
      confidence += 0.25;
      reasons.push('Extended engagement time');
    }

    // Interaction count trigger
    if (viewer.interactions >= this.config.triggers.interactionCount) {
      confidence += 0.2;
      reasons.push('Active interaction level');
    }

    // Behavioral signals
    const behaviorScore = this.analyzeBehavioralSignals(viewer);
    confidence += behaviorScore.score * 0.25;
    if (behaviorScore.signals.length > 0) {
      reasons.push(...behaviorScore.signals);
    }

    // Time-based optimization
    const timeScore = this.analyzeOptimalTiming();
    confidence += timeScore * 0.1;

    // Jackpot leads get immediate priority
    if (viewer.intentScore >= 90) {
      confidence = Math.max(confidence, 0.95);
      reasons.push('JACKPOT level intent');
    }

    return {
      shouldTrigger: confidence >= 0.6,
      confidence: Math.min(confidence, 1),
      reason: reasons.join(', ')
    };
  }

  /**
   * Select the most appropriate offer for viewer
   */
  private selectOptimalOffer(viewer: ViewerProfile, confidence: number): OfferTemplate | null {
    const score = viewer.intentScore;

    // JACKPOT leads (90-100)
    if (score >= 90) {
      return this.config.offers.jackpotOffer;
    }

    // HOT leads (75-89)
    if (score >= 75) {
      return this.config.offers.hotLeadOffer;
    }

    // WARM leads (60-74)
    if (score >= 60) {
      return this.config.offers.warmLeadOffer;
    }

    // Everyone else gets nurturing
    return this.config.offers.nurturingOffer;
  }

  /**
   * Analyze behavioral signals for offer timing
   */
  private analyzeBehavioralSignals(viewer: ViewerProfile): {
    score: number;
    signals: string[];
  } {
    const signals: string[] = [];
    let score = 0;

    // Form engagement signal
    if (viewer.behaviorMetrics.formEngagement > 0.7) {
      score += 0.3;
      signals.push('High form engagement');
    }

    // CTA clicks
    if (viewer.behaviorMetrics.clicksToCTA >= 2) {
      score += 0.25;
      signals.push('Multiple CTA interactions');
    }

    // Scroll depth
    if (viewer.behaviorMetrics.scrollDepth > 0.8) {
      score += 0.2;
      signals.push('Deep page exploration');
    }

    // Returning visitor
    if (viewer.behaviorMetrics.returningVisitor) {
      score += 0.15;
      signals.push('Returning visitor');
    }

    // Purchase history
    if (viewer.behaviorMetrics.purchaseHistory > 0) {
      score += 0.4;
      signals.push('Previous purchase history');
    }

    // High email engagement
    if (viewer.behaviorMetrics.emailEngagement > 0.6) {
      score += 0.1;
      signals.push('Email responsive');
    }

    return { score: Math.min(score, 1), signals };
  }

  /**
   * Analyze optimal timing based on historical performance
   */
  private analyzeOptimalTiming(): number {
    const hour = new Date().getHours();

    // Business hours boost (10 AM - 4 PM)
    if (hour >= 10 && hour <= 16) return 0.8;

    // Evening engagement (7 PM - 10 PM)
    if (hour >= 19 && hour <= 22) return 0.6;

    // Morning (8 AM - 10 AM)
    if (hour >= 8 && hour <= 10) return 0.4;

    // Lower confidence for other times
    return 0.2;
  }

  /**
   * Track offer trigger for analytics
   */
  private trackOfferTrigger(trigger: OfferTrigger): void {
    // Add to viewer history
    const history = this.viewerHistory.get(trigger.viewerId) || [];
    history.push(trigger);
    this.viewerHistory.set(trigger.viewerId, history);

    // Track performance metrics
    const perf = this.performance.get(trigger.offerTemplate.id) || {
      offerId: trigger.offerTemplate.id,
      triggered: 0,
      viewed: 0,
      clicked: 0,
      converted: 0,
      revenue: 0,
      avgViewTime: 0,
      bestPerformingTime: new Date().toLocaleTimeString()
    };

    perf.triggered++;
    this.performance.set(trigger.offerTemplate.id, perf);

    // Set active offer
    this.activeOffers.set(trigger.viewerId, trigger);

    // Set cooldown
    this.cooldowns.set(trigger.viewerId, new Date());
  }

  /**
   * Handle offer interaction (view, click, convert)
   */
  handleOfferInteraction(viewerId: string, action: 'viewed' | 'clicked' | 'converted', revenue?: number): void {
    const trigger = this.activeOffers.get(viewerId);
    if (!trigger) return;

    const perf = this.performance.get(trigger.offerTemplate.id);
    if (!perf) return;

    switch (action) {
      case 'viewed':
        perf.viewed++;
        break;
      case 'clicked':
        perf.clicked++;
        break;
      case 'converted':
        perf.converted++;
        if (revenue) perf.revenue += revenue;
        break;
    }

    this.performance.set(trigger.offerTemplate.id, perf);

    if (action === 'converted' || action === 'clicked') {
      // Remove from active offers
      this.activeOffers.delete(viewerId);
    }
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): {
    totalTriggers: number;
    conversionRate: number;
    totalRevenue: number;
    bestPerformingOffer: string;
    offerBreakdown: OfferPerformance[];
  } {
    const offers = Array.from(this.performance.values());
    const totalTriggers = offers.reduce((sum, o) => sum + o.triggered, 0);
    const totalConverted = offers.reduce((sum, o) => sum + o.converted, 0);
    const totalRevenue = offers.reduce((sum, o) => sum + o.revenue, 0);

    const bestPerforming = offers.reduce((best, current) => {
      const currentRate = current.triggered > 0 ? current.converted / current.triggered : 0;
      const bestRate = best.triggered > 0 ? best.converted / best.triggered : 0;
      return currentRate > bestRate ? current : best;
    }, offers[0] || { offerId: 'none' });

    return {
      totalTriggers,
      conversionRate: totalTriggers > 0 ? totalConverted / totalTriggers : 0,
      totalRevenue,
      bestPerformingOffer: bestPerforming?.offerId || 'none',
      offerBreakdown: offers
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoOfferConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AutoOfferConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Clear viewer history and reset
   */
  reset(): void {
    this.viewerHistory.clear();
    this.performance.clear();
    this.activeOffers.clear();
    this.cooldowns.clear();
  }
}

// Export singleton instance
export const autoOfferEngine = new AutoOfferEngine();