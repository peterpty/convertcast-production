'use client'

import {
  Target,
  Zap,
  DollarSign,
  MessageCircle,
  BarChart3,
  Globe,
  TrendingUp,
  Users,
  Clock,
  Award,
  Sparkles,
  Rocket
} from 'lucide-react'

const features = [
  {
    icon: Target,
    name: 'ShowUp Surge™',
    tagline: 'AI Attendance Optimization',
    description: 'Advanced AI algorithms analyze viewer behavior patterns to optimize reminder sequences and increase show-up rates by 50-70%.',
    metrics: [
      { label: 'Attendance Boost', value: '+67%' },
      { label: 'No-Shows Reduced', value: '-82%' },
      { label: 'Revenue Impact', value: '+156%' }
    ],
    gradient: 'from-green-500 to-emerald-600',
    features: [
      'Behavioral pattern analysis',
      'Personalized reminder timing',
      'Smart incentive triggers',
      'Predictive attendance scoring'
    ]
  },
  {
    icon: Zap,
    name: 'EngageMax™',
    tagline: 'Interactive Engagement Engine',
    description: 'Real-time polls, quizzes, emoji reactions, and smart CTAs that automatically adapt based on audience engagement levels.',
    metrics: [
      { label: 'Engagement Increase', value: '+234%' },
      { label: 'Interaction Rate', value: '89%' },
      { label: 'Retention Boost', value: '+145%' }
    ],
    gradient: 'from-purple-500 to-violet-600',
    features: [
      'Live polls & quizzes',
      'Emoji reaction storms',
      'Smart CTA placement',
      'Gamification elements'
    ]
  },
  {
    icon: DollarSign,
    name: 'AutoOffer™',
    tagline: 'Dynamic Pricing & A/B Testing',
    description: 'AI-powered dynamic pricing with real-time A/B testing that optimizes offers based on viewer behavior and intent scoring.',
    metrics: [
      { label: 'Conversion Boost', value: '+189%' },
      { label: 'Revenue Per Lead', value: '+267%' },
      { label: 'Cart Recovery', value: '+78%' }
    ],
    gradient: 'from-orange-500 to-red-600',
    features: [
      'Dynamic pricing algorithms',
      'Real-time A/B testing',
      'Behavioral triggers',
      'Scarcity optimization'
    ]
  },
  {
    icon: MessageCircle,
    name: 'AI Live Chat',
    tagline: 'Synthetic Engagement & Social Proof',
    description: 'Intelligent chatbots create authentic social proof with synthetic messages while analyzing real viewer intent in real-time.',
    metrics: [
      { label: 'Social Proof', value: '+312%' },
      { label: 'Intent Accuracy', value: '94%' },
      { label: 'Response Time', value: '<0.3s' }
    ],
    gradient: 'from-blue-500 to-cyan-600',
    features: [
      'Synthetic social proof',
      'Intent signal detection',
      'Automated responses',
      'Sentiment analysis'
    ]
  },
  {
    icon: BarChart3,
    name: 'InsightEngine™',
    tagline: 'Predictive Analytics & Optimization',
    description: 'Advanced analytics that predict conversion likelihood, optimize content delivery, and provide real-time optimization recommendations.',
    metrics: [
      { label: 'Prediction Accuracy', value: '91%' },
      { label: 'ROI Improvement', value: '+423%' },
      { label: 'Data Points', value: '1M+' }
    ],
    gradient: 'from-pink-500 to-purple-600',
    features: [
      'Conversion predictions',
      'Content optimization',
      'Real-time recommendations',
      'Performance analytics'
    ]
  },
  {
    icon: Globe,
    name: 'SmartScheduler',
    tagline: 'Global Time Optimization',
    description: 'AI analyzes global audience data to recommend optimal scheduling times for maximum attendance across all time zones.',
    metrics: [
      { label: 'Global Reach', value: '180+ Countries' },
      { label: 'Time Accuracy', value: '96%' },
      { label: 'Attendance Boost', value: '+45%' }
    ],
    gradient: 'from-teal-500 to-green-600',
    features: [
      'Global time analysis',
      'Audience timezone mapping',
      'Optimal scheduling',
      'Regional preferences'
    ]
  }
]

export function Features() {
  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium inline-flex items-center mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Powered by Advanced AI
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            6 Breakthrough AI Features That
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent block">
              Crush The Competition
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            ConvertCast's proprietary AI suite delivers results that make other platforms look ancient.
            Each feature is designed to maximize your revenue and minimize your effort.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={feature.name}
              className="bg-white/5 border border-purple-200/20 rounded-lg p-6 group hover:scale-105 transition-all duration-300 hover:shadow-2xl backdrop-blur-sm"
            >
              <div className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.gradient}`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    #{index + 1} FEATURE
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.name}</h3>
                <p className="text-sm text-purple-400 font-semibold mb-3">{feature.tagline}</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-0">
                {/* Metrics */}
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {feature.metrics.map((metric) => (
                    <div key={metric.label} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                      <span className="text-xs text-gray-400">{metric.label}</span>
                      <span className="text-sm font-bold text-green-400">{metric.value}</span>
                    </div>
                  ))}
                </div>

                {/* Feature list */}
                <div className="space-y-2 mb-4">
                  {feature.features.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      <span className="text-xs text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full text-xs bg-white/10 border border-white/20 text-white py-2 px-4 rounded hover:bg-white/20 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA section */}
        <div className="text-center bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-3xl p-12 border border-purple-200/20">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-medium inline-flex items-center">
                <Rocket className="w-4 h-4 mr-2" />
                Limited Time: Early Access
              </div>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to 3x Your Webinar Revenue?
            </h3>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 50,000+ marketers already using ConvertCast to dominate their markets.
              Start your free trial and see results in your first webinar.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">67%</div>
                <div className="text-xs text-muted-foreground">Higher Attendance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">3.2x</div>
                <div className="text-xs text-muted-foreground">More Conversions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">156%</div>
                <div className="text-xs text-muted-foreground">Revenue Increase</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">50k+</div>
                <div className="text-xs text-muted-foreground">Happy Users</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center">
                <TrendingUp className="mr-2 w-5 h-5" />
                Start Free Trial - No Credit Card
              </button>
              <button className="bg-white/10 border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center">
                <Award className="mr-2 w-5 h-5" />
                Book Demo Call
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              ✅ 30-day free trial • ✅ Setup in 5 minutes • ✅ Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}