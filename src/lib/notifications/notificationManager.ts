'use client';

import { ViewerProfile } from '../ai/scoringEngine';
import {
  ShowUpSurgeEngine,
  showUpSurgeEngine,
  ShowUpSurgeProfile,
  NotificationSchedule,
  NotificationChannel,
  NotificationStatus
} from './showUpSurgeEngine';
import { EmailTemplate, EmailTemplateEngine, emailTemplateEngine, EventDetails } from './emailTemplates';
import { DeliveryEngine, deliveryEngine, DeliveryResult } from './deliveryEngine';
import { AbandonedCartRecovery, abandonedCartRecovery } from './abandonedCartRecovery';
// TODO: Re-enable node-cron when notifications are ready for production
// import * as cron from 'node-cron';
import { addMinutes, addHours, addDays, isBefore, isAfter } from 'date-fns';

export interface NotificationEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  duration: string;
  presenters: string[];
  topics: string[];
  registrationUrl: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  registrations: EventRegistration[];
}

export interface EventRegistration {
  id: string;
  eventId: string;
  viewer: ViewerProfile;
  registeredAt: Date;
  status: 'registered' | 'confirmed' | 'attended' | 'no-show' | 'cancelled';
  source: string;
  customFields: Record<string, any>;
}

export interface CampaignMetrics {
  eventId: string;
  totalRegistrations: number;
  totalAttendance: number;
  attendanceRate: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  smsSent: number;
  smsClicked: number;
  pushSent: number;
  pushOpened: number;
  channelEffectiveness: Record<NotificationChannel, {
    sent: number;
    opened: number;
    clicked: number;
    attended: number;
    conversionRate: number;
  }>;
  timelinePerformance: {
    hour: number;
    sent: number;
    attended: number;
    rate: number;
  }[];
}

/**
 * ShowUp Surge™ Notification Manager
 * Central orchestrator for all notification campaigns and scheduling
 */
export class NotificationManager {
  private events: Map<string, NotificationEvent> = new Map();
  private registrations: Map<string, EventRegistration> = new Map();
  // TODO: Re-enable cron.ScheduledTask when notifications are ready
  private scheduledJobs: Map<string, any> = new Map();
  private campaignMetrics: Map<string, CampaignMetrics> = new Map();
  private isActive: boolean = false;

  constructor() {
    this.startScheduler();
  }

  /**
   * Start the notification scheduler
   */
  private startScheduler(): void {
    this.isActive = true;

    // TODO: Re-enable cron scheduler when notifications are ready
    // const task = cron.schedule('* * * * *', () => {
    //   this.processScheduledNotifications();
    // }, {
    //   scheduled: false
    // });
    // task.start();
    console.log('🚀 ShowUp Surge notification scheduler started');
  }

  /**
   * Create a new event with ShowUp Surge optimization
   */
  createEvent(eventData: Omit<NotificationEvent, 'id' | 'registrations' | 'status'>): NotificationEvent {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: NotificationEvent = {
      id: eventId,
      ...eventData,
      status: 'draft',
      registrations: []
    };

    this.events.set(eventId, event);

    // Initialize campaign metrics
    this.campaignMetrics.set(eventId, {
      eventId,
      totalRegistrations: 0,
      totalAttendance: 0,
      attendanceRate: 0,
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      smsSent: 0,
      smsClicked: 0,
      pushSent: 0,
      pushOpened: 0,
      channelEffectiveness: {
        email: { sent: 0, opened: 0, clicked: 0, attended: 0, conversionRate: 0 },
        sms: { sent: 0, opened: 0, clicked: 0, attended: 0, conversionRate: 0 },
        whatsapp: { sent: 0, opened: 0, clicked: 0, attended: 0, conversionRate: 0 },
        push: { sent: 0, opened: 0, clicked: 0, attended: 0, conversionRate: 0 }
      },
      timelinePerformance: []
    });

    console.log(`📅 Event created: ${event.title} (${eventId})`);
    return event;
  }

