'use client';

import { motion } from 'framer-motion';
import { X, CheckCircle, TrendingDown, Users, DollarSign } from 'lucide-react';

const problems = [
  {
    icon: TrendingDown,
    title: "Low Attendance Rates",
    description: "Traditional webinars see 40-50% no-show rates, wasting your marketing spend.",
    solution: "ShowUp Surge™ increases attendance by 50-70% with AI-powered reminder sequences.",
    color: "from-red-500 to-orange-500"
  },
  {
    icon: Users,
    title: "Poor Engagement",
    description: "Viewers lose interest within minutes, leading to early drop-offs and missed opportunities.",
    solution: "EngageMax™ delivers 70%+ engagement rates with interactive AI-powered experiences.",
    color: "from-orange-500 to-yellow-500"
  },
  {
    icon: DollarSign,
    title: "Low Conversion Rates",
    description: "Most webinars convert less than 2% of attendees into paying customers.",
    solution: "AutoOffer™ increases conversions by 200-400% with perfect-timing AI recommendations.",
    color: "from-yellow-500 to-green-500"
  }
];

export function Problems() {
  return (
    <section id="problems" className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-800/30" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNkb3RzKSIvPjwvc3ZnPg==')] opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Why Most Webinars{' '}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Fail Miserably
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Traditional webinar platforms leave millions on the table. Here's how ConvertCast™
            transforms these critical failure points into revenue opportunities.
          </p>
        </motion.div>

        {/* Problems Grid */}
        <div className="max-w-6xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`mb-12 ${index % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12 lg:text-right'}`}
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
                <div className={`flex items-start gap-6 ${index % 2 === 0 ? '' : 'lg:flex-row-reverse lg:text-right'}`}>
                  {/* Problem Side */}
                  <div className="flex-1">
                    <div className={`flex items-center gap-4 mb-4 ${index % 2 === 0 ? '' : 'lg:flex-row-reverse lg:justify-start'}`}>
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${problem.color}`}>
                        <problem.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <X className="w-5 h-5 text-red-400" />
                          <span className="text-red-400 font-semibold">PROBLEM</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white">{problem.title}</h3>
                      </div>
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed">
                      {problem.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="hidden lg:block w-px h-24 bg-gradient-to-b from-slate-600 to-transparent" />

                  {/* Solution Side */}
                  <div className="flex-1 mt-6 lg:mt-0">
                    <div className={`flex items-center gap-4 mb-4 ${index % 2 === 0 ? '' : 'lg:flex-row-reverse lg:justify-start'}`}>
                      <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-semibold">SOLUTION</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white">ConvertCast™ Fix</h3>
                      </div>
                    </div>
                    <p className="text-slate-300 text-lg leading-relaxed">
                      {problem.solution}
                    </p>
                  </div>
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
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-6">
            <span className="text-purple-300 font-medium">
              🎯 Ready to fix these problems forever?
            </span>
          </div>

          <h3 className="text-3xl font-bold text-white mb-4">
            Turn Your Webinar Failures Into{' '}
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Revenue Machines
            </span>
          </h3>

          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Join 50,000+ streamers who've already transformed their webinars with ConvertCast™'s
            AI-powered solution suite.
          </p>
        </motion.div>
      </div>
    </section>
  );
}