/**
 * Brevo (Sendinblue) Integration Adapter
 * Supports email and SMS sending via Brevo API
 */

import {
  BaseIntegrationAdapter,
  IntegrationCapabilities,
  IntegrationCredentials,
  IntegrationConfig,
  IntegrationHealthCheck,
  SendEmailParams,
  SendResult,
  SendSmsParams,
  ContactSyncResult,
  ContactData,
} from '../base';

export class BrevoAdapter extends BaseIntegrationAdapter {
  private apiUrl = 'https://api.brevo.com/v3';

  constructor(credentials: IntegrationCredentials, config?: IntegrationConfig) {
    super('brevo', credentials, config);
  }

  getCapabilities(): IntegrationCapabilities {
    return {
      email: true,
      sms: true, // Brevo supports SMS!
      contacts: true,
      lists: true,
      templates: true,
      analytics: true,
    };
  }

  async verifyConnection(): Promise<IntegrationHealthCheck> {
    const startTime = Date.now();

    try {
      // Verify by checking account info
      const response = await fetch(`${this.apiUrl}/account`, {
        method: 'GET',
        headers: {
          'api-key': this.credentials.apiKey || '',
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
            email: data.email,
            companyName: data.companyName,
            plan: data.plan?.[0]?.type,
          },
        };
      } else {
        const error = await response.json();
        return {
          healthy: false,
          responseTime,
          error: `Brevo verification failed: ${error.message || 'Unknown error'}`,
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

      const payload = {
        sender: {
          email: params.from || this.credentials.senderEmail || 'noreply@example.com',
          name: 'ConvertCast',
        },
        to: params.to.map(email => ({ email })),
        ...(params.cc && params.cc.length > 0 ? { cc: params.cc.map(email => ({ email })) } : {}),
        ...(params.bcc && params.bcc.length > 0 ? { bcc: params.bcc.map(email => ({ email })) } : {}),
        subject: params.subject,
        htmlContent: params.htmlBody,
        ...(params.textBody ? { textContent: params.textBody } : {}),
        ...(params.replyTo ? { replyTo: { email: params.replyTo } } : {}),
        ...(params.tags && params.tags.length > 0 ? { tags: params.tags } : {}),
        ...(params.metadata ? { params: params.metadata } : {}),
      };

      const response = await fetch(`${this.apiUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.credentials.apiKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 201) {
        const data = await response.json();
        const estimatedCost = this.estimateCost(params.to.length, 'email');

        this.log('info', 'Email sent successfully', { messageId: data.messageId });

        return {
          success: true,
          messageId: data.messageId,
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

  async sendSms(params: SendSmsParams): Promise<SendResult> {
    try {
      this.log('info', `Sending SMS to ${params.to.length} recipients`);

      // Brevo SMS API requires sending one by one
      const results = await Promise.allSettled(
        params.to.map(async phoneNumber => {
          const payload = {
            sender: params.from || this.credentials.senderPhone || 'ConvertCast',
            recipient: phoneNumber,
            content: params.message,
            type: 'transactional',
          };

          const response = await fetch(`${this.apiUrl}/transactionalSMS/sms`, {
            method: 'POST',
            headers: {
              'api-key': this.credentials.apiKey || '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send SMS');
          }

          return await response.json();
        })
      );

      const sentCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => ({ recipient: 'unknown', error: r.reason.message }));

      const estimatedCost = this.estimateCost(sentCount, 'sms');

      this.log('info', `SMS batch complete: ${sentCount} sent, ${failedCount} failed`);

      return {
        success: sentCount > 0,
        sentCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
        estimatedCost,
      };
    } catch (error) {
      this.log('error', 'Error sending SMS batch', error);

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
      this.log('info', 'Syncing contacts from Brevo');

      let offset = 0;
      const limit = 500; // Brevo max per page
      const allContacts: ContactData[] = [];

      while (true) {
        const response = await fetch(`${this.apiUrl}/contacts?limit=${limit}&offset=${offset}`, {
          method: 'GET',
          headers: {
            'api-key': this.credentials.apiKey || '',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch contacts');
        }

        const data = await response.json();
        const contacts: ContactData[] = data.contacts.map((contact: any) => ({
          id: contact.id?.toString(),
          email: contact.email,
          firstName: contact.attributes?.FIRSTNAME,
          lastName: contact.attributes?.LASTNAME,
          phone: contact.attributes?.SMS,
          lists: contact.listIds?.map((id: number) => ({ id: id.toString(), name: 'Unknown' })) || [],
          customFields: contact.attributes,
          consent: {
            email: !contact.emailBlacklisted,
            sms: !contact.smsBlacklisted,
          },
        }));

        allContacts.push(...contacts);

        // Check if there are more pages
        if (data.contacts.length < limit) {
          break;
        }

        offset += limit;
      }

      this.log('info', `Synced ${allContacts.length} contacts`);

      return {
        success: true,
        syncedCount: allContacts.length,
        failedCount: 0,
        contacts: allContacts,
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
      const response = await fetch(`${this.apiUrl}/contacts/lists?limit=50`, {
        method: 'GET',
        headers: {
          'api-key': this.credentials.apiKey || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lists');
      }

      const data = await response.json();

      return data.lists?.map((list: any) => ({
        id: list.id.toString(),
        name: list.name,
        memberCount: list.totalSubscribers,
      })) || [];
    } catch (error) {
      this.log('error', 'Failed to fetch lists', error);
      return [];
    }
  }

  estimateCost(recipientCount: number, type: 'email' | 'sms'): number {
    if (type === 'email') {
      // Brevo pricing: Free plan 300 emails/day, then ~$0.70/1000 emails
      const costPer1000 = 0.70;
      const freeEmails = 300;

      if (recipientCount <= freeEmails) return 0;
      const billableEmails = recipientCount - freeEmails;
      return (billableEmails / 1000) * costPer1000;
    } else if (type === 'sms') {
      // Brevo SMS pricing: ~$0.04 per SMS (varies by country)
      const costPerSms = 0.04;
      return recipientCount * costPerSms;
    }

    return 0;
  }

  getConfigFields() {
    return [
      {
        name: 'apiKey',
        label: 'Brevo API Key',
        type: 'password' as const,
        required: true,
        placeholder: 'xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'Found in Settings > SMTP & API > API Keys',
      },
      {
        name: 'senderEmail',
        label: 'Sender Email',
        type: 'email' as const,
        required: true,
        placeholder: 'notifications@yourdomain.com',
        helpText: 'Must be verified in Brevo',
      },
      {
        name: 'senderPhone',
        label: 'Sender Name for SMS (Optional)',
        type: 'text' as const,
        required: false,
        placeholder: 'ConvertCast',
        helpText: 'Name displayed as SMS sender (max 11 characters)',
      },
    ];
  }

  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.credentials.apiKey) {
      errors.push('Brevo API key is required');
    } else if (!this.credentials.apiKey.startsWith('xkeysib-')) {
      errors.push('Brevo API key should start with "xkeysib-"');
    }

    if (!this.credentials.senderEmail) {
      errors.push('Sender email is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRateLimits() {
    return {
      emailsPerDay: 300, // Free plan limit
      smsPerDay: undefined, // Varies by credits
    };
  }
}
