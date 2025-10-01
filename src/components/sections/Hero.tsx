'use client'

import { useState } from 'react'
import { Play, Zap, Users, TrendingUp, BarChart3, Target, Brain } from 'lucide-react'

export function Hero() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-purple-800/80 to-purple-700/80" />

      {/* Animated particles/dots */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
            🚀 Now Live: AI-Powered Webinar Revolution
          </div>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-up">
          The World's Most
          <br />
          <span className="text-gradient bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent animate-pulse">
            Intelligent Webinar
          </span>
          <br />
          Platform
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-up" style={{animationDelay: '0.2s'}}>
          ConvertCast combines cutting-edge AI with ultra-low latency streaming to deliver
          <span className="text-white font-semibold"> 50-70% higher attendance rates</span> and
          <span className="text-white font-semibold"> 3x more conversions</span> than any other platform.
        </p>

        {/* Feature highlights */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-up" style={{animationDelay: '0.4s'}}>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">50,000 Concurrent Users</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">&lt;5s Ultra-Low Latency</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">6 AI-Powered Features</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12" style={{animationDelay: '0.6s'}}>
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity min-w-[200px] flex items-center justify-center">
            Start Free Trial
            <TrendingUp className="ml-2 w-5 h-5" />
          </button>
          <button className="bg-white/10 border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors min-w-[200px] flex items-center justify-center">
            <Play className="mr-2 w-5 h-5" />
            Watch Demo (2 min)
          </button>
        </div>

        {/* Demo video placeholder */}
        <div className="max-w-4xl mx-auto animate-fade-up" style={{animationDelay: '0.8s'}}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-75 group-hover:opacity-100 blur-lg transition-opacity duration-300" />
            <div className="relative bg-black/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              {!isVideoPlaying ? (
                <div
                  className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl flex items-center justify-center cursor-pointer group/video hover:scale-105 transition-transform duration-300"
                  onClick={() => setIsVideoPlaying(true)}
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 group-hover/video:bg-white/30 transition-colors">
                    <Play className="w-12 h-12 text-white ml-1" />
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
                  <p className="text-white">Demo video would play here</p>
                </div>
              )}

              {/* Video stats overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-between items-end">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-white text-sm">
                      <span className="text-green-400 font-semibold">● LIVE</span> • 2,847 viewers
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        <span className="text-white text-sm font-semibold">Intent: 94%</span>
                      </div>
                    </div>
                    <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                        <span className="text-white text-sm font-semibold">Conv: 23%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-16 animate-fade-up" style={{animationDelay: '1s'}}>
          <p className="text-purple-200 text-sm mb-4">Trusted by 50,000+ marketers worldwide</p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            {/* Placeholder for company logos */}
            <div className="bg-white/20 rounded-lg px-6 py-3 text-white font-semibold text-sm">ClickFunnels</div>
            <div className="bg-white/20 rounded-lg px-6 py-3 text-white font-semibold text-sm">Leadpages</div>
            <div className="bg-white/20 rounded-lg px-6 py-3 text-white font-semibold text-sm">ConvertKit</div>
            <div className="bg-white/20 rounded-lg px-6 py-3 text-white font-semibold text-sm">Kajabi</div>
          </div>
        </div>
      </div>
    </section>
  )
}