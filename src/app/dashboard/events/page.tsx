'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AttendeeManagement } from '@/components/events/AttendeeManagement';
import NotificationSettingsModal from '@/components/events/NotificationSettingsModal';
import {
  Plus,
  Calendar,
  Clock,
  Users,
  Play,
  Edit,
  Copy,
  Trash2,
  BarChart3,
  Settings,
  Eye,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Bell
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  max_attendees: number | null;
  timezone: string;
  custom_fields: any | null;
  registration_count?: number;
  notifications_sent?: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEventForManagement, setSelectedEventForManagement] = useState<string | null>(null);
  const [attendeeCount, setAttendeeCount] = useState<Record<string, number>>({});
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedEventForNotifications, setSelectedEventForNotifications] = useState<string | null>(null);
  const [goingLive, setGoingLive] = useState<Record<string, boolean>>({});

  // Create event form state
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    max_attendees: 1000,
    tags: '',
  });
  const [creating, setCreating] = useState(false);

  // Fetch events from API
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        console.log('📋 Fetching events from API...');

        const response = await fetch('/api/events');
        const data = await response.json();

        if (data.success && data.events) {
          console.log(`✅ Loaded ${data.events.length} events`);
          setEvents(data.events);
        } else {
          console.error('❌ Failed to load events:', data.error);
        }
      } catch (error) {
        console.error('❌ Error loading events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
      case 'scheduled': return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      case 'live': return 'bg-green-600/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-purple-600/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: Event['status']) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'live': return <Play className="w-4 h-4" />;
      case 'completed': return <BarChart3 className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateEvent = async () => {
    try {
      setCreating(true);

      // Validate required fields
      if (!createFormData.title || !createFormData.date || !createFormData.time) {
        alert('Please fill in all required fields (Title, Date, Time)');
        return;
      }

      console.log('📝 Creating event...');

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: createFormData.title,
          description: createFormData.description,
          date: createFormData.date,
          time: createFormData.time,
          duration: createFormData.duration,
          max_attendees: createFormData.max_attendees,
          tags: createFormData.tags ? createFormData.tags.split(',').map(t => t.trim()) : [],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create event');
      }

      console.log('✅ Event created:', data.event);

      // Add new event to list
      setEvents(prev => [data.event, ...prev]);

      // Reset form and close modal
      setCreateFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        max_attendees: 1000,
        tags: '',
      });
      setShowCreateModal(false);

      // Show success message
      alert('Event created successfully!');
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      alert(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleGoLive = async (eventId: string) => {
    try {
      setGoingLive(prev => ({ ...prev, [eventId]: true }));

      const response = await fetch(`/api/events/${eventId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start event');
      }

      console.log('✅ Event started:', data);

      // Navigate to studio with event context
      window.location.href = `/dashboard/stream/studio?eventId=${eventId}&streamId=${data.stream.id}`;
    } catch (error) {
      console.error('❌ Failed to go live:', error);
      alert(`Failed to go live: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setGoingLive(prev => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <DashboardLayout
      title="Events"
      description="Create and manage your ConvertCast webinar events"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 w-64"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-12 shadow-2xl">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-purple-300 text-center">Loading events...</p>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {!loading && (
        <div className="grid gap-6">
          {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl hover:scale-[1.01] transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(event.status)}`}>
                    {getStatusIcon(event.status)}
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </div>
                </div>
                <p className="text-purple-200/80 text-sm mb-4 leading-relaxed">
                  {event.description || 'No description provided'}
                </p>

                {event.custom_fields?.tags && event.custom_fields.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.custom_fields.tags.map((tag: string, tagIndex: number) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button className="p-2 bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/30 rounded-xl transition-all duration-200">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/30 rounded-xl transition-all duration-200">
                  <Edit className="w-5 h-5" />
                </button>
                <button className="p-2 bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/30 rounded-xl transition-all duration-200">
                  <Copy className="w-5 h-5" />
                </button>
                <button className="p-2 bg-red-600/20 border border-red-500/30 text-red-200 hover:text-white hover:bg-red-600/30 rounded-xl transition-all duration-200">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-300 text-sm">Date & Time</span>
                </div>
                <div className="text-white font-semibold">
                  {new Date(event.scheduled_start).toLocaleDateString()}
                </div>
                <div className="text-purple-200/80 text-sm">
                  {new Date(event.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(event.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="text-purple-300 text-sm">Registrations</span>
                </div>
                <div className="text-white font-semibold">
                  {(event.registration_count || 0).toLocaleString()}
                </div>
                <div className="text-purple-200/80 text-sm">
                  {event.max_attendees ? `Max: ${event.max_attendees.toLocaleString()}` : 'Unlimited'}
                </div>
              </div>

              <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <span className="text-purple-300 text-sm">Capacity</span>
                </div>
                <div className="text-white font-semibold">
                  {event.max_attendees
                    ? Math.round(((event.registration_count || 0) / event.max_attendees) * 100)
                    : 0}%
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                    style={{
                      width: event.max_attendees
                        ? `${Math.min(((event.registration_count || 0) / event.max_attendees) * 100, 100)}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-orange-400" />
                  <span className="text-purple-300 text-sm">AI Features</span>
                </div>
                <div className="text-white font-semibold">6/6 Active</div>
                <div className="text-green-400 text-sm">All optimized</div>
              </div>
            </div>

            <div className="flex gap-4">
              {event.status === 'draft' && (
                <>
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200">
                    Schedule Event
                  </button>
                  <button
                    onClick={() => window.open(`/join/${event.id}`, '_blank')}
                    className="bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/30 px-4 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Preview
                  </button>
                </>
              )}

              {event.status === 'scheduled' && (
                <>
                  <button
                    onClick={() => handleGoLive(event.id)}
                    disabled={goingLive[event.id]}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {goingLive[event.id] ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Go Live
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedEventForManagement(
                      selectedEventForManagement === event.id ? null : event.id
                    )}
                    className="bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/30 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Attendees
                    {selectedEventForManagement === event.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}

              {event.status === 'live' && (
                <>
                  <button
                    onClick={() => handleGoLive(event.id)}
                    disabled={goingLive[event.id]}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {goingLive[event.id] ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Settings className="w-5 h-5" />
                        Manage Live
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.open(`/watch/${event.id}`, '_blank')}
                    className="bg-green-600/20 border border-green-500/30 text-green-200 hover:text-white hover:bg-green-600/30 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Watch
                  </button>
                </>
              )}

              {event.status === 'completed' && (
                <>
                  <button className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    View Analytics
                  </button>
                  <button
                    onClick={() => window.open(`/watch/${event.id}`, '_blank')}
                    className="bg-slate-600/20 border border-slate-500/30 text-slate-200 hover:text-white hover:bg-slate-600/30 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Replay
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setSelectedEventForNotifications(event.id);
                  setShowNotificationModal(true);
                }}
                className="bg-blue-600/20 border border-blue-500/30 text-blue-200 hover:text-white hover:bg-blue-600/30 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notification Settings
              </button>
            </div>

            {/* Attendee Management Section */}
            <AnimatePresence>
              {selectedEventForManagement === event.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 overflow-hidden"
                >
                  <AttendeeManagement
                    eventId={event.id}
                    eventTitle={event.title}
                    eventDate={new Date(event.scheduled_start)}
                    onAttendeeCountChange={(count) =>
                      setAttendeeCount(prev => ({ ...prev, [event.id]: count }))
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-12 shadow-2xl max-w-md mx-auto">
            <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Events Found</h3>
            <p className="text-purple-200/80 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first ConvertCast event to get started'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                Create New Event
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Event Title *</label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  placeholder="Enter event title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  placeholder="Describe your event..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={createFormData.date}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Time *</label>
                  <input
                    type="time"
                    value={createFormData.time}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={createFormData.duration}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Max Attendees</label>
                  <input
                    type="number"
                    min="1"
                    value={createFormData.max_attendees}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, max_attendees: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Tags</label>
                <input
                  type="text"
                  value={createFormData.tags}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  placeholder="Enter tags separated by commas..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-purple-500/20">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  // Reset form when closing
                  setCreateFormData({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    duration: 60,
                    max_attendees: 1000,
                    tags: '',
                  });
                }}
                disabled={creating}
                className="flex-1 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/20 px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={creating}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification Settings Modal */}
      {selectedEventForNotifications && (
        <NotificationSettingsModal
          isOpen={showNotificationModal}
          onClose={() => {
            setShowNotificationModal(false);
            setSelectedEventForNotifications(null);
          }}
          eventId={selectedEventForNotifications}
          onSave={(settings) => {
            console.log('Notification settings saved for event:', selectedEventForNotifications, settings);
          }}
        />
      )}
    </DashboardLayout>
  );
}