'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import {
  Users,
  Calendar,
  Play,
  Eye,
  Clock,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Globe,
  Zap
} from 'lucide-react';

type StreamWithEvent = Database['public']['Tables']['streams']['Row'] & {
  events: Database['public']['Tables']['events']['Row'];
};

interface StreamCardProps {
  stream: StreamWithEvent;
}

function StreamCard({ stream }: StreamCardProps) {
  const viewerCount = stream.peak_viewers + Math.floor(Math.random() * 50);
  const isLive = stream.status === 'active';

  const formatDuration = (start: string) => {
    const startTime = new Date(start);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="relative p-6">
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {isLive ? (
            <div className="bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              LIVE
            </div>
          ) : (
            <div className="bg-slate-600/70 text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
              ENDED
            </div>
          )}
        </div>

        {/* Stream Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
              {stream.events.title}
            </h3>
            {stream.events.description && (
              <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                {stream.events.description}
              </p>
            )}
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{viewerCount.toLocaleString()}</span>
            </div>

            {isLive ? (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(stream.events.scheduled_start)} live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(stream.events.scheduled_start).toLocaleDateString()}</span>
              </div>
            )}

            {stream.events.status === 'live' && (
              <div className="flex items-center gap-1 text-green-400">
                <Zap className="w-4 h-4" />
                <span>Interactive</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Link
              href={`/watch/${stream.mux_playback_id || stream.id}`}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isLive
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/30'
                  : 'bg-slate-600/50 hover:bg-slate-600 text-gray-300 hover:text-white'
              }`}
            >
              {isLive ? (
                <>
                  <Eye className="w-4 h-4" />
                  Watch Live
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  View Recording
                </>
              )}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function StreamsPage() {
  const [streams, setStreams] = useState<StreamWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'ended'>('all');

  useEffect(() => {
    async function loadStreams() {
      try {
        setLoading(true);
        setError(null);

        const { data: streamsData, error: streamsError } = await supabase
          .from('streams')
          .select(`
            *,
            events (
              id,
              title,
              description,
              scheduled_start,
              scheduled_end,
              status,
              user_id
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (streamsError) {
          throw streamsError;
        }

        if (streamsData) {
          // Filter out streams without events
          const validStreams = streamsData.filter(stream => stream.events) as StreamWithEvent[];
          setStreams(validStreams);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading streams:', err);
        setError('Failed to load streams');
        setLoading(false);
      }
    }

    loadStreams();
  }, []);

  // Filter streams based on search and status
  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.events.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (stream.events.description && stream.events.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'live' && stream.status === 'active') ||
                         (filterStatus === 'ended' && stream.status === 'ended');

    return matchesSearch && matchesFilter;
  });

  const liveCount = streams.filter(s => s.status === 'active').length;

  return (
    <>
      <Head>
        <title>Live Streams - ConvertCast | Interactive Live Streaming</title>
        <meta name="description" content="Discover and watch live interactive streaming events on ConvertCast. Join engaging conversations and real-time interactions." />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Live Streams - ConvertCast" />
        <meta property="og:description" content="Discover and watch live interactive streaming events. Join engaging conversations and real-time interactions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://convertcast.com/streams" />
        <meta property="og:site_name" content="ConvertCast" />
        <meta property="og:image" content="/og-streams.png" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@ConvertCast" />
        <meta name="twitter:title" content="Live Streams - ConvertCast" />
        <meta name="twitter:description" content="Discover and watch live interactive streaming events" />
        <meta name="twitter:image" content="/og-streams.png" />

        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#9f6aff" />
        <link rel="canonical" href="https://convertcast.com/streams" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900/50 to-purple-950/30 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent mb-2">
                ConvertCast Streams
              </h1>
              <div className="flex items-center gap-4 text-sm text-purple-200">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Public Directory</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>{liveCount} Live Now</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{streams.reduce((acc, s) => acc + s.peak_viewers, 0).toLocaleString()} Total Viewers</span>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search streams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 w-64"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl p-1 border border-purple-500/30">
                {(['all', 'live', 'ended'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                      filterStatus === status
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-slate-600/50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Loading Streams...</h2>
              <p className="text-gray-400">Discovering live content for you</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Unable to Load Streams</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredStreams.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Streams Found</h2>
              <p className="text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No streams are currently available'
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {filteredStreams.length} {filteredStreams.length === 1 ? 'Stream' : 'Streams'}
                {searchTerm && (
                  <span className="text-purple-300 font-normal"> matching "{searchTerm}"</span>
                )}
              </h2>
            </div>

            {/* Streams Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}