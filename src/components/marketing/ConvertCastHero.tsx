'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';

export function ConvertCastHero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZG90cykiLz48L3N2Zz4=')] opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-20 flex items-center min-h-screen">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-purple-300 mr-2" />
              <span className="text-purple-200 text-sm font-medium">
                ✨ AI-Powered Webinar Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl lg:text-7xl font-bold mb-8 leading-tight"
            >
              <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                ConvertCast
              </span>{' '}
              <span className="text-white">takes the stress out of</span>{' '}
              <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                selling live
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl text-purple-100/90 mb-8 leading-relaxed max-w-xl"
            >
              Stop leaving money on the table with basic webinar tools.{' '}
              <span className="bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-300 bg-clip-text text-transparent font-semibold">
                ConvertCast's AI-powered platform
              </span>{' '}
              converts{' '}
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent font-bold text-2xl">
                50% better
              </span>{' '}
              than traditional solutions.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="grid grid-cols-3 gap-6 mb-10"
            >
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">50%</div>
                <div className="text-sm text-purple-300">Higher Conversion</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">98%</div>
                <div className="text-sm text-purple-300">Attendance Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">15min</div>
                <div className="text-sm text-purple-300">Setup Time</div>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/auth/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group"
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg shadow-2xl hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Request an Invite
                  </Button>
                </motion.div>
              </Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-400/50 text-white hover:bg-purple-500/10 px-8 py-4 rounded-xl text-lg backdrop-blur-sm"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Content - Modern Interface Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Main Interface Card */}
            <motion.div
              className="relative bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Attendance Badge */}
              <motion.div
                className="absolute -top-4 right-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
              >
                <span className="mr-2">🎯</span>
                98% attendance rate
              </motion.div>

              {/* Video Interface */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl mb-6 aspect-video relative overflow-hidden border border-purple-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20" />

                {/* Live Badge */}
                <motion.div
                  className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center text-sm font-bold"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-white rounded-full mr-2" />
                  LIVE
                </motion.div>

                {/* Webinar Title */}
                <div className="absolute top-4 left-4">
                  <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                    <div className="text-sm font-semibold">How to 10x Your Sales</div>
                    <div className="text-xs text-purple-300">Live AI Webinar</div>
                  </div>
                </div>

                {/* Center Play Button */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl cursor-pointer">
                    <Play className="w-10 h-10 text-white ml-2" />
                  </div>
                </motion.div>

                {/* Viewer Counter */}
                <motion.div
                  className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Users className="w-4 h-4 mr-2 text-purple-300" />
                  <span className="text-sm font-semibold">234 watching</span>
                </motion.div>
              </div>

              {/* Chat Preview */}
              <div className="space-y-3 mb-6">
                {[
                  { name: "Sarah M.", message: "This is exactly what I needed! 🔥", color: "purple" },
                  { name: "Mike R.", message: "Amazing conversion tips!", color: "blue" },
                  { name: "Lisa K.", message: "When is the next session?", color: "pink" }
                ].map((chat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1 + index * 0.2 }}
                    className="flex items-center space-x-3"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-r from-${chat.color}-500 to-${chat.color}-600 rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{chat.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{chat.name}</div>
                      <div className="text-sm text-purple-200">{chat.message}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Insights Badge */}
              <motion.div
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-center font-semibold"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                AI-Powered Insights
              </motion.div>
            </motion.div>

            {/* Floating Glow Effects */}
            <motion.div
              className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}