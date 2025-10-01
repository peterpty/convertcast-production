'use client';

import { ViewerProfile } from '../ai/scoringEngine';
import { PaymentOffer, ABTestVariant, ABTestConfiguration } from './paymentEngine';

export interface ABTestResult {
  testId: string;
  variant: ABTestVariant;
  isStatisticallySignificant: boolean;
  confidence: number;
  winningVariant?: ABTestVariant;
  metrics: {
    conversionRate: number;
    averageOrderValue: number;
    totalRevenue: number;
    impressions: number;
    conversions: number;
  };
}

export interface ExperimentConfig {
  name: string;
  description: string;
  hypothesis: string;
  successMetric: 'conversion_rate' | 'revenue' | 'average_order_value';
  minimumSampleSize: number;
  minimumDetectableEffect: number; // percentage
  confidenceLevel: number; // 0.95 for 95%
  duration: {
    minDays: number;
    maxDays: number;
  };
  targetAudience: {
    intentScoreMin?: number;
    intentScoreMax?: number;
    trafficSources?: string[];
    deviceTypes?: string[];
    newVisitorsOnly?: boolean;
    returningVisitorsOnly?: boolean;
  };
}

export class ABTestEngine {
  private tests: Map<string, ABTestConfiguration> = new Map();
  private results: Map<string, ABTestResult> = new Map();

  constructor() {
    this.initializeDefaultTests();
  }

  /**
   * Create new A/B test
   */
  createABTest(config: ExperimentConfig, variants: ABTestVariant[]): string {
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate variants weights sum to 100
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Variant weights must sum to 100');
    }

    const test: ABTestConfiguration = {
      id: testId,
      name: config.name,
      isActive: true,
      variants,
      trafficSplit: 100, // Test all eligible traffic
      conversionGoal: config.successMetric,
      startDate: new Date(),
      endDate: new Date(Date.now() + config.duration.maxDays * 24 * 60 * 60 * 1000),
      results: {}
    };

    // Initialize results for each variant
    variants.forEach(variant => {
      test.results[variant.id] = {
        impressions: 0,
        conversions: 0,
        revenue: 0,
        conversionRate: 0
      };
    });

