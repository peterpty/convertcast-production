import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getEmailTemplate, getSMSTemplate, TemplateVariables } from '@/lib/notifications/templates';
import { sendEmail, sendSms, sendBatchEmails } from '@/lib/notifications/notificationService';
import { integrationFactory } from '@/lib/integrations/factory';
import { decrypt } from '@/lib/security/encryption';

/**
 * POST /api/cron/send-notifications
 * Cron job to send scheduled event notifications
 *
 * Security: Verify cron secret to ensure only authorized calls
 * Runs every minute via Vercel Cron or external scheduler
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔔 Starting notification delivery job...');

    // Use service role key for admin operations
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Find all notifications that are scheduled and due
    const { data: dueNotifications, error: notifError } = await supabase
      .from('event_notifications')
      .select(`
        *,
        events!event_notifications_event_id_fkey (
          *,
          users!events_user_id_fkey (
            name,
            email,
            company
          )
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_time', fiveMinutesFromNow.toISOString())
      .order('scheduled_time', { ascending: true });

    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    if (!dueNotifications || dueNotifications.length === 0) {
      console.log('✅ No notifications due at this time');
      return NextResponse.json({
        success: true,
        message: 'No notifications to send',
        processed: 0,
      });
    }

    console.log(`📬 Found ${dueNotifications.length} notifications to send`);

    const results = {
      total: dueNotifications.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each notification
    for (const notification of dueNotifications) {
      try {
        // Mark as sending
        await supabase
          .from('event_notifications')
          .update({
            status: 'sending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', notification.id);

        const event = notification.events as any;
        if (!event) {
          throw new Error('Event not found for notification');
        }

        // Check if event has selected contacts from integration
        const hasIntegrationContacts = event.preferred_integration_id && event.selected_contact_ids?.length > 0;

        let recipients: any[] = [];

        if (hasIntegrationContacts) {
          // Fetch contacts from integration_contacts table
          const { data: contacts, error: contactError } = await supabase
            .from('integration_contacts')
            .select('*')
            .in('id', event.selected_contact_ids)
            .eq('integration_id', event.preferred_integration_id);

          if (contactError || !contacts || contacts.length === 0) {
            console.warn(`⚠️ No integration contacts found for event ${event.title}`);
            await supabase
              .from('event_notifications')
              .update({
                status: 'sent',
                recipients_count: 0,
                sent_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', notification.id);
            continue;
          }

          recipients = contacts;
          console.log(`📧 Sending to ${recipients.length} integration contacts for "${event.title}"`);
        } else {
          // Get all registrations for this event (original behavior)
          const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select(`
              *,
              viewer_profiles!registrations_viewer_profile_id_fkey (
                *
              )
            `)
            .eq('event_id', notification.event_id);

          if (regError || !registrations || registrations.length === 0) {
            console.warn(`⚠️ No registrations found for event ${event.title}`);
            await supabase
              .from('event_notifications')
              .update({
                status: 'sent',
                recipients_count: 0,
                sent_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', notification.id);
            continue;
          }

          recipients = registrations;
          console.log(`📧 Sending to ${recipients.length} registered viewers for "${event.title}"`);
        }

        // Calculate time until event
        const eventDate = new Date(event.scheduled_start);
        const timeUntilMs = eventDate.getTime() - Date.now();
        const hoursUntil = Math.floor(timeUntilMs / (1000 * 60 * 60));
        const daysUntil = Math.floor(hoursUntil / 24);

        let timeUntilEvent = 'soon';
        if (daysUntil >= 7) {
          const weeksUntil = Math.floor(daysUntil / 7);
          timeUntilEvent = `in ${weeksUntil} week${weeksUntil > 1 ? 's' : ''}`;
        } else if (daysUntil >= 1) {
          timeUntilEvent = `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
        } else if (hoursUntil >= 1) {
          timeUntilEvent = `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`;
        } else {
          const minutesUntil = Math.floor(timeUntilMs / (1000 * 60));
          if (minutesUntil > 0) {
            timeUntilEvent = `in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`;
          } else {
            timeUntilEvent = 'now';
          }
        }

        const eventDateTime = eventDate.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        });

        const eventDateStr = eventDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

        const eventTimeStr = eventDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        });

        let sentCount = 0;
        let failedCount = 0;

        // Fetch integration if specified
        let integration: any = null;
        let adapter: any = null;

        if (hasIntegrationContacts && event.preferred_integration_id) {
          const { data: integrationData } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('id', event.preferred_integration_id)
            .eq('is_active', true)
            .single();

          if (integrationData) {
            integration = integrationData;

            // Decrypt credentials
            const credentials: any = {};
            if (integration.api_key_encrypted) {
              credentials.apiKey = decrypt(integration.api_key_encrypted);
            }
            if (integration.api_secret_encrypted) {
              credentials.apiSecret = decrypt(integration.api_secret_encrypted);
            }
            if (integration.oauth_token_encrypted) {
              credentials.oauthToken = decrypt(integration.oauth_token_encrypted);
            }
            if (integration.sender_email) {
              credentials.senderEmail = integration.sender_email;
            }
            if (integration.sender_phone) {
              credentials.senderPhone = integration.sender_phone;
            }

            // Create adapter
            try {
              adapter = integrationFactory.create(
                integration.service_type,
                credentials,
                integration.configuration || {}
              );
              console.log(`✅ Using integration: ${integration.service_name} (${integration.service_type})`);
            } catch (error) {
              console.error('❌ Failed to create integration adapter:', error);
              adapter = null;
            }
          }
        }

        // Send emails if enabled
        if (notification.notification_type === 'email' || notification.notification_type === 'both') {
          if (hasIntegrationContacts && adapter) {
            // Use integration adapter to send emails
            const emailList = recipients
              .filter((contact) => contact.email && contact.consent_email)
              .map((contact) => {
                const watchUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/watch/${event.id}`;
                const registrationUrl = event.registration_url || `${process.env.NEXT_PUBLIC_APP_URL}/register/${event.id}`;

                const templateVars: TemplateVariables = {
                  firstName: contact.first_name || '',
                  lastName: contact.last_name || '',
                  eventTitle: event.title,
                  eventDescription: event.description || '',
                  eventDateTime,
                  eventDate: eventDateStr,
                  eventTime: eventTimeStr,
                  timeUntilEvent,
                  streamerName: event.users?.name || 'Your Host',
                  streamerCompany: event.users?.company,
                  registrationUrl,
                  watchUrl,
                  unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${contact.email}`,
                  customMessage: (event.notification_settings as any)?.custom_message,
                };

                const emailTemplate = getEmailTemplate(notification.notification_timing, templateVars);

                return {
                  email: contact.email,
                  subject: emailTemplate.subject,
                  htmlBody: emailTemplate.html,
                  textBody: emailTemplate.text,
                };
              });

            try {
              const result = await adapter.sendEmail({
                to: emailList.map((e: any) => e.email),
                subject: emailList[0]?.subject || event.title,
                htmlBody: emailList[0]?.htmlBody || '',
                textBody: emailList[0]?.textBody,
              });

              if (result.success) {
                sentCount += result.sentCount || emailList.length;
                failedCount += result.failedCount || 0;

                // Update integration usage
                await supabase
                  .from('user_integrations')
                  .update({
                    total_sent: supabase.sql`total_sent + ${result.sentCount || emailList.length}`,
                    last_used_at: new Date().toISOString(),
                  })
                  .eq('id', integration.id);

                // Log usage
                await supabase
                  .from('integration_usage_logs')
                  .insert({
                    integration_id: integration.id,
                    operation_type: 'email',
                    recipients_count: emailList.length,
                    success_count: result.sentCount || emailList.length,
                    failed_count: result.failedCount || 0,
                    estimated_cost: result.estimatedCost || 0,
                  });
              } else {
                failedCount += emailList.length;
              }
            } catch (error) {
              console.error('❌ Failed to send via integration:', error);
              failedCount += emailList.length;
            }
          } else {
            // Use default notification service (registrations)
            const emailBatch = recipients.map((reg) => {
              const viewer = hasIntegrationContacts ? reg : reg.viewer_profiles as any;
              const watchUrl = hasIntegrationContacts
                ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/watch/${event.id}`
                : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/watch/${event.id}?token=${reg.access_token}`;
              const registrationUrl = event.registration_url || `${process.env.NEXT_PUBLIC_APP_URL}/register/${event.id}`;

              const templateVars: TemplateVariables = {
                firstName: viewer.first_name,
                lastName: viewer.last_name,
                eventTitle: event.title,
                eventDescription: event.description || '',
                eventDateTime,
                eventDate: eventDateStr,
                eventTime: eventTimeStr,
                timeUntilEvent,
                streamerName: event.users?.name || 'Your Host',
                streamerCompany: event.users?.company,
                registrationUrl,
                watchUrl,
                unsubscribeUrl: hasIntegrationContacts
                  ? `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${viewer.email}`
                  : `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${reg.access_token}`,
                customMessage: (event.notification_settings as any)?.custom_message,
              };

              const emailTemplate = getEmailTemplate(notification.notification_timing, templateVars);

              return {
                to: viewer.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text,
                tags: ['event-notification', event.id, notification.notification_timing],
                trackOpens: true,
                trackClicks: true,
              };
            });

            // Send in batches of 100
            const emailResults = await sendBatchEmails(emailBatch, 100, 1000);
            sentCount += emailResults.filter(r => r.success).length;
            failedCount += emailResults.filter(r => !r.success).length;
          }
        }

        // Send SMS if enabled
        if (notification.notification_type === 'sms' || notification.notification_type === 'both') {
          if (hasIntegrationContacts && adapter) {
            // Use integration adapter to send SMS
            const smsList = recipients
              .filter((contact) => contact.phone && contact.consent_sms)
              .map((contact) => {
                const watchUrl = `${process.env.NEXT_PUBLIC_APP_URL}/watch/${event.id}`;
                const templateVars: TemplateVariables = {
                  firstName: contact.first_name || '',
                  lastName: contact.last_name || '',
                  eventTitle: event.title,
                  eventDescription: event.description || '',
                  eventDateTime,
                  eventDate: eventDateStr,
                  eventTime: eventTimeStr,
                  timeUntilEvent,
                  streamerName: event.users?.name || 'Your Host',
                  registrationUrl: '',
                  watchUrl,
                };

                const smsText = getSMSTemplate(notification.notification_timing, templateVars);

                return {
                  phone: contact.phone,
                  message: smsText,
                };
              });

            for (const sms of smsList) {
              try {
                const result = await adapter.sendSms({
                  to: [sms.phone],
                  body: sms.message,
                });

                if (result.success) {
                  sentCount++;

                  // Update integration usage
                  await supabase
                    .from('user_integrations')
                    .update({
                      total_sent: supabase.sql`total_sent + 1`,
                      last_used_at: new Date().toISOString(),
                    })
                    .eq('id', integration.id);
                } else {
                  failedCount++;
                }
              } catch (error) {
                console.error('❌ Failed to send SMS via integration:', error);
                failedCount++;
              }

              // Rate limit: wait 100ms between SMS sends
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } else {
            // Use default notification service (registrations)
            for (const reg of recipients) {
              const viewer = hasIntegrationContacts ? reg : reg.viewer_profiles as any;
              if (!viewer.phone) continue;

              const watchUrl = hasIntegrationContacts
                ? `${process.env.NEXT_PUBLIC_APP_URL}/watch/${event.id}`
                : `${process.env.NEXT_PUBLIC_APP_URL}/watch/${event.id}?token=${reg.access_token}`;
              const templateVars: TemplateVariables = {
                firstName: viewer.first_name,
                lastName: viewer.last_name,
                eventTitle: event.title,
                eventDescription: event.description || '',
                eventDateTime,
                eventDate: eventDateStr,
                eventTime: eventTimeStr,
                timeUntilEvent,
                streamerName: event.users?.name || 'Your Host',
                registrationUrl: '',
                watchUrl,
              };

              const smsText = getSMSTemplate(notification.notification_timing, templateVars);
              const smsResult = await sendSms({
                to: viewer.phone,
                body: smsText,
              });

              if (smsResult.success) {
                sentCount++;
              } else {
                failedCount++;
              }

              // Rate limit: wait 100ms between SMS sends
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }

        // Update notification status
        await supabase
          .from('event_notifications')
          .update({
            status: failedCount > 0 && sentCount === 0 ? 'failed' : 'sent',
            recipients_count: registrations.length,
            sent_count: sentCount,
            failed_count: failedCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', notification.id);

        // Update event analytics
        await supabase
          .from('event_analytics')
          .update({
            notifications_sent: supabase.sql`notifications_sent + ${sentCount}`,
            updated_at: new Date().toISOString(),
          })
          .eq('event_id', notification.event_id);

        console.log(`✅ Notification sent: ${sentCount} succeeded, ${failedCount} failed`);
        results.sent++;
      } catch (error) {
        console.error(`❌ Error processing notification ${notification.id}:`, error);
        results.failed++;
        results.errors.push(error instanceof Error ? error.message : 'Unknown error');

        // Mark notification as failed
        await supabase
          .from('event_notifications')
          .update({
            status: 'failed',
            error_details: { error: error instanceof Error ? error.message : 'Unknown error' },
            updated_at: new Date().toISOString(),
          })
          .eq('id', notification.id);
      }
    }

    console.log(`🎉 Notification job complete: ${results.sent} sent, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Notification delivery complete',
      results,
    });
  } catch (error) {
    console.error('❌ Notification job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Notification job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/send-notifications
 * Health check and manual trigger (for testing)
 */
export async function GET(request: NextRequest) {
  // Check if this is authorized (for testing only)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

  if (authHeader === `Bearer ${cronSecret}`) {
    // Allow manual trigger for testing
    return POST(request);
  }

  return NextResponse.json({
    success: true,
    message: 'Notification cron endpoint is healthy',
    timestamp: new Date().toISOString(),
  });
}