  /**
   * Register viewer for event with ShowUp Surge optimization
   */
  registerForEvent(
    eventId: string,
    viewer: ViewerProfile,
    source: string = 'direct',
    customFields: Record<string, any> = {}
  ): EventRegistration {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const registrationId = `reg_${viewer.id}_${eventId}_${Date.now()}`;

    const registration: EventRegistration = {
      id: registrationId,
      eventId,
      viewer,
      registeredAt: new Date(),
      status: 'registered',
      source,
      customFields
    };

    // Add to event registrations
    event.registrations.push(registration);
    this.registrations.set(registrationId, registration);

    // Initialize ShowUp Surge profile
    const showUpProfile = showUpSurgeEngine.initializeProfile(viewer, eventId);

    // Generate optimized notification schedule
    const eventDetails: EventDetails = {
      title: event.title,
      date: event.date,
      time: event.time,
      duration: event.duration,
      presenters: event.presenters,
      topics: event.topics,
      registrationUrl: event.registrationUrl,
      value: '$497',
      bonuses: ['Bonus materials', 'Q&A access', 'Implementation guide']
    };

    const schedule = showUpSurgeEngine.generateOptimizedSchedule(eventDetails, [showUpProfile]);
    const personalizedSchedule = schedule.get(viewer.id);

    if (personalizedSchedule) {
      this.scheduleNotifications(personalizedSchedule, registration);
    }

    // Update metrics
    const metrics = this.campaignMetrics.get(eventId);
    if (metrics) {
      metrics.totalRegistrations++;
      this.campaignMetrics.set(eventId, metrics);
    }

    console.log(`✅ Registered: ${viewer.name} for ${event.title}`);
    console.log(`📧 Scheduled ${personalizedSchedule?.length || 0} notifications via ShowUp Surge`);

    return registration;
  }

  /**
   * Schedule notifications for a registration
   */
  private scheduleNotifications(
    schedule: NotificationSchedule[],
    registration: EventRegistration
  ): void {
    schedule.forEach(notification => {
      const jobId = `${registration.id}-${notification.templateId}`;

      // TODO: Re-enable cron scheduling when notifications are ready
      // const cronExpression = this.generateCronExpression(notification.scheduledAt);
      // const job = cron.schedule(cronExpression, async () => {
      //   await this.sendNotification(notification, registration);
      //   const scheduledJob = this.scheduledJobs.get(jobId);
      //   if (scheduledJob) {
      //     scheduledJob.destroy();
      //     this.scheduledJobs.delete(jobId);
      //   }
      // }, { scheduled: false });
      // job.start();
      // this.scheduledJobs.set(jobId, job);

      console.log(`⏰ Notification scheduled (stubbed): ${notification.templateId} for ${registration.viewer.name}`);

      console.log(`⏰ Scheduled: ${notification.templateId} for ${registration.viewer.name} at ${notification.scheduledAt.toISOString()}`);
    });
  }

