'use client';

/**
 * Production Analytics and Monitoring System
 * Tracks user behavior, streaming performance, and business metrics
 */

export interface StreamingAnalytics {
  streamId: string;
  eventId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  metrics: {
    viewerCount: number;
    peakViewers: number;
    averageViewDuration: number;
    totalViewTime: number;
    uniqueViewers: number;
    engagementRate: number;
    conversionRate: number;
    buffering_events: number;
    quality_score: number;
  };
  userInteractions: {
    type: 'poll_vote' | 'reaction' | 'cta_click' | 'registration' | 'purchase';
    data: any;
    timestamp: Date;
  }[];
  technicalMetrics: {
    bitrate: number;
    framerate: number;
    resolution: string;
    latency: number;
    connectionQuality: number;
    errorCount: number;
  };
}

export interface BusinessMetrics {
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  customerAcquisitionCost: number;
  lifetimeValue: number;
  churnRate: number;
  engagementScore: number;
}

export interface ErrorTracking {
  errorId: string;
  type: 'streaming' | 'payment' | 'authentication' | 'api' | 'ui';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  context: Record<string, any>;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  memoryUsage: number;
  cpuUsage: number;
}

class ProductionAnalytics {
  private sessionId: string;
  private userId?: string;
  private isInitialized: boolean = false;
  private eventQueue: any[] = [];
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize analytics system
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Set up automatic error tracking
    this.setupErrorTracking();

    // Set up performance monitoring
    this.setupPerformanceTracking();

    // Set up automatic event flushing
    this.startBatchProcessor();

    // Track page load
    this.trackPageLoad();

    this.isInitialized = true;
    console.log('🔍 Production Analytics initialized');
  }

  /**
   * Set user ID for session tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.trackEvent('user_identified', { userId });
  }

  /**
   * Track streaming analytics
   */
  trackStreamingAnalytics(data: StreamingAnalytics): void {
    this.queueEvent('streaming_analytics', {
      ...data,
      sessionId: this.sessionId,
      userId: this.userId
    });
  }

  /**
   * Track business metrics
   */
  trackBusinessMetrics(metrics: BusinessMetrics): void {
    this.queueEvent('business_metrics', {
      ...metrics,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date()
    });
  }

  /**
   * Track custom events
   */
  trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    this.queueEvent('custom_event', {
      eventName,
      properties,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date(),
      url: window.location.href,
      referrer: document.referrer
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(type: 'registration' | 'purchase' | 'subscription', value?: number): void {
    this.queueEvent('conversion', {
      type,
      value,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date(),
      url: window.location.href
    });
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, duration?: number): void {
    this.queueEvent('engagement', {
      action,
      duration,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date()
    });
  }

  /**
   * Track errors with context
   */
  trackError(error: Error | string, context: Record<string, any> = {}): void {
    const errorData: ErrorTracking = {
      errorId: this.generateId(),
      type: context.type || 'ui',
      severity: context.severity || 'medium',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      userId: this.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      context
    };

    this.queueEvent('error', errorData);

    // Send critical errors immediately
    if (errorData.severity === 'critical') {
      this.flushEvents();
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: Partial<PerformanceMetrics>): void {
    this.queueEvent('performance', {
      ...metrics,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date(),
      url: window.location.href
    });
  }

  /**
   * Set up automatic error tracking
   */
  private setupErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError(event.error || event.message, {
        type: 'ui',
        severity: 'high',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'api',
        severity: 'high',
        promise: true
      });
    });

    // Console error interceptor
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.trackError(args.join(' '), {
        type: 'ui',
        severity: 'medium',
        source: 'console'
      });
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Set up performance tracking
   */
  private setupPerformanceTracking(): void {
    // Wait for page load to complete
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintEntries = performance.getEntriesByType('paint');

        const metrics: PerformanceMetrics = {
          pageLoadTime: perfData.loadEventEnd - perfData.loadEventStart,
          timeToInteractive: perfData.domInteractive - perfData.navigationStart,
          firstContentfulPaint: paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          largestContentfulPaint: 0, // Would need to implement LCP observer
          cumulativeLayoutShift: 0, // Would need to implement CLS observer
          firstInputDelay: 0, // Would need to implement FID observer
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          cpuUsage: 0 // Would need worker thread calculation
        };

        this.trackPerformance(metrics);
      }, 1000);
    });

    // Track Core Web Vitals if available
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance({ largestContentfulPaint: lastEntry.startTime });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.trackPerformance({ firstInputDelay: entry.processingStart - entry.startTime });
        });
      }).observe({ entryTypes: ['first-input'], buffered: true });
    }
  }

  /**
   * Track page load event
   */
  private trackPageLoad(): void {
    this.trackEvent('page_load', {
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  /**
   * Queue event for batch processing
   */
  private queueEvent(type: string, data: any): void {
    this.eventQueue.push({
      type,
      data,
      timestamp: new Date().toISOString()
    });

    // Flush if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Start batch processor
   */
  private startBatchProcessor(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  /**
   * Flush events to analytics endpoint
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In production, this would send to your analytics service
      // For now, we'll send to a local endpoint
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events
        })
      });

      if (!response.ok) {
        console.warn('Analytics flush failed:', response.status);
        // Re-queue events for retry
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Clean up on page unload
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Flush remaining events
    if (this.eventQueue.length > 0) {
      // Use sendBeacon for reliable last-chance sending
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics',
          JSON.stringify({
            sessionId: this.sessionId,
            events: this.eventQueue
          })
        );
      }
    }
  }
}

// Export singleton instance
export const analytics = new ProductionAnalytics();

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.destroy();
  });
}