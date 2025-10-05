'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';

interface EventData {
  id: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  timezone: string;
  status: string;
  registration_enabled: boolean;
  max_registrations: number | null;
  current_registrations: number;
  spots_remaining: number | null;
  host: {
    name: string;
    company: string | null;
    avatar_url: string | null;
  };
}

export default function EventRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchUrl, setWatchUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/register`);
      const data = await response.json();

      if (data.success) {
        setEvent(data.event);
      } else {
        setError(data.error || 'Failed to load event');
      }
    } catch (err) {
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'email',
          send_confirmation: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setWatchUrl(data.watch_url);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading event details...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  if (success && watchUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-green-500">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">You're Registered!</h1>
            <p className="text-white text-lg">Check your email for confirmation</p>
          </div>

          <div className="p-8">
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">{event.title}</h2>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-center">
                  <span className="text-blue-400 mr-2">📅</span>
                  {new Date(event.scheduled_start).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="flex items-center">
                  <span className="text-blue-400 mr-2">🕐</span>
                  {new Date(event.scheduled_start).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  })}
                </p>
                <p className="flex items-center">
                  <span className="text-blue-400 mr-2">👤</span>
                  Hosted by {event.host.name}
                </p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-blue-400 mb-2">What's Next?</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  Check your email for confirmation and event details
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  We'll send you reminders as the event approaches
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  Use the link below or check your email to join the event
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <a
                href={watchUrl}
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all text-center text-lg"
              >
                🎥 Go to Watch Page
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(watchUrl);
                  alert('Watch link copied to clipboard!');
                }}
                className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all text-center"
              >
                📋 Copy Watch Link
              </button>
            </div>

            <p className="text-gray-400 text-sm text-center mt-6">
              Save this page or email for easy access to the event
            </p>
          </div>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.scheduled_start);
  const isEventFull = event.max_registrations && event.current_registrations >= event.max_registrations;
  const isPastEvent = new Date(event.scheduled_start) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Register for Event
          </h1>
          <p className="text-gray-400">Secure your spot for this exclusive live event</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Event Details */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 h-fit">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-3">{event.title}</h2>
              {event.description && (
                <p className="text-gray-300 leading-relaxed">{event.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-blue-400 text-xl mr-3">📅</span>
                <div>
                  <p className="text-gray-400 text-sm">Date</p>
                  <p className="text-white font-medium">
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-blue-400 text-xl mr-3">🕐</span>
                <div>
                  <p className="text-gray-400 text-sm">Time</p>
                  <p className="text-white font-medium">
                    {eventDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZoneName: 'short',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-blue-400 text-xl mr-3">👤</span>
                <div>
                  <p className="text-gray-400 text-sm">Host</p>
                  <p className="text-white font-medium">{event.host.name}</p>
                  {event.host.company && (
                    <p className="text-gray-400 text-sm">{event.host.company}</p>
                  )}
                </div>
              </div>

              {event.max_registrations && (
                <div className="flex items-start">
                  <span className="text-blue-400 text-xl mr-3">🎫</span>
                  <div>
                    <p className="text-gray-400 text-sm">Availability</p>
                    <p className="text-white font-medium">
                      {event.spots_remaining !== null && event.spots_remaining > 0
                        ? `${event.spots_remaining} spots remaining`
                        : 'Limited spots available'}
                    </p>
                    <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all"
                        style={{
                          width: `${(event.current_registrations / event.max_registrations) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            {isPastEvent ? (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
                <p className="text-red-400 font-bold mb-2">This event has already passed</p>
                <p className="text-gray-400">Registration is no longer available</p>
              </div>
            ) : isEventFull ? (
              <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6 text-center">
                <p className="text-yellow-400 font-bold mb-2">Event is Full</p>
                <p className="text-gray-400">All spots have been filled</p>
              </div>
            ) : !event.registration_enabled ? (
              <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-6 text-center">
                <p className="text-yellow-400 font-bold mb-2">Registration Closed</p>
                <p className="text-gray-400">Registration is not available for this event</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4">Complete Registration</h3>

                {error && (
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="john@example.com"
                  />
                  <p className="text-gray-400 text-xs mt-1">We'll send event details and reminders here</p>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-gray-400 text-xs mt-1">For SMS reminders (if enabled)</p>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Acme Inc."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  {submitting ? 'Registering...' : '✅ Complete Registration'}
                </button>

                <p className="text-gray-400 text-xs text-center mt-4">
                  By registering, you agree to receive event notifications and updates
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Powered by ConvertCast</p>
          <div className="flex justify-center space-x-6 text-gray-600 text-sm">
            <span>🔒 Secure Registration</span>
            <span>📧 Email Confirmation</span>
            <span>🔔 Event Reminders</span>
          </div>
        </div>
      </div>
    </div>
  );
}
