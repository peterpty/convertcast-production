'use client';

import { ViewerProfile } from '../ai/scoringEngine';
import { currency } from 'currency.js';

export interface PaymentOffer {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currency: string;
  discountPercentage?: number;
  finalPrice: number;
  urgency: {
    enabled: boolean;
    timeLeft?: number; // seconds
    message: string;
  };
  scarcity: {
    enabled: boolean;
    remaining?: number;
    message: string;
  };
  features: string[];
  offerType: 'standard' | 'premium' | 'vip' | 'limited';
  validUntil?: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100
  pricing: {
    basePrice: number;
    discountPercentage: number;
  };
  messaging: {
    headline: string;
    subtext: string;
    buttonText: string;
    urgencyMessage: string;
  };
  design: {
    color: string;
    style: 'minimal' | 'bold' | 'premium';
  };
}

export interface ABTestConfiguration {
  id: string;
  name: string;
  isActive: boolean;
  variants: ABTestVariant[];
  trafficSplit: number; // percentage of viewers to include in test
  conversionGoal: string;
  startDate: Date;
  endDate?: Date;
  results: {
    [variantId: string]: {
      impressions: number;
      conversions: number;
      revenue: number;
      conversionRate: number;
    };
  };
}

export interface DynamicPricingRule {
  id: string;
  name: string;
  condition: {
    intentScoreMin: number;
    intentScoreMax: number;
    engagementTimeMin?: number;
    trafficSource?: string[];
    deviceType?: string[];
    returningVisitor?: boolean;
  };
  adjustment: {
    type: 'percentage' | 'fixed';
    value: number; // percentage (10 = 10% discount) or fixed amount
    maxDiscount?: number;
  };
  priority: number; // higher = more priority
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'paypal' | 'apple-pay' | 'google-pay';
  enabled: boolean;
  config: {
    [key: string]: any;
  };
}

export interface PaymentSession {
  id: string;
  viewerId: string;
  offerId: string;
  offer: PaymentOffer;
  abTestVariant?: string;
  originalPrice: number;
  finalPrice: number;
  currency: string;
  paymentMethod: PaymentMethod['type'];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  metadata: {
    [key: string]: any;
  };
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // conversion rate from USD
  locale: string;
}

const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0, locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.85, locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.73, locale: 'en-GB' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.25, locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.35, locale: 'en-AU' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 110.0, locale: 'ja-JP' }
];

export class AutoOfferPaymentEngine {
  private abTests: Map<string, ABTestConfiguration> = new Map();
  private pricingRules: DynamicPricingRule[] = [];
  private activeSessions: Map<string, PaymentSession> = new Map();
  private paymentMethods: PaymentMethod[] = [];

  constructor() {
    this.initializeDefaultPricingRules();
    this.initializePaymentMethods();
  }

  /**
   * Generate optimized offer for viewer based on AI scoring
   */
  generateOptimizedOffer(
    viewer: ViewerProfile,
    baseOffer: Partial<PaymentOffer>,
    currency = 'USD'
  ): PaymentOffer {
    const targetCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];

    // Apply dynamic pricing based on viewer score and behavior
    const pricingAdjustment = this.calculateDynamicPricing(viewer);
    const basePrice = (baseOffer.basePrice || 297) * targetCurrency.rate;

    // Calculate final price with discounts
    let finalPrice = basePrice;
    let discountPercentage = 0;

    if (pricingAdjustment.type === 'percentage') {
      discountPercentage = pricingAdjustment.value;
      finalPrice = basePrice * (1 - discountPercentage / 100);
    } else {
      const discountAmount = pricingAdjustment.value * targetCurrency.rate;
      finalPrice = Math.max(basePrice - discountAmount, basePrice * 0.1); // Min 10% of original
      discountPercentage = ((basePrice - finalPrice) / basePrice) * 100;
    }

    // Generate urgency and scarcity messaging
    const urgency = this.generateUrgencyMessaging(viewer);
    const scarcity = this.generateScarcityMessaging(viewer);

