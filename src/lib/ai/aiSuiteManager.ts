'use client';

import { convertCastAI, ViewerProfile } from './scoringEngine';
import { autoOfferEngine, OfferTrigger } from './autoOfferEngine';
import { insightEngine, RealTimeSuggestion } from './insightEngine';
import { smartScheduler, ScheduleRecommendation } from './smartScheduler';

export interface AISuiteConfig {
  hotLeadScoring: {
    enabled: boolean;
    threshold: number;
    updateInterval: number;
  };
  autoOffers: {
    enabled: boolean;
    autoExecute: boolean;
    confidenceThreshold: number;
  };
  insightEngine: {
    enabled: boolean;
    updateInterval: number;
    suggestionPriority: 'all' | 'high' | 'medium';
  };
  syntheticChat: {
    enabled: boolean;
    frequency: number;
    testimonials: boolean;
    trustBuilding: boolean;
  };
  smartScheduling: {
    enabled: boolean;
    autoOptimize: boolean;
  };
}

export interface AIMetrics {
  totalViewers: number;
  hotLeads: number;
  jackpotLeads: number;
  averageScore: number;
  activeOffers: number;
  offerConversions: number;
  totalRevenue: number;
  aiSuggestions: number;
  executedSuggestions: number;
  streamHealth: number;
}

export interface AIEvent {
  id: string;
  type: 'lead-score-update' | 'offer-triggered' | 'suggestion-generated' | 'insight-update' | 'chat-message';
  timestamp: Date;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const DEFAULT_CONFIG: AISuiteConfig = {
  hotLeadScoring: {
    enabled: true,
    threshold: 60,
    updateInterval: 3000 // 3 seconds
  },
  autoOffers: {
    enabled: true,
    autoExecute: true,
    confidenceThreshold: 0.8
  },
  insightEngine: {
    enabled: true,
    updateInterval: 10000, // 10 seconds
    suggestionPriority: 'all'
  },
  syntheticChat: {
    enabled: true,
    frequency: 3, // messages per minute
    testimonials: true,
    trustBuilding: true
  },
  smartScheduling: {
    enabled: true,
    autoOptimize: true
  }
};

export class AISuiteManager {
  private config: AISuiteConfig;
  private viewers: ViewerProfile[] = [];
  private streamMetrics: any = {
    startTime: new Date(),
    totalRevenue: 0,
    conversions: 0,
    avgEngagement: 0
  };
  private activeOffers: Map<string, OfferTrigger> = new Map();
  private aiEvents: AIEvent[] = [];
  private eventCallbacks: Map<string, Function[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private syntheticMessages: any[] = [];

  constructor(config?: Partial<AISuiteConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeAISuite();
  }

  /**
   * Initialize the AI Suite
   */
  private initializeAISuite(): void {
    if (this.config.hotLeadScoring.enabled) {
      this.startHotLeadScoring();
    }

    if (this.config.autoOffers.enabled) {
      this.startAutoOffers();
    }

    if (this.config.insightEngine.enabled) {
      this.startInsightEngine();
    }

    if (this.config.syntheticChat.enabled) {
      this.startSyntheticChat();
    }

    console.log('🤖 AI Suite initialized with all features enabled');
  }

  /**
   * Update viewer data and trigger AI processing
   */
  updateViewers(newViewers: ViewerProfile[]): void {
    const previousViewers = [...this.viewers];
    this.viewers = newViewers;

    // Process score changes
    this.processScoreUpdates(previousViewers, newViewers);

    // Update stream metrics
    this.updateStreamMetrics();

    // Emit viewer update event
    this.emitEvent({
      id: `viewer-update-${Date.now()}`,
      type: 'lead-score-update',
      timestamp: new Date(),
      data: {
        totalViewers: newViewers.length,
        hotLeads: newViewers.filter(v => v.intentScore >= 75).length,
        averageScore: newViewers.reduce((sum, v) => sum + v.intentScore, 0) / newViewers.length
      },
      priority: 'medium'
    });
  }

  /**
   * Get current AI metrics
   */
  getAIMetrics(): AIMetrics {
    const hotLeads = this.viewers.filter(v => v.intentScore >= 75);
    const jackpotLeads = this.viewers.filter(v => v.intentScore >= 90);
    const avgScore = this.viewers.length > 0 ?
      this.viewers.reduce((sum, v) => sum + v.intentScore, 0) / this.viewers.length : 0;

    return {
      totalViewers: this.viewers.length,
      hotLeads: hotLeads.length,
      jackpotLeads: jackpotLeads.length,
      averageScore: Math.round(avgScore),
      activeOffers: this.activeOffers.size,
      offerConversions: this.streamMetrics.conversions || 0,
      totalRevenue: this.streamMetrics.totalRevenue || 0,
      aiSuggestions: this.aiEvents.filter(e => e.type === 'suggestion-generated').length,
      executedSuggestions: this.aiEvents.filter(e => e.data?.executed).length,
      streamHealth: this.calculateStreamHealth()
    };
  }

  /**
   * Get real-time AI suggestions
   */
  getActiveSuggestions(): RealTimeSuggestion[] {
    return insightEngine.generateRealTimeSuggestions(this.viewers, this.streamMetrics)
      .filter(suggestion => {
        switch (this.config.insightEngine.suggestionPriority) {
          case 'high': return suggestion.priority === 'high';
          case 'medium': return ['high', 'medium'].includes(suggestion.priority);
          default: return true;
        }
      });
  }

  /**
   * Execute an AI suggestion
   */
  executeSuggestion(suggestionId: string): void {
    this.emitEvent({
      id: `suggestion-executed-${suggestionId}`,
      type: 'suggestion-generated',
      timestamp: new Date(),
      data: { suggestionId, executed: true },
      priority: 'medium'
    });
  }

  /**
   * Trigger manual offer
   */
  triggerOffer(viewerId: string, offerType: 'jackpot' | 'hot' | 'warm' | 'nurture'): void {
    const viewer = this.viewers.find(v => v.id === viewerId);
    if (!viewer) return;

    const config = autoOfferEngine.getConfig();
    let template;

    switch (offerType) {
      case 'jackpot': template = config.offers.jackpotOffer; break;
      case 'hot': template = config.offers.hotLeadOffer; break;
      case 'warm': template = config.offers.warmLeadOffer; break;
      case 'nurture': template = config.offers.nurturingOffer; break;
    }

    const trigger: OfferTrigger = {
      id: `manual-${viewerId}-${Date.now()}`,
      viewerId,
      offerTemplate: template,
      triggerTime: new Date(),
      triggerReason: 'Manual trigger',
      confidence: 1.0,
      context: {
        viewerScore: viewer.intentScore,
        engagementTime: viewer.engagementTime,
        lastActivity: viewer.lastActivity,
        previousOffers: 0
      }
    };

    this.activeOffers.set(viewerId, trigger);

    this.emitEvent({
      id: trigger.id,
      type: 'offer-triggered',
      timestamp: new Date(),
      data: { trigger, manual: true },
      priority: 'high'
    });
  }

  /**
   * Generate synthetic chat message
   */
  generateSyntheticMessage(): any | null {
    if (!this.config.syntheticChat.enabled) return null;

    const messageTypes = [];

    if (this.config.syntheticChat.testimonials) {
      messageTypes.push('testimonial');
    }

    if (this.config.syntheticChat.trustBuilding) {
      messageTypes.push('trust');
    }

    messageTypes.push('engagement', 'question');

    const type = messageTypes[Math.floor(Math.random() * messageTypes.length)];
    const message = this.createSyntheticMessage(type);

    this.syntheticMessages.push(message);

    this.emitEvent({
      id: `chat-${message.id}`,
      type: 'chat-message',
      timestamp: new Date(),
      data: { message, synthetic: true },
      priority: 'low'
    });

    return message;
  }

  /**
   * Get AI-powered schedule recommendation
   */
  getScheduleRecommendation(
    contentType: 'educational' | 'product-demo' | 'webinar' | 'workshop' | 'entertainment' = 'webinar',
    duration: number = 60,
    audienceGoal: number = 100
  ): ScheduleRecommendation {
    return smartScheduler.getScheduleRecommendation(undefined, contentType, duration, audienceGoal);
  }

  /**
   * Subscribe to AI events
   */
  onEvent(eventType: string, callback: Function): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    this.eventCallbacks.get(eventType)!.push(callback);
  }