    this.tests.set(testId, test);
    return testId;
  }

  /**
   * Get variant for viewer based on test configuration
   */
  getVariantForViewer(testId: string, viewer: ViewerProfile): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || !test.isActive) return null;

    // Check if test has ended
    if (test.endDate && new Date() > test.endDate) {
      this.stopTest(testId);
      return null;
    }

    // Deterministic assignment based on viewer ID + test ID
    const hash = this.hashString(`${viewer.id}-${testId}`);
    const bucket = hash % 100;

    let currentWeight = 0;
    for (const variant of test.variants) {
      currentWeight += variant.weight;
      if (bucket < currentWeight) {
        // Track impression
        this.trackImpression(testId, variant.id);
        return variant;
      }
    }

    return test.variants[0]; // Fallback
  }

  /**
   * Track impression for A/B test
   */
  trackImpression(testId: string, variantId: string): void {
    const test = this.tests.get(testId);
    if (!test) return;

    if (!test.results[variantId]) {
      test.results[variantId] = {
        impressions: 0,
        conversions: 0,
        revenue: 0,
        conversionRate: 0
      };
    }

    test.results[variantId].impressions++;
  }

  /**
   * Track conversion for A/B test
   */
  trackConversion(testId: string, variantId: string, revenue: number): void {
    const test = this.tests.get(testId);
    if (!test || !test.results[variantId]) return;

    const results = test.results[variantId];
    results.conversions++;
    results.revenue += revenue;
    results.conversionRate = results.conversions / Math.max(results.impressions, 1);

    // Check if test has reached statistical significance
    this.updateTestResults(testId);
  }

  /**
   * Get test results with statistical analysis
   */
  getTestResults(testId: string): ABTestResult | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    const variants = test.variants.map(variant => {
      const results = test.results[variant.id] || {
        impressions: 0,
        conversions: 0,
        revenue: 0,
        conversionRate: 0
      };

      return {
        variant,
        metrics: {
          ...results,
          averageOrderValue: results.conversions > 0 ? results.revenue / results.conversions : 0
        }
      };
    });

    // Find best performing variant
    const bestVariant = variants.reduce((best, current) => {
      const bestMetric = this.getMetricValue(best.metrics, test.conversionGoal);
      const currentMetric = this.getMetricValue(current.metrics, test.conversionGoal);
      return currentMetric > bestMetric ? current : best;
    }, variants[0]);

    // Calculate statistical significance
    const significance = this.calculateStatisticalSignificance(variants, test.conversionGoal);

    return {
      testId,
      variant: bestVariant.variant,
      isStatisticallySignificant: significance.isSignificant,
      confidence: significance.confidence,
      winningVariant: significance.isSignificant ? bestVariant.variant : undefined,
      metrics: bestVariant.metrics
    };
  }

  /**
   * Stop A/B test
   */
  stopTest(testId: string): void {
    const test = this.tests.get(testId);
    if (test) {
      test.isActive = false;
      this.updateTestResults(testId);
    }
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTestConfiguration[] {
    return Array.from(this.tests.values()).filter(test => test.isActive);
  }

  /**
   * Get test performance summary
   */
  getTestSummary(): {
    total: number;
    active: number;
    completed: number;
    significantResults: number;
    totalRevenue: number;
  } {
    const tests = Array.from(this.tests.values());
    const active = tests.filter(t => t.isActive).length;
    const completed = tests.length - active;

    let significantResults = 0;
    let totalRevenue = 0;

    tests.forEach(test => {
      const results = this.getTestResults(test.id);
      if (results?.isStatisticallySignificant) {
        significantResults++;
      }

      Object.values(test.results).forEach(result => {
        totalRevenue += result.revenue;
      });
    });

    return {
      total: tests.length,
      active,
      completed,
      significantResults,
      totalRevenue
    };
  }

  /**
   * Create offer with A/B test variant applied
   */
  applyVariantToOffer(baseOffer: PaymentOffer, variant: ABTestVariant): PaymentOffer {
    return {
      ...baseOffer,
      name: variant.messaging.headline,
      description: variant.messaging.subtext,
      basePrice: variant.pricing.basePrice,
      discountPercentage: variant.pricing.discountPercentage,
      finalPrice: variant.pricing.basePrice * (1 - variant.pricing.discountPercentage / 100),
      urgency: {
        ...baseOffer.urgency,
        message: variant.messaging.urgencyMessage
      }
    };
  }

  /**
   * Generate A/B test recommendations
   */
  generateTestRecommendations(viewerData: ViewerProfile[]): {
    testName: string;
    hypothesis: string;
    variants: ABTestVariant[];
    expectedImpact: number;
    confidence: number;
  }[] {
    const recommendations = [];

    // Analyze viewer data for test opportunities
    const avgIntentScore = viewerData.reduce((sum, v) => sum + v.intentScore, 0) / viewerData.length;
    const mobileRatio = viewerData.filter(v => v.behaviorMetrics.deviceType === 'mobile').length / viewerData.length;
    const returningRatio = viewerData.filter(v => v.behaviorMetrics.returningVisitor).length / viewerData.length;

    // Pricing test recommendation
    if (avgIntentScore > 70) {
      recommendations.push({
        testName: 'Premium Pricing Test',
        hypothesis: 'High-intent audience will convert at higher price points with premium messaging',
        variants: [
          {
            id: 'control-standard',
            name: 'Control - Standard Pricing',
            weight: 50,
            pricing: { basePrice: 297, discountPercentage: 25 },
            messaging: {
              headline: 'Complete Training System',
              subtext: 'Everything you need to succeed',
              buttonText: 'Get Instant Access',
              urgencyMessage: 'Limited time: 25% off'
            },
            design: { color: '#3B82F6', style: 'minimal' }
          },
          {
            id: 'variant-premium',
            name: 'Variant - Premium Pricing',
            weight: 50,
            pricing: { basePrice: 497, discountPercentage: 20 },
            messaging: {
              headline: 'Premium Mastery Program',
              subtext: 'Elite training for serious professionals',
              buttonText: 'Claim Your Spot',
              urgencyMessage: 'Exclusive: 20% off for VIPs only'
            },
            design: { color: '#8B5CF6', style: 'premium' }
          }
        ],
        expectedImpact: 25,
        confidence: 0.8
      });
    }

    // Mobile-optimized messaging test
    if (mobileRatio > 0.6) {
      recommendations.push({
        testName: 'Mobile Messaging Test',
        hypothesis: 'Mobile-specific messaging will improve conversion rates',
        variants: [
          {
            id: 'control-generic',
            name: 'Control - Generic Messaging',
            weight: 50,
            pricing: { basePrice: 297, discountPercentage: 30 },
            messaging: {
              headline: 'Transform Your Business',
              subtext: 'Complete training system with all resources',
              buttonText: 'Get Started Now',
              urgencyMessage: '30% off ends soon'
            },
            design: { color: '#10B981', style: 'minimal' }
          },
          {
            id: 'variant-mobile',
            name: 'Variant - Mobile Optimized',
            weight: 50,
            pricing: { basePrice: 297, discountPercentage: 30 },
            messaging: {
              headline: 'Learn On-The-Go',
              subtext: 'Mobile-friendly training you can access anywhere',
              buttonText: 'Start Learning',
              urgencyMessage: '📱 Perfect for mobile learning - 30% off'
            },
            design: { color: '#F59E0B', style: 'bold' }
          }
        ],
        expectedImpact: 15,
        confidence: 0.7
      });
    }

    return recommendations;
  }

  // Private methods

  private updateTestResults(testId: string): void {
    const results = this.getTestResults(testId);
    if (results) {
      this.results.set(testId, results);
    }
  }

  private calculateStatisticalSignificance(
    variants: Array<{ variant: ABTestVariant; metrics: any }>,
    goal: string
  ): { isSignificant: boolean; confidence: number } {
    if (variants.length < 2) {
      return { isSignificant: false, confidence: 0 };
    }

    // Simple statistical significance calculation
    // In production, use proper statistical libraries
    const control = variants[0];
    const variant = variants[1];

    const controlRate = this.getMetricValue(control.metrics, goal);
    const variantRate = this.getMetricValue(variant.metrics, goal);

    const controlSize = control.metrics.impressions;
    const variantSize = variant.metrics.impressions;

    // Require minimum sample size
    if (controlSize < 100 || variantSize < 100) {
      return { isSignificant: false, confidence: 0 };
    }

    // Simple significance test (in production, use proper z-test)
    const pooledRate = (control.metrics.conversions + variant.metrics.conversions) /
                      (controlSize + variantSize);

    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlSize + 1/variantSize));
    const zScore = Math.abs(controlRate - variantRate) / standardError;

    // 95% confidence = z > 1.96
    const isSignificant = zScore > 1.96;
    const confidence = Math.min(0.99, 0.5 + (zScore / 3.92)); // Simplified confidence calculation

    return { isSignificant, confidence };
  }

  private getMetricValue(metrics: any, goal: string): number {
    switch (goal) {
      case 'conversion_rate': return metrics.conversionRate;
      case 'revenue': return metrics.revenue;
      case 'average_order_value': return metrics.averageOrderValue;
      default: return metrics.conversionRate;
    }
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

  private initializeDefaultTests(): void {
    // Create a sample A/B test for pricing
    const pricingTest: ABTestConfiguration = {
      id: 'pricing-test-001',
      name: 'Premium vs Standard Pricing',
      isActive: true,
      variants: [
        {
          id: 'control-standard',
          name: 'Control - Standard',
          weight: 50,
          pricing: {
            basePrice: 297,
            discountPercentage: 30
          },
          messaging: {
            headline: 'Complete Training System',
            subtext: 'Everything you need to transform your business',
            buttonText: 'Get Instant Access',
            urgencyMessage: 'Limited time: 30% off expires soon!'
          },
          design: {
            color: '#3B82F6',
            style: 'minimal'
          }
        },
        {
          id: 'variant-premium',
          name: 'Variant - Premium',
          weight: 50,
          pricing: {
            basePrice: 497,
            discountPercentage: 25
          },
          messaging: {
            headline: 'Premium Mastery Program',
            subtext: 'Elite training for serious entrepreneurs',
            buttonText: 'Claim Your VIP Spot',
            urgencyMessage: 'Exclusive: VIP pricing ends in 24 hours!'
          },
          design: {
            color: '#8B5CF6',
            style: 'premium'
          }
        }
      ],
      trafficSplit: 80, // 80% of viewers in test
      conversionGoal: 'revenue',
      startDate: new Date(),
      results: {
        'control-standard': {
          impressions: 0,
          conversions: 0,
          revenue: 0,
          conversionRate: 0
        },
        'variant-premium': {
          impressions: 0,
          conversions: 0,
          revenue: 0,
          conversionRate: 0
        }
      }
    };

    this.tests.set(pricingTest.id, pricingTest);

    // Add urgency messaging test
    const urgencyTest: ABTestConfiguration = {
      id: 'urgency-test-002',
      name: 'Urgency Messaging Test',
      isActive: true,
      variants: [
        {
          id: 'control-standard-urgency',
          name: 'Control - Standard Urgency',
          weight: 50,
          pricing: {
            basePrice: 297,
            discountPercentage: 25
          },
          messaging: {
            headline: 'Limited Time Offer',
            subtext: 'Don\'t miss out on this special deal',
            buttonText: 'Get It Now',
            urgencyMessage: 'Offer ends soon - don\'t wait!'
          },
          design: {
            color: '#EF4444',
            style: 'bold'
          }
        },
        {
          id: 'variant-high-urgency',
          name: 'Variant - High Urgency',
          weight: 50,
          pricing: {
            basePrice: 297,
            discountPercentage: 25
          },
          messaging: {
            headline: '🚨 URGENT: Spots Filling Fast',
            subtext: 'Only 7 spots left at this price!',
            buttonText: 'SECURE MY SPOT NOW',
            urgencyMessage: '⏰ LAST CHANCE: Price increases in 47 minutes!'
          },
          design: {
            color: '#DC2626',
            style: 'bold'
          }
        }
      ],
      trafficSplit: 60,
      conversionGoal: 'conversion_rate',
      startDate: new Date(),
      results: {
        'control-standard-urgency': {
          impressions: 0,
          conversions: 0,
          revenue: 0,
          conversionRate: 0
        },
        'variant-high-urgency': {
          impressions: 0,
          conversions: 0,
          revenue: 0,
          conversionRate: 0
        }
      }
    };

    this.tests.set(urgencyTest.id, urgencyTest);
  }
}

// Export singleton instance
export const abTestEngine = new ABTestEngine();