    // Create optimized offer
    const optimizedOffer: PaymentOffer = {
      id: `offer-${viewer.id}-${Date.now()}`,
      name: baseOffer.name || this.getOfferNameByIntentLevel(viewer.intentScore),
      description: baseOffer.description || this.getOfferDescriptionByIntentLevel(viewer.intentScore),
      basePrice,
      currency: targetCurrency.code,
      discountPercentage: Math.round(discountPercentage),
      finalPrice: Math.round(finalPrice),
      urgency,
      scarcity,
      features: baseOffer.features || this.getFeaturesByIntentLevel(viewer.intentScore),
      offerType: this.getOfferTypeByIntentLevel(viewer.intentScore),
      validUntil: new Date(Date.now() + (urgency.timeLeft || 3600) * 1000)
    };

    return optimizedOffer;
  }

  /**
   * Get A/B test variant for viewer
   */
  getABTestVariant(viewer: ViewerProfile, testId: string): ABTestVariant | null {
    const test = this.abTests.get(testId);
    if (!test || !test.isActive) return null;

    // Check if viewer should be included in test
    if (Math.random() > test.trafficSplit / 100) return null;

    // Deterministic variant assignment based on viewer ID
    const hash = this.hashString(viewer.id + testId);
    const bucket = hash % 100;

    let currentWeight = 0;
    for (const variant of test.variants) {
      currentWeight += variant.weight;
      if (bucket < currentWeight) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback
  }

  /**
   * Create payment session
   */
  createPaymentSession(
    viewer: ViewerProfile,
    offer: PaymentOffer,
    paymentMethodType: PaymentMethod['type'],
    abTestVariant?: string
  ): PaymentSession {
    const session: PaymentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      viewerId: viewer.id,
      offerId: offer.id,
      offer,
      abTestVariant,
      originalPrice: offer.basePrice,
      finalPrice: offer.finalPrice,
      currency: offer.currency,
      paymentMethod: paymentMethodType,
      status: 'pending',
      createdAt: new Date(),
      metadata: {
        intentScore: viewer.intentScore,
        engagementTime: viewer.engagementTime,
        trafficSource: viewer.behaviorMetrics.trafficSource,
        deviceType: viewer.behaviorMetrics.deviceType
      }
    };

    this.activeSessions.set(session.id, session);
    return session;
  }

  /**
   * Update session status and track conversion
   */
  updateSessionStatus(
    sessionId: string,
    status: PaymentSession['status'],
    externalId?: string
  ): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.status = status;

    if (status === 'completed') {
      session.completedAt = new Date();
      this.trackConversion(session);
    }

    if (externalId) {
      if (session.paymentMethod === 'stripe') {
        session.stripePaymentIntentId = externalId;
      } else if (session.paymentMethod === 'paypal') {
        session.paypalOrderId = externalId;
      }
    }
  }

  /**
   * Get optimal offer timing based on viewer behavior
   */
  getOptimalOfferTiming(viewer: ViewerProfile): {
    shouldTrigger: boolean;
    confidence: number;
    delaySeconds: number;
    reasoning: string;
  } {
    const score = viewer.intentScore;
    const engagementTime = viewer.engagementTime;

    // JACKPOT leads - immediate trigger
    if (score >= 90) {
      return {
        shouldTrigger: true,
        confidence: 0.95,
        delaySeconds: 0,
        reasoning: 'JACKPOT intent score - trigger premium offer immediately'
      };
    }

    // HOT leads - short delay for engagement buildup
    if (score >= 75 && engagementTime > 300) {
      return {
        shouldTrigger: true,
        confidence: 0.85,
        delaySeconds: 30,
        reasoning: 'HOT lead with good engagement - brief delay for maximum impact'
      };
    }

    // WARM leads - medium delay
    if (score >= 60 && engagementTime > 600) {
      return {
        shouldTrigger: true,
        confidence: 0.72,
        delaySeconds: 120,
        reasoning: 'WARM lead with extended engagement - build more value first'
      };
    }

    // LUKEWARM - longer delay or nurture sequence
    if (score >= 40) {
      return {
        shouldTrigger: false,
        confidence: 0.45,
        delaySeconds: 900,
        reasoning: 'LUKEWARM intent - continue nurturing before offer'
      };
    }

    return {
      shouldTrigger: false,
      confidence: 0.2,
      delaySeconds: 0,
      reasoning: 'Low intent score - focus on engagement building'
    };
  }

  /**
   * Format price in local currency
   */
  formatPrice(amount: number, currencyCode: string): string {
    const curr = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];

    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code
    }).format(amount);
  }

  /**
   * Convert price between currencies
   */
  convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
    const fromCurr = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency) || SUPPORTED_CURRENCIES[0];
    const toCurr = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency) || SUPPORTED_CURRENCIES[0];

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromCurr.rate;
    return usdAmount * toCurr.rate;
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): Currency[] {
    return [...SUPPORTED_CURRENCIES];
  }

  /**
   * Get payment session by ID
   */
  getPaymentSession(sessionId: string): PaymentSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get active A/B tests
   */
  getActiveABTests(): ABTestConfiguration[] {
    return Array.from(this.abTests.values()).filter(test => test.isActive);
  }

  // Private methods

  private calculateDynamicPricing(viewer: ViewerProfile): { type: 'percentage' | 'fixed'; value: number } {
    // Find applicable pricing rule with highest priority
    const applicableRules = this.pricingRules
      .filter(rule => this.isRuleApplicable(rule, viewer))
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length === 0) {
      return { type: 'percentage', value: 0 }; // No discount
    }

    return applicableRules[0].adjustment;
  }

  private isRuleApplicable(rule: DynamicPricingRule, viewer: ViewerProfile): boolean {
    if (!rule.isActive) return false;

    // Check intent score range
    if (viewer.intentScore < rule.condition.intentScoreMin ||
        viewer.intentScore > rule.condition.intentScoreMax) {
      return false;
    }

    // Check engagement time
    if (rule.condition.engagementTimeMin && viewer.engagementTime < rule.condition.engagementTimeMin) {
      return false;
    }

    // Check traffic source
    if (rule.condition.trafficSource &&
        !rule.condition.trafficSource.includes(viewer.behaviorMetrics.trafficSource)) {
      return false;
    }

    // Check device type
    if (rule.condition.deviceType &&
        !rule.condition.deviceType.includes(viewer.behaviorMetrics.deviceType)) {
      return false;
    }

    // Check returning visitor
    if (rule.condition.returningVisitor !== undefined &&
        viewer.behaviorMetrics.returningVisitor !== rule.condition.returningVisitor) {
      return false;
    }

    return true;
  }

  private generateUrgencyMessaging(viewer: ViewerProfile): PaymentOffer['urgency'] {
    if (viewer.intentScore >= 90) {
      return {
        enabled: true,
        timeLeft: 900, // 15 minutes
        message: '🚨 EXCLUSIVE: This premium offer expires in 15 minutes!'
      };
    }

    if (viewer.intentScore >= 75) {
      return {
        enabled: true,
        timeLeft: 1800, // 30 minutes
        message: '⏰ Limited time: 30 minutes left at this special price!'
      };
    }

    if (viewer.intentScore >= 60) {
      return {
        enabled: true,
        timeLeft: 3600, // 1 hour
        message: '⏳ Special pricing ends in 1 hour - don\'t miss out!'
      };
    }

    return {
      enabled: false,
      message: ''
    };
  }

  private generateScarcityMessaging(viewer: ViewerProfile): PaymentOffer['scarcity'] {
    if (viewer.intentScore >= 90) {
      return {
        enabled: true,
        remaining: 3,
        message: 'Only 3 VIP spots left at this exclusive price!'
      };
    }

    if (viewer.intentScore >= 75) {
      return {
        enabled: true,
        remaining: 12,
        message: 'Only 12 spots remaining in this cohort!'
      };
    }

    if (viewer.intentScore >= 60) {
      return {
        enabled: true,
        remaining: 47,
        message: '47 people have already secured their spot today!'
      };
    }

    return {
      enabled: false,
      message: ''
    };
  }

  private getOfferNameByIntentLevel(score: number): string {
    if (score >= 90) return 'VIP Exclusive Access';
    if (score >= 75) return 'Premium Package';
    if (score >= 60) return 'Complete System';
    return 'Essential Training';
  }

  private getOfferDescriptionByIntentLevel(score: number): string {
    if (score >= 90) return 'Our most comprehensive program with 1-on-1 coaching and exclusive bonuses';
    if (score >= 75) return 'Advanced training with premium resources and priority support';
    if (score >= 60) return 'Complete training system with all core modules and materials';
    return 'Essential training to get you started on the right path';
  }

  private getFeaturesByIntentLevel(score: number): string[] {
    const baseFeatures = ['Core training modules', 'Digital workbook', 'Email support'];

    if (score >= 60) baseFeatures.push('Bonus materials', 'Private community access');
    if (score >= 75) baseFeatures.push('Priority support', 'Monthly group calls', 'Advanced templates');
    if (score >= 90) baseFeatures.push('1-on-1 coaching session', 'Done-for-you resources', 'Lifetime updates');

    return baseFeatures;
  }

  private getOfferTypeByIntentLevel(score: number): PaymentOffer['offerType'] {
    if (score >= 90) return 'vip';
    if (score >= 75) return 'premium';
    if (score >= 60) return 'standard';
    return 'standard';
  }

  private trackConversion(session: PaymentSession): void {
    // Track conversion for A/B testing
    if (session.abTestVariant) {
      const testId = this.findTestByVariant(session.abTestVariant);
      if (testId) {
        const test = this.abTests.get(testId);
        if (test) {
          if (!test.results[session.abTestVariant]) {
            test.results[session.abTestVariant] = {
              impressions: 0,
              conversions: 0,
              revenue: 0,
              conversionRate: 0
            };
          }

          const results = test.results[session.abTestVariant];
          results.conversions++;
          results.revenue += session.finalPrice;
          results.conversionRate = results.conversions / Math.max(results.impressions, 1);
        }
      }
    }

    console.log(`💰 Conversion tracked: ${session.id} - ${session.finalPrice} ${session.currency}`);
  }

  private findTestByVariant(variantId: string): string | null {
    for (const [testId, test] of this.abTests) {
      if (test.variants.some(v => v.id === variantId)) {
        return testId;
      }
    }
    return null;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private initializeDefaultPricingRules(): void {
    this.pricingRules = [
      // JACKPOT leads get premium pricing (less discount)
      {
        id: 'jackpot-premium',
        name: 'JACKPOT Premium Pricing',
        condition: {
          intentScoreMin: 90,
          intentScoreMax: 100
        },
        adjustment: {
          type: 'percentage',
          value: 10 // Small discount for exclusivity
        },
        priority: 100,
        isActive: true
      },
      // HOT leads get good discount
      {
        id: 'hot-lead-discount',
        name: 'HOT Lead Special Offer',
        condition: {
          intentScoreMin: 75,
          intentScoreMax: 89
        },
        adjustment: {
          type: 'percentage',
          value: 25
        },
        priority: 90,
        isActive: true
      },
      // WARM leads get standard discount
      {
        id: 'warm-lead-standard',
        name: 'WARM Lead Standard Discount',
        condition: {
          intentScoreMin: 60,
          intentScoreMax: 74
        },
        adjustment: {
          type: 'percentage',
          value: 35
        },
        priority: 80,
        isActive: true
      },
      // Return visitors get loyalty discount
      {
        id: 'returning-visitor-loyalty',
        name: 'Returning Visitor Loyalty',
        condition: {
          intentScoreMin: 40,
          intentScoreMax: 100,
          returningVisitor: true
        },
        adjustment: {
          type: 'percentage',
          value: 15
        },
        priority: 70,
        isActive: true
      },
      // High engagement bonus discount
      {
        id: 'high-engagement-bonus',
        name: 'High Engagement Bonus',
        condition: {
          intentScoreMin: 60,
          intentScoreMax: 100,
          engagementTimeMin: 1800 // 30 minutes
        },
        adjustment: {
          type: 'percentage',
          value: 10 // Additional discount
        },
        priority: 60,
        isActive: true
      }
    ];
  }

  private initializePaymentMethods(): void {
    this.paymentMethods = [
      {
        id: 'stripe',
        type: 'stripe',
        enabled: true,
        config: {
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...'
        }
      },
      {
        id: 'paypal',
        type: 'paypal',
        enabled: true,
        config: {
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sandbox-client-id'
        }
      }
    ];
  }
}

// Export singleton instance
export const autoOfferPaymentEngine = new AutoOfferPaymentEngine();