'use client';

import { ViewerProfile } from '../ai/scoringEngine';
import { PaymentSession, PaymentOffer } from '../payment/paymentEngine';
import { showUpSurgeEngine, ShowUpSurgeProfile, NotificationChannel } from './showUpSurgeEngine';
import { emailTemplateEngine } from './emailTemplates';
import { deliveryEngine } from './deliveryEngine';
import { addMinutes, addHours, addDays, isBefore, isAfter } from 'date-fns';

export type AbandonedCartStage = 'cart-abandoned' | 'checkout-started' | 'payment-failed' | 'registration-incomplete';
export type RecoveryTrigger = 'time-based' | 'behavioral' | 'manual' | 'ai-optimized';

export interface AbandonedCartSession {
  id: string;
  viewerId: string;
  eventId?: string;
  sessionType: 'payment' | 'registration' | 'checkout';
  stage: AbandonedCartStage;
  offer?: PaymentOffer;
  paymentSession?: Partial<PaymentSession>;
  abandonedAt: Date;
  lastInteraction: Date;
  totalValue: number;
  currency: string;
  recoveryAttempts: RecoveryAttempt[];
  isRecovered: boolean;
  recoveredAt?: Date;
  recoveryValue?: number;
}

export interface RecoveryAttempt {
  id: string;
  attemptNumber: number;
  trigger: RecoveryTrigger;
  channel: NotificationChannel;
  templateId: string;
  sentAt: Date;
  incentive?: {
    type: 'discount' | 'bonus' | 'urgency' | 'social-proof';
    value: any;
    expiresAt?: Date;
  };
  result?: {
    opened: boolean;
    clicked: boolean;
    recovered: boolean;
    openedAt?: Date;
    clickedAt?: Date;
    recoveredAt?: Date;
  };
}

export interface RecoveryTemplate {
  id: string;
  name: string;
  stage: AbandonedCartStage;
  timing: {
    delayMinutes: number;
    maxAttempts: number;
  };
  subject: string;
  htmlContent: string;
  textContent: string;
  incentive?: {
    type: 'discount' | 'bonus' | 'urgency';
    value: any;
  };
  channel: NotificationChannel[];
  triggers: {
    minValue?: number;
    maxAttempts?: number;
    requiredBehavior?: string[];
  };
}

export interface RecoveryAnalytics {
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
  averageRecoveryTime: number; // hours
  revenueRecovered: number;
  attemptsByStage: Record<AbandonedCartStage, number>;
  channelPerformance: Record<NotificationChannel, {
    sent: number;
    recovered: number;
    recoveryRate: number;
  }>;
  templatePerformance: Record<string, {
    sent: number;
    recovered: number;
    recoveryRate: number;
    averageRecoveryValue: number;
  }>;
}

/**
 * Abandoned Cart Recovery System
 * AI-powered recovery campaigns for incomplete purchases and registrations
 */
export class AbandonedCartRecovery {
  private abandonedSessions: Map<string, AbandonedCartSession> = new Map();
  private recoveryTemplates: RecoveryTemplate[] = [];
  private analytics: RecoveryAnalytics = {
    totalAbandoned: 0,
    totalRecovered: 0,
    recoveryRate: 0,
    averageRecoveryTime: 0,
    revenueRecovered: 0,
    attemptsByStage: {
      'cart-abandoned': 0,
      'checkout-started': 0,
      'payment-failed': 0,
      'registration-incomplete': 0
    },
    channelPerformance: {
      email: { sent: 0, recovered: 0, recoveryRate: 0 },
      sms: { sent: 0, recovered: 0, recoveryRate: 0 },
      whatsapp: { sent: 0, recovered: 0, recoveryRate: 0 },
      push: { sent: 0, recovered: 0, recoveryRate: 0 }
    },
    templatePerformance: {}
  };

  constructor() {
    this.initializeRecoveryTemplates();
  }

