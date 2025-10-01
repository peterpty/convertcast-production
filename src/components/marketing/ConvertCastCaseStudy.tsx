'use client';

import { motion } from 'framer-motion';
import { Star, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

export function ConvertCastCaseStudy() {
  return (
    <section className="bg-gradient-to-b from-slate-900 via-purple-950 to-indigo-950 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">From</span>{' '}
            <span className="text-red-400">$5K on Zoom</span>{' '}
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">to</span>{' '}
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">$45K with ConvertCast</span>
          </h2>

          {/* ROI Display */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
            className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl px-6 py-4 mb-12 shadow-2xl"
          >
            <div className="text-3xl lg:text-4xl font-bold text-white mb-1">900% ROI</div>
            <div className="text-sm text-purple-100">Return on Investment</div>
          </motion.div>
        </div>

        {/* Case Study Content */}
        <div className="max-w-4xl mx-auto">
          {/* Testimonial */}
          <div className="bg-slate-900 rounded-2xl p-8 mb-12">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">RT</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Meet Rebecca T.Y.</h3>
                <div className="flex items-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-400">Marketing Director, SaaS Company</p>
              </div>
            </div>

            <blockquote className="text-lg text-gray-300 leading-relaxed italic">
              "I was struggling with Zoom webinars that barely converted. After switching to ConvertCast,
              our first webinar generated $45K in sales. The engagement tools and automated follow-up
              sequences completely transformed our results. This platform literally changed our business."
            </blockquote>
          </div>

          {/* Problem-Solution-Result Breakdown */}
          <div className="space-y-6">
            {/* The Problem */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-bold text-red-400">The Problem</h4>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Rebecca was using Zoom for webinars but struggled with low engagement, poor conversion rates,
                and technical issues. Her webinars were generating only $5K in revenue despite having good content
                and a solid product offering.
              </p>
            </div>

            {/* ConvertCast Solution */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-bold text-purple-400">ConvertCast Solution</h4>
              </div>
              <p className="text-gray-300 leading-relaxed">
                ConvertCast provided advanced engagement tools, automated sales sequences, and conversion-optimized
                interfaces. Rebecca could focus on presenting while the platform handled technical aspects and
                guided prospects through the buying process seamlessly.
              </p>
            </div>

            {/* The Result */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-bold text-green-400">The Result</h4>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                First webinar with ConvertCast generated $45K in sales - a 900% increase. Rebecca now consistently
                runs high-converting webinars and has scaled her business significantly using ConvertCast's
                automation and optimization features.
              </p>

              {/* Result Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">$45K</div>
                  <div className="text-sm text-gray-400">First Webinar</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">300%</div>
                  <div className="text-sm text-gray-400">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">85%</div>
                  <div className="text-sm text-gray-400">Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">12x</div>
                  <div className="text-sm text-gray-400">Revenue Growth</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-6">
              Ready to Transform Your Webinar Results?
            </h3>
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Your Success Story
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}