  /**
   * Unsubscribe from AI events
   */
  offEvent(eventType: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AISuiteConfig>): void {
    this.config = { ...this.config, ...updates };

    // Restart components if needed
    this.stopAllIntervals();
    this.initializeAISuite();
  }

  /**
   * Get current configuration
   */
  getConfig(): AISuiteConfig {
    return { ...this.config };
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    this.stopAllIntervals();
    this.eventCallbacks.clear();
    this.aiEvents = [];
    console.log('🤖 AI Suite shutdown complete');
  }

  // Private methods

  private startHotLeadScoring(): void {
    const interval = setInterval(() => {
      this.viewers.forEach(viewer => {
        const newScore = convertCastAI.calculateIntentScore(viewer);
        if (newScore !== viewer.intentScore) {
          viewer.intentScore = newScore;

          // Check for level transitions
          const level = convertCastAI.getIntentLevel(newScore);
          if (level === 'JACKPOT' || (level === 'HOT_LEAD' && newScore >= 80)) {
            this.emitEvent({
              id: `score-alert-${viewer.id}`,
              type: 'lead-score-update',
              timestamp: new Date(),
              data: { viewer, newScore, level },
              priority: level === 'JACKPOT' ? 'urgent' : 'high'
            });
          }
        }
      });
    }, this.config.hotLeadScoring.updateInterval);

    this.intervals.set('hotLeadScoring', interval);
  }

