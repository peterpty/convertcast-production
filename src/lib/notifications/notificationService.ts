/**
 * Notification Service
 * Handles sending email and SMS notifications using Mailgun and Twilio
 */

import formData from 'form-data';
import Mailgun from 'mailgun.js';
import twilio from 'twilio';

// Initialize services
const mailgun = new Mailgun(formData);
const mg = process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN
  ? mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    })
  : null;

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface SmsParams {
  to: string;
  from?: string;
  body: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  service: 'email' | 'sms';
}

/**
 * Send email notification via Mailgun
 */
export async function sendEmail(params: EmailParams): Promise<NotificationResult> {
  try {
    if (!mg || !process.env.MAILGUN_DOMAIN) {
      console.warn('📧 Mailgun not configured, skipping email');
      return {
        success: false,
        error: 'Mailgun not configured',
        service: 'email',
      };
    }

    const from = params.from || `ConvertCast <noreply@${process.env.MAILGUN_DOMAIN}>`;

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || stripHtml(params.html),
      'o:tracking': params.trackOpens ? 'yes' : 'no',
      'o:tracking-clicks': params.trackClicks ? 'yes' : 'no',
      'o:tag': params.tags || ['event-notification'],
    });

    console.log('✅ Email sent:', result.id);

    return {
      success: true,
      messageId: result.id,
      service: 'email',
    };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'email',
    };
  }
}

/**
 * Send SMS notification via Twilio
 */
export async function sendSms(params: SmsParams): Promise<NotificationResult> {
  try {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn('📱 Twilio not configured, skipping SMS');
      return {
        success: false,
        error: 'Twilio not configured',
        service: 'sms',
      };
    }

    const from = params.from || process.env.TWILIO_PHONE_NUMBER;

    const message = await twilioClient.messages.create({
      from,
      to: params.to,
      body: params.body,
    });

    console.log('✅ SMS sent:', message.sid);

    return {
      success: true,
      messageId: message.sid,
      service: 'sms',
    };
  } catch (error) {
    console.error('❌ SMS send failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'sms',
    };
  }
}

/**
 * Send batch emails with rate limiting
 */
export async function sendBatchEmails(
  emails: EmailParams[],
  batchSize: number = 100,
  delayMs: number = 1000
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    console.log(`📧 Sending email batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)}`);

    const batchResults = await Promise.all(
      batch.map(email => sendEmail(email))
    );

    results.push(...batchResults);

    // Rate limiting delay between batches
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Send batch SMS with rate limiting
 */
export async function sendBatchSms(
  messages: SmsParams[],
  batchSize: number = 50,
  delayMs: number = 1000
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    console.log(`📱 Sending SMS batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(messages.length / batchSize)}`);

    const batchResults = await Promise.all(
      batch.map(sms => sendSms(sms))
    );

    results.push(...batchResults);

    // Rate limiting delay between batches
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Template variable replacement
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, value);
  });

  return rendered;
}

/**
 * Generate event notification email HTML
 */
