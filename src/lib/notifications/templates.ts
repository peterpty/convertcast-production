/**
 * Email and SMS Templates for Event Notifications
 * Branded, personalized templates with tracking
 */

export interface TemplateVariables {
  firstName: string;
  lastName?: string;
  eventTitle: string;
  eventDescription?: string;
  eventDateTime: string;
  eventDate: string;
  eventTime: string;
  timeUntilEvent: string;
  streamerName: string;
  streamerCompany?: string;
  registrationUrl: string;
  watchUrl: string;
  unsubscribeUrl?: string;
  customMessage?: string;
}

/**
 * Replace template variables in a string
 */
function replaceVariables(template: string, variables: TemplateVariables): string {
  return template
    .replace(/\{firstName\}/g, variables.firstName)
    .replace(/\{lastName\}/g, variables.lastName || '')
    .replace(/\{eventTitle\}/g, variables.eventTitle)
    .replace(/\{eventDescription\}/g, variables.eventDescription || '')
    .replace(/\{eventDateTime\}/g, variables.eventDateTime)
    .replace(/\{eventDate\}/g, variables.eventDate)
    .replace(/\{eventTime\}/g, variables.eventTime)
    .replace(/\{timeUntilEvent\}/g, variables.timeUntilEvent)
    .replace(/\{streamerName\}/g, variables.streamerName)
    .replace(/\{streamerCompany\}/g, variables.streamerCompany || variables.streamerName)
    .replace(/\{registrationUrl\}/g, variables.registrationUrl)
    .replace(/\{watchUrl\}/g, variables.watchUrl)
    .replace(/\{unsubscribeUrl\}/g, variables.unsubscribeUrl || '#')
    .replace(/\{customMessage\}/g, variables.customMessage || '');
}

/**
 * Email: Event Confirmation (Right after registration)
 */
export function getConfirmationEmail(variables: TemplateVariables): { subject: string; html: string; text: string } {
  const subject = `You're registered for ${variables.eventTitle}!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✅ You're Registered!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi {firstName},
              </p>

              <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Great news! You're all set for <strong style="color: #60a5fa;">{eventTitle}</strong> hosted by {streamerName}.
              </p>

              <!-- Event Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f172a; border-radius: 8px; margin: 30px 0; border: 1px solid #334155;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 15px; color: #94a3b8; font-size: 14px; text-transform: uppercase; font-weight: bold;">Event Details</p>
                    <h2 style="margin: 0 0 10px; color: #ffffff; font-size: 22px;">{eventTitle}</h2>
                    <p style="margin: 0 0 15px; color: #cbd5e1; font-size: 16px;">{eventDescription}</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">📅 Date:</td>
                        <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; font-weight: bold;">{eventDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">🕐 Time:</td>
                        <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; font-weight: bold;">{eventTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">👤 Host:</td>
                        <td style="padding: 8px 0; color: #e2e8f0; font-size: 14px; font-weight: bold;">{streamerName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{watchUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      📺 Add to Calendar & Get Reminder
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                We'll send you reminders as the event approaches. See you there!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0f172a; border-top: 1px solid #334155;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px; text-align: center;">
                Powered by <strong style="color: #60a5fa;">ConvertCast</strong> - The AI-Powered Streaming Platform
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                <a href="{unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
You're registered for ${variables.eventTitle}!

Hi ${variables.firstName},

Great news! You're all set for ${variables.eventTitle} hosted by ${variables.streamerName}.

EVENT DETAILS:
📅 Date: ${variables.eventDate}
🕐 Time: ${variables.eventTime}
👤 Host: ${variables.streamerName}

${variables.eventDescription}

Watch here: ${variables.watchUrl}

We'll send you reminders as the event approaches. See you there!

---
Powered by ConvertCast
Unsubscribe: ${variables.unsubscribeUrl || 'Reply STOP'}
  `.trim();

  return { subject, html: replaceVariables(html, variables), text: replaceVariables(text, variables) };
}

/**
 * Email: Event Reminder (2 weeks, 1 week, 3 days, 1 day before)
 */
