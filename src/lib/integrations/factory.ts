/**
 * Integration Adapter Factory
 * Creates the appropriate adapter instance based on service type
 */

import {
  BaseIntegrationAdapter,
  ServiceType,
  IntegrationCredentials,
  IntegrationConfig,
  IntegrationAdapterFactory,
} from './base';

// Email adapters
import { MailgunAdapter } from './email/mailgun';
import { SendGridAdapter } from './email/sendgrid';
import { MailchimpAdapter } from './email/mailchimp';
import { BrevoAdapter } from './email/brevo';

// SMS adapters
import { TwilioAdapter } from './sms/twilio';
import { WhatsAppAdapter } from './sms/whatsapp';
import { TelegramAdapter } from './sms/telegram';

/**
 * Factory implementation
 */
class IntegrationFactory implements IntegrationAdapterFactory {
  create(
    serviceType: ServiceType,
    credentials: IntegrationCredentials,
    config?: IntegrationConfig
  ): BaseIntegrationAdapter {
    switch (serviceType) {
      // Email services
      case 'mailgun':
        return new MailgunAdapter(credentials, config as any);

      case 'sendgrid':
        return new SendGridAdapter(credentials, config);

      case 'mailchimp':
        return new MailchimpAdapter(credentials, config as any);

      case 'brevo':
        return new BrevoAdapter(credentials, config);

      // SMS services
      case 'twilio':
        return new TwilioAdapter(credentials, config);

      case 'whatsapp_business':
        return new WhatsAppAdapter(credentials, config as any);

      case 'telegram':
        return new TelegramAdapter(credentials, config);

      // Not yet implemented
      case 'custom_smtp':
        throw new Error('Custom SMTP adapter not yet implemented');

      default:
        throw new Error(`Unknown service type: ${serviceType}`);
    }
  }
}

// Export singleton instance
export const integrationFactory = new IntegrationFactory();

/**
 * Helper function to create an adapter with decrypted credentials
 * @param serviceType - The integration service type
 * @param encryptedCredentials - Encrypted credentials from database
 * @param config - Service-specific configuration
 * @returns Initialized adapter instance
 */
export async function createAdapter(
  serviceType: ServiceType,
  encryptedCredentials: {
    api_key_encrypted?: string | null;
    api_secret_encrypted?: string | null;
    oauth_token_encrypted?: string | null;
    sender_email?: string | null;
    sender_phone?: string | null;
  },
  config?: IntegrationConfig
): Promise<BaseIntegrationAdapter> {
  const { decrypt } = await import('../security/encryption');

  // Decrypt credentials
  const credentials: IntegrationCredentials = {
    apiKey: encryptedCredentials.api_key_encrypted
      ? decrypt(encryptedCredentials.api_key_encrypted)
      : undefined,
    apiSecret: encryptedCredentials.api_secret_encrypted
      ? decrypt(encryptedCredentials.api_secret_encrypted)
      : undefined,
    oauthToken: encryptedCredentials.oauth_token_encrypted
      ? decrypt(encryptedCredentials.oauth_token_encrypted)
      : undefined,
    senderEmail: encryptedCredentials.sender_email || undefined,
    senderPhone: encryptedCredentials.sender_phone || undefined,
  };

  return integrationFactory.create(serviceType, credentials, config);
}

/**
 * Helper to create adapter from database row
 * @param integration - Integration record from database
 * @returns Initialized adapter instance
 */
export async function createAdapterFromDb(integration: {
  service_type: string;
  api_key_encrypted?: string | null;
  api_secret_encrypted?: string | null;
  oauth_token_encrypted?: string | null;
  sender_email?: string | null;
  sender_phone?: string | null;
  configuration?: any;
}): Promise<BaseIntegrationAdapter> {
  return createAdapter(
    integration.service_type as ServiceType,
    {
      api_key_encrypted: integration.api_key_encrypted,
      api_secret_encrypted: integration.api_secret_encrypted,
      oauth_token_encrypted: integration.oauth_token_encrypted,
      sender_email: integration.sender_email,
      sender_phone: integration.sender_phone,
    },
    integration.configuration || {}
  );
}

/**
 * Get list of all supported service types
 */
export function getSupportedServices(): Array<{
  type: ServiceType;
  name: string;
  category: 'email' | 'sms';
  capabilities: {
    email: boolean;
    sms: boolean;
    contacts: boolean;
    lists: boolean;
  };
}> {
  return [
    {
      type: 'mailgun',
      name: 'Mailgun',
      category: 'email',
      capabilities: { email: true, sms: false, contacts: false, lists: false },
    },
    {
      type: 'sendgrid',
      name: 'SendGrid',
      category: 'email',
      capabilities: { email: true, sms: false, contacts: true, lists: true },
    },
    {
      type: 'mailchimp',
      name: 'Mailchimp',
      category: 'email',
      capabilities: { email: true, sms: false, contacts: true, lists: true },
    },
    {
      type: 'brevo',
      name: 'Brevo (Sendinblue)',
      category: 'email',
      capabilities: { email: true, sms: true, contacts: true, lists: true },
    },
    {
      type: 'twilio',
      name: 'Twilio',
      category: 'sms',
      capabilities: { email: false, sms: true, contacts: false, lists: false },
    },
    {
      type: 'whatsapp_business',
      name: 'WhatsApp Business',
      category: 'sms',
      capabilities: { email: false, sms: true, contacts: false, lists: false },
    },
    {
      type: 'telegram',
      name: 'Telegram',
      category: 'sms',
      capabilities: { email: false, sms: true, contacts: false, lists: false },
    },
  ];
}

/**
 * Test adapter connectivity without saving to database
 * Used during integration setup wizard
 */
export async function testIntegration(
  serviceType: ServiceType,
  credentials: IntegrationCredentials,
  config?: IntegrationConfig
): Promise<{
  success: boolean;
  healthy: boolean;
  responseTime?: number;
  error?: string;
  metadata?: any;
}> {
  try {
    const adapter = integrationFactory.create(serviceType, credentials, config);

    // Validate credentials format first
    const validation = adapter.validateCredentials();
    if (!validation.valid) {
      return {
        success: false,
        healthy: false,
        error: validation.errors.join(', '),
      };
    }

    // Test connection
    const healthCheck = await adapter.verifyConnection();

    return {
      success: healthCheck.healthy,
      healthy: healthCheck.healthy,
      responseTime: healthCheck.responseTime,
      error: healthCheck.error,
      metadata: healthCheck.metadata,
    };
  } catch (error) {
    return {
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
