'use client';

import {
  Bell,
  Heart,
  ShoppingCart,
  MessageCircle,
  Brain,
  Calendar
} from 'lucide-react';

export function ConvertCastFeatures() {
  const features = [
    {
      name: "ShowUp Surge™",
      description: "AI-powered attendance optimization that increases show-up rates by 50-70% with intelligent reminder sequences.",
      icon: Bell,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/20"
    },
    {
      name: "EngageMax™",
      description: "Interactive experience engine delivering 70%+ engagement rates with real-time polls, quizzes, and gamification.",
      icon: Heart,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/20"
    },
    {
      name: "AutoOffer™",
      description: "Perfect-timing sales AI that increases conversions by 200-400% with dynamic pricing and behavioral triggers.",
      icon: ShoppingCart,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/20"
    },
    {
      name: "AI Live Chat",
      description: "Intelligent customer support providing instant, contextual responses that build trust and drive satisfaction.",
      icon: MessageCircle,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/20"
    },
    {
      name: "InsightEngine™",
      description: "Predictive analytics platform with 90%+ accuracy for attendance, engagement, and revenue optimization.",
      icon: Brain,
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-500/20"
    },
    {
      name: "SmartScheduler",
      description: "Global optimization system that maximizes attendance and revenue with AI-powered scheduling across time zones.",
      icon: Calendar,
      color: "from-teal-500 to-blue-500",
      bgColor: "bg-teal-500/20"
    }
  ];

  return (
    <section className="bg-gradient-to-b from-slate-900 via-purple-950 to-indigo-950 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              Even More{' '}
            </span>
            <span className="text-green-400">ConvertCast Features</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover the complete suite of advanced tools that transform ordinary webinars into
            high-converting revenue engines.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-purple-500/20 rounded-2xl p-8 hover:bg-gradient-to-br hover:from-purple-900/30 hover:to-indigo-900/30 hover:border-purple-400/40 transition-all duration-300 group hover:scale-105"
            >
              {/* Icon */}
              <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-8 h-8 text-transparent bg-gradient-to-r ${feature.color} bg-clip-text`} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-4">
                {feature.name}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Learn More Link */}
              <div className="mt-6 pt-4">
                <button className={`text-transparent bg-gradient-to-r ${feature.color} bg-clip-text font-semibold hover:underline transition-all duration-200`}>
                  Learn More →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-white mb-6">
            Get Access to All Features Today
          </h3>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Start your free trial and experience how all 6 AI-powered features work together to
            transform your webinar results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Free Trial Now
            </button>
            <button className="border border-purple-500/30 hover:bg-purple-900/20 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}