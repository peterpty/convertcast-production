'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Zap,
  TrendingUp,
  MessageCircle,
  BarChart3,
  Calendar,
  X,
  Play,
  Check,
  Target,
  Users,
  Clock
} from 'lucide-react';

const features = [
  {
    id: 1,
    name: "ShowUp Surge™",
    benefit: "Never Feel Empty",
    improvement: "50-70%",
    category: "Acquisition",
    gradient: "from-emerald-500 to-green-500",
    icon: UserCheck,
    description: "AI-powered reminder system that ensures maximum attendance",
    keyFeatures: [
      "Smart reminder sequences",
      "Personalized messaging",
      "Optimal timing detection",
      "Multi-channel notifications"
    ],
    metrics: {
      "Show-up Rate": "98%",
      "Reminder Open Rate": "85%",
      "Last-minute Registrations": "40%"
    }
  },
  {
    id: 2,
    name: "EngageMax™",
    benefit: "Captivated Audiences",
    improvement: "70%+",
    category: "Engagement",
    gradient: "from-purple-500 to-violet-500",
    icon: Zap,
    description: "Keep your audience engaged with interactive AI-powered features",
    keyFeatures: [
      "Real-time engagement scoring",
      "Interactive polls & Q&A",
      "Attention monitoring",
      "Dynamic content adaptation"
    ],
    metrics: {
      "Engagement Rate": "89%",
      "Average Watch Time": "47min",
      "Interaction Rate": "73%"
    }
  },
  {
    id: 3,
    name: "AutoOffer™",
    benefit: "Effortless Sales",
    improvement: "50%+",
    category: "Conversion",
    gradient: "from-blue-500 to-cyan-500",
    icon: TrendingUp,
    description: "Intelligent offer timing and personalized sales sequences",
    keyFeatures: [
      "AI-powered offer timing",
      "Dynamic pricing display",
      "Urgency optimization",
      "Automated follow-up"
    ],
    metrics: {
      "Conversion Rate": "23%",
      "Average Order Value": "$497",
      "Cart Recovery": "67%"
    }
  },
  {
    id: 4,
    name: "AI Live Chat",
    benefit: "Authentic Feel",
    improvement: "10x",
    category: "Engagement",
    gradient: "from-pink-500 to-rose-500",
    icon: MessageCircle,
    description: "Natural AI responses that feel completely human",
    keyFeatures: [
      "Context-aware responses",
      "Emotional intelligence",
      "Brand voice matching",
      "Multilingual support"
    ],
    metrics: {
      "Response Rate": "95%",
      "Satisfaction Score": "4.8/5",
      "Resolution Time": "30sec"
    }
  },
  {
    id: 5,
    name: "InsightEngine™",
    benefit: "Crystal Clear Vision",
    improvement: "90%+",
    category: "Analytics",
    gradient: "from-orange-500 to-amber-500",
    icon: BarChart3,
    description: "Deep analytics and actionable insights for optimization",
    keyFeatures: [
      "Real-time analytics dashboard",
      "Conversion tracking",
      "Audience insights",
      "Performance predictions"
    ],
    metrics: {
      "Data Accuracy": "99.2%",
      "Insight Generation": "Real-time",
      "ROI Tracking": "Complete"
    }
  },
  {
    id: 6,
    name: "SmartScheduler",
    benefit: "Worldwide Connection",
    improvement: "Global",
    category: "Automation",
    gradient: "from-indigo-500 to-blue-500",
    icon: Calendar,
    description: "Intelligent scheduling across all time zones",
    keyFeatures: [
      "Global timezone optimization",
      "Audience preference learning",
      "Automated rescheduling",
      "Calendar integrations"
    ],
    metrics: {
      "Scheduling Efficiency": "95%",
      "Timezone Coverage": "24/7",
      "Booking Rate": "78%"
    }
  }
];

export default function FeatureShowcase() {
  const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section id="features" className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">AI-Powered Features</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Six <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Game-Changing
            </span> Features
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Each feature is designed to solve a specific problem and multiply your results.
            Click any feature to see how it transforms your webinars.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                className="group cursor-pointer"
                variants={cardVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => setSelectedFeature(feature)}
              >
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full hover:border-slate-600 transition-all duration-300 group-hover:shadow-xl">
                  {/* Icon and Category */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 bg-gradient-to-r ${feature.gradient} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        {feature.category}
                      </div>
                      <div className={`text-sm font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                        {feature.improvement}
                      </div>
                    </div>
                  </div>

                  {/* Feature Name */}
                  <h3 className={`text-2xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-2`}>
                    {feature.name}
                  </h3>

                  {/* Benefit */}
                  <div className="text-lg font-semibold text-white mb-3">
                    {feature.benefit}
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Learn More Button */}
                  <div className="flex items-center gap-2 text-blue-400 font-medium text-sm group-hover:gap-3 transition-all duration-300">
                    <span>Learn More</span>
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Feature Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFeature(null)}
          >
            <motion.div
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-gradient-to-r ${selectedFeature.gradient} rounded-xl`}>
                    <selectedFeature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold bg-gradient-to-r ${selectedFeature.gradient} bg-clip-text text-transparent`}>
                      {selectedFeature.name}
                    </h3>
                    <p className="text-gray-400">{selectedFeature.benefit}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-8">
                {/* Video Demo Placeholder */}
                <div className="bg-slate-800 rounded-xl p-8 text-center">
                  <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Feature Demo Video</p>
                  <p className="text-sm text-gray-500 mt-2">See {selectedFeature.name} in action</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Key Features */}
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400" />
                      Key Features
                    </h4>
                    <ul className="space-y-3">
                      {selectedFeature.keyFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Performance Metrics */}
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      Performance Metrics
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(selectedFeature.metrics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                          <span className="text-gray-300">{key}</span>
                          <span className={`font-bold bg-gradient-to-r ${selectedFeature.gradient} bg-clip-text text-transparent`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center pt-6 border-t border-slate-700">
                  <motion.button
                    className={`px-8 py-4 bg-gradient-to-r ${selectedFeature.gradient} text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedFeature(null)}
                  >
                    Get Started with {selectedFeature.name}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}