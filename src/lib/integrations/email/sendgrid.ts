/**
 * SendGrid Integration Adapter
 * Supports transactional email sending and contact sync via SendGrid API
 */

import {
  BaseIntegrationAdapter,
  IntegrationCapabilities,
  IntegrationCredentials,
  IntegrationConfig,
  IntegrationHealthCheck,
  SendEmailParams,
  SendResult,
  ContactSyncResult,
  ContactData,
} from '../base';

export class SendGridAdapter extends BaseIntegrationAdapter {
  private apiUrl = 'https://api.sendgrid.com/v3';

  constructor(credentials: IntegrationCredentials, config?: IntegrationConfig) {
    super('sendgrid', credentials, config);
  }

  getCapabilities(): IntegrationCapabilities {
    return {
      email: true,
      sms: false,
      contacts: true,
      lists: true,
      templates: true,
      analytics: true,
    };
  }

  async verifyConnection(): Promise<IntegrationHealthCheck> {
    const startTime = Date.now();

    try {
      // Verify API key by checking account details
      const response = await fetch(`${this.apiUrl}/user/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          responseTime,
          metadata: {
            type: data.type,
            reputation: data.reputation,
          },
        };
      } else {
        const error = await response.json();
        return {
          healthy: false,
          responseTime,
          error: `SendGrid verification failed: ${error.errors?.[0]?.message || 'Unknown error'}`,
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

      // Build personalizations for each recipient
      const personalizations = params.to.map(email => ({
        to: [{ email }],
        ...(params.cc && params.cc.length > 0 ? { cc: params.cc.map(e => ({ email: e })) } : {}),
        ...(params.bcc && params.bcc.length > 0 ? { bcc: params.bcc.map(e => ({ email: e })) } : {}),
        ...(params.metadata ? { custom_args: params.metadata } : {}),
      }));

      const payload = {
        personalizations,
        from: {
          email: params.from || this.credentials.senderEmail || 'noreply@example.com',
        },
        subject: params.subject,
        content: [
          {
            type: 'text/html',
            value: params.htmlBody,
          },
          ...(params.textBody
            ? [
                {
                  type: 'text/plain',
                  value: params.textBody,
                },
              ]
            : []),
        ],
        ...(params.replyTo ? { reply_to: { email: params.replyTo } } : {}),
        ...(params.tags && params.tags.length > 0 ? { categories: params.tags } : {}),
      };

      const response = await fetch(`${this.apiUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 202) {
        // SendGrid returns 202 Accepted
        const messageId = response.headers.get('X-Message-Id') || undefined;
        const estimatedCost = this.estimateCost(params.to.length, 'email');

        this.log('info', 'Email sent successfully', { messageId });

        return {
          success: true,
          messageId,
          sentCount: params.to.length,
          failedCount: 0,
          estimatedCost,
        };
      } else {
        const error = await response.json();
        this.log('error', 'Failed to send email', error);

        return {
          success: false,
          sentCount: 0,
          failedCount: params.to.length,
          errors: [
            {
              recipient: 'all',
              error: error.errors?.[0]?.message || 'Unknown error',
            },
          ],
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

  async syncContacts(listIds?: string[]): Promise<ContactSyncResult> {
    try {
      this.log('info', 'Syncing contacts from SendGrid');

      // Fetch all contacts
      const response = await fetch(`${this.apiUrl}/marketing/contacts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Failed to fetch contacts');
      }

      const data = await response.json();
      const contacts: ContactData[] = data.result?.map((contact: any) => ({
        id: contact.id,
        email: contact.email,
        firstName: contact.first_name,
        lastName: contact.last_name,
        customFields: contact.custom_fields || {},
        lists: contact.list_ids?.map((id: string) => ({ id, name: 'Unknown' })) || [],
      })) || [];

      this.log('info', `Synced ${contacts.length} contacts`);

      return {
        success: true,
        syncedCount: contacts.length,
        failedCount: 0,
        contacts,
      };
    } catch (error) {
      this.log('error', 'Failed to sync contacts', error);

      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        contacts: [],
        errors: [this.parseError(error)],
      };
    }
  }

  async getLists(): Promise<Array<{ id: string; name: string; memberCount?: number }>> {
    try {
      const response = await fetch(`${this.apiUrl}/marketing/lists`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lists');
      }

      const data = await response.json();

      return data.result?.map((list: any) => ({
        id: list.id,
        name: list.name,
        memberCount: list.contact_count,
      })) || [];
    } catch (error) {
      this.log('error', 'Failed to fetch lists', error);
      return [];
    }
  }

  estimateCost(recipientCount: number, type: 'email' | 'sms'): number {
    if (type !== 'email') return 0;

    // SendGrid pricing: ~$0.70 per 1,000 emails (varies by plan)
    // First 100 emails/day free on free tier
    const costPer1000 = 0.70;
    const freeEmails = 100;

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
        label: 'SendGrid API Key',
        type: 'password' as const,
        required: true,
        placeholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'Created in Settings > API Keys with "Mail Send" permission',
      },
      {
        name: 'senderEmail',
        label: 'Sender Email',
        type: 'email' as const,
        required: true,
        placeholder: 'notifications@yourdomain.com',
        helpText: 'Must be a verified sender in SendGrid',
      },
    ];
  }

  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.credentials.apiKey) {
      errors.push('SendGrid API key is required');
    } else if (!this.credentials.apiKey.startsWith('SG.')) {
      errors.push('SendGrid API key should start with "SG."');
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
      // SendGrid has flexible rate limits based on plan
      emailsPerDay: undefined, // Varies by plan
    };
  }
}
