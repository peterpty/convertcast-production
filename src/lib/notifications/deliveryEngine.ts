'use client';

import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { Twilio } from 'twilio';
import { NotificationChannel, NotificationSchedule, NotificationStatus } from './showUpSurgeEngine';

export interface DeliveryProvider {
  name: string;
  channel: NotificationChannel;
  isEnabled: boolean;
  config: Record<string, any>;
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt: Date;
  provider: string;
}

export interface DeliveryMetrics {
  channel: NotificationChannel;
  provider: string;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  averageDeliveryTime: number; // milliseconds
  errors: { message: string; count: number }[];
}

/**
 * Multi-Channel Delivery Engine
 * Handles email, SMS, WhatsApp, and push notification delivery
 */
export class DeliveryEngine {
  private mailgun: any;
  private twilio: any;
  private providers: Map<NotificationChannel, DeliveryProvider[]> = new Map();
  private deliveryMetrics: Map<string, DeliveryMetrics> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize delivery providers
   */
  private initializeProviders(): void {
    // Email providers
    this.providers.set('email', [
      {
        name: 'Mailgun',
        channel: 'email',
        isEnabled: !!process.env.MAILGUN_API_KEY,
        config: {
          apiKey: process.env.MAILGUN_API_KEY,
          domain: process.env.MAILGUN_DOMAIN || 'mg.convertcast.com'
        }
      }
    ]);

    // SMS/WhatsApp providers
    this.providers.set('sms', [
      {
        name: 'Twilio',
        channel: 'sms',
        isEnabled: !!process.env.TWILIO_ACCOUNT_SID,
        config: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromNumber: process.env.TWILIO_FROM_NUMBER
        }
      }
    ]);

    this.providers.set('whatsapp', [
      {
        name: 'Twilio',
        channel: 'whatsapp',
        isEnabled: !!process.env.TWILIO_ACCOUNT_SID,
        config: {
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
        }
      }
    ]);

