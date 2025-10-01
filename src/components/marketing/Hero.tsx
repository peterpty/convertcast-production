'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, Users, TrendingUp, DollarSign } from 'lucide-react';

export function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-6">
                <span className="text-purple-300 text-sm font-medium">
                  🚀 Production Ready Webinar Platform
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                The Ultimate{' '}
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Zoom Killer
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-slate-300 mb-8 leading-relaxed">
                ConvertCast™ delivers{' '}
                <span className="text-purple-400 font-semibold">300% higher revenue</span>{' '}
                with 6 AI-powered features that transform ordinary webinars into conversion machines.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-6 h-6 text-green-400 mr-2" />
                    <span className="text-3xl font-bold text-white">70%</span>
                  </div>
                  <p className="text-slate-400 text-sm">Higher Attendance</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-blue-400 mr-2" />
                    <span className="text-3xl font-bold text-white">400%</span>
                  </div>
                  <p className="text-slate-400 text-sm">More Engagement</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-6 h-6 text-purple-400 mr-2" />
                    <span className="text-3xl font-bold text-white">300%</span>
                  </div>
                  <p className="text-slate-400 text-sm">Revenue Increase</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-2xl hover:shadow-purple-500/25 text-lg"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-4 rounded-xl text-lg"
                  onClick={() => setShowVideo(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center lg:justify-start space-x-6 mt-10 text-slate-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  <span className="text-sm">50K+ Users</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
                  <span className="text-sm">99.9% Uptime</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse" />
                  <span className="text-sm">AI-Powered</span>
                </div>
              </div>
            </div>

            {/* Right Content - Demo Video */}
            <div className="relative">
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                {!showVideo ? (
                  <>
                    {/* Video Thumbnail */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => setShowVideo(true)}
                        className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-2xl"
                      >
                        <Play className="w-8 h-8 text-white ml-1" />
                      </button>
                    </div>

                    {/* Demo UI Preview */}
                    <div className="absolute inset-4">
                      <div className="bg-slate-900/90 rounded-xl p-4 h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                          </div>
                          <div className="text-xs text-slate-400">Live Demo</div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded" />
                          <div className="h-3 bg-slate-700 rounded w-3/4" />
                          <div className="h-3 bg-slate-700 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-slate-400">Loading Demo...</p>
                    </div>
                  </div>
                )}

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg rotate-12 opacity-80" />
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg rotate-45 opacity-60" />
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl -z-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center">
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-purple-500 rounded-full mt-2 animate-bounce" />
          </div>
          <p className="text-slate-500 text-xs mt-2">Scroll to explore</p>
        </div>
      </div>
    </section>
  );
}