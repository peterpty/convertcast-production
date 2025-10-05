/**
 * Mailchimp Integration Adapter
 * Supports email campaigns and contact sync via Mailchimp Marketing API
 * Uses OAuth2 authentication
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

interface MailchimpConfig extends IntegrationConfig {
  serverPrefix?: string; // e.g., "us1", "us2", etc.
}

export class MailchimpAdapter extends BaseIntegrationAdapter {
  private serverPrefix: string;
  private apiUrl: string;

  constructor(credentials: IntegrationCredentials, config: MailchimpConfig) {
    super('mailchimp', credentials, config);

    // Extract server prefix from API key or config
    // Mailchimp API keys are in format: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1
    this.serverPrefix = config.serverPrefix || this.extractServerPrefix(credentials.apiKey || '');
    this.apiUrl = `https://${this.serverPrefix}.api.mailchimp.com/3.0`;
  }

  private extractServerPrefix(apiKey: string): string {
    const parts = apiKey.split('-');
    if (parts.length === 2) {
      return parts[1];
    }
    return 'us1'; // Default fallback
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
      // Verify by checking account info
      const response = await fetch(`${this.apiUrl}/`, {
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
            accountName: data.account_name,
            email: data.email,
            role: data.role,
          },
        };
      } else {
        const error = await response.json();
        return {
          healthy: false,
          responseTime,
          error: `Mailchimp verification failed: ${error.title || 'Unknown error'}`,
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
      this.log('info', `Creating Mailchimp campaign for ${params.to.length} recipients`);

      // Note: Mailchimp doesn't support direct transactional emails via Marketing API
      // This creates a campaign instead
      // For true transactional emails, use Mailchimp Transactional (Mandrill)

      // Get the first list ID (required for campaign)
      const lists = await this.getLists();
      if (lists.length === 0) {
        throw new Error('No audience lists found. Please create a list in Mailchimp first.');
      }

      const listId = lists[0].id;

      // Create campaign
      const campaignPayload = {
        type: 'regular',
        recipients: {
          list_id: listId,
        },
        settings: {
          subject_line: params.subject,
          from_name: 'ConvertCast',
          reply_to: params.replyTo || params.from || this.credentials.senderEmail || 'noreply@example.com',
        },
      };

      const campaignResponse = await fetch(`${this.apiUrl}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignPayload),
      });

      if (!campaignResponse.ok) {
        const error = await campaignResponse.json();
        throw new Error(error.title || 'Failed to create campaign');
      }

      const campaign = await campaignResponse.json();

      // Set campaign content
      const contentPayload = {
        html: params.htmlBody,
        ...(params.textBody ? { plain_text: params.textBody } : {}),
      };

      const contentResponse = await fetch(`${this.apiUrl}/campaigns/${campaign.id}/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentPayload),
      });

      if (!contentResponse.ok) {
        const error = await contentResponse.json();
        throw new Error(error.title || 'Failed to set campaign content');
      }

      // Send campaign
      const sendResponse = await fetch(`${this.apiUrl}/campaigns/${campaign.id}/actions/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (sendResponse.ok) {
        const estimatedCost = this.estimateCost(params.to.length, 'email');

        this.log('info', 'Campaign sent successfully', { campaignId: campaign.id });

        return {
          success: true,
          messageId: campaign.id,
          sentCount: params.to.length,
          failedCount: 0,
          estimatedCost,
          metadata: {
            campaignId: campaign.id,
          },
        };
      } else {
        const error = await sendResponse.json();
        throw new Error(error.title || 'Failed to send campaign');
      }
    } catch (error) {
      this.log('error', 'Error sending via Mailchimp', error);

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
      this.log('info', 'Syncing contacts from Mailchimp');

      const allContacts: ContactData[] = [];
      const listsToSync = listIds || (await this.getLists()).map(l => l.id);

      for (const listId of listsToSync) {
        let offset = 0;
        const count = 1000; // Mailchimp max per page

        while (true) {
          const response = await fetch(
            `${this.apiUrl}/lists/${listId}/members?offset=${offset}&count=${count}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${this.credentials.apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.title || 'Failed to fetch contacts');
          }

          const data = await response.json();
          const contacts: ContactData[] = data.members.map((member: any) => ({
            id: member.id,
            email: member.email_address,
            firstName: member.merge_fields?.FNAME,
            lastName: member.merge_fields?.LNAME,
            tags: member.tags?.map((t: any) => t.name) || [],
            lists: [{ id: listId, name: 'Unknown' }],
            customFields: member.merge_fields,
            consent: {
              email: member.status === 'subscribed',
              sms: false,
            },
          }));

          allContacts.push(...contacts);

          // Check if there are more pages
          if (data.members.length < count) {
            break;
          }

          offset += count;
        }
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
      const response = await fetch(`${this.apiUrl}/lists?count=100`, {
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

      return data.lists?.map((list: any) => ({
        id: list.id,
        name: list.name,
        memberCount: list.stats?.member_count,
      })) || [];
    } catch (error) {
      this.log('error', 'Failed to fetch lists', error);
      return [];
    }
  }

  estimateCost(recipientCount: number, type: 'email' | 'sms'): number {
    if (type !== 'email') return 0;

    // Mailchimp pricing varies greatly by plan and contact count
    // Free plan: Up to 500 contacts, 1,000 sends/month
    // Essentials: ~$13/month for 500 contacts
    // Average estimate: ~$0.002 per email
    const costPerEmail = 0.002;

    return recipientCount * costPerEmail;
  }

  getConfigFields() {
    return [
      {
        name: 'apiKey',
        label: 'Mailchimp API Key',
        type: 'password' as const,
        required: true,
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1',
        helpText: 'Found in Account > Extras > API Keys. Format: key-serverprefix',
      },
      {
        name: 'senderEmail',
        label: 'Default Sender Email',
        type: 'email' as const,
        required: true,
        placeholder: 'notifications@yourdomain.com',
        helpText: 'Must be verified in Mailchimp',
      },
    ];
  }

  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.credentials.apiKey) {
      errors.push('Mailchimp API key is required');
    } else if (!this.credentials.apiKey.includes('-')) {
      errors.push('Mailchimp API key should be in format: key-serverprefix (e.g., xxx-us1)');
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
      // Mailchimp has rate limits of 10 requests/second per API key
      emailsPerHour: undefined,
      emailsPerDay: undefined, // Varies by plan
    };
  }
}