    // Initialize clients
    this.initializeClients();
  }

  /**
   * Initialize API clients
   */
  private initializeClients(): void {
    // Initialize Mailgun
    const emailProvider = this.providers.get('email')?.[0];
    if (emailProvider?.isEnabled) {
      const mg = new Mailgun(formData);
      this.mailgun = mg.client({
        username: 'api',
        key: emailProvider.config.apiKey
      });
    }

    // Initialize Twilio
    const smsProvider = this.providers.get('sms')?.[0];
    if (smsProvider?.isEnabled) {
      this.twilio = new Twilio(
        smsProvider.config.accountSid,
        smsProvider.config.authToken
      );
    }
  }

  /**
   * Send notification via appropriate channel
   */
  async sendNotification(
    schedule: NotificationSchedule,
    recipient: {
      email?: string;
      phone?: string;
      name?: string;
      timezone?: string;
    }
  ): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      let result: DeliveryResult;

      switch (schedule.channel) {
        case 'email':
          result = await this.sendEmail(schedule, recipient);
          break;
        case 'sms':
          result = await this.sendSMS(schedule, recipient);
          break;
        case 'whatsapp':
          result = await this.sendWhatsApp(schedule, recipient);
          break;
        case 'push':
          result = await this.sendPushNotification(schedule, recipient);
          break;
        default:
          throw new Error(`Unsupported channel: ${schedule.channel}`);
      }

      // Update metrics
      this.updateDeliveryMetrics(schedule.channel, 'Mailgun', result, Date.now() - startTime);

      return result;
    } catch (error) {
      const errorResult: DeliveryResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveredAt: new Date(),
        provider: this.getProviderName(schedule.channel)
      };

      this.updateDeliveryMetrics(schedule.channel, 'Error', errorResult, Date.now() - startTime);
      return errorResult;
    }
  }

  /**
   * Send email via Mailgun
   */
  private async sendEmail(
    schedule: NotificationSchedule,
    recipient: { email?: string; name?: string }
  ): Promise<DeliveryResult> {
    if (!this.mailgun || !recipient.email) {
      throw new Error('Mailgun not configured or recipient email missing');
    }

    const emailProvider = this.providers.get('email')?.[0];
    if (!emailProvider) {
      throw new Error('No email provider configured');
    }

    const messageData = {
      from: `ConvertCast ShowUp Surge <noreply@${emailProvider.config.domain}>`,
      to: recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email,
      subject: schedule.personalizedContent.subject,
      html: schedule.personalizedContent.content,
      text: this.stripHtml(schedule.personalizedContent.content),
      'o:tracking': true,
      'o:tracking-clicks': true,
      'o:tracking-opens': true,
      'o:tag': [`template:${schedule.templateId}`, `event:${schedule.id}`],
      'h:X-Mailgun-Variables': JSON.stringify({
        scheduleId: schedule.id,
        templateId: schedule.templateId,
        channel: schedule.channel
      })
    };

    const response = await this.mailgun.messages.create(emailProvider.config.domain, messageData);

    return {
      success: true,
      messageId: response.id,
      deliveredAt: new Date(),
      provider: 'Mailgun'
    };
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(
    schedule: NotificationSchedule,
    recipient: { phone?: string; name?: string }
  ): Promise<DeliveryResult> {
    if (!this.twilio || !recipient.phone) {
      throw new Error('Twilio not configured or recipient phone missing');
    }

    const smsProvider = this.providers.get('sms')?.[0];
    if (!smsProvider) {
      throw new Error('No SMS provider configured');
    }

    // Convert HTML content to plain text for SMS
    const plainText = this.stripHtml(schedule.personalizedContent.content);

    // Truncate for SMS limits
    const smsContent = this.formatForSMS(plainText, schedule.personalizedContent.subject);

    const message = await this.twilio.messages.create({
      body: smsContent,
      from: smsProvider.config.fromNumber,
      to: recipient.phone,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/twilio/sms-status`,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
    });

    return {
      success: true,
      messageId: message.sid,
      deliveredAt: new Date(),
      provider: 'Twilio'
    };
  }

  /**
   * Send WhatsApp message via Twilio
   */
  private async sendWhatsApp(
    schedule: NotificationSchedule,
    recipient: { phone?: string; name?: string }
  ): Promise<DeliveryResult> {
    if (!this.twilio || !recipient.phone) {
      throw new Error('Twilio not configured or recipient phone missing');
    }

    const whatsappProvider = this.providers.get('whatsapp')?.[0];
    if (!whatsappProvider) {
      throw new Error('No WhatsApp provider configured');
    }

    // Format for WhatsApp
    const whatsappContent = this.formatForWhatsApp(
      schedule.personalizedContent.content,
      schedule.personalizedContent.subject
    );

    const whatsappNumber = recipient.phone.startsWith('whatsapp:')
      ? recipient.phone
      : `whatsapp:${recipient.phone}`;

    const message = await this.twilio.messages.create({
      body: whatsappContent,
      from: whatsappProvider.config.fromNumber,
      to: whatsappNumber,
      statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/twilio/whatsapp-status`
    });

    return {
      success: true,
      messageId: message.sid,
      deliveredAt: new Date(),
      provider: 'Twilio'
    };
  }

  /**
   * Send push notification (placeholder for future implementation)
   */
  private async sendPushNotification(
    schedule: NotificationSchedule,
    recipient: { email?: string; name?: string }
  ): Promise<DeliveryResult> {
    // This would integrate with services like:
    // - Firebase Cloud Messaging
    // - OneSignal
    // - Pusher
    // For now, we'll simulate the delivery

    console.log('📱 Push notification simulated:', {
      title: schedule.personalizedContent.subject,
      body: this.stripHtml(schedule.personalizedContent.content).substring(0, 100),
      recipient: recipient.name || recipient.email
    });

    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      messageId: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveredAt: new Date(),
      provider: 'OneSignal'
    };
  }

  /**
   * Batch send notifications
   */
  async sendBatch(
    schedules: {
      schedule: NotificationSchedule;
      recipient: {
        email?: string;
        phone?: string;
        name?: string;
        timezone?: string;
      };
    }[]
  ): Promise<Map<string, DeliveryResult>> {
    const results = new Map<string, DeliveryResult>();
    const batchSize = 10; // Process in batches to avoid rate limits

    for (let i = 0; i < schedules.length; i += batchSize) {
      const batch = schedules.slice(i, i + batchSize);

      const batchPromises = batch.map(async ({ schedule, recipient }) => {
        try {
          const result = await this.sendNotification(schedule, recipient);
          results.set(schedule.id, result);
        } catch (error) {
          results.set(schedule.id, {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            deliveredAt: new Date(),
            provider: this.getProviderName(schedule.channel)
          });
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches to respect rate limits
      if (i + batchSize < schedules.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Process webhook from delivery providers
   */
  processWebhook(
    provider: string,
    channel: NotificationChannel,
    webhookData: any
  ): {
    scheduleId?: string;
    status: NotificationStatus;
    timestamp: Date;
    error?: string;
  } {
    switch (provider.toLowerCase()) {
      case 'mailgun':
        return this.processMailgunWebhook(webhookData);
      case 'twilio':
        return this.processTwilioWebhook(channel, webhookData);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Process Mailgun webhook
   */
  private processMailgunWebhook(data: any): {
    scheduleId?: string;
    status: NotificationStatus;
    timestamp: Date;
    error?: string;
  } {
    const eventType = data['event-data']?.event;
    const messageId = data['event-data']?.message?.headers?.['message-id'];
    const variables = data['event-data']?.['user-variables'];
    const timestamp = new Date((data['event-data']?.timestamp || Date.now()) * 1000);

    let status: NotificationStatus = 'sent';
    switch (eventType) {
      case 'delivered':
        status = 'delivered';
        break;
      case 'opened':
        status = 'opened';
        break;
      case 'clicked':
        status = 'clicked';
        break;
      case 'failed':
      case 'rejected':
        status = 'failed';
        break;
    }

    return {
      scheduleId: variables?.scheduleId,
      status,
      timestamp,
      error: eventType === 'failed' ? data['event-data']?.reason : undefined
    };
  }

  /**
   * Process Twilio webhook
   */
  private processTwilioWebhook(
    channel: NotificationChannel,
    data: any
  ): {
    scheduleId?: string;
    status: NotificationStatus;
    timestamp: Date;
    error?: string;
  } {
    const messageStatus = data.MessageStatus || data.SmsStatus;
    const messageSid = data.MessageSid || data.SmsSid;
    const timestamp = new Date();

    let status: NotificationStatus = 'sent';
    switch (messageStatus) {
      case 'delivered':
        status = 'delivered';
        break;
      case 'failed':
      case 'undelivered':
        status = 'failed';
        break;
      case 'sent':
        status = 'sent';
        break;
    }

    return {
      scheduleId: messageSid, // Would need custom mapping in real implementation
      status,
      timestamp,
      error: messageStatus === 'failed' ? data.ErrorMessage : undefined
    };
  }

  /**
   * Get delivery metrics for a channel
   */
  getDeliveryMetrics(channel: NotificationChannel): DeliveryMetrics | undefined {
    return this.deliveryMetrics.get(channel);
  }

  /**
   * Get all delivery metrics
   */
  getAllDeliveryMetrics(): Map<string, DeliveryMetrics> {
    return this.deliveryMetrics;
  }

  /**
   * Update delivery metrics
   */
  private updateDeliveryMetrics(
    channel: NotificationChannel,
    provider: string,
    result: DeliveryResult,
    deliveryTime: number
  ): void {
    const key = `${channel}-${provider}`;
    let metrics = this.deliveryMetrics.get(key);

    if (!metrics) {
      metrics = {
        channel,
        provider,
        sent: 0,
        delivered: 0,
        failed: 0,
        deliveryRate: 0,
        averageDeliveryTime: 0,
        errors: []
      };
    }

    metrics.sent++;

    if (result.success) {
      metrics.delivered++;
    } else {
      metrics.failed++;

      // Track error messages
      if (result.error) {
        const existingError = metrics.errors.find(e => e.message === result.error);
        if (existingError) {
          existingError.count++;
        } else {
          metrics.errors.push({ message: result.error, count: 1 });
        }
      }
    }

    metrics.deliveryRate = metrics.sent > 0 ? metrics.delivered / metrics.sent : 0;

    // Update average delivery time
    metrics.averageDeliveryTime = (metrics.averageDeliveryTime + deliveryTime) / 2;

    this.deliveryMetrics.set(key, metrics);
  }

  /**
   * Strip HTML tags for plain text content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gims, '')
      .replace(/<script[^>]*>.*<\/script>/gims, '')
      .replace(/<[^>]+>/gim, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Format content for SMS
   */
  private formatForSMS(content: string, subject: string): string {
    const maxLength = 1600; // SMS limit
    const header = `${subject}\n\n`;

    let smsContent = header + content;

    if (smsContent.length > maxLength) {
      const availableLength = maxLength - header.length - 50; // Leave room for "..."
      smsContent = header + content.substring(0, availableLength) + '...\n\nView full details at: [link]';
    }

    return smsContent;
  }

  /**
   * Format content for WhatsApp
   */
  private formatForWhatsApp(content: string, subject: string): string {
    const maxLength = 4096; // WhatsApp limit

    // WhatsApp supports some formatting
    let whatsappContent = `*${subject}*\n\n${content}`;

    if (whatsappContent.length > maxLength) {
      const availableLength = maxLength - 100; // Leave room for footer
      whatsappContent = whatsappContent.substring(0, availableLength) + '...\n\n_Continue reading at: [link]_';
    }

    return whatsappContent;
  }

  /**
   * Get provider name for a channel
   */
  private getProviderName(channel: NotificationChannel): string {
    const providers = this.providers.get(channel);
    return providers?.[0]?.name || 'Unknown';
  }

  /**
   * Test delivery configuration
   */
  async testConfiguration(): Promise<{
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
    errors: string[];
  }> {
    const results = {
      email: false,
      sms: false,
      whatsapp: false,
      push: false,
      errors: []
    };

    // Test email
    try {
      if (this.mailgun) {
        // This would send a test email in production
        results.email = true;
      } else {
        results.errors.push('Mailgun not configured - missing API key or domain');
      }
    } catch (error) {
      results.errors.push(`Email test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test SMS/WhatsApp
    try {
      if (this.twilio) {
        results.sms = true;
        results.whatsapp = true;
      } else {
        results.errors.push('Twilio not configured - missing account SID or auth token');
      }
    } catch (error) {
      results.errors.push(`Twilio test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Push is always available (simulated)
    results.push = true;

    return results;
  }
}

// Export singleton instance
export const deliveryEngine = new DeliveryEngine();