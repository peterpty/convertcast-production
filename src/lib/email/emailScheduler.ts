'use client';

import { emailService, EmailRecipient, ScheduledEmail } from './emailService';
import { addHours, addMinutes, subHours, isBefore, isAfter, format } from 'date-fns';

export interface NotificationSettings {
  confirmationEnabled: boolean;
  reminder24hEnabled: boolean;
  reminder1hEnabled: boolean;
  lastChanceEnabled: boolean;
  liveStartingEnabled: boolean;
  customReminderTimes?: number[]; // Hours before event
}

export interface EventAttendee {
  id: string;
  email: string;
  name: string;
  registeredAt: Date;
  eventId: string;
  showUpProbability?: number; // From ShowUp Surge AI
  engagementScore?: number; // From EngageMax
  preferredNotificationTimes?: string[]; // ['morning', 'afternoon', 'evening']
}

export interface EventNotificationJob {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  attendees: EventAttendee[];
  settings: NotificationSettings;
  scheduledEmails: ScheduledEmail[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

/**
 * Email Scheduler - Manages automated email notifications
 * Integrates with ShowUp Surge AI for intelligent timing
 */
export class EmailScheduler {
  private jobs: Map<string, EventNotificationJob> = new Map();
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Start the scheduler
    this.start();
  }

  /**
   * Create notification job for an event
   */
  createNotificationJob(
    eventId: string,
    eventTitle: string,
    eventDate: Date,
    attendees: EventAttendee[],
    settings: NotificationSettings = this.getDefaultSettings()
  ): EventNotificationJob {
    const job: EventNotificationJob = {
      id: `job_${eventId}_${Date.now()}`,
      eventId,
      eventTitle,
      eventDate,
      attendees,
      settings,
      scheduledEmails: [],
      status: 'active',
      createdAt: new Date()
    };

    // Generate scheduled emails
    job.scheduledEmails = this.generateScheduledEmails(job);

    this.jobs.set(job.id, job);
    console.log(`📅 Created notification job for event: ${eventTitle} (${attendees.length} attendees)`);

    return job;
  }

  /**
   * Generate scheduled emails based on event and settings
   */
  private generateScheduledEmails(job: EventNotificationJob): ScheduledEmail[] {
    const scheduledEmails: ScheduledEmail[] = [];
    const { eventDate, eventId, eventTitle, attendees, settings } = job;

    attendees.forEach(attendee => {
      const recipient: EmailRecipient = {
        email: attendee.email,
        name: attendee.name,
        variables: {
          attendeeName: attendee.name,
          eventTitle: eventTitle,
          eventDate: format(eventDate, 'EEEE, MMMM do, yyyy'),
          eventTime: format(eventDate, 'h:mm a'),
          joinUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/watch/${eventId}`,
          calendarUrl: this.generateCalendarUrl(eventTitle, eventDate, eventId)
        }
      };

      // Confirmation email (send immediately after registration)
      if (settings.confirmationEnabled) {
        scheduledEmails.push({
          id: `confirmation_${attendee.id}_${Date.now()}`,
          templateId: 'event-confirmation',
          recipients: [recipient],
          scheduledAt: new Date(), // Send immediately
          eventId,
          type: 'confirmation',
          status: 'pending'
        });
      }

      // 24-hour reminder
      if (settings.reminder24hEnabled) {
        const reminder24h = subHours(eventDate, 24);
        if (isAfter(reminder24h, new Date())) {
          scheduledEmails.push({
            id: `reminder24h_${attendee.id}_${Date.now()}`,
            templateId: 'reminder-24h',
            recipients: [recipient],
            scheduledAt: this.optimizeReminderTime(reminder24h, attendee),
            eventId,
            type: 'reminder-24h',
            status: 'pending'
          });
        }
      }

      // 1-hour reminder
      if (settings.reminder1hEnabled) {
        const reminder1h = subHours(eventDate, 1);
        if (isAfter(reminder1h, new Date())) {
          scheduledEmails.push({
            id: `reminder1h_${attendee.id}_${Date.now()}`,
            templateId: 'reminder-1h',
            recipients: [recipient],
            scheduledAt: reminder1h,
            eventId,
            type: 'reminder-1h',
            status: 'pending'
          });
        }
      }

      // Live starting notification
      if (settings.liveStartingEnabled) {
        scheduledEmails.push({
          id: `livestarting_${attendee.id}_${Date.now()}`,
          templateId: 'live-starting',
          recipients: [recipient],
          scheduledAt: eventDate,
          eventId,
          type: 'live-starting',
          status: 'pending'
        });
      }

      // Custom reminder times
      if (settings.customReminderTimes) {
        settings.customReminderTimes.forEach((hours, index) => {
          const customReminder = subHours(eventDate, hours);
          if (isAfter(customReminder, new Date())) {
            scheduledEmails.push({
              id: `custom${index}_${attendee.id}_${Date.now()}`,
              templateId: 'reminder-24h', // Use 24h template for custom reminders
              recipients: [{ ...recipient, variables: { ...recipient.variables, timeUntilEvent: `${hours} hours` } }],
              scheduledAt: this.optimizeReminderTime(customReminder, attendee),
              eventId,
              type: 'reminder-24h',
              status: 'pending'
            });
          }
        });
      }
    });

    return scheduledEmails;
  }

  /**
   * Optimize reminder time based on ShowUp Surge AI insights
   */
  private optimizeReminderTime(originalTime: Date, attendee: EventAttendee): Date {
    // If attendee has low show-up probability, send reminders earlier
    if (attendee.showUpProbability && attendee.showUpProbability < 0.6) {
      return subHours(originalTime, 2); // Send 2 hours earlier for low-probability attendees
    }

    // Optimize based on preferred notification times
    if (attendee.preferredNotificationTimes?.length) {
      const hour = originalTime.getHours();

      // Adjust to preferred times
      if (attendee.preferredNotificationTimes.includes('morning') && hour > 12) {
        const morningTime = new Date(originalTime);
        morningTime.setHours(9, 0, 0, 0); // 9 AM
        if (isAfter(morningTime, new Date())) {
          return morningTime;
        }
      }

      if (attendee.preferredNotificationTimes.includes('evening') && hour < 17) {
        const eveningTime = new Date(originalTime);
        eveningTime.setHours(18, 0, 0, 0); // 6 PM
        if (isAfter(eveningTime, new Date())) {
          return eveningTime;
        }
      }
    }

    return originalTime;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    // Check every 60 seconds for due emails
    this.intervalId = setInterval(() => {
      this.processDueEmails();
    }, 60000);

    console.log('📧 Email scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('📧 Email scheduler stopped');
  }

  /**
   * Process due emails
   */
  private async processDueEmails(): Promise<void> {
    const now = new Date();

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status !== 'active') continue;

      const dueEmails = job.scheduledEmails.filter(
        email => email.status === 'pending' && isBefore(email.scheduledAt, now)
      );

      for (const email of dueEmails) {
        try {
          // Send email to all recipients
          const results = await emailService.sendBulkEmails(
            email.templateId,
            email.recipients
          );

          const successCount = results.filter(r => r.success).length;
          const failureCount = results.filter(r => !r.success).length;

          if (successCount > 0) {
            email.status = 'sent';
            email.sentAt = new Date();
            console.log(`📧 Sent ${email.type} emails: ${successCount} success, ${failureCount} failed`);
          } else {
            email.status = 'failed';
            email.error = 'All email sends failed';
            console.error(`❌ Failed to send ${email.type} emails for event ${job.eventTitle}`);
          }
        } catch (error) {
          email.status = 'failed';
          email.error = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Error sending ${email.type} emails:`, error);
        }
      }

      // Check if job is complete
      const allEmailsProcessed = job.scheduledEmails.every(
        email => email.status === 'sent' || email.status === 'failed' || email.status === 'cancelled'
      );

      const eventPassed = isBefore(job.eventDate, now);

      if (allEmailsProcessed && eventPassed) {
        job.status = 'completed';
        console.log(`✅ Completed notification job for event: ${job.eventTitle}`);
      }
    }

    // Clean up old completed jobs (keep for 7 days)
    const weekAgo = subHours(now, 7 * 24);
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' && isBefore(job.createdAt, weekAgo)) {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Add attendee to existing job
   */
  addAttendeeToJob(jobId: string, attendee: EventAttendee): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'active') return false;

    // Add attendee
    job.attendees.push(attendee);

    // Generate new scheduled emails for this attendee
    const newScheduledEmails = this.generateScheduledEmails({
      ...job,
      attendees: [attendee] // Only generate for new attendee
    });

    job.scheduledEmails.push(...newScheduledEmails);

    console.log(`➕ Added attendee ${attendee.name} to job ${jobId}`);
    return true;
  }

