'use client';

import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Users, Zap } from 'lucide-react';

export function ConvertCastProblems() {
  const problems = [
    {
      title: "Platform Limitations",
      description: "Most webinar platforms can't handle high conversion selling processes. They lack the bandwidth and features needed for serious revenue generation.",
      color: "from-purple-500 to-purple-600",
      icon: CheckCircle,
      textColor: "text-purple-100",
      bgGlow: "bg-purple-500/10"
    },
    {
      title: "Technical Complexity",
      description: "Setting up webinars shouldn't require a technical degree. Stop wrestling with complicated systems that slow down your sales process.",
      color: "from-blue-500 to-blue-600",
      icon: AlertTriangle,
      textColor: "text-blue-100",
      bgGlow: "bg-blue-500/10"
    },
    {
      title: "Poor Engagement Tools",
      description: "Basic webinar tools don't convert. You need advanced engagement features that actually drive purchasing decisions and close deals.",
      color: "from-pink-500 to-pink-600",
      icon: Users,
      textColor: "text-pink-100",
      bgGlow: "bg-pink-500/10"
    }
  ];

  return (
    <section className="relative bg-gradient-to-b from-slate-900 via-purple-950 to-indigo-950 py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              We Fix The Problems
            </span>{' '}
            <span className="bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              ALL Webinars
            </span>{' '}
            <span className="text-white">Suffer From</span>
          </h2>
          <p className="text-xl text-purple-200/80 max-w-4xl mx-auto leading-relaxed">
            These critical problems destroy conversion rates. Most platforms can't deliver the bandwidth
            or features you need for serious revenue generation.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="group relative"
            >
              {/* Card Background */}
              <div className={`absolute inset-0 ${problem.bgGlow} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className={`relative bg-gradient-to-br ${problem.color} rounded-3xl p-8 text-center shadow-2xl border border-white/10 backdrop-blur-sm`}>
                <div className="mb-8">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <problem.icon className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {problem.title}
                  </h3>
                </div>

                <p className={`${problem.textColor} text-lg leading-relaxed mb-8`}>
                  {problem.description}
                </p>

                {/* Solution Indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="pt-6 border-t border-white/20"
                >
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Zap className="w-5 h-5 text-white mr-2" />
                    </motion.div>
                    <span className="text-white font-semibold">ConvertCast Solves This</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-20"
        >
          <p className="text-purple-200 text-lg mb-8 max-w-2xl mx-auto">
            Stop letting these problems kill your webinar revenue. Transform your results today.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all duration-200 shadow-2xl hover:shadow-purple-500/25"
          >
            <Zap className="w-5 h-5 inline mr-2" />
            Fix These Problems Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}