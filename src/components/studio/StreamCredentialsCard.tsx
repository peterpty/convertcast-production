'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Key,
  Server,
  Download,
  HelpCircle
} from 'lucide-react';

interface StreamCredentialsCardProps {
  streamKey: string | null;
  rtmpServerUrl: string | null;
  streamId: string;
  onRefreshKey?: () => Promise<void>;
  isRefreshing?: boolean;
}

export function StreamCredentialsCard({
  streamKey,
  rtmpServerUrl,
  streamId,
  onRefreshKey,
  isRefreshing = false
}: StreamCredentialsCardProps) {
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Debug: Log props when they change
  console.log('🔐 StreamCredentialsCard props:', {
    streamKey: streamKey ? streamKey.substring(0, 8) + '...' : 'NULL',
    rtmpServerUrl: rtmpServerUrl || 'NULL',
    streamId,
    hasStreamKey: !!streamKey,
    hasRtmpUrl: !!rtmpServerUrl
  });

  const handleCopyKey = async () => {
    if (!streamKey) return;
    await navigator.clipboard.writeText(streamKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = async () => {
    if (!rtmpServerUrl) return;
    await navigator.clipboard.writeText(rtmpServerUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleRefresh = async () => {
    if (!onRefreshKey) return;

    setRefreshError(null);
    setRefreshSuccess(false);

    try {
      await onRefreshKey();

      // Success!
      setRefreshSuccess(true);

      // Close modal after short delay to show success state
      setTimeout(() => {
        setShowRefreshConfirm(false);
        // Keep success banner visible for longer
        setTimeout(() => {
          setRefreshSuccess(false);
        }, 3000);
      }, 1500);

    } catch (error) {
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh stream key';
      setRefreshError(errorMessage);
      console.error('❌ Stream key refresh failed:', error);

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setRefreshError(null);
      }, 5000);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const hasCredentials = streamKey && rtmpServerUrl;

  console.log('🔐 StreamCredentialsCard hasCredentials check:', {
    hasCredentials: !!hasCredentials,
    streamKeyCheck: !!streamKey,
    rtmpServerUrlCheck: !!rtmpServerUrl,
    streamKeyType: typeof streamKey,
    rtmpServerUrlType: typeof rtmpServerUrl,
    streamKeyValue: streamKey,
    rtmpServerUrlValue: rtmpServerUrl
  });

  return (
    <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">OBS Connection Settings</h4>
            <p className="text-purple-300 text-xs">Your unique streaming credentials</p>
          </div>
        </div>
        {hasCredentials && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-semibold">READY</span>
          </div>
        )}
      </div>

      {/* Success Banner (shown briefly after refresh) */}
      <AnimatePresence>
        {refreshSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-200 text-sm font-medium">
                Stream key refreshed! Update OBS with the new key.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasCredentials ? (
        /* No Credentials State */
        <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-yellow-300 text-sm mb-2">Stream credentials not available</p>
          <p className="text-yellow-200/70 text-xs">
            Create a new stream or contact support if this persists
          </p>
        </div>
      ) : (
        <>
          {/* RTMP Server URL */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-purple-400" />
              <label className="text-purple-300 text-xs font-medium">RTMP Server URL</label>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2">
                <div className="text-white font-mono text-xs break-all select-all">
                  {rtmpServerUrl}
                </div>
              </div>
              <button
                onClick={handleCopyUrl}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 hover:text-white rounded-lg transition-all duration-200"
                title="Copy RTMP URL"
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Stream Key */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                <label className="text-purple-300 text-xs font-medium">Stream Key</label>
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                className="flex items-center gap-1 text-purple-300 hover:text-purple-200 text-xs transition-colors"
              >
                {showKey ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    Show
                  </>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-900/60 border border-slate-600/50 rounded-lg px-3 py-2">
                <div className="text-white font-mono text-xs break-all select-all">
                  {showKey ? streamKey : maskKey(streamKey)}
                </div>
              </div>
              <button
                onClick={handleCopyKey}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 hover:text-white rounded-lg transition-all duration-200"
                title="Copy Stream Key"
              >
                {copiedKey ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-200 hover:text-white rounded-lg text-xs font-medium transition-all duration-200"
            >
              <HelpCircle className="w-4 h-4" />
              Setup Guide
            </button>

            <button
              onClick={() => setShowRefreshConfirm(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 hover:border-orange-500/50 text-orange-200 hover:text-white rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Key'}
            </button>
          </div>

          {/* OBS Setup Instructions */}
          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-3 mb-3"
              >
                <h5 className="text-blue-300 text-xs font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  OBS Studio Setup (3 Easy Steps)
                </h5>
                <ol className="space-y-2 text-blue-200/80 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">1</span>
                    <span>Open OBS → Settings → Stream</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">2</span>
                    <span>Select: <strong>Custom</strong> service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">3</span>
                    <div>
                      <div>Paste Server URL and Stream Key above</div>
                      <div className="text-[10px] text-blue-300/60 mt-1">
                        Use the copy buttons (📋) for easy setup
                      </div>
                    </div>
                  </li>
                </ol>
                <a
                  href="https://obsproject.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mt-3 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 hover:text-white rounded-lg text-xs font-medium transition-all duration-200"
                >
                  <Download className="w-3 h-3" />
                  Download OBS Studio
                  <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security Note */}
          <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-lg">
            <p className="text-purple-300 text-xs leading-relaxed">
              <strong>🔒 Security:</strong> Keep your stream key private. Anyone with this key can stream to your channel.
              Refresh if compromised.
            </p>
          </div>
        </>
      )}

      {/* Refresh Confirmation Modal */}
      <AnimatePresence>
        {showRefreshConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowRefreshConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-orange-500/30 rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
            >
              <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-white text-xl font-bold text-center mb-2">
                Refresh Stream Key?
              </h3>
              <p className="text-gray-300 text-sm text-center mb-6">
                This will generate a new stream key. Your current key will <strong>stop working immediately</strong>.
                You'll need to update OBS with the new key.
              </p>

              {/* Error Alert */}
              {refreshError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-200 text-sm font-medium">Refresh Failed</p>
                      <p className="text-red-300 text-xs mt-1">{refreshError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Alert */}
              {refreshSuccess && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-green-200 text-sm font-medium">Stream key refreshed successfully!</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowRefreshConfirm(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh Key'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
