'use client';

import { motion } from 'framer-motion';
import { Sparkles, Play, ArrowRight } from 'lucide-react';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

export default function Hero() {
  const { shouldDisableBlur, shouldReduceAnimations, isMobile } = usePerformanceMode();

  return (
    <section className="min-h-screen relative flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      {/* Background Animated Elements - Disabled on mobile for performance */}
      {!shouldDisableBlur && (
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"
            animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{ y: [0, 10, 0], scale: [1, 0.95, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"
            animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content Column */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">AI-Powered Webinar Platform</span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              className="mb-6"
              initial={shouldReduceAnimations ? false : { opacity: 0, y: 30 }}
              animate={shouldReduceAnimations ? false : { opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-200 bg-clip-text text-transparent">
                  ConvertCast
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  takes the stress out
                </span>
                <br />
                <span className="text-white">of selling live</span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0"
              initial={shouldReduceAnimations ? false : { opacity: 0, y: 30 }}
              animate={shouldReduceAnimations ? false : { opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Stop leaving money on the table...{' '}
              <span className="font-semibold text-green-400">50% better conversion</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-12"
              initial={shouldReduceAnimations ? false : { opacity: 0, y: 30 }}
              animate={shouldReduceAnimations ? false : { opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <motion.button
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation"
                whileHover={shouldReduceAnimations ? {} : { scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Request an Invite
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-600 text-white rounded-lg font-semibold text-base sm:text-lg hover:border-gray-500 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation"
                whileHover={shouldReduceAnimations ? {} : { scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            >
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-400">50%</div>
                <div className="text-gray-400 text-sm">Higher Conversion</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-400">98%</div>
                <div className="text-gray-400 text-sm">Attendance Rate</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-400">15min</div>
                <div className="text-gray-400 text-sm">Setup Time</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Video Demo Column */}
          <motion.div
            className="relative mt-8 lg:mt-0"
            initial={shouldReduceAnimations ? false : { opacity: 0, scale: 0.8 }}
            animate={shouldReduceAnimations ? false : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1.0 }}
          >
            {/* Wistia Video Embed */}
            <div className="relative bg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src="https://fast.wistia.net/embed/iframe/9xhewqwxy9?seo=false&videoFoam=true"
                title="ConvertCast Demo"
                allow="autoplay; fullscreen"
                allowFullScreen
                loading="lazy"
                className="w-full h-56 sm:h-64 md:h-80 lg:h-96"
              />

              {/* Mock Webinar Interface Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Header - Hidden on small mobile */}
                <div className="absolute top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm p-2 sm:p-4 hidden xs:block">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-1">How to 10x Your Sales - Live AI Webinar</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <motion.div
                          className="w-2 h-2 bg-red-500 rounded-full"
                          animate={shouldReduceAnimations ? false : { scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className="text-red-400 text-xs sm:text-sm font-medium">LIVE</span>
                        <span className="text-gray-400 text-xs sm:text-sm">234 watching</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Preview - Hidden on mobile */}
                <div className="absolute bottom-0 right-0 w-48 sm:w-64 bg-slate-900/90 backdrop-blur-sm p-2 sm:p-3 space-y-2 hidden md:block">
                  <div className="text-xs text-gray-400">Chat Preview</div>
                  <div className="space-y-1 text-xs">
                    <div className="text-blue-300"><strong>Sarah:</strong> This is amazing!</div>
                    <div className="text-green-300"><strong>Mike:</strong> Already seeing results</div>
                    <div className="text-purple-300"><strong>Lisa:</strong> Where do I sign up?</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Achievement Badges - Simplified on mobile */}
            <motion.div
              className="absolute -top-4 sm:-top-6 -left-4 sm:-left-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg"
              animate={shouldReduceAnimations ? false : { y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="hidden sm:inline">98% attendance rate</span>
              <span className="sm:hidden">98% attend</span>
            </motion.div>
            <motion.div
              className="absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg"
              animate={shouldReduceAnimations ? false : { y: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="hidden sm:inline">AI-Powered Insights</span>
              <span className="sm:hidden">AI-Powered</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}