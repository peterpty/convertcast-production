'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Users,
  Star,
  CheckCircle,
  Play,
  Zap,
  Brain,
  Target,
  Bell,
  DollarSign,
  MessageSquare,
  ArrowRight,
  Shield,
  Award,
  TrendingUp
} from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  description: string;
  presenter: {
    name: string;
    title: string;
    avatar: string;
    bio: string;
  };
  schedule: {
    date: string;
    time: string;
    duration: number;
    timezone: string;
  };
  stats: {
    registered: number;
    capacity: number;
    rating: number;
  };
  benefits: string[];
  features: {
    name: string;
    description: string;
    icon: any;
  }[];
}

export default function EventRegistrationPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    company: '',
    role: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Mock event data - in production this would come from Supabase
  useEffect(() => {
    setTimeout(() => {
      setEventData({
        id: eventId,
        title: 'How to 10x Your Webinar Conversions with AI',
        description: 'Discover the exact strategies used by top marketers to achieve 300%+ conversion rates using ConvertCast\'s revolutionary AI-powered features. This exclusive masterclass reveals the proven framework behind our clients\' most successful campaigns.',
        presenter: {
          name: 'Sarah Johnson',
          title: 'VP of Growth, ConvertCast',
          avatar: '/api/placeholder/80/80',
          bio: 'Sarah has helped over 500+ companies increase their webinar conversions by an average of 245% using AI-powered optimization techniques.'
        },
        schedule: {
          date: '2024-10-25',
          time: '14:00',
          duration: 90,
          timezone: 'PST'
        },
        stats: {
          registered: 1247,
          capacity: 5000,
          rating: 4.9
        },
        benefits: [
          'Learn the 6 AI features that increased conversions by 300%+',
          'Get the exact templates and scripts we use internally',
          'Discover the psychology behind high-converting webinars',
          'Access to exclusive ConvertCast Pro features',
          'Live Q&A with industry experts',
          'Downloadable resources and action plan'
        ],
        features: [
          {
            name: 'ShowUp Surge™',
            description: '68.2% higher attendance with AI-powered notifications',
            icon: Bell
          },
          {
            name: 'EngageMax™',
            description: '78.5% engagement rate with real-time optimization',
            icon: Target
          },
          {
            name: 'AutoOffer™',
            description: '186% conversion boost with dynamic pricing',
            icon: DollarSign
          },
          {
            name: 'AI Live Chat',
            description: '94.8% satisfaction with intelligent support',
            icon: MessageSquare
          },
          {
            name: 'InsightEngine™',
            description: '93.7% prediction accuracy for optimal timing',
            icon: Brain
          },
          {
            name: 'SmartScheduler',
            description: '47% better timing optimization',
            icon: Zap
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [eventId]);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setRegistered(true);
    setIsRegistering(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Loading Event Details...
          </h2>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Event Not Found</h2>
          <p className="text-purple-200/80">This event may have been removed or the link is invalid.</p>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-green-500/30 rounded-3xl p-12 text-center shadow-2xl max-w-2xl"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">You're All Set!</h2>
          <p className="text-purple-200/80 text-lg mb-8 leading-relaxed">
            You've successfully registered for <strong>{eventData.title}</strong>. We've sent you a confirmation email with all the details.
          </p>

          <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-300">Date:</span>
                <span className="text-white">{new Date(eventData.schedule.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Time:</span>
                <span className="text-white">{eventData.schedule.time} {eventData.schedule.timezone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Duration:</span>
                <span className="text-white">{eventData.schedule.duration} minutes</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-purple-200/80 text-sm">
              Add this event to your calendar and we'll send you reminders as the date approaches.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                Add to Calendar
              </button>
              <button className="border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/20 px-6 py-3 rounded-xl font-semibold transition-all duration-200">
                Share Event
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            {/* Event Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  LIVE EVENT
                </div>
                <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                  LIMITED SEATS
                </div>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent mb-6 leading-tight">
                {eventData.title}
              </h1>

              <p className="text-xl text-purple-200/90 leading-relaxed max-w-3xl mx-auto mb-8">
                {eventData.description}
              </p>

              {/* Event Stats */}
              <div className="flex items-center justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{eventData.stats.registered.toLocaleString()}</div>
                  <div className="text-sm text-purple-300">Registered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 flex items-center gap-1">
                    {eventData.stats.rating}
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <div className="text-sm text-purple-300">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">FREE</div>
                  <div className="text-sm text-purple-300">Registration</div>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 inline-block">
                <div className="flex items-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span>{new Date(eventData.schedule.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span>{eventData.schedule.time} {eventData.schedule.timezone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span>{eventData.schedule.duration} min</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Registration Form & Benefits */}
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Secure Your FREE Seat</h2>
                <p className="text-purple-200/80">Join {eventData.stats.registered.toLocaleString()}+ professionals already registered</p>
              </div>

              <form onSubmit={handleRegistration} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={registrationForm.name}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={registrationForm.email}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="your.email@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Company</label>
                  <input
                    type="text"
                    value={registrationForm.company}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, company: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Job Role</label>
                  <select
                    value={registrationForm.role}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="">Select your role</option>
                    <option value="marketing">Marketing Manager</option>
                    <option value="sales">Sales Manager</option>
                    <option value="founder">Founder/CEO</option>
                    <option value="consultant">Consultant</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRegistering ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      Register FREE Now
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-xs text-purple-300/60">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Your information is secure and will never be shared
                  </p>
                </div>
              </form>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              {/* What You'll Learn */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-400" />
                  What You'll Learn
                </h3>
                <ul className="space-y-4">
                  {eventData.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-200/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Features */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                  Powered by ConvertCast AI
                </h3>
                <div className="grid gap-4">
                  {eventData.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <feature.icon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{feature.name}</div>
                        <div className="text-xs text-purple-300">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-purple-300/60 mt-4">
                  + 3 more exclusive AI features revealed during the event
                </p>
              </div>

              {/* Presenter */}
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6">Your Expert Presenter</h3>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {eventData.presenter.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{eventData.presenter.name}</h4>
                    <p className="text-purple-300 text-sm mb-2">{eventData.presenter.title}</p>
                    <p className="text-purple-200/80 text-sm">{eventData.presenter.bio}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}