/**
 * Intelligent Notification Scheduler
 * Calculates optimal notification intervals based on event timing
 */

export interface NotificationInterval {
  name: string;
  label: string;
  milliseconds: number;
  scheduledTime: Date;
  recommended: boolean;
}

export interface NotificationSchedule {
  eventTime: Date;
  intervals: NotificationInterval[];
  totalNotifications: number;
}

const INTERVAL_DEFINITIONS = [
  { name: 'now', label: 'Right Now', ms: 0, minEventDistance: 0 },
  { name: '15min', label: '15 minutes before', ms: 15 * 60 * 1000, minEventDistance: 15 * 60 * 1000 },
  { name: '1hour', label: '1 hour before', ms: 60 * 60 * 1000, minEventDistance: 60 * 60 * 1000 },
  { name: '12hours', label: '12 hours before', ms: 12 * 60 * 60 * 1000, minEventDistance: 12 * 60 * 60 * 1000 },
  { name: '1day', label: '1 day before', ms: 24 * 60 * 60 * 1000, minEventDistance: 24 * 60 * 60 * 1000 },
  { name: '3days', label: '3 days before', ms: 3 * 24 * 60 * 60 * 1000, minEventDistance: 3 * 24 * 60 * 60 * 1000 },
  { name: '1week', label: '1 week before', ms: 7 * 24 * 60 * 60 * 1000, minEventDistance: 7 * 24 * 60 * 60 * 1000 },
  { name: '2weeks', label: '2 weeks before', ms: 14 * 24 * 60 * 60 * 1000, minEventDistance: 14 * 24 * 60 * 60 * 1000 },
];

/**
 * Calculate intelligent notification intervals based on event timing
 * Only suggests intervals that make sense for the event timeline
 */
export function calculateNotificationSchedule(eventTime: Date | string): NotificationSchedule {
  const eventDate = typeof eventTime === 'string' ? new Date(eventTime) : eventTime;
  const now = new Date();
  const timeUntilEvent = eventDate.getTime() - now.getTime();

  if (timeUntilEvent <= 0) {
    throw new Error('Event time must be in the future');
  }

  const intervals: NotificationInterval[] = [];

  // Determine which intervals are feasible and recommended
  INTERVAL_DEFINITIONS.forEach(interval => {
    const notificationTime = new Date(eventDate.getTime() - interval.ms);

    // Only include if notification would be in the future
    if (notificationTime.getTime() > now.getTime()) {
      // Check if there's enough time for this interval
      const isRecommended = timeUntilEvent >= interval.minEventDistance;

      intervals.push({
        name: interval.name,
        label: interval.label,
        milliseconds: interval.ms,
        scheduledTime: notificationTime,
        recommended: isRecommended,
      });
    }
  });

  // Always include "at event start" notification
  intervals.push({
    name: 'at_start',
    label: 'At event start',
    milliseconds: 0,
    scheduledTime: eventDate,
    recommended: true,
  });

  // Sort by scheduled time (earliest first)
  intervals.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

  return {
    eventTime: eventDate,
    intervals,
    totalNotifications: intervals.length,
  };
}

/**
 * Get human-readable time until event
 */
export function getTimeUntilEvent(eventTime: Date | string): string {
  const eventDate = typeof eventTime === 'string' ? new Date(eventTime) : eventTime;
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'now';
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));

  if (weeks >= 1) {
    return weeks === 1 ? 'in 1 week' : `in ${weeks} weeks`;
  } else if (days >= 1) {
    return days === 1 ? 'in 1 day' : `in ${days} days`;
  } else if (hours >= 1) {
    return hours === 1 ? 'in 1 hour' : `in ${hours} hours`;
  } else if (minutes >= 1) {
    return minutes === 1 ? 'in 1 minute' : `in ${minutes} minutes`;
  } else {
    return 'in less than a minute';
  }
}

/**
 * Format date/time for notifications
 */
