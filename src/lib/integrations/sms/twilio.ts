/**
 * Twilio Integration Adapter
 * Supports SMS and MMS sending via Twilio API
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

export class TwilioAdapter extends BaseIntegrationAdapter {
  private apiUrl = 'https://api.twilio.com/2010-04-01';
  private accountSid: string;
  private authToken: string;

  constructor(credentials: IntegrationCredentials, config?: IntegrationConfig) {
    super('twilio', credentials, config);

    this.accountSid = credentials.apiKey || '';
    this.authToken = credentials.apiSecret || '';
  }

  getCapabilities(): IntegrationCapabilities {
    return {
      email: false,
      sms: true,
      contacts: false,
      lists: false,
      templates: false,
      analytics: true,
    };
  }

  async verifyConnection(): Promise<IntegrationHealthCheck> {
    const startTime = Date.now();

    try {
      // Verify by checking account info
      const response = await fetch(`${this.apiUrl}/Accounts/${this.accountSid}.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          responseTime,
          metadata: {
            friendlyName: data.friendly_name,
            status: data.status,
            type: data.type,
          },
        };
      } else {
        const error = await response.json();
        return {
          healthy: false,
          responseTime,
          error: `Twilio verification failed: ${error.message || 'Unknown error'}`,
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
      this.log('info', `Sending SMS to ${params.to.length} recipients`);

      const from = params.from || this.credentials.senderPhone;
      if (!from) {
        throw new Error('Sender phone number is required');
      }

      // Send messages in parallel
      const results = await Promise.allSettled(
        params.to.map(async phoneNumber => {
          const formData = new URLSearchParams();
          formData.append('To', phoneNumber);
          formData.append('From', from);
          formData.append('Body', params.message);

          // Add media URLs for MMS
          if (params.mediaUrls && params.mediaUrls.length > 0) {
            params.mediaUrls.forEach(url => formData.append('MediaUrl', url));
          }

          const response = await fetch(
            `${this.apiUrl}/Accounts/${this.accountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData,
            }
          );

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
        .map((r, index) => ({
          recipient: params.to[index],
          error: r.reason.message,
        }));

      const estimatedCost = this.estimateCost(sentCount, 'sms');

      this.log('info', `SMS batch complete: ${sentCount} sent, ${failedCount} failed`);

      return {
        success: sentCount > 0,
        messageId: results[0]?.status === 'fulfilled' ? results[0].value.sid : undefined,
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

  estimateCost(recipientCount: number, type: 'email' | 'sms'): number {
    if (type !== 'sms') return 0;

    // Twilio SMS pricing (US):
    // Outbound SMS: $0.0079 per message
    // Outbound MMS: $0.02 per message
    // Using SMS rate as base estimate
    const costPerSms = 0.0079;

    return recipientCount * costPerSms;
  }

  getConfigFields() {
    return [
      {
        name: 'apiKey',
        label: 'Twilio Account SID',
        type: 'text' as const,
        required: true,
        placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpText: 'Found in Console Dashboard at twilio.com/console',
      },
      {
        name: 'apiSecret',
        label: 'Twilio Auth Token',
        type: 'password' as const,
        required: true,
        placeholder: 'your_auth_token',
        helpText: 'Found in Console Dashboard (click to reveal)',
      },
      {
        name: 'senderPhone',
        label: 'Twilio Phone Number',
        type: 'text' as const,
        required: true,
        placeholder: '+1234567890',
        helpText: 'Your Twilio phone number in E.164 format',
      },
    ];
  }

  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.accountSid) {
      errors.push('Twilio Account SID is required');
    } else if (!this.accountSid.startsWith('AC')) {
      errors.push('Twilio Account SID should start with "AC"');
    }

    if (!this.authToken) {
      errors.push('Twilio Auth Token is required');
    }

    if (!this.credentials.senderPhone) {
      errors.push('Twilio phone number is required');
    } else if (!/^\+[1-9]\d{1,14}$/.test(this.credentials.senderPhone)) {
      errors.push('Phone number must be in E.164 format (e.g., +1234567890)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRateLimits() {
    return {
      smsPerSecond: 1, // Twilio recommends 1 message per second
      smsPerDay: undefined, // No hard limit, based on account limits
    };
  }
}
