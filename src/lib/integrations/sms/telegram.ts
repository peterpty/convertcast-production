/**
 * Telegram Bot API Integration Adapter
 * Supports message sending via Telegram Bot API
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

export class TelegramAdapter extends BaseIntegrationAdapter {
  private apiUrl: string;
  private botToken: string;

  constructor(credentials: IntegrationCredentials, config?: IntegrationConfig) {
    super('telegram', credentials, config);
    this.botToken = credentials.apiKey || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  getCapabilities(): IntegrationCapabilities {
    return {
      email: false,
      sms: true,
      contacts: false,
      lists: false,
      templates: false,
      analytics: false,
    };
  }

  async verifyConnection(): Promise<IntegrationHealthCheck> {
    const startTime = Date.now();

    try {
      // Verify by getting bot info
      const response = await fetch(`${this.apiUrl}/getMe`, {
        method: 'GET',
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          return {
            healthy: true,
            responseTime,
            metadata: {
              botUsername: data.result.username,
              botName: data.result.first_name,
              canReadMessages: data.result.can_read_all_group_messages,
            },
          };
        } else {
          return {
            healthy: false,
            responseTime,
            error: `Telegram verification failed: ${data.description || 'Unknown error'}`,
          };
        }
      } else {
        return {
          healthy: false,
          responseTime,
          error: 'Telegram API request failed',
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
      this.log('info', `Sending Telegram messages to ${params.to.length} recipients`);

      // Telegram uses chat IDs, not phone numbers
      // params.to should contain Telegram chat IDs or usernames
      const results = await Promise.allSettled(
        params.to.map(async chatId => {
          const payload = {
            chat_id: chatId,
            text: params.message,
            parse_mode: 'HTML', // Support basic HTML formatting
          };

          const response = await fetch(`${this.apiUrl}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (!data.ok) {
            throw new Error(data.description || 'Failed to send Telegram message');
          }

          return data.result;
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

      this.log('info', `Telegram batch complete: ${sentCount} sent, ${failedCount} failed`);

      return {
        success: sentCount > 0,
        messageId: results[0]?.status === 'fulfilled' ? results[0].value.message_id?.toString() : undefined,
        sentCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
        estimatedCost,
      };
    } catch (error) {
      this.log('error', 'Error sending Telegram batch', error);

      return {
        success: false,
        sentCount: 0,
        failedCount: params.to.length,
        errors: [{ recipient: 'all', error: this.parseError(error) }],
      };
    }
  }

  estimateCost(recipientCount: number, type: 'email' | 'sms'): number {
    // Telegram Bot API is completely free!
    return 0;
  }

  getConfigFields() {
    return [
      {
        name: 'apiKey',
        label: 'Telegram Bot Token',
        type: 'password' as const,
        required: true,
        placeholder: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz',
        helpText: 'Get from @BotFather on Telegram. Format: <bot_id>:<token>',
      },
    ];
  }

  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.botToken) {
      errors.push('Telegram bot token is required');
    } else if (!this.botToken.includes(':')) {
      errors.push('Telegram bot token should be in format: bot_id:token');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  getRateLimits() {
    return {
      smsPerSecond: 1, // Telegram rate limit: 30 messages per second globally, but recommend 1/sec for safety
      smsPerDay: undefined, // No daily limit
    };
  }

  /**
   * Helper method to get bot info
   * Useful for displaying in UI
   */
  async getBotInfo(): Promise<{
    username: string;
    name: string;
    canJoinGroups: boolean;
  } | null> {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      const data = await response.json();

      if (data.ok) {
        return {
          username: data.result.username,
          name: data.result.first_name,
          canJoinGroups: data.result.can_join_groups,
        };
      }

      return null;
    } catch (error) {
      this.log('error', 'Failed to get bot info', error);
      return null;
    }
  }
}