  /**
   * Initialize recovery templates
   */
  private initializeRecoveryTemplates(): void {
    this.recoveryTemplates = [
      // Stage 1: Cart Abandoned (15 minutes)
      {
        id: 'cart-abandoned-1',
        name: 'Gentle Reminder',
        stage: 'cart-abandoned',
        timing: { delayMinutes: 15, maxAttempts: 1 },
        subject: '👋 Don\'t Miss Out: {{offerName}} is Still Available',
        htmlContent: this.generateCartAbandonedTemplate1(),
        textContent: this.generateCartAbandonedText1(),
        channel: ['email'],
        triggers: { minValue: 0 }
      },

      // Stage 2: Cart Abandoned (1 hour)
      {
        id: 'cart-abandoned-2',
        name: 'Value Reinforcement',
        stage: 'cart-abandoned',
        timing: { delayMinutes: 60, maxAttempts: 1 },
        subject: '⏰ {{firstName}}, Your {{offerName}} is Reserved (For Now)',
        htmlContent: this.generateCartAbandonedTemplate2(),
        textContent: this.generateCartAbandonedText2(),
        incentive: { type: 'discount', value: 10 },
        channel: ['email', 'sms'],
        triggers: { minValue: 50 }
      },

      // Stage 3: Cart Abandoned (24 hours)
      {
        id: 'cart-abandoned-3',
        name: 'Final Notice with Incentive',
        stage: 'cart-abandoned',
        timing: { delayMinutes: 1440, maxAttempts: 1 },
        subject: '🚨 FINAL NOTICE: {{offerName}} + Special Bonus Inside',
        htmlContent: this.generateCartAbandonedTemplate3(),
        textContent: this.generateCartAbandonedText3(),
        incentive: { type: 'discount', value: 20 },
        channel: ['email', 'sms'],
        triggers: { minValue: 100 }
      },

      // Checkout Started Recovery
      {
        id: 'checkout-started-1',
        name: 'Quick Return',
        stage: 'checkout-started',
        timing: { delayMinutes: 5, maxAttempts: 1 },
        subject: '🔄 Complete Your Order: {{offerName}}',
        htmlContent: this.generateCheckoutStartedTemplate(),
        textContent: this.generateCheckoutStartedText(),
        channel: ['email', 'push'],
        triggers: { minValue: 0 }
      },

      // Payment Failed Recovery
      {
        id: 'payment-failed-1',
        name: 'Payment Issue Resolution',
        stage: 'payment-failed',
        timing: { delayMinutes: 10, maxAttempts: 2 },
        subject: '💳 Payment Issue? Let\'s Fix That - {{offerName}} Waiting',
        htmlContent: this.generatePaymentFailedTemplate(),
        textContent: this.generatePaymentFailedText(),
        incentive: { type: 'bonus', value: 'Free shipping + bonus materials' },
        channel: ['email', 'sms'],
        triggers: { minValue: 0 }
      },

      // Registration Incomplete
      {
        id: 'registration-incomplete-1',
        name: 'Complete Registration',
        stage: 'registration-incomplete',
        timing: { delayMinutes: 30, maxAttempts: 2 },
        subject: '✅ Complete Your Registration: {{eventTitle}} (1 Click Away)',
        htmlContent: this.generateRegistrationIncompleteTemplate(),
        textContent: this.generateRegistrationIncompleteText(),
        incentive: { type: 'bonus', value: 'Early-bird bonus materials' },
        channel: ['email'],
        triggers: { minValue: 0 }
      }
    ];
  }

  /**
   * Track abandoned session
   */
  trackAbandonedSession(
    viewer: ViewerProfile,
    sessionData: {
      eventId?: string;
      sessionType: 'payment' | 'registration' | 'checkout';
      stage: AbandonedCartStage;
      offer?: PaymentOffer;
      paymentSession?: Partial<PaymentSession>;
      totalValue: number;
      currency: string;
    }
  ): AbandonedCartSession {
    const sessionId = `${viewer.id}-${sessionData.sessionType}-${Date.now()}`;

    const abandonedSession: AbandonedCartSession = {
      id: sessionId,
      viewerId: viewer.id,
      eventId: sessionData.eventId,
      sessionType: sessionData.sessionType,
      stage: sessionData.stage,
      offer: sessionData.offer,
      paymentSession: sessionData.paymentSession,
      abandonedAt: new Date(),
      lastInteraction: new Date(),
      totalValue: sessionData.totalValue,
      currency: sessionData.currency,
      recoveryAttempts: [],
      isRecovered: false
    };

    this.abandonedSessions.set(sessionId, abandonedSession);
    this.analytics.totalAbandoned++;
    this.analytics.attemptsByStage[sessionData.stage]++;

    // Start recovery process
    this.initiateRecoveryProcess(abandonedSession, viewer);

    return abandonedSession;
  }