  /**
   * Cancel notification job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.status = 'cancelled';
    job.scheduledEmails.forEach(email => {
      if (email.status === 'pending') {
        email.status = 'cancelled';
      }
    });

    console.log(`🚫 Cancelled notification job: ${job.eventTitle}`);
    return true;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): EventNotificationJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): EventNotificationJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs for specific event
   */
  getJobsForEvent(eventId: string): EventNotificationJob[] {
    return Array.from(this.jobs.values()).filter(job => job.eventId === eventId);
  }

  /**
   * Get email statistics for a job
   */
  getJobStats(jobId: string): {
    totalEmails: number;
    sent: number;
    pending: number;
    failed: number;
    cancelled: number;
  } | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const stats = {
      totalEmails: job.scheduledEmails.length,
      sent: 0,
      pending: 0,
      failed: 0,
      cancelled: 0
    };

    job.scheduledEmails.forEach(email => {
      stats[email.status]++;
    });

    return stats;
  }

  /**
   * Generate calendar URL for event
   */
  private generateCalendarUrl(title: string, date: Date, eventId: string): string {
    const startDate = format(date, "yyyyMMdd'T'HHmmss");
    const endDate = format(addHours(date, 2), "yyyyMMdd'T'HHmmss"); // Assume 2-hour duration
    const details = `Join the live event: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/watch/${eventId}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}`;
  }

  /**
   * Get default notification settings
   */
  private getDefaultSettings(): NotificationSettings {
    return {
      confirmationEnabled: true,
      reminder24hEnabled: true,
      reminder1hEnabled: true,
      lastChanceEnabled: false,
      liveStartingEnabled: true,
      customReminderTimes: []
    };
  }
}

// Export singleton instance
export const emailScheduler = new EmailScheduler();