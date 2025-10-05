/**
 * Base Integration Adapter
 * Defines the interface that all service integrations must implement
 */

export type ServiceType =
  | 'mailchimp'
  | 'mailgun'
  | 'sendgrid'
  | 'brevo'
  | 'custom_smtp'
  | 'twilio'
  | 'whatsapp_business'
  | 'telegram';

export type IntegrationCapabilities = {
  email: boolean;
  sms: boolean;
  contacts: boolean; // Can sync contacts
  lists: boolean; // Supports contact lists
  templates: boolean; // Supports message templates
  analytics: boolean; // Provides delivery analytics
};

export type IntegrationStatus = 'pending' | 'verified' | 'failed' | 'disabled';

export interface IntegrationCredentials {
  apiKey?: string;
  apiSecret?: string;
  oauthToken?: string;
  senderEmail?: string;
  senderPhone?: string;
  [key: string]: string | undefined;
}

export interface IntegrationConfig {
  apiUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  [key: string]: any;
}

export interface ContactData {
  id?: string; // External ID from service
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  lists?: Array<{ id: string; name: string }>;
  customFields?: Record<string, any>;
  consent?: {
    email: boolean;
    sms: boolean;
    date?: Date;
    ip?: string;
  };
}

export interface SendEmailParams {
  to: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SendSmsParams {
  to: string[];
  message: string;
  from?: string;
  mediaUrls?: string[]; // For MMS
  metadata?: Record<string, any>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  sentCount: number;
  failedCount: number;
  errors?: Array<{ recipient: string; error: string }>;
  estimatedCost?: number; // In USD
  metadata?: Record<string, any>;
}

export interface ContactSyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  contacts: ContactData[];
  errors?: string[];
}

export interface IntegrationHealthCheck {
  healthy: boolean;
  responseTime?: number; // In milliseconds
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Abstract base class for all integration adapters
 * Each service (Mailgun, Twilio, etc.) extends this class
 */
export abstract class BaseIntegrationAdapter {
  protected credentials: IntegrationCredentials;
  protected config: IntegrationConfig;
  protected serviceType: ServiceType;

  constructor(
    serviceType: ServiceType,
    credentials: IntegrationCredentials,
    config?: IntegrationConfig
  ) {
    this.serviceType = serviceType;
    this.credentials = credentials;
    this.config = config || {};
  }

  /**
   * Get the service type
   */
  getServiceType(): ServiceType {
    return this.serviceType;
  }

  /**
   * Get the capabilities of this integration
   */
  abstract getCapabilities(): IntegrationCapabilities;

  /**
   * Verify the integration credentials
   * @returns Health check result with verification status
   */
  abstract verifyConnection(): Promise<IntegrationHealthCheck>;

  /**
   * Send an email notification
   * @param params - Email parameters
   * @returns Result with success status and metadata
   */
  async sendEmail(params: SendEmailParams): Promise<SendResult> {
    throw new Error(`Email sending not supported by ${this.serviceType}`);
  }

  /**
   * Send an SMS notification
   * @param params - SMS parameters
   * @returns Result with success status and metadata
   */
  async sendSms(params: SendSmsParams): Promise<SendResult> {
    throw new Error(`SMS sending not supported by ${this.serviceType}`);
  }

  /**
   * Sync contacts from the external service
   * @param listIds - Optional list IDs to sync from
   * @returns Array of contacts with metadata
   */
  async syncContacts(listIds?: string[]): Promise<ContactSyncResult> {
    throw new Error(`Contact sync not supported by ${this.serviceType}`);
  }

  /**
   * Get available contact lists
   * @returns Array of lists with IDs and names
   */
  async getLists(): Promise<Array<{ id: string; name: string; memberCount?: number }>> {
    throw new Error(`List retrieval not supported by ${this.serviceType}`);
  }

  /**
   * Estimate cost for sending to N recipients
   * @param recipientCount - Number of recipients
   * @param type - 'email' or 'sms'
   * @returns Estimated cost in USD
   */
  abstract estimateCost(recipientCount: number, type: 'email' | 'sms'): number;