  /**
   * Initiate recovery process
   */
  private async initiateRecoveryProcess(
    session: AbandonedCartSession,
    viewer: ViewerProfile
  ): Promise<void> {
    // Get applicable recovery templates
    const applicableTemplates = this.recoveryTemplates.filter(template =>
      template.stage === session.stage &&
      (!template.triggers.minValue || session.totalValue >= template.triggers.minValue)
    );

    // Sort by timing
    applicableTemplates.sort((a, b) => a.timing.delayMinutes - b.timing.delayMinutes);

    // Schedule recovery attempts
    for (const template of applicableTemplates) {
      setTimeout(() => {
        this.executeRecoveryAttempt(session, template, viewer);
      }, template.timing.delayMinutes * 60 * 1000);
    }
  }

  /**
   * Execute recovery attempt
   */
  private async executeRecoveryAttempt(
    session: AbandonedCartSession,
    template: RecoveryTemplate,
    viewer: ViewerProfile
  ): Promise<void> {
    // Check if session was already recovered
    if (session.isRecovered) {
      return;
    }

    // Check max attempts
    const existingAttempts = session.recoveryAttempts.filter(a => a.templateId === template.id);
    if (existingAttempts.length >= template.timing.maxAttempts) {
      return;
    }

    // Determine optimal channel using ShowUp Surge
    const showUpProfile = showUpSurgeEngine.getProfile(`${viewer.id}-${session.eventId || 'recovery'}`);
    const optimalChannel = this.selectOptimalChannel(template, showUpProfile, viewer);

    // Generate personalized content
    const personalizedContent = this.generatePersonalizedRecoveryContent(
      template,
      session,
      viewer
    );

    // Create recovery attempt
    const attempt: RecoveryAttempt = {
      id: `${session.id}-attempt-${session.recoveryAttempts.length + 1}`,
      attemptNumber: session.recoveryAttempts.length + 1,
      trigger: 'time-based',
      channel: optimalChannel,
      templateId: template.id,
      sentAt: new Date(),
      incentive: template.incentive
    };

    // Send notification
    try {
      const deliveryResult = await deliveryEngine.sendNotification(
        {
          id: attempt.id,
          profileId: session.id,
          templateId: template.id,
          channel: optimalChannel,
          scheduledAt: new Date(),
          status: 'scheduled',
          personalizedContent: {
            subject: personalizedContent.subject,
            content: personalizedContent.html || personalizedContent.text,
            incentives: template.incentive
          },
          deliveryMetrics: {}
        },
        {
          email: viewer.email,
          phone: viewer.phone,
          name: viewer.name
        }
      );

      if (deliveryResult.success) {
        console.log(`🔄 Recovery attempt sent: ${template.name} via ${optimalChannel} to ${viewer.name}`);

        // Update analytics
        this.analytics.channelPerformance[optimalChannel].sent++;
      }
    } catch (error) {
      console.error('Recovery attempt failed:', error);
    }

    // Add attempt to session
    session.recoveryAttempts.push(attempt);
    this.abandonedSessions.set(session.id, session);
  }

