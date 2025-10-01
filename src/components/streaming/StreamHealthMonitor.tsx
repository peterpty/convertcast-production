'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Monitor,
  Signal,
  Wifi,
  WifiOff,
  Zap,
  TrendingUp,
  TrendingDown,
  Settings,
  RefreshCw,
  AlertCircle,
  Info,
  XCircle
} from 'lucide-react';
import { muxService, StreamHealth, StreamMetrics } from '@/lib/streaming/muxService';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  action?: string;
}

interface StreamHealthMonitorProps {
  streamId: string;
  isLive: boolean;
  onHealthChange?: (health: StreamHealth) => void;
}

export function StreamHealthMonitor({
  streamId,
  isLive,
  onHealthChange
}: StreamHealthMonitorProps) {
  const [health, setHealth] = useState<StreamHealth | null>(null);
  const [metrics, setMetrics] = useState<StreamMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isLive) {
      loadHealthData();
      const interval = setInterval(() => {
        if (autoRefresh) {
          loadHealthData();
        }
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    } else {
      setHealth(null);
      setMetrics(null);
      setAlerts([]);
      setLoading(false);
    }
  }, [streamId, isLive, autoRefresh]);

  const loadHealthData = async () => {
    try {
      const [healthData, metricsData] = await Promise.all([
        muxService.getStreamHealth(streamId),
        muxService.getStreamMetrics(streamId)
      ]);

      setHealth(healthData);
      setMetrics(metricsData);
      setLastUpdate(new Date());

      if (onHealthChange) {
        onHealthChange(healthData);
      }

      // Generate alerts based on health data
      generateAlerts(healthData);
    } catch (error) {
      console.error('Failed to load stream health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (healthData: StreamHealth) => {
    const newAlerts: Alert[] = [];

    // Connection quality alerts
    if (healthData.connection_quality < 50) {
      newAlerts.push({
        id: `connection-${Date.now()}`,
        type: 'error',
        title: 'Poor Connection Quality',
        message: `Connection quality is ${Math.round(healthData.connection_quality)}%. Stream may be unstable.`,
        timestamp: new Date(),
        resolved: false,
        action: 'Check your internet connection and reduce bitrate'
      });
    } else if (healthData.connection_quality < 70) {
      newAlerts.push({
        id: `connection-warning-${Date.now()}`,
        type: 'warning',
        title: 'Connection Quality Warning',
        message: `Connection quality is ${Math.round(healthData.connection_quality)}%. Consider optimizing settings.`,
        timestamp: new Date(),
        resolved: false,
        action: 'Reduce bitrate or resolution if issues persist'
      });
    }

    // Bitrate alerts
    if (healthData.bitrate < 1000000) {
      newAlerts.push({
        id: `bitrate-${Date.now()}`,
        type: 'warning',
        title: 'Low Bitrate Detected',
        message: `Current bitrate is ${(healthData.bitrate / 1000000).toFixed(1)} Mbps, which may affect quality.`,
        timestamp: new Date(),
        resolved: false,
        action: 'Increase bitrate in your streaming software'
      });
    }

    // Latency alerts
    if (healthData.latency > 5000) {
      newAlerts.push({
        id: `latency-${Date.now()}`,
        type: 'warning',
        title: 'High Latency Warning',
        message: `Stream latency is ${(healthData.latency / 1000).toFixed(1)} seconds. Viewers may experience delays.`,
        timestamp: new Date(),
        resolved: false,
        action: 'Check network conditions or use a server closer to your location'
      });
    }

    // Status alerts
    if (healthData.status === 'offline') {
      newAlerts.push({
        id: `offline-${Date.now()}`,
        type: 'error',
        title: 'Stream Offline',
        message: 'Your stream is currently offline. Viewers cannot watch the content.',
        timestamp: new Date(),
        resolved: false,
        action: 'Check your streaming software connection'
      });
    } else if (healthData.status === 'poor') {
      newAlerts.push({
        id: `quality-${Date.now()}`,
        type: 'error',
        title: 'Poor Stream Quality',
        message: 'Stream quality is degraded. Multiple issues detected.',
        timestamp: new Date(),
        resolved: false,
        action: 'Review stream settings and network connection'
      });
    }

    // Update alerts, removing old ones and adding new ones
    setAlerts(prev => {
      const recentAlerts = prev.filter(alert =>
        new Date().getTime() - alert.timestamp.getTime() < 300000 // Keep alerts for 5 minutes
      );
      return [...recentAlerts, ...newAlerts];
    });
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'poor': return 'text-orange-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'poor': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'offline': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatBytes = (bytes: number): string => {
    const mbps = bytes / 1000000;
    return `${mbps.toFixed(1)} Mbps`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  if (!isLive) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Stream Monitoring Inactive</h3>
          <p className="text-gray-500">Start your stream to monitor health and performance</p>
        </div>
      </div>
    );
  }

  if (loading || !health) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mr-3" />
          <span className="text-gray-300">Loading stream health data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Stream Health Monitor</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                autoRefresh
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={loadHealthData}
              className="p-2 bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              {getHealthStatusIcon(health.status)}
              <span className="text-gray-300 text-sm">Stream Status</span>
            </div>
            <div className={`text-lg font-bold ${getHealthStatusColor(health.status)} capitalize`}>
              {health.status}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300 text-sm">Viewers</span>
            </div>
            <div className="text-lg font-bold text-white">
              {health.viewer_count.toLocaleString()}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Signal className="w-5 h-5 text-green-400" />
              <span className="text-gray-300 text-sm">Quality</span>
            </div>
            <div className="text-lg font-bold text-white">
              {Math.round(health.connection_quality)}%
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  health.connection_quality > 80 ? 'bg-green-500' :
                  health.connection_quality > 60 ? 'bg-blue-500' :
                  health.connection_quality > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${health.connection_quality}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-gray-300 text-sm">Uptime</span>
            </div>
            <div className="text-lg font-bold text-white">
              {formatDuration(health.uptime)}
            </div>
          </motion.div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-gray-300 font-medium mb-3">Stream Quality</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Bitrate</span>
                <span className="text-white font-medium">{formatBytes(health.bitrate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Framerate</span>
                <span className="text-white font-medium">{health.framerate} fps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Resolution</span>
                <span className="text-white font-medium">{health.resolution}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-gray-300 font-medium mb-3">Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Latency</span>
                <span className={`font-medium ${
                  health.latency < 3000 ? 'text-green-400' :
                  health.latency < 5000 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {(health.latency / 1000).toFixed(1)}s
                </span>
              </div>
              {metrics && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Quality Score</span>
                    <span className="text-white font-medium">{Math.round(metrics.quality_score)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Buffering Events</span>
                    <span className="text-white font-medium">{metrics.buffering_events}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {metrics && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-gray-300 font-medium mb-3">Analytics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Peak Viewers</span>
                  <span className="text-white font-medium">{metrics.peak_concurrent_viewers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Avg Duration</span>
                  <span className="text-white font-medium">{metrics.average_view_duration}m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Viewers</span>
                  <span className="text-white font-medium">{metrics.unique_viewers.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.filter(alert => !alert.resolved).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2" />
              Active Alerts ({alerts.filter(alert => !alert.resolved).length})
            </h4>

            <div className="space-y-3">
              {alerts.filter(alert => !alert.resolved).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`border-l-4 rounded-lg p-4 ${
                    alert.type === 'error' ? 'bg-red-500/10 border-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                    'bg-blue-500/10 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getAlertIcon(alert.type)}
                        <h5 className="font-medium text-white">{alert.title}</h5>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                      {alert.action && (
                        <p className="text-blue-400 text-xs">💡 {alert.action}</p>
                      )}
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 hover:text-white transition-colors ml-4"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last Updated */}
      <div className="text-center text-gray-500 text-sm">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}