  /**
   * Get service-specific configuration requirements
   * Used for UI to show what fields are needed
   */
  abstract getConfigFields(): Array<{
    name: string;
    label: string;
    type: 'text' | 'password' | 'email' | 'select';
    required: boolean;
    placeholder?: string;
    helpText?: string;
    options?: Array<{ value: string; label: string }>;
  }>;

  /**
   * Validate credentials format before attempting connection
   * @returns Validation result with errors if any
   */
  validateCredentials(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Override in subclass for service-specific validation
    if (!this.credentials.apiKey && !this.credentials.oauthToken) {
      errors.push('API key or OAuth token is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get rate limits for the service
   * Used for throttling and displaying limits to users
   */
  getRateLimits(): {
    emailsPerHour?: number;
    emailsPerDay?: number;
    smsPerSecond?: number;
    smsPerDay?: number;
  } {
    return {}; // Override in subclass
  }

  /**
   * Parse service-specific error responses
   * @param error - Raw error from service
   * @returns User-friendly error message
   */
  protected parseError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'Unknown error occurred';
  }

  /**
   * Log integration activity
   * Override to implement custom logging
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, metadata?: any): void {
    const prefix = `[${this.serviceType.toUpperCase()}]`;
    switch (level) {
      case 'info':
        console.log(prefix, message, metadata || '');
        break;
      case 'warn':
        console.warn(prefix, message, metadata || '');
        break;
      case 'error':
        console.error(prefix, message, metadata || '');
        break;
    }
  }
}

/**
 * Integration adapter factory
 * Creates the appropriate adapter based on service type
 */
export interface IntegrationAdapterFactory {
  create(
    serviceType: ServiceType,
    credentials: IntegrationCredentials,
    config?: IntegrationConfig
  ): BaseIntegrationAdapter;
}

/**
 * Helper to check if a service supports a specific capability
 */
export function serviceSupports(
  serviceType: ServiceType,
  capability: keyof IntegrationCapabilities
): boolean {
  // Quick lookup without instantiating adapter
  const capabilities: Record<ServiceType, IntegrationCapabilities> = {
    mailchimp: { email: true, sms: false, contacts: true, lists: true, templates: true, analytics: true },
    mailgun: { email: true, sms: false, contacts: false, lists: false, templates: true, analytics: true },
    sendgrid: { email: true, sms: false, contacts: true, lists: true, templates: true, analytics: true },
    brevo: { email: true, sms: true, contacts: true, lists: true, templates: true, analytics: true },
    custom_smtp: { email: true, sms: false, contacts: false, lists: false, templates: false, analytics: false },
    twilio: { email: false, sms: true, contacts: false, lists: false, templates: false, analytics: true },
    whatsapp_business: { email: false, sms: true, contacts: false, lists: false, templates: true, analytics: true },
    telegram: { email: false, sms: true, contacts: false, lists: false, templates: false, analytics: true },
  };

  return capabilities[serviceType]?.[capability] || false;
}

/**
 * Get display name for service type
 */
export function getServiceDisplayName(serviceType: ServiceType): string {
  const names: Record<ServiceType, string> = {
    mailchimp: 'Mailchimp',
    mailgun: 'Mailgun',
    sendgrid: 'SendGrid',
    brevo: 'Brevo (Sendinblue)',
    custom_smtp: 'Custom SMTP',
    twilio: 'Twilio',
    whatsapp_business: 'WhatsApp Business',
    telegram: 'Telegram',
  };

  return names[serviceType] || serviceType;
}

/**
 * Get documentation URL for service
 */
export function getServiceDocsUrl(serviceType: ServiceType): string {
  const urls: Record<ServiceType, string> = {
    mailchimp: 'https://mailchimp.com/developer/marketing/api/',
    mailgun: 'https://documentation.mailgun.com/en/latest/api-intro.html',
    sendgrid: 'https://docs.sendgrid.com/api-reference',
    brevo: 'https://developers.brevo.com/',
    custom_smtp: 'https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol',
    twilio: 'https://www.twilio.com/docs/sms',
    whatsapp_business: 'https://developers.facebook.com/docs/whatsapp',
    telegram: 'https://core.telegram.org/bots/api',
  };

  return urls[serviceType] || '#';
}