  /**
   * Mark session as recovered
   */
  markAsRecovered(
    sessionId: string,
    recoveryValue?: number,
    attemptId?: string
  ): void {
    const session = this.abandonedSessions.get(sessionId);
    if (!session || session.isRecovered) {
      return;
    }

    session.isRecovered = true;
    session.recoveredAt = new Date();
    session.recoveryValue = recoveryValue || session.totalValue;

    // Update attempt result if specified
    if (attemptId) {
      const attempt = session.recoveryAttempts.find(a => a.id === attemptId);
      if (attempt) {
        attempt.result = {
          ...attempt.result,
          recovered: true,
          recoveredAt: new Date()
        };

        // Update analytics
        this.analytics.channelPerformance[attempt.channel].recovered++;
        this.analytics.channelPerformance[attempt.channel].recoveryRate =
          this.analytics.channelPerformance[attempt.channel].recovered /
          this.analytics.channelPerformance[attempt.channel].sent;
      }
    }

    // Update global analytics
    this.analytics.totalRecovered++;
    this.analytics.recoveryRate = this.analytics.totalRecovered / this.analytics.totalAbandoned;
    this.analytics.revenueRecovered += session.recoveryValue;

    // Calculate average recovery time
    if (session.recoveredAt) {
      const recoveryTimeHours = (session.recoveredAt.getTime() - session.abandonedAt.getTime()) / (1000 * 60 * 60);
      this.analytics.averageRecoveryTime = (this.analytics.averageRecoveryTime + recoveryTimeHours) / 2;
    }

    this.abandonedSessions.set(sessionId, session);

    console.log(`💰 Cart recovered: ${session.recoveryValue} ${session.currency} from session ${sessionId}`);
  }

  /**
   * Update interaction (email open, click, etc.)
   */
  updateInteraction(
    sessionId: string,
    attemptId: string,
    interaction: {
      type: 'opened' | 'clicked';
      timestamp: Date;
    }
  ): void {
    const session = this.abandonedSessions.get(sessionId);
    if (!session) return;

    const attempt = session.recoveryAttempts.find(a => a.id === attemptId);
    if (!attempt) return;

    if (!attempt.result) {
      attempt.result = {
        opened: false,
        clicked: false,
        recovered: false
      };
    }

    switch (interaction.type) {
      case 'opened':
        attempt.result.opened = true;
        attempt.result.openedAt = interaction.timestamp;
        break;
      case 'clicked':
        attempt.result.clicked = true;
        attempt.result.clickedAt = interaction.timestamp;
        break;
    }

    session.lastInteraction = interaction.timestamp;
    this.abandonedSessions.set(sessionId, session);
  }

  /**
   * Get abandoned sessions for viewer
   */
  getAbandonedSessions(viewerId: string): AbandonedCartSession[] {
    return Array.from(this.abandonedSessions.values())
      .filter(session => session.viewerId === viewerId);
  }

  /**
   * Get recovery analytics
   */
  getRecoveryAnalytics(): RecoveryAnalytics {
    return { ...this.analytics };
  }

  /**
   * Select optimal channel for recovery
   */
  private selectOptimalChannel(
    template: RecoveryTemplate,
    showUpProfile: ShowUpSurgeProfile | undefined,
    viewer: ViewerProfile
  ): NotificationChannel {
    const availableChannels = template.channel;

    if (showUpProfile) {
      // Use ShowUp Surge optimization
      const channelScores = availableChannels.map(channel => ({
        channel,
        score: showUpProfile.behaviorPatterns.channelPreferences[channel]
      }));

      channelScores.sort((a, b) => b.score - a.score);
      return channelScores[0].channel;
    }

    // Fallback to simple logic
    const hasPhone = viewer.phone && viewer.phone.length > 0;

    if (availableChannels.includes('sms') && hasPhone && viewer.intentScore >= 70) {
      return 'sms';
    }

    return availableChannels.includes('email') ? 'email' : availableChannels[0];
  }

