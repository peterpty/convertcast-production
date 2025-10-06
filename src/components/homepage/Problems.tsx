'use client';

import { motion } from 'framer-motion';
import { UserCheck, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

const problems = [
  {
    id: 1,
    problem: "Declining Attendance Rates",
    solution: "ShowUp Surge™",
    improvement: "50%+",
    gradient: "from-emerald-500 to-green-500",
    category: "Attendance Optimization",
    icon: UserCheck,
    description: "Traditional webinars struggle with no-shows. Our AI-powered reminder system and smart scheduling ensures maximum attendance."
  },
  {
    id: 2,
    problem: "Low Engagement & Energy",
    solution: "EngageMax™",
    improvement: "70%+",
    gradient: "from-purple-500 to-violet-500",
    category: "Engagement Engine",
    icon: Zap,
    description: "Keep your audience captivated with interactive features, real-time polling, and AI-driven engagement optimization."
  },
  {
    id: 3,
    problem: "Poor Conversion Rates",
    solution: "AutoOffer™",
    improvement: "50%+",
    gradient: "from-blue-500 to-cyan-500",
    category: "Conversion Accelerator",
    icon: TrendingUp,
    description: "Transform viewers into buyers with intelligent offer timing, personalized CTAs, and automated follow-up sequences."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3
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

export default function Problems() {
  const { shouldDisableBlur, shouldReduceAnimations } = usePerformanceMode();

  return (
    <section id="problems" className="py-16 sm:py-24 bg-slate-950 relative overflow-hidden">
      {/* Background Elements - Disabled on mobile for performance */}
      {!shouldDisableBlur && (
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 right-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
            animate={{ scale: [1, 0.8, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={shouldReduceAnimations ? false : { opacity: 0, y: 30 }}
          whileInView={shouldReduceAnimations ? false : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm font-medium">The 3 Critical Problems</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Why Most <span className="text-red-400">Webinars Fail</span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
            Traditional webinar platforms leave you struggling with the same three problems.
            ConvertCast solves them all with AI-powered solutions.
          </p>
        </motion.div>

        {/* Problems Grid */}
        <motion.div
          className="grid lg:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.id}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all duration-300"
                variants={cardVariants}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                {/* Problem Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-red-400 font-semibold text-sm uppercase tracking-wide">
                      Problem #{problem.id}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3">
                    {problem.problem}
                  </h3>

                  <p className="text-gray-400 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                {/* Solution Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${problem.gradient} rounded-lg flex items-center justify-center`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-300 font-semibold text-sm uppercase tracking-wide">
                      {problem.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-gradient-to-r ${problem.gradient} rounded-xl`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className={`text-2xl font-bold bg-gradient-to-r ${problem.gradient} bg-clip-text text-transparent`}>
                        {problem.solution}
                      </div>
                      <div className="text-gray-300 text-sm">
                        Improvement: <span className="font-semibold text-green-400">{problem.improvement}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Results Summary */}
        <motion.div
          className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <h3 className="text-3xl font-bold text-white mb-6">
            The ConvertCast Difference
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
                98%
              </div>
              <div className="text-gray-300">Show-up Rate</div>
              <div className="text-sm text-gray-500">vs. 20% industry average</div>
            </div>

            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-violet-500 bg-clip-text text-transparent">
                70%
              </div>
              <div className="text-gray-300">Engagement Rate</div>
              <div className="text-sm text-gray-500">vs. 15% industry average</div>
            </div>

            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                50%
              </div>
              <div className="text-gray-300">Higher Conversions</div>
              <div className="text-sm text-gray-500">vs. traditional platforms</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}