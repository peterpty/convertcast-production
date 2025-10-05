'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { SmartScheduler, ScheduleRecommendation } from '@/lib/ai/smartScheduler';
import {
  calculateNotificationSchedule,
  getRecommendedIntervals,
  formatEventDateTime,
} from '@/lib/notifications/notificationScheduler';
import NotificationSettingsModal from '@/components/events/NotificationSettingsModal';
import { ContactSelector } from '@/components/events/ContactSelector';

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<'details' | 'schedule' | 'notifications' | 'review'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Event Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxRegistrations, setMaxRegistrations] = useState<number | null>(null);

  // Schedule
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [aiRecommendation, setAiRecommendation] = useState<ScheduleRecommendation | null>(null);

  // Notifications
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [selectedIntervals, setSelectedIntervals] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');

  // Contacts
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);

  const handleAiScheduleSelect = (recommendation: ScheduleRecommendation) => {
    setAiRecommendation(recommendation);
    const startDate = new Date(recommendation.recommendedTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

    setScheduledStart(startDate.toISOString().slice(0, 16));
    setScheduledEnd(endDate.toISOString().slice(0, 16));
  };

  const handleScheduleSelect = () => {
    if (!scheduledStart) {
      setError('Please select a start date and time');
      return;
    }

    // Calculate recommended notification intervals
    const recommended = getRecommendedIntervals(scheduledStart);
    setSelectedIntervals(recommended);
    setStep('notifications');
  };

  const toggleInterval = (interval: string) => {
    if (selectedIntervals.includes(interval)) {
      setSelectedIntervals(selectedIntervals.filter(i => i !== interval));
    } else {
      setSelectedIntervals([...selectedIntervals, interval]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !scheduledStart) {
      setError('Title and start time are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd || new Date(new Date(scheduledStart).getTime() + 60 * 60 * 1000).toISOString(),
          timezone,
          notification_settings: {
            email_enabled: emailEnabled,
            sms_enabled: smsEnabled,
            auto_schedule: true,
            custom_message: customMessage || null,
          },
          registration_enabled: true,
          max_registrations: maxRegistrations,
          selected_intervals: selectedIntervals,
          preferred_integration_id: selectedIntegrationId,
          selected_contact_ids: selectedContactIds,
          smartscheduler_data: aiRecommendation ? {
            score: aiRecommendation.score,
            confidence: aiRecommendation.confidence,
            expected_outcome: aiRecommendation.expectedOutcome,
          } : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store event ID and show notification settings modal
        setCreatedEventId(data.event.id);
        setShowNotificationModal(true);
      } else {
        setError(data.error || 'Failed to create event');
      }
    } catch (err) {
      setError('Failed to create event');
      console.error('Error creating event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationModalClose = () => {
    setShowNotificationModal(false);
    // Navigate to events dashboard after closing modal
    router.push('/dashboard/events');
  };

  const notificationSchedule = scheduledStart ? calculateNotificationSchedule(scheduledStart) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-4 flex items-center"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Create New Event</h1>
          <p className="text-gray-400">Schedule a live streaming event with automated notifications</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center space-x-4">
          {['details', 'schedule', 'notifications', 'review'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : ['details', 'schedule', 'notifications', 'review'].indexOf(step) >
                      ['details', 'schedule', 'notifications', 'review'].indexOf(s)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  step === s ? 'text-white font-bold' : 'text-gray-500'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {idx < 3 && <div className="w-12 h-0.5 bg-gray-700 mx-4" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Event Details */}
        {step === 'details' && (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Event Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 font-medium mb-2">Event Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Product Launch Webinar"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Describe what viewers can expect..."
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-2">Max Registrations (Optional)</label>
                <input
                  type="number"
                  value={maxRegistrations || ''}
                  onChange={(e) => setMaxRegistrations(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Leave empty for unlimited"
                  min="1"
                />
                <p className="text-gray-400 text-sm mt-1">Limit the number of people who can register</p>
              </div>

              <button
                onClick={() => setStep('schedule')}
                disabled={!title}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all"
              >
                Next: Schedule Event
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Schedule (with AI) */}
        {step === 'schedule' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Manual Schedule */}
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">📅 Manual Schedule</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-1">Optional: Defaults to 1 hour after start</p>
                </div>

                <div>
                  <label className="block text-gray-300 font-medium mb-2">Timezone</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('details')}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleScheduleSelect}
                    disabled={!scheduledStart}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* AI Scheduler */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-4">
                <h2 className="text-xl font-bold text-white">🤖 AI Smart Scheduler</h2>
                <p className="text-gray-300 text-sm">Let AI find the optimal time</p>
              </div>
              {/* SmartScheduler component would go here */}
              <div className="p-6">
                <p className="text-gray-400 text-sm mb-4">
                  The AI scheduler analyzes audience timezones, engagement patterns, and market competition to recommend the best time for your event.
                </p>
                <button
                  onClick={() => {
                    // This would open the SmartScheduler
                    alert('AI Scheduler integration coming in next iteration');
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Open AI Scheduler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Notifications */}
        {step === 'notifications' && (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">🔔 Notification Settings</h2>

            <div className="space-y-6">
              {/* Notification Types */}
              <div>
                <label className="block text-gray-300 font-medium mb-3">Notification Methods</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-white">📧 Email Notifications</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsEnabled}
                      onChange={(e) => setSmsEnabled(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-white">📱 SMS Notifications (requires phone numbers)</span>
                  </label>
                </div>
              </div>

              {/* Notification Schedule */}
              {notificationSchedule && (
                <div>
                  <label className="block text-gray-300 font-medium mb-3">
                    Notification Schedule ({notificationSchedule.intervals.length} reminders)
                  </label>
                  <div className="space-y-2">
                    {notificationSchedule.intervals.map((interval) => (
                      <label
                        key={interval.name}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedIntervals.includes(interval.name)
                            ? 'bg-blue-900/30 border-blue-500'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedIntervals.includes(interval.name)}
                            onChange={() => toggleInterval(interval.name)}
                            className="w-5 h-5 rounded"
                          />
                          <div>
                            <span className="text-white font-medium">{interval.label}</span>
                            {interval.recommended && (
                              <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                                Recommended
                              </span>
                            )}
                            <p className="text-gray-400 text-sm">
                              {interval.scheduledTime.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Message */}
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Add a personal message to your notifications..."
                  maxLength={300}
                />
                <p className="text-gray-400 text-sm mt-1">
                  {customMessage.length}/300 characters
                </p>
              </div>

              {/* Contact Selection */}
              {(emailEnabled || smsEnabled) && (
                <div>
                  <label className="block text-gray-300 font-medium mb-3">
                    Select Recipients
                  </label>
                  <ContactSelector
                    notificationType={emailEnabled && smsEnabled ? 'both' : emailEnabled ? 'email' : 'sms'}
                    onContactsChange={(ids, integrationId) => {
                      setSelectedContactIds(ids);
                      setSelectedIntegrationId(integrationId);
                    }}
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('schedule')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('review')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Next: Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {step === 'review' && (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Review & Create Event</h2>

            <div className="space-y-6">
              {/* Event Summary */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                {description && <p className="text-gray-300 mb-4">{description}</p>}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Start Time</p>
                    <p className="text-white font-medium">
                      {new Date(scheduledStart).toLocaleString()}
                    </p>
                  </div>
                  {scheduledEnd && (
                    <div>
                      <p className="text-gray-400">End Time</p>
                      <p className="text-white font-medium">
                        {new Date(scheduledEnd).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {maxRegistrations && (
                    <div>
                      <p className="text-gray-400">Max Registrations</p>
                      <p className="text-white font-medium">{maxRegistrations}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400">Notifications</p>
                    <p className="text-white font-medium">
                      {selectedIntervals.length} scheduled
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Summary */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-3">Notification Plan</h3>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    {emailEnabled && '📧 Email'}
                    {emailEnabled && smsEnabled && ' + '}
                    {smsEnabled && '📱 SMS'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {selectedIntervals.length} reminders will be sent automatically
                  </p>
                  {customMessage && (
                    <div className="mt-3 bg-gray-800 rounded p-3 border-l-4 border-blue-500">
                      <p className="text-gray-400 text-xs mb-1">Custom Message:</p>
                      <p className="text-gray-300 text-sm italic">"{customMessage}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('notifications')}
                  disabled={loading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 rounded-lg transition-all"
                >
                  {loading ? 'Creating Event...' : '✅ Create Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings Modal */}
      {createdEventId && (
        <NotificationSettingsModal
          isOpen={showNotificationModal}
          onClose={handleNotificationModalClose}
          eventId={createdEventId}
          initialSettings={{
            emailEnabled,
            smsEnabled,
            emailTimings: [],
            smsTimings: [],
          }}
          onSave={(settings) => {
            console.log('Notification settings saved:', settings);
          }}
        />
      )}
    </div>
  );
}