export function getReminderEmail(variables: TemplateVariables, timing: string): { subject: string; html: string; text: string } {
  const subject = `Reminder: ${variables.eventTitle} starts ${variables.timeUntilEvent}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">⏰ Event Starting Soon!</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 18px; opacity: 0.9;">{timeUntilEvent}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi {firstName},
              </p>

              <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Just a friendly reminder that <strong style="color: #fbbf24;">{eventTitle}</strong> is starting {timeUntilEvent}!
              </p>

              ${variables.customMessage ? `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f172a; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #cbd5e1; font-size: 15px; line-height: 1.6; font-style: italic;">
                      "{customMessage}"
                    </p>
                    <p style="margin: 10px 0 0; color: #94a3b8; font-size: 14px;">
                      — {streamerName}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Event Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f172a; border-radius: 8px; margin: 25px 0; border: 1px solid #334155;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="margin: 0 0 15px; color: #ffffff; font-size: 20px;">{eventTitle}</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">📅 {eventDateTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #94a3b8; font-size: 14px;">👤 Hosted by {streamerName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{watchUrl}" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.5);">
                      🎥 Join Event
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #94a3b8; font-size: 14px; text-align: center; line-height: 1.6;">
                Click the button above when it's time to watch.<br>We'll see you there!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0f172a; border-top: 1px solid #334155;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px; text-align: center;">
                Powered by <strong style="color: #60a5fa;">ConvertCast</strong>
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                <a href="{unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
⏰ Event Starting ${variables.timeUntilEvent}!

Hi ${variables.firstName},

Just a friendly reminder that ${variables.eventTitle} is starting ${variables.timeUntilEvent}!

${variables.customMessage ? `"${variables.customMessage}" — ${variables.streamerName}\n` : ''}

EVENT DETAILS:
📅 ${variables.eventDateTime}
👤 Hosted by ${variables.streamerName}

Watch here: ${variables.watchUrl}

See you there!

---
Powered by ConvertCast
Unsubscribe: ${variables.unsubscribeUrl || 'Reply STOP'}
  `.trim();

  return { subject, html: replaceVariables(html, variables), text: replaceVariables(text, variables) };
}

/**
 * Email: Event Starting Now
 */
export function getStartingNowEmail(variables: TemplateVariables): { subject: string; html: string; text: string } {
  const subject = `🔴 LIVE NOW: ${variables.eventTitle}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 50px 30px; text-align: center;">
              <div style="width: 20px; height: 20px; background-color: #ffffff; border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite; margin-bottom: 15px;"></div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; text-transform: uppercase;">🔴 LIVE NOW</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 18px;">{eventTitle}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="margin: 0 0 30px; color: #e2e8f0; font-size: 18px; line-height: 1.6;">
                Hi {firstName}, we're live! 🎉
              </p>

              <p style="margin: 0 0 30px; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                <strong style="color: #f87171;">{eventTitle}</strong> is happening right now!<br>
                Don't miss out—join {streamerName} live.
              </p>

              <!-- Urgent CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 40px 0;">
                <tr>
                  <td align="center">
                    <a href="{watchUrl}" style="display: inline-block; padding: 25px 60px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 22px; font-weight: bold; box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6); text-transform: uppercase;">
                      🎥 WATCH LIVE NOW
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                The stream is live and waiting for you!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0f172a; border-top: 1px solid #334155;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                Powered by <strong style="color: #60a5fa;">ConvertCast</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
🔴 LIVE NOW: ${variables.eventTitle}

Hi ${variables.firstName}, we're live! 🎉

${variables.eventTitle} is happening right now!
Don't miss out—join ${variables.streamerName} live.

WATCH LIVE NOW: ${variables.watchUrl}

The stream is live and waiting for you!

---
Powered by ConvertCast
  `.trim();

  return { subject, html: replaceVariables(html, variables), text: replaceVariables(text, variables) };
}

/**
 * SMS Templates (160 characters max recommended)
 */
export function getConfirmationSMS(variables: TemplateVariables): string {
  const template = `You're registered for {eventTitle}! {eventDateTime}. Watch: {watchUrl} - {streamerName}`;
  return replaceVariables(template, variables);
}

export function getReminderSMS(variables: TemplateVariables): string {
  const template = `⏰ {eventTitle} starts {timeUntilEvent}! Join: {watchUrl}`;
  return replaceVariables(template, variables);
}

export function getStartingNowSMS(variables: TemplateVariables): string {
  const template = `🔴 LIVE NOW: {eventTitle}! Watch: {watchUrl}`;
  return replaceVariables(template, variables);
}

/**
 * Get template by timing
 */
export function getEmailTemplate(timing: string, variables: TemplateVariables): { subject: string; html: string; text: string } {
  switch (timing) {
    case 'immediate':
    case 'now':
      return getConfirmationEmail(variables);

    case 'at_event_start':
      return getStartingNowEmail(variables);

    case '15_minutes_before':
    case '1_hour_before':
    case '12_hours_before':
    case '1_day_before':
    case '3_days_before':
    case '1_week_before':
    case '2_weeks_before':
      return getReminderEmail(variables, timing);

    default:
      return getReminderEmail(variables, timing);
  }
}

export function getSMSTemplate(timing: string, variables: TemplateVariables): string {
  switch (timing) {
    case 'immediate':
    case 'now':
      return getConfirmationSMS(variables);

    case 'at_event_start':
      return getStartingNowSMS(variables);

    default:
      return getReminderSMS(variables);
  }
}
