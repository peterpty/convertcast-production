'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Mail, MessageSquare, Save } from 'lucide-react';

interface NotificationTiming {
  enabled: boolean;
  timing: string;
  label: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailTimings: NotificationTiming[];
  smsTimings: NotificationTiming[];
}

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  initialSettings?: Partial<NotificationSettings>;
  onSave?: (settings: NotificationSettings) => void;
}

const DEFAULT_TIMINGS: Omit<NotificationTiming, 'enabled'>[] = [
  { timing: '1_week_before', label: '1 week before' },
  { timing: '1_day_before', label: '1 day before' },
  { timing: '1_hour_before', label: '1 hour before' },
  { timing: '15_min_before', label: '15 minutes before' },
  { timing: '3_min_before', label: '3 minutes before' },
];

const POST_EVENT_TIMINGS: Omit<NotificationTiming, 'enabled'>[] = [
  { timing: '5_min_after', label: '5 minutes after' },
  { timing: '10_min_after', label: '10 minutes after' },
  { timing: '15_min_after', label: '15 minutes after' },
];

export default function NotificationSettingsModal({
  isOpen,
  onClose,
  eventId,
  initialSettings,
  onSave,
}: NotificationSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const [emailTimings, setEmailTimings] = useState<NotificationTiming[]>(
    DEFAULT_TIMINGS.map(t => ({ ...t, enabled: true }))
  );
  const [emailPostEventTimings, setEmailPostEventTimings] = useState<NotificationTiming[]>(
    POST_EVENT_TIMINGS.map(t => ({ ...t, enabled: true }))
  );

  const [smsTimings, setSmsTimings] = useState<NotificationTiming[]>(
    DEFAULT_TIMINGS.map(t => ({ ...t, enabled: true }))
  );
  const [smsPostEventTimings, setSmsPostEventTimings] = useState<NotificationTiming[]>(
    POST_EVENT_TIMINGS.map(t => ({ ...t, enabled: true }))
  );

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.emailEnabled !== undefined) setEmailEnabled(initialSettings.emailEnabled);
      if (initialSettings.smsEnabled !== undefined) setSmsEnabled(initialSettings.smsEnabled);
      if (initialSettings.emailTimings) setEmailTimings(initialSettings.emailTimings);
      if (initialSettings.smsTimings) setSmsTimings(initialSettings.smsTimings);
    }
  }, [initialSettings]);

  const toggleEmailTiming = (timing: string) => {
    setEmailTimings(prev =>
      prev.map(t => (t.timing === timing ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const toggleEmailPostEventTiming = (timing: string) => {
    setEmailPostEventTimings(prev =>
      prev.map(t => (t.timing === timing ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const toggleSmsTiming = (timing: string) => {
    setSmsTimings(prev =>
      prev.map(t => (t.timing === timing ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const toggleSmsPostEventTiming = (timing: string) => {
    setSmsPostEventTimings(prev =>
      prev.map(t => (t.timing === timing ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const settings: NotificationSettings = {
        emailEnabled,
        smsEnabled,
        emailTimings: [...emailTimings, ...emailPostEventTimings],
        smsTimings: [...smsTimings, ...smsPostEventTimings],
      };

      // Call API to update notification settings
      const response = await fetch(`/api/events/${eventId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save notification settings');
      }

      setSuccess(true);

      // Call onSave callback if provided
      if (onSave) {
        onSave(settings);
      }

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notification Settings</h2>
              <p className="text-sm text-gray-400">Configure email and SMS reminders for your attendees</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
              <p className="text-green-400 text-sm font-medium">✓ Notification settings saved successfully!</p>
            </div>
          )}

          {/* Email Notifications */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Email Notifications</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {emailEnabled && (
              <>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Send email reminders:</p>
                  {emailTimings.map((timing) => (
                    <label
                      key={timing.timing}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={timing.enabled}
                        onChange={() => toggleEmailTiming(timing.timing)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-white">{timing.label}</span>
                    </label>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    After event starts <span className="text-gray-500">(for no-shows only)</span>:
                  </p>
                  <div className="space-y-2">
                    {emailPostEventTimings.map((timing) => (
                      <label
                        key={timing.timing}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={timing.enabled}
                          onChange={() => toggleEmailPostEventTiming(timing.timing)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-white">{timing.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-amber-400 mt-3 bg-amber-900/10 border border-amber-700/30 rounded p-2">
                    Post-event reminders: Only sent to people who haven't shown up to encourage late attendance
                  </p>
                </div>
              </>
            )}
          </div>

          {/* SMS Notifications */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-white">SMS Notifications</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <p className="text-sm text-blue-400 mb-4 bg-blue-900/10 border border-blue-700/30 rounded p-2">
              <strong>Note:</strong> SMS reminders require phone number collection in registration form
            </p>

            {smsEnabled && (
              <>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Send SMS reminders:</p>
                  {smsTimings.map((timing) => (
                    <label
                      key={timing.timing}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={timing.enabled}
                        onChange={() => toggleSmsTiming(timing.timing)}
                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <span className="text-white">{timing.label}</span>
                    </label>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    After event starts <span className="text-gray-500">(for no-shows only)</span>:
                  </p>
                  <div className="space-y-2">
                    {smsPostEventTimings.map((timing) => (
                      <label
                        key={timing.timing}
                        className="flex items-center space-x-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={timing.enabled}
                          onChange={() => toggleSmsPostEventTiming(timing.timing)}
                          className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <span className="text-white">{timing.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-amber-400 mt-3 bg-amber-900/10 border border-amber-700/30 rounded p-2">
                    Post-event reminders: Only sent to people who haven't shown up to encourage late attendance
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6">
          <button
            onClick={handleSave}
            disabled={loading || success}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Saving...' : success ? 'Saved!' : 'Save Notification Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
