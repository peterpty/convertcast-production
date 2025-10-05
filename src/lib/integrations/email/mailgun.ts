/**
 * Mailgun Integration Adapter
 * Supports transactional email sending via Mailgun API
 */

import {
  BaseIntegrationAdapter,
  IntegrationCapabilities,
  IntegrationCredentials,
  IntegrationConfig,
  IntegrationHealthCheck,
  SendEmailParams,
  SendResult,
} from '../base';

interface MailgunConfig extends IntegrationConfig {
  domain: string;
  region?: 'us' | 'eu'; // US or EU API endpoint
}

export class MailgunAdapter extends BaseIntegrationAdapter {
  private domain: string;
  private apiUrl: string;

  constructor(credentials: IntegrationCredentials, config: MailgunConfig) {
    super('mailgun', credentials, config);
    this.domain = config.domain;

    // Determine API endpoint based on region
    const region = config.region || 'us';
    this.apiUrl = region === 'eu'
      ? 'https://api.eu.mailgun.net/v3'
      : 'https://api.mailgun.net/v3';
  }

  getCapabilities(): IntegrationCapabilities {
    return {
      email: true,
      sms: false,
      contacts: false,
      lists: false,
      templates: true,
      analytics: true,
    };
  }

  async verifyConnection(): Promise<IntegrationHealthCheck> {
    const startTime = Date.now();

    try {
      // Validate domain by checking domain info
      const response = await fetch(`${this.apiUrl}/domains/${this.domain}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.credentials.apiKey}`).toString('base64')}`,
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          responseTime,
          metadata: {
            domain: data.domain?.name,
            state: data.domain?.state,
          },
        };
      } else {
        const error = await response.text();
        return {
          healthy: false,
          responseTime,
          error: `Mailgun verification failed: ${error}`,
        };
      }
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: this.parseError(error),
      };
    }
  }

  async sendEmail(params: SendEmailParams): Promise<SendResult> {
    try {
      this.log('info', `Sending email to ${params.to.length} recipients`);

      const formData = new FormData();
      formData.append('from', params.from || this.credentials.senderEmail || 'noreply@' + this.domain);
      formData.append('subject', params.subject);
      formData.append('html', params.htmlBody);

      if (params.textBody) {
        formData.append('text', params.textBody);
      }

      // Add recipients
      params.to.forEach(email => formData.append('to', email));

      if (params.cc && params.cc.length > 0) {
        params.cc.forEach(email => formData.append('cc', email));
      }

      if (params.bcc && params.bcc.length > 0) {
        params.bcc.forEach(email => formData.append('bcc', email));
      }

      if (params.replyTo) {
        formData.append('h:Reply-To', params.replyTo);
      }

      // Add tags for tracking
      if (params.tags && params.tags.length > 0) {
        params.tags.forEach(tag => formData.append('o:tag', tag));
      }

      // Add custom variables for tracking
      if (params.metadata) {
        Object.entries(params.metadata).forEach(([key, value]) => {
          formData.append(`v:${key}`, String(value));
        });
      }

      const response = await fetch(`${this.apiUrl}/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.credentials.apiKey}`).toString('base64')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        const estimatedCost = this.estimateCost(params.to.length, 'email');

        this.log('info', 'Email sent successfully', { messageId: data.id });

        return {
          success: true,
          messageId: data.id,
          sentCount: params.to.length,
          failedCount: 0,
          estimatedCost,
          metadata: {
            message: data.message,
          },
        };
      } else {
        const error = await response.json();
        this.log('error', 'Failed to send email', error);

        return {
          success: false,
          sentCount: 0,
          failedCount: params.to.length,
          errors: [{ recipient: 'all', error: error.message || 'Unknown error' }],
        };
      }
    } catch (error) {
      this.log('error', 'Error sending email', error);

      return {
        success: false,
        sentCount: 0,
        failedCount: params.to.length,
        errors: [{ recipient: 'all', error: this.parseError(error) }],
      };
    }
  }

  estimateCost(recipientCount: number, type: 'email' | 'sms'): number {
    if (type !== 'email') return 0;

    // Mailgun pricing: $0.80 per 1,000 emails (first 5,000 free)
    const costPer1000 = 0.80;
    const freeEmails = 5000;

    if (recipientCount <= freeEmails) {
      return 0;
    }

    const billableEmails = recipientCount - freeEmails;
    return (billableEmails / 1000) * costPer1000;
  }

  getConfigFields() {
    return [
      {
        name: 'apiKey',
        label: 'Mailgun API Key',
        type: 'password' as const,
        required: true,
        placeholder: 'key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'Found in Settings > API Keys in your Mailgun dashboard',
      },
      {
        name: 'domain',
        label: 'Mailgun Domain',
        type: 'text' as const,
        required: true,
        placeholder: 'mg.yourdomain.com',
        helpText: 'Your verified sending domain in Mailgun',
      },
      {
        name: 'senderEmail',
        label: 'Sender Email',
        type: 'email' as const,
        required: true,
        placeholder: 'notifications@yourdomain.com',
        helpText: 'Email address to send notifications from',
      },
      {
        name: 'region',
        label: 'Region',
        type: 'select' as const,
        required: false,
        options: [
          { value: 'us', label: 'US (api.mailgun.net)' },
          { value: 'eu', label: 'EU (api.eu.mailgun.net)' },
        ],
        helpText: 'Select the region where your Mailgun account is hosted',
      },
    ];
  }

  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.credentials.apiKey) {
      errors.push('Mailgun API key is required');
    }

    if (!this.domain) {
      errors.push('Mailgun domain is required');
    }

    if (!this.credentials.senderEmail) {
      errors.push('Sender email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.credentials.senderEmail)) {
      errors.push('Sender email must be a valid email address');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRateLimits() {
    return {
      // Mailgun doesn't have strict rate limits, but recommends batching
      emailsPerHour: undefined,
      emailsPerDay: undefined,
    };
  }
}
