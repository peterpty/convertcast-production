'use client';

import { motion } from 'framer-motion';
import { Star, Target, ArrowRight, Users, Quote } from 'lucide-react';

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-32 left-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-32 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 0.7, 1], rotate: [0, -180, -360] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
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
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-green-400" fill="currentColor" />
            <span className="text-green-300 text-sm font-medium">Success Story</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            From <span className="text-red-400">$5K on Zoom</span> to{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              $45K with ConvertCast
            </span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how Rebecca transformed her struggling webinars into high-converting sales machines
          </p>
        </motion.div>

        {/* Main Case Study */}
        <motion.div
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl overflow-hidden mb-16"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.0 }}
        >
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left: Testimonial & Story */}
            <div className="p-8 lg:p-12">
              {/* Avatar & Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">RTY</span>
                </div>
                <div>
                  <div className="text-white font-bold text-xl">Rebecca T.Y.</div>
                  <div className="text-gray-400">Business Coach & Course Creator</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="mb-8">
                <Quote className="w-8 h-8 text-purple-400 mb-4" />
                <blockquote className="text-xl text-gray-300 leading-relaxed">
                  "I was ready to give up on webinars entirely. My Zoom sessions were disasters -
                  barely anyone showed up, and even fewer bought anything. ConvertCast completely
                  transformed my business. Now my webinars are my biggest revenue driver."
                </blockquote>
              </div>

              {/* Story Timeline */}
              <div className="space-y-6">
                {/* The Problem */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mt-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-400 mb-2">The Problem</h4>
                    <p className="text-gray-400 text-sm">
                      20% show-up rate, 1% conversion, losing money on every webinar
                    </p>
                  </div>
                </div>

                {/* ConvertCast Solution */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mt-1">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-400 mb-2">ConvertCast Solution</h4>
                    <p className="text-gray-400 text-sm">
                      AI reminders, EngageMax™ features, and AutoOffer™ timing
                    </p>
                  </div>
                </div>

                {/* The Results */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mt-1">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">The Results</h4>
                    <p className="text-gray-400 text-sm">
                      65% show-up rate, 900% conversion increase, $800K+ revenue in 12 months
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Results Display */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 lg:p-12 flex flex-col justify-center">
              {/* Big ROI Number */}
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-none mb-4">
                  900%
                </div>
                <div className="text-2xl font-semibold text-white">ROI Increase</div>
                <div className="text-gray-400">Single webinar revenue jump</div>
              </motion.div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 gap-6">
                <motion.div
                  className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  <div className="text-3xl font-bold text-green-400 mb-2">65%</div>
                  <div className="text-gray-300 font-medium mb-1">Show-up Rate</div>
                  <div className="text-sm text-gray-500">↑ from 20%</div>
                </motion.div>

                <motion.div
                  className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  <div className="text-3xl font-bold text-purple-400 mb-2">$45K</div>
                  <div className="text-gray-300 font-medium mb-1">Single Webinar</div>
                  <div className="text-sm text-gray-500">vs. $5K before</div>
                </motion.div>

                <motion.div
                  className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 text-center"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                >
                  <div className="text-3xl font-bold text-blue-400 mb-2">$800K+</div>
                  <div className="text-gray-300 font-medium mb-1">Revenue Generated</div>
                  <div className="text-sm text-gray-500">in 12 months</div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Webinars?
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join Rebecca and hundreds of other entrepreneurs who've revolutionized
            their live selling with ConvertCast
          </p>

          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started Today
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}