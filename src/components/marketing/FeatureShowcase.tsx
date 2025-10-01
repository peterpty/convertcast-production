'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Heart,
  ShoppingCart,
  MessageCircle,
  Brain,
  Calendar,
  X,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Target,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const features = [
  {
    id: 'showup-surge',
    name: 'ShowUp Surge™',
    tagline: 'AI Attendance Optimizer',
    description: 'Increase attendance rates by 50-70% with intelligent reminder sequences and optimal scheduling.',
    icon: Bell,
    color: 'from-blue-500 to-cyan-500',
    stats: [
      { label: 'Attendance Boost', value: '70%', icon: TrendingUp },
      { label: 'Reminder Sequences', value: '12+', icon: Bell },
      { label: 'Channels', value: '8', icon: MessageCircle }
    ],
    details: [
      'AI-powered reminder optimization',
      'Multi-channel notifications (Email, SMS, WhatsApp, Push)',
      'Behavioral trigger analysis',
      'Time zone intelligent scheduling',
      'Abandoned registration recovery'
    ],
    demo: 'Watch how ShowUp Surge™ transforms no-shows into attendees with perfect timing.'
  },
  {
    id: 'engagemax',
    name: 'EngageMax™',
    tagline: 'Interactive Experience Engine',
    description: 'Achieve 70%+ engagement rates with real-time polls, quizzes, and gamified experiences.',
    icon: Heart,
    color: 'from-purple-500 to-pink-500',
    stats: [
      { label: 'Engagement Rate', value: '70%+', icon: Heart },
      { label: 'Interactive Features', value: '15+', icon: Zap },
      { label: 'Response Time', value: '<1s', icon: Clock }
    ],
    details: [
      'Real-time polls and Q&A',
      'Interactive quizzes with scoring',
      'Emoji reactions and feedback',
      'Gamification elements',
      'Social sharing integration'
    ],
    demo: 'Experience how EngageMax™ keeps viewers glued to their screens throughout your webinar.'
  },
  {
    id: 'autooffer',
    name: 'AutoOffer™',
    tagline: 'Perfect-Timing Sales AI',
    description: 'Increase conversions by 200-400% with AI-powered offer timing and dynamic pricing.',
    icon: ShoppingCart,
    color: 'from-green-500 to-emerald-500',
    stats: [
      { label: 'Conversion Boost', value: '400%', icon: DollarSign },
      { label: 'Perfect Timing', value: '90%+', icon: Target },
      { label: 'Dynamic Pricing', value: 'Real-time', icon: TrendingUp }
    ],
    details: [
      'AI-powered perfect moment detection',
      'Dynamic pricing optimization',
      'Behavioral trigger analysis',
      'Urgency and scarcity tactics',
      'One-click checkout integration'
    ],
    demo: 'See AutoOffer™ identify the perfect moment to present offers for maximum conversions.'
  },
  {
    id: 'ai-chat',
    name: 'AI Live Chat',
    tagline: 'Intelligent Customer Support',
    description: 'Provide instant, contextual responses that build trust and drive 10x customer satisfaction.',
    icon: MessageCircle,
    color: 'from-orange-500 to-red-500',
    stats: [
      { label: 'Response Time', value: '<2s', icon: Clock },
      { label: 'Accuracy Rate', value: '95%+', icon: Target },
      { label: 'Satisfaction', value: '10x', icon: Users }
    ],
    details: [
      'Contextual AI responses',
      'Real-time sentiment analysis',
      'Escalation to human support',
      'Multi-language support',
      'Chat history and analytics'
    ],
    demo: 'Watch AI Live Chat handle complex questions and build trust instantly.'
  },
  {
    id: 'insightengine',
    name: 'InsightEngine™',
    tagline: 'Predictive Analytics Platform',
    description: 'Get 90%+ accurate predictions for attendance, engagement, and revenue optimization.',
    icon: Brain,
    color: 'from-indigo-500 to-purple-500',
    stats: [
      { label: 'Prediction Accuracy', value: '90%+', icon: Brain },
      { label: 'Data Points', value: '500+', icon: TrendingUp },
      { label: 'Real-time Alerts', value: 'Instant', icon: Bell }
    ],
    details: [
      'Pre-event attendance forecasting',
      'Real-time engagement scoring',
      'Revenue prediction modeling',
      'Optimization recommendations',
      'Performance benchmarking'
    ],
    demo: 'Discover how InsightEngine™ predicts and optimizes your webinar performance.'
  },
  {
    id: 'smartscheduler',
    name: 'SmartScheduler',
    tagline: 'Global Optimization System',
    description: 'Maximize attendance and revenue with AI-powered scheduling across all time zones.',
    icon: Calendar,
    color: 'from-teal-500 to-blue-500',
    stats: [
      { label: 'Time Zones', value: '40+', icon: Clock },
      { label: 'Optimization', value: 'AI-Powered', icon: Brain },
      { label: 'Revenue Lift', value: '35%+', icon: DollarSign }
    ],
    details: [
      'Global time zone optimization',
      'Audience behavior analysis',
      'Peak engagement timing',
      'Automated scheduling suggestions',
      'Multi-session coordination'
    ],
    demo: 'See SmartScheduler find the perfect time for maximum global attendance.'
  }
];

export function FeatureShowcase() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeature(featureId);
  };

  const closeModal = () => {
    setSelectedFeature(null);
  };

  const currentFeature = features.find(f => f.id === selectedFeature);

  return (
    <section id="showcase" className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/10 to-blue-900/10" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-6">
            <span className="text-purple-300 font-medium">
              🤖 AI-Powered Feature Suite
            </span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            6 Branded Features That{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Dominate Webinars
            </span>
          </h2>

          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Each feature is powered by advanced AI and delivers measurable results.
            Click any feature to see it in action.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => handleFeatureClick(feature.id)}
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                {/* Feature Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color}`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-slate-500 group-hover:text-slate-400 transition-colors">
                    →
                  </div>
                </div>

                {/* Feature Info */}
                <h3 className="text-xl font-bold text-white mb-2">{feature.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{feature.tagline}</p>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Stats */}
                <div className="space-y-3">
                  {feature.stats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <stat.icon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">{stat.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Experience the{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Ultimate Webinar Platform?
            </span>
          </h3>

          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Join 50,000+ streamers already using ConvertCast™ to deliver exceptional webinar experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-xl text-lg"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-4 rounded-xl text-lg"
              >
                View Live Demo
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Feature Modal */}
      <AnimatePresence>
        {selectedFeature && currentFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Modal Content */}
              <div className="flex items-start gap-6 mb-6">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${currentFeature.color}`}>
                  <currentFeature.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{currentFeature.name}</h2>
                  <p className="text-lg text-slate-400">{currentFeature.tagline}</p>
                </div>
              </div>

              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                {currentFeature.demo}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {currentFeature.stats.map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-slate-700/50 rounded-xl">
                    <stat.icon className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Feature Details */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Key Capabilities</h3>
                <ul className="space-y-3">
                  {currentFeature.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                      <span className="text-slate-300">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="flex gap-4">
                <Link href="/auth/signup" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3">
                    Try {currentFeature.name}
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                    Live Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}