export function formatEventDateTime(eventTime: Date | string): {
  date: string;
  time: string;
  datetime: string;
} {
  const eventDate = typeof eventTime === 'string' ? new Date(eventTime) : eventTime;

  return {
    date: eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
    datetime: eventDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

/**
 * Validate notification schedule (lenient version)
 * Filters out invalid intervals instead of failing the entire schedule
 */
export function validateNotificationSchedule(
  schedule: NotificationSchedule
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const now = new Date();

  // Hard errors (fail the entire schedule)
  if (schedule.eventTime <= now) {
    errors.push('Event time must be in the future');
    return { valid: false, errors, warnings };
  }

  // Count valid intervals
  let validIntervalCount = 0;
  const intervalErrors: string[] = [];

  schedule.intervals.forEach((interval, index) => {
    let isValid = true;

    if (interval.scheduledTime <= now) {
      warnings.push(`Notification "${interval.label}" is in the past - will be skipped`);
      isValid = false;
    }

    if (interval.scheduledTime > schedule.eventTime) {
      warnings.push(`Notification "${interval.label}" is after event start - will be skipped`);
      isValid = false;
    }

    // Check for overlapping notifications (within 5 minutes) - warning only
    if (isValid && index > 0) {
      const prevInterval = schedule.intervals[index - 1];
      const timeDiff = interval.scheduledTime.getTime() - prevInterval.scheduledTime.getTime();
      if (timeDiff < 5 * 60 * 1000) {
        warnings.push(
          `Notifications "${prevInterval.label}" and "${interval.label}" are close together (< 5 minutes)`
        );
      }
    }

    if (isValid) {
      validIntervalCount++;
    }
  });

  // Only fail if NO valid intervals exist
  if (validIntervalCount === 0) {
    errors.push('No valid notification intervals found. Event is too soon or all intervals are invalid.');
    return { valid: false, errors, warnings };
  }

  // Success with warnings
  return {
    valid: true,
    errors: [],
    warnings,
  };
}

/**
 * Filter notification schedule to only include valid intervals
 */
export function filterValidIntervals(schedule: NotificationSchedule): NotificationSchedule {
  const now = new Date();

  const validIntervals = schedule.intervals.filter(interval => {
    // Must be in the future
    if (interval.scheduledTime <= now) return false;

    // Must be before event start
    if (interval.scheduledTime > schedule.eventTime) return false;

    return true;
  });

  return {
    ...schedule,
    intervals: validIntervals,
    totalNotifications: validIntervals.length,
  };
}

/**
 * Get recommended intervals for UI display
 */
export function getRecommendedIntervals(eventTime: Date | string): string[] {
  const schedule = calculateNotificationSchedule(eventTime);
  return schedule.intervals
    .filter(i => i.recommended)
    .map(i => i.name);
}

/**
 * Convert interval name to notification timing enum
 */
export function intervalToNotificationTiming(intervalName: string): string {
  const timingMap: { [key: string]: string } = {
    'now': 'immediate',
    '15min': '15_minutes_before',
    '1hour': '1_hour_before',
    '12hours': '12_hours_before',
    '1day': '1_day_before',
    '3days': '3_days_before',
    '1week': '1_week_before',
    '2weeks': '2_weeks_before',
    'at_start': 'at_event_start',
  };

  return timingMap[intervalName] || intervalName;
}

/**
 * Calculate next notification time for an event
 */
export function getNextNotificationTime(eventTime: Date | string): Date | null {
  const schedule = calculateNotificationSchedule(eventTime);
  const now = new Date();

  for (const interval of schedule.intervals) {
    if (interval.scheduledTime > now) {
      return interval.scheduledTime;
    }
  }

  return null;
}

/**
 * Check if it's too late to schedule notifications
 */
export function isTooLateToSchedule(eventTime: Date | string): boolean {
  const eventDate = typeof eventTime === 'string' ? new Date(eventTime) : eventTime;
  const now = new Date();
  const timeUntilEvent = eventDate.getTime() - now.getTime();

  // If event is less than 5 minutes away, it's too late
  return timeUntilEvent < 5 * 60 * 1000;
}

/**
 * Estimate notification reach
 */
export function estimateNotificationReach(
  registrationCount: number,
  emailEnabled: boolean,
  smsEnabled: boolean
): {
  totalRecipients: number;
  estimatedEmailsSent: number;
  estimatedSmsSent: number;
  estimatedCost: number; // in USD
} {
  const SMS_COST_PER_MESSAGE = 0.0075; // Average Twilio cost
  const EMAIL_COST_PER_MESSAGE = 0.001; // Average Mailgun cost

  let estimatedEmailsSent = 0;
  let estimatedSmsSent = 0;

  if (emailEnabled) {
    estimatedEmailsSent = Math.floor(registrationCount * 0.95); // 95% deliverability
  }

  if (smsEnabled) {
    estimatedSmsSent = Math.floor(registrationCount * 0.98); // 98% deliverability
  }

  const estimatedCost =
    estimatedEmailsSent * EMAIL_COST_PER_MESSAGE +
    estimatedSmsSent * SMS_COST_PER_MESSAGE;

  return {
    totalRecipients: registrationCount,
    estimatedEmailsSent,
    estimatedSmsSent,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
  };
}