  /**
   * Send individual notification
   */
  private async sendNotification(
    notification: NotificationSchedule,
    registration: EventRegistration
  ): Promise<void> {
    try {
      const result = await deliveryEngine.sendNotification(
        notification,
        {
          email: registration.viewer.email,
          phone: registration.viewer.phone,
          name: registration.viewer.name,
          timezone: 'UTC' // Would be detected from viewer
        }
      );

      // Update notification status
      notification.status = result.success ? 'sent' : 'failed';
      notification.deliveryMetrics.sentAt = result.deliveredAt;

      if (!result.success) {
        notification.deliveryMetrics.errorMessage = result.error;
      }

      // Update campaign metrics
      this.updateCampaignMetrics(registration.eventId, notification.channel, 'sent');

      console.log(`📤 Sent: ${notification.templateId} to ${registration.viewer.name} via ${notification.channel} (${result.success ? 'SUCCESS' : 'FAILED'})`);

    } catch (error) {
      console.error(`❌ Failed to send notification:`, error);
      notification.status = 'failed';
      notification.deliveryMetrics.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Process scheduled notifications (called by cron)
   */
  private async processScheduledNotifications(): Promise<void> {
    const now = new Date();

    // Process any notifications that should have been sent by now
    for (const [eventId, event] of this.events.entries()) {
      if (event.status !== 'active') continue;

      for (const registration of event.registrations) {
        const profile = showUpSurgeEngine.getProfile(`${registration.viewer.id}-${eventId}`);
        if (!profile) continue;

        const schedules = showUpSurgeEngine.getScheduledNotifications(`${registration.viewer.id}-${eventId}`);

        for (const schedule of schedules) {
          if (schedule.status === 'scheduled' && isBefore(schedule.scheduledAt, now)) {
            await this.sendNotification(schedule, registration);
          }
        }
      }
    }

    // Check for abandoned cart opportunities
    await this.processAbandonedCartRecovery();
  }

  /**
   * Process abandoned cart recovery
   */
  private async processAbandonedCartRecovery(): Promise<void> {
    // This would integrate with payment system to detect abandoned carts
    // For now, we'll simulate based on incomplete registrations

    for (const [registrationId, registration] of this.registrations.entries()) {
      if (registration.status === 'registered') {
        const timeSinceRegistration = Date.now() - registration.registeredAt.getTime();
        const hoursElapsed = timeSinceRegistration / (1000 * 60 * 60);

        // If registered but no recent interaction for 24+ hours, consider for recovery
        if (hoursElapsed >= 24) {
          const event = this.events.get(registration.eventId);
          if (event && isBefore(new Date(), event.date)) {
            // Create abandoned session for event registration
            abandonedCartRecovery.trackAbandonedSession(
              registration.viewer,
              {
                eventId: registration.eventId,
                sessionType: 'registration',
                stage: 'registration-incomplete',
                totalValue: 0, // Free event
                currency: 'USD'
              }
            );
          }
        }
      }
    }
  }

  /**
   * Mark attendee as present
   */
  markAttendance(registrationId: string, attended: boolean = true): void {
    const registration = this.registrations.get(registrationId);
    if (!registration) return;

    registration.status = attended ? 'attended' : 'no-show';

    // Update ShowUp Surge profile
    const profileId = `${registration.viewer.id}-${registration.eventId}`;
    showUpSurgeEngine.updateProfileFromInteraction(profileId, {
      type: attended ? 'event-join' : 'no-show',
      timestamp: new Date(),
      channel: 'email' // Default channel for tracking
    });

    // Update campaign metrics
    const metrics = this.campaignMetrics.get(registration.eventId);
    if (metrics && attended) {
      metrics.totalAttendance++;
      metrics.attendanceRate = metrics.totalAttendance / metrics.totalRegistrations;
      this.campaignMetrics.set(registration.eventId, metrics);
    }

    console.log(`👥 Attendance marked: ${registration.viewer.name} - ${attended ? 'ATTENDED' : 'NO-SHOW'}`);
  }

  /**
   * Track notification interaction
   */
  trackInteraction(
    registrationId: string,
    notificationId: string,
    interaction: {
      type: 'opened' | 'clicked';
      timestamp: Date;
      userAgent?: string;
      ipAddress?: string;
    }
  ): void {
    const registration = this.registrations.get(registrationId);
    if (!registration) return;

    // Update ShowUp Surge profile
    const profileId = `${registration.viewer.id}-${registration.eventId}`;
    showUpSurgeEngine.updateProfileFromInteraction(profileId, {
      type: interaction.type === 'opened' ? 'email-open' : 'email-click',
      timestamp: interaction.timestamp,
      channel: 'email' // Would be determined from notification
    });

    // Update campaign metrics
    this.updateCampaignMetrics(
      registration.eventId,
      'email', // Would be determined from notification
      interaction.type
    );

    console.log(`📊 Interaction tracked: ${registration.viewer.name} ${interaction.type} notification`);
  }

  /**
   * Get event analytics
   */
  getEventAnalytics(eventId: string): CampaignMetrics | undefined {
    return this.campaignMetrics.get(eventId);
  }

  /**
   * Get comprehensive analytics across all events
   */
  getComprehensiveAnalytics(): {
    totalEvents: number;
    totalRegistrations: number;
    totalAttendance: number;
    averageAttendanceRate: number;
    totalNotificationsSent: number;
    channelPerformance: Record<NotificationChannel, {
      totalSent: number;
      totalOpened: number;
      totalClicked: number;
      averageOpenRate: number;
      averageClickRate: number;
    }>;
    showUpSurgeImpact: {
      averageAttendanceRate: number;
      comparedToIndustry: string;
      improvementPercentage: number;
    };
  } {
    const allMetrics = Array.from(this.campaignMetrics.values());

    const totalEvents = allMetrics.length;
    const totalRegistrations = allMetrics.reduce((sum, m) => sum + m.totalRegistrations, 0);
    const totalAttendance = allMetrics.reduce((sum, m) => sum + m.totalAttendance, 0);
    const averageAttendanceRate = totalRegistrations > 0 ? totalAttendance / totalRegistrations : 0;

    const channelPerformance: any = {
      email: { totalSent: 0, totalOpened: 0, totalClicked: 0, averageOpenRate: 0, averageClickRate: 0 },
      sms: { totalSent: 0, totalOpened: 0, totalClicked: 0, averageOpenRate: 0, averageClickRate: 0 },
      whatsapp: { totalSent: 0, totalOpened: 0, totalClicked: 0, averageOpenRate: 0, averageClickRate: 0 },
      push: { totalSent: 0, totalOpened: 0, totalClicked: 0, averageOpenRate: 0, averageClickRate: 0 }
    };

    allMetrics.forEach(metrics => {
      Object.entries(metrics.channelEffectiveness).forEach(([channel, data]) => {
        const channelKey = channel as NotificationChannel;
        channelPerformance[channelKey].totalSent += data.sent;
        channelPerformance[channelKey].totalOpened += data.opened;
        channelPerformance[channelKey].totalClicked += data.clicked;
      });
    });

    // Calculate averages
    Object.keys(channelPerformance).forEach(channel => {
      const data = channelPerformance[channel];
      data.averageOpenRate = data.totalSent > 0 ? data.totalOpened / data.totalSent : 0;
      data.averageClickRate = data.totalSent > 0 ? data.totalClicked / data.totalSent : 0;
    });

    const totalNotificationsSent = Object.values(channelPerformance)
      .reduce((sum: number, data: any) => sum + data.totalSent, 0);

    // Industry average is typically 30-40%
    const industryAverage = 0.35;
    const improvementPercentage = Math.round(((averageAttendanceRate - industryAverage) / industryAverage) * 100);

    return {
      totalEvents,
      totalRegistrations,
      totalAttendance,
      averageAttendanceRate,
      totalNotificationsSent,
      channelPerformance,
      showUpSurgeImpact: {
        averageAttendanceRate,
        comparedToIndustry: averageAttendanceRate >= 0.6 ? '70%+' : averageAttendanceRate >= 0.5 ? '50-70%' : '<50%',
        improvementPercentage
      }
    };
  }

  /**
   * Generate AI-optimized intervention for low-likelihood attendees
   */
  async triggerIntelligentIntervention(eventId: string): Promise<{
    triggered: number;
    interventions: {
      viewerId: string;
      channel: NotificationChannel;
      templateId: string;
      timing: Date;
      reason: string;
    }[];
  }> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const interventions: any[] = [];

    for (const registration of event.registrations) {
      if (registration.status !== 'registered') continue;

      const profileId = `${registration.viewer.id}-${eventId}`;
      const likelihood = showUpSurgeEngine.predictAttendanceLikelihood(profileId);

      if (likelihood < 0.7) {
        const intervention = showUpSurgeEngine.recommendIntervention(profileId);

        if (intervention) {
          // Execute intervention
          const template = emailTemplateEngine.getTemplate(intervention.templateId);
          if (template) {
            const eventDetails: EventDetails = {
              title: event.title,
              date: event.date,
              time: event.time,
              duration: event.duration,
              presenters: event.presenters,
              topics: event.topics,
              registrationUrl: event.registrationUrl,
              value: '$497',
              bonuses: ['Bonus materials', 'Q&A access']
            };

            const personalizedContent = emailTemplateEngine.generatePersonalizedEmail(
              template,
              registration.viewer,
              eventDetails
            );

            // Send intervention
            const result = await deliveryEngine.sendNotification(
              {
                id: `intervention_${Date.now()}`,
                profileId,
                templateId: intervention.templateId,
                channel: intervention.channel,
                scheduledAt: intervention.timing,
                status: 'scheduled',
                personalizedContent,
                deliveryMetrics: {}
              },
              {
                email: registration.viewer.email,
                phone: registration.viewer.phone,
                name: registration.viewer.name
              }
            );

            if (result.success) {
              interventions.push({
                viewerId: registration.viewer.id,
                channel: intervention.channel,
                templateId: intervention.templateId,
                timing: intervention.timing,
                reason: `Low attendance likelihood: ${Math.round(likelihood * 100)}%`
              });
            }
          }
        }
      }
    }

    console.log(`🎯 Triggered ${interventions.length} intelligent interventions for ${event.title}`);

    return {
      triggered: interventions.length,
      interventions
    };
  }

  /**
   * Update campaign metrics
   */
  private updateCampaignMetrics(
    eventId: string,
    channel: NotificationChannel,
    action: 'sent' | 'opened' | 'clicked'
  ): void {
    const metrics = this.campaignMetrics.get(eventId);
    if (!metrics) return;

    switch (action) {
      case 'sent':
        metrics.channelEffectiveness[channel].sent++;
        if (channel === 'email') metrics.emailsSent++;
        if (channel === 'sms') metrics.smsSent++;
        if (channel === 'push') metrics.pushSent++;
        break;
      case 'opened':
        metrics.channelEffectiveness[channel].opened++;
        if (channel === 'email') metrics.emailsOpened++;
        if (channel === 'push') metrics.pushOpened++;
        break;
      case 'clicked':
        metrics.channelEffectiveness[channel].clicked++;
        if (channel === 'email') metrics.emailsClicked++;
        if (channel === 'sms') metrics.smsClicked++;
        break;
    }

    // Recalculate conversion rates
    const channelData = metrics.channelEffectiveness[channel];
    channelData.conversionRate = channelData.sent > 0 ? channelData.attended / channelData.sent : 0;

    this.campaignMetrics.set(eventId, metrics);
  }

  /**
   * Generate cron expression from date
   */
  private generateCronExpression(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;

    return `${minute} ${hour} ${day} ${month} *`;
  }

  /**
   * Activate event to start sending notifications
   */
  activateEvent(eventId: string): void {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    event.status = 'active';
    this.events.set(eventId, event);

    console.log(`🚀 Event activated: ${event.title} - notifications will start sending`);
  }

  /**
   * Get all events
   */
  getEvents(): NotificationEvent[] {
    return Array.from(this.events.values());
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): NotificationEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Get registrations for an event
   */
  getEventRegistrations(eventId: string): EventRegistration[] {
    return Array.from(this.registrations.values()).filter(r => r.eventId === eventId);
  }

  /**
   * Stop all scheduled notifications
   */
  stopScheduler(): void {
    this.isActive = false;

    // TODO: Re-enable job destruction when notifications are ready
    // this.scheduledJobs.forEach(job => job.destroy());
    this.scheduledJobs.clear();

    console.log('🛑 ShowUp Surge notification scheduler stopped');
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();