/**
 * WhatsApp Business API Integration Adapter
 * Supports message sending via WhatsApp Business Cloud API (Meta)
 */

import {
  BaseIntegrationAdapter,
  IntegrationCapabilities,
  IntegrationCredentials,
  IntegrationConfig,
  IntegrationHealthCheck,
  SendSmsParams,
  SendResult,
} from '../base';

interface WhatsAppConfig extends IntegrationConfig {
  phoneNumberId: string; // WhatsApp phone number ID
  businessAccountId?: string;
}

export class WhatsAppAdapter extends BaseIntegrationAdapter {
  private apiUrl = 'https://graph.facebook.com/v18.0';
  private phoneNumberId: string;

  constructor(credentials: IntegrationCredentials, config: WhatsAppConfig) {
    super('whatsapp_business', credentials, config);
    this.phoneNumberId = config.phoneNumberId;
  }

  getCapabilities(): IntegrationCapabilities {
    return {
      email: false,
      sms: true,
      contacts: false,
      lists: false,
      templates: true, // WhatsApp supports message templates
      analytics: true,
    };
  }

  async verifyConnection(): Promise<IntegrationHealthCheck> {
    const startTime = Date.now();

    try {
      // Verify by checking phone number details
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.credentials.apiKey}`,
          },
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          responseTime,
          metadata: {
            verifiedName: data.verified_name,
            phoneNumber: data.display_phone_number,
            qualityRating: data.quality_rating,
          },
        };
      } else {
        const error = await response.json();
        return {
          healthy: false,
          responseTime,
          error: `WhatsApp verification failed: ${error.error?.message || 'Unknown error'}`,
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

  async sendSms(params: SendSmsParams): Promise<SendResult> {
    try {
      this.log('info', `Sending WhatsApp messages to ${params.to.length} recipients`);

      // Send messages in parallel
      const results = await Promise.allSettled(
        params.to.map(async phoneNumber => {
          // WhatsApp requires phone numbers without + or spaces
          const cleanPhone = phoneNumber.replace(/[^\d]/g, '');

          const payload = {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: {
              preview_url: true,
              body: params.message,
            },
          };

          const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.credentials.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to send WhatsApp message');
          }

          return await response.json();
        })
      );

      const sentCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r, index) => ({
          recipient: params.to[index],
          error: r.reason.message,
        }));

      const estimatedCost = this.estimateCost(sentCount, 'sms');

      this.log('info', `WhatsApp batch complete: ${sentCount} sent, ${failedCount} failed`);

      return {
        success: sentCount > 0,
        messageId: results[0]?.status === 'fulfilled' ? results[0].value.messages?.[0]?.id : undefined,
        sentCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
        estimatedCost,
      };
    } catch (error) {
      this.log('error', 'Error sending WhatsApp batch', error);

      return {
        success: false,
        sentCount: 0,
        failedCount: params.to.length,
        errors: [{ recipient: 'all', error: this.parseError(error) }],
      };
    }
  }

  estimateCost(recipientCount: number, type: 'email' | 'sms'): number {
    if (type !== 'sms') return 0;

    // WhatsApp Business API pricing (varies by country and conversation type)
    // Service conversations (business-initiated): ~$0.005 - $0.08 per message
    // Utility conversations: ~$0.0025 - $0.04 per message
    // Using average estimate for US
    const costPerMessage = 0.01;

    return recipientCount * costPerMessage;
  }

  getConfigFields() {
    return [
      {
        name: 'apiKey',
        label: 'WhatsApp Access Token',
        type: 'password' as const,
        required: true,
        placeholder: 'EAAxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'System user access token from Meta Business Manager',
      },
      {
        name: 'phoneNumberId',
        label: 'Phone Number ID',
        type: 'text' as const,
        required: true,
        placeholder: '1234567890123456',
        helpText: 'WhatsApp Business phone number ID from Meta Business Manager',
      },
      {
        name: 'senderPhone',
        label: 'Display Phone Number',
        type: 'text' as const,
        required: false,
        placeholder: '+1234567890',
        helpText: 'Your WhatsApp Business verified phone number (for display only)',
      },
    ];
  }

  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.credentials.apiKey) {
      errors.push('WhatsApp access token is required');
    }

    if (!this.phoneNumberId) {
      errors.push('Phone number ID is required');
    } else if (!/^\d+$/.test(this.phoneNumberId)) {
      errors.push('Phone number ID should contain only digits');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRateLimits() {
    return {
      smsPerSecond: 80, // WhatsApp allows 80 messages per second
      smsPerDay: undefined, // Based on messaging tier (1K, 10K, 100K, unlimited)
    };
  }
}