  /**
   * Generate personalized recovery content
   */
  private generatePersonalizedRecoveryContent(
    template: RecoveryTemplate,
    session: AbandonedCartSession,
    viewer: ViewerProfile
  ): { subject: string; html?: string; text: string } {
    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;

    // Replace placeholders
    const placeholders = {
      firstName: viewer.name.split(' ')[0],
      fullName: viewer.name,
      offerName: session.offer?.name || 'Special Offer',
      eventTitle: session.offer?.name || 'Premium Training',
      totalValue: session.totalValue.toFixed(2),
      currency: session.currency,
      discountAmount: template.incentive?.type === 'discount' ? template.incentive.value : 0,
      recoveryUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/recovery/${session.id}`
    };

    Object.entries(placeholders).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      htmlContent = htmlContent.replace(regex, String(value));
      textContent = textContent.replace(regex, String(value));
    });

    return {
      subject,
      html: htmlContent,
      text: textContent
    };
  }

  // Template generation methods
  private generateCartAbandonedTemplate1(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6, #3B82F6); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .offer-box { background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #3B82F6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">👋 Still Interested?</h1>
            <p style="color: white; font-size: 16px;">{{offerName}} is waiting for you</p>
        </div>

        <div class="content">
            <h2>Hi {{firstName}},</h2>

            <p>I noticed you were looking at <strong>{{offerName}}</strong> but didn't complete your order.</p>

            <p>No worries! I've saved everything for you.</p>

            <div class="offer-box">
                <h3>{{offerName}}</h3>
                <p><strong>Value:</strong> {{currency}}{{totalValue}}</p>
                <p><strong>Status:</strong> Reserved for you</p>
            </div>

            <p>This offer includes everything you saw before:</p>
            <ul>
                <li>✅ Complete training system</li>
                <li>✅ Bonus materials and resources</li>
                <li>✅ Money-back guarantee</li>
                <li>✅ Instant access</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{recoveryUrl}}" class="button">Complete My Order</a>
            </div>

            <p>Questions? Just reply to this email!</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateCartAbandonedText1(): string {
    return `
Hi {{firstName}},

I noticed you were looking at {{offerName}} but didn't complete your order.

No worries! I've saved everything for you.

{{offerName}}
Value: {{currency}}{{totalValue}}
Status: Reserved for you

This offer includes everything you saw before:
✅ Complete training system
✅ Bonus materials and resources
✅ Money-back guarantee
✅ Instant access

Complete My Order: {{recoveryUrl}}

Questions? Just reply to this email!
    `;
  }

  private generateCartAbandonedTemplate2(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .discount-box { background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; background: linear-gradient(135deg, #F59E0B, #EF4444); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">⏰ Don't Miss Out!</h1>
            <p style="color: white; font-size: 16px;">{{offerName}} + Special Discount</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, I have something special for you...</h2>

            <p>Since you showed interest in <strong>{{offerName}}</strong>, I'm offering you an exclusive discount that's not available to everyone.</p>

            <div class="discount-box">
                <h3 style="color: #92400E; margin-top: 0;">🎁 EXCLUSIVE {{discountAmount}}% DISCOUNT</h3>
                <p><strong>Original Price:</strong> <span style="text-decoration: line-through;">{{currency}}{{totalValue}}</span></p>
                <p style="font-size: 24px; color: #DC2626;"><strong>Your Price: {{currency}}{{finalValue}}</strong></p>
                <p style="color: #92400E;"><strong>You Save: {{currency}}{{savingsAmount}}</strong></p>
            </div>

            <p><strong>Why am I offering this discount?</strong></p>
            <p>Because I genuinely want to help you succeed, and I know that sometimes we all need that extra push to invest in ourselves.</p>

            <p>This discount expires in <strong>24 hours</strong>, so don't wait too long.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{recoveryUrl}}" class="button">Claim My {{discountAmount}}% Discount</a>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateCartAbandonedText2(): string {
    return `
{{firstName}}, I have something special for you...

Since you showed interest in {{offerName}}, I'm offering you an exclusive discount that's not available to everyone.

🎁 EXCLUSIVE {{discountAmount}}% DISCOUNT

Original Price: {{currency}}{{totalValue}}
Your Price: {{currency}}{{finalValue}}
You Save: {{currency}}{{savingsAmount}}

Why am I offering this discount?

Because I genuinely want to help you succeed, and I know that sometimes we all need that extra push to invest in ourselves.

This discount expires in 24 hours, so don't wait too long.

Claim My {{discountAmount}}% Discount: {{recoveryUrl}}
    `;
  }

  private generateCartAbandonedTemplate3(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #DC2626, #7C2D12); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .final-offer { background: #FEE2E2; border: 3px solid #DC2626; border-radius: 8px; padding: 25px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; background: linear-gradient(135deg, #DC2626, #7C2D12); color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">🚨 FINAL NOTICE</h1>
            <p style="color: white; font-size: 16px;">Last chance for {{offerName}}</p>
        </div>

        <div class="content">
            <h2>{{firstName}}, this is my final email about {{offerName}}.</h2>

            <p>I've been holding your spot, but I can't hold it much longer.</p>

            <p>Here's the situation:</p>
            <ul>
                <li>⏰ Your reservation expires tonight at midnight</li>
                <li>📈 Demand has been incredible (seriously, my inbox is full)</li>
                <li>🎯 I can only guarantee this price for the next few hours</li>
            </ul>

            <div class="final-offer">
                <h3 style="color: #DC2626; margin-top: 0;">FINAL OFFER: {{discountAmount}}% OFF + BONUS PACKAGE</h3>
                <p><strong>{{offerName}} + Exclusive Bonuses</strong></p>
                <p style="font-size: 24px; color: #DC2626;"><strong>{{currency}}{{finalValue}} (Save {{currency}}{{savingsAmount}})</strong></p>
                <p style="color: #7C2D12;"><strong>Expires: Tonight at Midnight</strong></p>
            </div>

            <p><strong>What happens if you don't act now?</strong></p>
            <p>Honestly? You'll probably kick yourself later. I've seen this happen countless times - people wait, then email me weeks later asking if the offer is still available. It never is.</p>

            <p>Don't be that person.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{recoveryUrl}}" class="button">CLAIM FINAL OFFER</a>
            </div>

            <p style="text-align: center; font-size: 14px; color: #666;">After midnight, this offer disappears forever.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateCartAbandonedText3(): string {
    return `
🚨 FINAL NOTICE - Last chance for {{offerName}}

{{firstName}}, this is my final email about {{offerName}}.

I've been holding your spot, but I can't hold it much longer.

Here's the situation:
⏰ Your reservation expires tonight at midnight
📈 Demand has been incredible (seriously, my inbox is full)
🎯 I can only guarantee this price for the next few hours

FINAL OFFER: {{discountAmount}}% OFF + BONUS PACKAGE

{{offerName}} + Exclusive Bonuses
{{currency}}{{finalValue}} (Save {{currency}}{{savingsAmount}})
Expires: Tonight at Midnight

What happens if you don't act now?

Honestly? You'll probably kick yourself later. I've seen this happen countless times - people wait, then email me weeks later asking if the offer is still available. It never is.

Don't be that person.

CLAIM FINAL OFFER: {{recoveryUrl}}

After midnight, this offer disappears forever.
    `;
  }

  private generateCheckoutStartedTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .progress-box { background: #ECFDF5; border: 2px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">🔄 Almost There!</h1>
            <p style="color: white; font-size: 16px;">Complete your {{offerName}} order</p>
        </div>

        <div class="content">
            <h2>Hi {{firstName}},</h2>

            <p>You were so close! I saw you started the checkout process for <strong>{{offerName}}</strong> but didn't finish.</p>

            <div class="progress-box">
                <h3 style="color: #059669; margin-top: 0;">📋 Your Progress</h3>
                <p>✅ Selected {{offerName}}</p>
                <p>✅ Started checkout</p>
                <p>⏳ Complete payment (1 click away!)</p>
            </div>

            <p>Good news: I've saved everything for you. Just click the button below to complete your order in seconds.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{recoveryUrl}}" class="button">Complete My Order</a>
            </div>

            <p><small>Having trouble? Reply to this email and I'll help you personally.</small></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateCheckoutStartedText(): string {
    return `
Hi {{firstName}},

You were so close! I saw you started the checkout process for {{offerName}} but didn't finish.

Your Progress:
✅ Selected {{offerName}}
✅ Started checkout
⏳ Complete payment (1 click away!)

Good news: I've saved everything for you. Just click the link below to complete your order in seconds.

Complete My Order: {{recoveryUrl}}

Having trouble? Reply to this email and I'll help you personally.
    `;
  }

  private generatePaymentFailedTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .help-box { background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">💳 Let's Fix That</h1>
            <p style="color: white; font-size: 16px;">Payment issue with {{offerName}}</p>
        </div>

        <div class="content">
            <h2>Hi {{firstName}},</h2>

            <p>I noticed there was an issue with processing your payment for <strong>{{offerName}}</strong>.</p>

            <p>Don't worry - this happens sometimes! Usually it's something simple like:</p>
            <ul>
                <li>💳 Card expired or needs updating</li>
                <li>🏦 Bank flagged international transaction</li>
                <li>📱 3D Secure verification needed</li>
                <li>💰 Insufficient funds</li>
            </ul>

            <div class="help-box">
                <h3 style="color: #1E40AF; margin-top: 0;">🎁 Special Offer for the Inconvenience</h3>
                <p>To apologize for the hassle, I'm including these bonuses:</p>
                <ul>
                    <li>✅ Free priority support</li>
                    <li>✅ Bonus implementation materials</li>
                    <li>✅ Extended money-back guarantee (60 days)</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{recoveryUrl}}" class="button">Try Payment Again</a>
            </div>

            <p>Need help? Reply to this email or call us at <strong>(555) 123-4567</strong> - we'll get this sorted in 2 minutes!</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generatePaymentFailedText(): string {
    return `
Hi {{firstName}},

I noticed there was an issue with processing your payment for {{offerName}}.

Don't worry - this happens sometimes! Usually it's something simple like:
💳 Card expired or needs updating
🏦 Bank flagged international transaction
📱 3D Secure verification needed
💰 Insufficient funds

Special Offer for the Inconvenience:

To apologize for the hassle, I'm including these bonuses:
✅ Free priority support
✅ Bonus implementation materials
✅ Extended money-back guarantee (60 days)

Try Payment Again: {{recoveryUrl}}

Need help? Reply to this email or call us at (555) 123-4567 - we'll get this sorted in 2 minutes!
    `;
  }

  private generateRegistrationIncompleteTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6, #7C3AED); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .bonus-box { background: #FAF5FF; border: 2px solid #8B5CF6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="color: white; margin: 0;">✅ One Click Away</h1>
            <p style="color: white; font-size: 16px;">Complete your {{eventTitle}} registration</p>
        </div>

        <div class="content">
            <h2>Hi {{firstName}},</h2>

            <p>You started registering for <strong>{{eventTitle}}</strong> but didn't complete the process.</p>

            <p>I totally get it - sometimes we get distracted or interrupted. But I don't want you to miss out on this!</p>

            <div class="bonus-box">
                <h3 style="color: #7C3AED; margin-top: 0;">🎁 Early-Bird Bonus</h3>
                <p>Since you started early, you get these exclusive bonuses:</p>
                <ul>
                    <li>✅ Pre-event preparation materials</li>
                    <li>✅ Bonus Q&A session recording</li>
                    <li>✅ Implementation worksheets</li>
                    <li>✅ Priority seating (virtual front row!)</li>
                </ul>
            </div>

            <p>It takes literally 10 seconds to complete your registration.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{recoveryUrl}}" class="button">Complete Registration (10 seconds)</a>
            </div>

            <p>See you at the event!</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateRegistrationIncompleteText(): string {
    return `
Hi {{firstName}},

You started registering for {{eventTitle}} but didn't complete the process.

I totally get it - sometimes we get distracted or interrupted. But I don't want you to miss out on this!

🎁 Early-Bird Bonus

Since you started early, you get these exclusive bonuses:
✅ Pre-event preparation materials
✅ Bonus Q&A session recording
✅ Implementation worksheets
✅ Priority seating (virtual front row!)

It takes literally 10 seconds to complete your registration.

Complete Registration (10 seconds): {{recoveryUrl}}

See you at the event!
    `;
  }
}

// Export singleton instance
export const abandonedCartRecovery = new AbandonedCartRecovery();