export function generateEventEmailHtml(params: {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  timeUntil: string;
  streamUrl: string;
  streamerName: string;
  firstName?: string;
  customMessage?: string;
  logoUrl?: string;
}): string {
  const greeting = params.firstName ? `Hi ${params.firstName},` : 'Hi there,';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #9f6aff 0%, #7128f0 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .content {
      background: #f8f9fa;
      padding: 30px 20px;
    }
    .event-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .event-title {
      font-size: 24px;
      font-weight: bold;
      color: #7128f0;
      margin-bottom: 16px;
    }
    .event-details {
      font-size: 16px;
      margin: 12px 0;
    }
    .event-details strong {
      color: #666;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #9f6aff 0%, #7128f0 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🎬 ConvertCast</div>
    <p>Your live stream is starting ${params.timeUntil}!</p>
  </div>

  <div class="content">
    <p>${greeting}</p>

    ${params.customMessage ? `<p>${params.customMessage}</p>` : ''}

    <div class="event-card">
      <div class="event-title">${params.eventTitle}</div>

      <div class="event-details">
        <strong>📅 Date:</strong> ${params.eventDate}
      </div>

      <div class="event-details">
        <strong>⏰ Time:</strong> ${params.eventTime}
      </div>

      <div class="event-details">
        <strong>🎤 Host:</strong> ${params.streamerName}
      </div>

      <div class="event-details">
        <strong>⏳ Starting:</strong> ${params.timeUntil}
      </div>

      <center>
        <a href="${params.streamUrl}" class="cta-button">
          Join Live Stream →
        </a>
      </center>
    </div>

    <p>
      Can't wait to see you there! Click the button above to join when it's time, or use this link:<br>
      <a href="${params.streamUrl}">${params.streamUrl}</a>
    </p>
  </div>

  <div class="footer">
    <p>
      Powered by <strong>ConvertCast</strong><br>
      <small>You're receiving this because you registered for this event.</small>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate event notification SMS message
 */
export function generateEventSms(params: {
  eventTitle: string;
  timeUntil: string;
  streamUrl: string;
}): string {
  return `🎬 "${params.eventTitle}" starts ${params.timeUntil}! Join live: ${params.streamUrl}`;
}

/**
 * Generate NOW LIVE email HTML (when event starts)
 */
export function generateNowLiveEmailHtml(params: {
  eventTitle: string;
  streamUrl: string;
  streamerName: string;
  firstName?: string;
  customMessage?: string;
  logoUrl?: string;
}): string {
  const greeting = params.firstName ? `Hi ${params.firstName},` : 'Hi there,';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .live-badge {
      display: inline-block;
      background: white;
      color: #ef4444;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 18px;
      margin-top: 10px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    .content {
      background: #f8f9fa;
      padding: 30px 20px;
    }
    .event-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #ef4444;
    }
    .event-title {
      font-size: 24px;
      font-weight: bold;
      color: #ef4444;
      margin-bottom: 16px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 18px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 18px;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
    .urgency-message {
      background: #fef2f2;
      border: 2px solid #ef4444;
      color: #991b1b;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: 600;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🎬 ConvertCast</div>
    <div class="live-badge">🔴 LIVE NOW</div>
    <p style="font-size: 20px; margin-top: 16px;">Your event is starting right now!</p>
  </div>

  <div class="content">
    <p>${greeting}</p>

    <div class="urgency-message">
      ⚡ The live stream has started! Join now to catch everything from the beginning.
    </div>

    ${params.customMessage ? `<p>${params.customMessage}</p>` : ''}

    <div class="event-card">
      <div class="event-title">${params.eventTitle}</div>

      <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
        <strong>🎤 Host:</strong> ${params.streamerName}
      </p>

      <center>
        <a href="${params.streamUrl}" class="cta-button">
          🔴 JOIN LIVE STREAM NOW →
        </a>
      </center>
    </div>

    <p>
      Don't miss out! The event is live right now. Click the button above to join instantly:<br>
      <a href="${params.streamUrl}" style="color: #ef4444; font-weight: 600;">${params.streamUrl}</a>
    </p>
  </div>

  <div class="footer">
    <p>
      Powered by <strong>ConvertCast</strong><br>
      <small>You're receiving this because you registered for this event.</small>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate NOW LIVE SMS message (when event starts)
 */
export function generateNowLiveSms(params: {
  eventTitle: string;
  streamUrl: string;
}): string {
  return `🔴 LIVE NOW: "${params.eventTitle}" is starting! Join immediately: ${params.streamUrl}`;
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s\s+/g, ' ')
    .trim();
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic check)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if it's a valid length (10-15 digits)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Format phone number for Twilio (E.164 format)
 */
export function formatPhoneNumber(phone: string, defaultCountryCode: string = '+1'): string {
  let cleaned = phone.replace(/\D/g, '');

  // Add country code if not present
  if (!phone.startsWith('+')) {
    // If starts with country code digits, add +
    if (cleaned.length > 10) {
      cleaned = '+' + cleaned;
    } else {
      // Add default country code
      cleaned = defaultCountryCode + cleaned;
    }
  }

  return cleaned;
}

/**
 * Check if services are configured
 */
export function areServicesConfigured(): {
  email: boolean;
  sms: boolean;
} {
  return {
    email: !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
    sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
  };
}