  private startAutoOffers(): void {
    const interval = setInterval(() => {
      this.viewers.forEach(viewer => {
        // Skip if already has active offer
        if (this.activeOffers.has(viewer.id)) return;

        const trigger = autoOfferEngine.analyzeViewer(viewer);
        if (trigger && trigger.confidence >= this.config.autoOffers.confidenceThreshold) {
          this.activeOffers.set(viewer.id, trigger);

          this.emitEvent({
            id: trigger.id,
            type: 'offer-triggered',
            timestamp: new Date(),
            data: { trigger, automatic: true },
            priority: trigger.confidence >= 0.9 ? 'urgent' : 'high'
          });
        }
      });
    }, 5000);

    this.intervals.set('autoOffers', interval);
  }

  private startInsightEngine(): void {
    const interval = setInterval(() => {
      const suggestions = insightEngine.generateRealTimeSuggestions(this.viewers, this.streamMetrics);
      const metrics = insightEngine.calculateInsightMetrics(this.viewers, this.streamMetrics);

      // Emit high-priority suggestions
      suggestions.filter(s => s.priority === 'high').forEach(suggestion => {
        this.emitEvent({
          id: `suggestion-${suggestion.id}`,
          type: 'suggestion-generated',
          timestamp: new Date(),
          data: { suggestion },
          priority: 'high'
        });
      });

      // Emit metrics update
      this.emitEvent({
        id: `metrics-${Date.now()}`,
        type: 'insight-update',
        timestamp: new Date(),
        data: { metrics },
        priority: 'low'
      });
    }, this.config.insightEngine.updateInterval);

    this.intervals.set('insightEngine', interval);
  }

  private startSyntheticChat(): void {
    const interval = setInterval(() => {
      if (Math.random() < (this.config.syntheticChat.frequency / 60)) {
        this.generateSyntheticMessage();
      }
    }, 1000);

    this.intervals.set('syntheticChat', interval);
  }

  private processScoreUpdates(previous: ViewerProfile[], current: ViewerProfile[]): void {
    current.forEach(viewer => {
      const previousViewer = previous.find(v => v.id === viewer.id);
      if (previousViewer && previousViewer.intentScore !== viewer.intentScore) {
        const scoreDiff = viewer.intentScore - previousViewer.intentScore;

        if (Math.abs(scoreDiff) >= 10) { // Significant change
          this.emitEvent({
            id: `score-change-${viewer.id}`,
            type: 'lead-score-update',
            timestamp: new Date(),
            data: { viewer, scoreDiff, previousScore: previousViewer.intentScore },
            priority: scoreDiff > 0 && viewer.intentScore >= 75 ? 'high' : 'medium'
          });
        }
      }
    });
  }

  private updateStreamMetrics(): void {
    const totalEngagement = this.viewers.reduce((sum, v) => sum + v.engagementTime, 0);
    const avgEngagement = totalEngagement / Math.max(this.viewers.length, 1);

    this.streamMetrics = {
      ...this.streamMetrics,
      totalViewers: this.viewers.length,
      avgEngagement,
      lastUpdate: new Date()
    };
  }

  private calculateStreamHealth(): number {
    const metrics = insightEngine.calculateInsightMetrics(this.viewers, this.streamMetrics);
    return metrics.streamHealth;
  }

  private createSyntheticMessage(type: string): any {
    const names = ['Sarah M.', 'Mike T.', 'Jessica L.', 'David R.', 'Amanda K.'];
    const avatars = ['👩‍💼', '👨‍💻', '👩‍🎨', '👨‍🚀', '👩‍⚕️'];

    const messages = {
      testimonial: [
        'This is exactly what I was looking for! 🔥',
        'Just signed up - can\'t wait to get started!',
        'Amazing value here, definitely investing',
        'This changed my business completely',
        'Best investment I\'ve made all year'
      ],
      trust: [
        'Love the transparency and honesty here',
        'No fluff, just real actionable content',
        'You can tell this comes from real experience',
        'Finally found someone who delivers'
      ],
      engagement: [
        'This is so helpful! 🙏',
        'Taking notes over here 📝',
        'Mind = blown 🤯',
        'Thanks for sharing this!'
      ],
      question: [
        'How do you track ROI on this?',
        'Can beginners really do this?',
        'What\'s the time commitment?',
        'How quickly do people see results?'
      ]
    };

    const messageArray = messages[type as keyof typeof messages] || messages.engagement;
    const randomMessage = messageArray[Math.floor(Math.random() * messageArray.length)];

    return {
      id: `synthetic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: names[Math.floor(Math.random() * names.length)],
      message: randomMessage,
      timestamp: new Date(),
      isStreamer: false,
      isSynthetic: true,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      intentLevel: type === 'testimonial' ? 'HOT_LEAD' : 'WARM'
    };
  }

  private emitEvent(event: AIEvent): void {
    this.aiEvents.push(event);

    // Keep only last 100 events
    if (this.aiEvents.length > 100) {
      this.aiEvents = this.aiEvents.slice(-100);
    }

    // Notify callbacks
    const callbacks = this.eventCallbacks.get(event.type) || [];
    const allCallbacks = this.eventCallbacks.get('*') || [];

    [...callbacks, ...allCallbacks].forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('AI Suite event callback error:', error);
      }
    });
  }

  private stopAllIntervals(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
}

// Export singleton instance
export const aiSuiteManager = new AISuiteManager();