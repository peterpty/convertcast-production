'use client';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface EmailRecipient {
  email: string;
  name: string;
  variables?: Record<string, string>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ScheduledEmail {
  id: string;
  templateId: string;
  recipients: EmailRecipient[];
  scheduledAt: Date;
  eventId: string;
  type: 'confirmation' | 'reminder-24h' | 'reminder-1h' | 'last-chance' | 'live-starting';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: Date;
  error?: string;
}

/**
 * Email Service Provider Interface
 * In production, this would integrate with services like:
 * - Resend (recommended)
 * - SendGrid
 * - AWS SES
 * - Mailgun
 */
export class EmailService {
  private provider: 'mock' | 'resend' | 'sendgrid' = 'mock';
  private apiKey: string | null = null;
  private fromEmail: string = 'noreply@convertcast.com';
  private fromName: string = 'ConvertCast';

  constructor() {
    // In production, load from environment variables
    this.provider = (process.env.NEXT_PUBLIC_EMAIL_PROVIDER as any) || 'mock';
    this.apiKey = process.env.EMAIL_API_KEY || null;
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@convertcast.com';
    this.fromName = process.env.FROM_NAME || 'ConvertCast';
  }

  /**
   * Send individual email
   */
  async sendEmail(
    templateId: string,
    recipient: EmailRecipient,
    variables: Record<string, string> = {}
  ): Promise<EmailSendResult> {
    try {
      const template = this.getTemplate(templateId);
      if (!template) {
        return { success: false, error: `Template ${templateId} not found` };
      }

      const renderedSubject = this.renderTemplate(template.subject, { ...variables, ...recipient.variables });
      const renderedHtml = this.renderTemplate(template.htmlContent, { ...variables, ...recipient.variables });
      const renderedText = this.renderTemplate(template.textContent, { ...variables, ...recipient.variables });

      // Mock implementation for development
      if (this.provider === 'mock') {
        console.log('📧 Mock Email Sent:', {
          to: recipient.email,
          from: `${this.fromName} <${this.fromEmail}>`,
          subject: renderedSubject,
          html: renderedHtml.substring(0, 200) + '...',
          variables
        });

        return {
          success: true,
          messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }

      // Production implementation would go here
      // Example for Resend:
      /*
      if (this.provider === 'resend') {
        const resend = new Resend(this.apiKey);
        const result = await resend.emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: recipient.email,
          subject: renderedSubject,
          html: renderedHtml,
          text: renderedText,
        });

        return {
          success: true,
          messageId: result.data?.id
        };
      }
      */

      return { success: false, error: 'Email provider not configured' };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    templateId: string,
    recipients: EmailRecipient[],
    variables: Record<string, string> = {}
  ): Promise<EmailSendResult[]> {
    const results: EmailSendResult[] = [];

    for (const recipient of recipients) {
      const result = await this.sendEmail(templateId, recipient, variables);
      results.push(result);

      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, string> = {}): string {
    let rendered = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    return rendered;
  }

  /**
   * Get email template by ID
   */
  private getTemplate(templateId: string): EmailTemplate | null {
    const templates = this.getTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * Get all email templates
   */
  getTemplates(): EmailTemplate[] {
    return [
      {
        id: 'event-confirmation',
        name: 'Event Registration Confirmation',
        subject: 'You\'re registered for {{eventTitle}}! 🎉',
        variables: ['attendeeName', 'eventTitle', 'eventDate', 'eventTime', 'joinUrl', 'calendarUrl'],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px; overflow: hidden;">
            <div style="padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: bold;">🎉 You're In!</h1>
              <p style="margin: 0; font-size: 18px; opacity: 0.9;">Registration confirmed for</p>
              <h2 style="margin: 16px 0; font-size: 24px; color: #ffd700;">{{eventTitle}}</h2>
            </div>

            <div style="background: white; color: #1f2937; padding: 32px; margin: 0;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h3 style="margin: 0 0 8px 0; color: #667eea;">Hi {{attendeeName}}!</h3>
                <p style="margin: 0; color: #6b7280;">Get ready for an amazing experience with ConvertCast's AI-powered features.</p>
              </div>

              <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Event Details</h4>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="margin-right: 12px;">📅</span>
                  <span><strong>Date:</strong> {{eventDate}}</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="margin-right: 12px;">⏰</span>
                  <span><strong>Time:</strong> {{eventTime}}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="margin-right: 12px;">🔗</span>
                  <span><strong>Join URL:</strong> <a href="{{joinUrl}}" style="color: #667eea;">Click to join</a></span>
                </div>
              </div>

              <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
                <h4 style="margin: 0 0 12px 0; color: #92400e;">What to Expect</h4>
                <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                  <li>EngageMax™ AI interactions</li>
                  <li>AutoOffer™ personalized deals</li>
                  <li>Real-time Q&A and polls</li>
                  <li>Exclusive insights and strategies</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="{{calendarUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 12px;">📅 Add to Calendar</a>
                <a href="{{joinUrl}}" style="display: inline-block; background: #10b981; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">🚀 Join Event</a>
              </div>

              <div style="text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; color: #6b7280; font-size: 14px;">
                <p style="margin: 0;">Questions? Reply to this email or contact support.</p>
              </div>
            </div>
          </div>
        `,
        textContent: `
You're registered for {{eventTitle}}! 🎉

Hi {{attendeeName}},

Thanks for registering! Here are your event details:

📅 Date: {{eventDate}}
⏰ Time: {{eventTime}}
🔗 Join: {{joinUrl}}

What to expect:
- EngageMax™ AI interactions
- AutoOffer™ personalized deals
- Real-time Q&A and polls
- Exclusive insights and strategies

Add to calendar: {{calendarUrl}}
Join event: {{joinUrl}}

Questions? Reply to this email or contact support.

See you there!
ConvertCast Team
        `
      },
      {
        id: 'reminder-24h',
        name: '24-Hour Reminder',
        subject: 'Tomorrow: {{eventTitle}} - Don\'t miss out! ⏰',
        variables: ['attendeeName', 'eventTitle', 'eventDate', 'eventTime', 'joinUrl', 'timeUntilEvent'],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">⏰ 24 Hours to Go!</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Your event is almost here</p>
            </div>

            <div style="background: white; color: #1f2937; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
              <h2 style="margin: 0 0 16px 0; color: #f59e0b;">Hi {{attendeeName}}!</h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                This is your friendly reminder that <strong>{{eventTitle}}</strong> is happening tomorrow!
              </p>

              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; color: #92400e;">Event Details</h3>
                <p style="margin: 0 0 8px 0;"><strong>📅 Date:</strong> {{eventDate}}</p>
                <p style="margin: 0 0 8px 0;"><strong>⏰ Time:</strong> {{eventTime}}</p>
                <p style="margin: 0;"><strong>⏳ Time remaining:</strong> {{timeUntilEvent}}</p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="{{joinUrl}}" style="display: inline-block; background: #f59e0b; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">🚀 Join Event Tomorrow</a>
              </div>

              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                <h4 style="margin: 0 0 12px 0; color: #0369a1;">Pro Tip:</h4>
                <p style="margin: 0; color: #0369a1;">Set up your streaming environment early and test your connection for the best experience!</p>
              </div>
            </div>
          </div>
        `,
        textContent: `
⏰ 24 Hours to Go!

Hi {{attendeeName}},

This is your friendly reminder that {{eventTitle}} is happening tomorrow!

Event Details:
📅 Date: {{eventDate}}
⏰ Time: {{eventTime}}
⏳ Time remaining: {{timeUntilEvent}}

Join tomorrow: {{joinUrl}}

Pro Tip: Set up your streaming environment early and test your connection for the best experience!

See you tomorrow!
ConvertCast Team
        `
      },
      {
        id: 'reminder-1h',
        name: '1-Hour Reminder',
        subject: 'STARTING SOON: {{eventTitle}} in 1 hour! 🚨',
        variables: ['attendeeName', 'eventTitle', 'joinUrl'],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 32px;">🚨 STARTING SOON!</h1>
              <p style="margin: 8px 0 0 0; font-size: 18px; opacity: 0.9;">Just 1 hour to go!</p>
            </div>

            <div style="background: white; color: #1f2937; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
              <h2 style="margin: 0 0 16px 0; color: #ef4444;">{{attendeeName}}, it's almost time! 🎉</h2>
              <p style="margin: 0 0 24px 0; font-size: 18px; line-height: 1.6;">
                <strong>{{eventTitle}}</strong> starts in just <strong style="color: #ef4444;">1 HOUR</strong>!
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="{{joinUrl}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">🚀 JOIN NOW</a>
              </div>

              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
                <h4 style="margin: 0 0 12px 0; color: #991b1b;">Last-Minute Checklist:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
                  <li>Test your internet connection</li>
                  <li>Close unnecessary apps</li>
                  <li>Grab your favorite beverage ☕</li>
                  <li>Get ready for amazing insights!</li>
                </ul>
              </div>
            </div>
          </div>
        `,
        textContent: `
🚨 STARTING SOON!

{{attendeeName}}, it's almost time! 🎉

{{eventTitle}} starts in just 1 HOUR!

JOIN NOW: {{joinUrl}}

Last-Minute Checklist:
- Test your internet connection
- Close unnecessary apps
- Grab your favorite beverage ☕
- Get ready for amazing insights!

See you in 1 hour!
ConvertCast Team
        `
      },
      {
        id: 'live-starting',
        name: 'Event Starting Now',
        subject: '🔴 LIVE NOW: {{eventTitle}} - Join immediately!',
        variables: ['attendeeName', 'eventTitle', 'joinUrl'],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 32px; text-align: center; border-radius: 16px 16px 0 0; animation: pulse 2s infinite;">
              <h1 style="margin: 0; font-size: 36px;">🔴 LIVE NOW!</h1>
              <p style="margin: 8px 0 0 0; font-size: 20px; opacity: 0.95;">We're starting right now!</p>
            </div>

            <div style="background: white; color: #1f2937; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
              <h2 style="margin: 0 0 16px 0; color: #10b981;">{{attendeeName}}, we're LIVE! 🎉</h2>
              <p style="margin: 0 0 24px 0; font-size: 18px; line-height: 1.6;">
                <strong>{{eventTitle}}</strong> is starting <strong style="color: #10b981;">RIGHT NOW</strong>! Don't miss a second!
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="{{joinUrl}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 24px 48px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 20px; box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); animation: bounce 1s infinite;">🚀 JOIN LIVE NOW</a>
              </div>

              <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; text-align: center;">
                <p style="margin: 0; color: #047857; font-size: 16px; font-weight: 500;">⚡ EngageMax™ AI is active • AutoOffer™ deals are live • Perfect moments await!</p>
              </div>
            </div>
          </div>
        `,
        textContent: `
🔴 LIVE NOW!

{{attendeeName}}, we're LIVE! 🎉

{{eventTitle}} is starting RIGHT NOW! Don't miss a second!

JOIN LIVE NOW: {{joinUrl}}

⚡ EngageMax™ AI is active • AutoOffer™ deals are live • Perfect moments await!

Join immediately!
ConvertCast Team
        `
      }
    ];
  }
}

// Export singleton instance
export const emailService = new EmailService();