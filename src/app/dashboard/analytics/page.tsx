'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  Brain,
  DollarSign,
  Users,
  Activity,
  Bell,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { insightEngine, InsightEngineAnalytics, PerfectMomentAlert, OptimizationRecommendation } from '@/lib/analytics/insightEngine';

interface DashboardTab {
  id: string;
  name: string;
  icon: React.ComponentType;
}

const tabs: DashboardTab[] = [
  { id: 'overview', name: 'Real-Time Overview', icon: Activity },
  { id: 'predictions', name: 'InsightEngine™ Predictions', icon: Brain },
  { id: 'revenue', name: 'Revenue Attribution', icon: DollarSign },
  { id: 'recommendations', name: 'Optimization', icon: Target }
];

const statusColors = {
  exceeding: '#10B981',
  meeting: '#3B82F6',
  below: '#F59E0B',
  failing: '#EF4444'
};

const severityColors = {
  info: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444',
  opportunity: '#10B981'
};

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<InsightEngineAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchAnalytics = () => {
      try {
        const data = insightEngine.getAnalytics();
        setAnalytics(data);
        setLastUpdate(new Date());
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAnalytics();

    // Update every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | 'volatile') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
      default: return <RefreshCw className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number, decimals: number = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4 text-xl">Loading InsightEngine™ Analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              InsightEngine™ Analytics
            </h1>
            <p className="text-gray-400 mt-1">
              AI-Powered Analytics & Predictions • Last Updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-green-500/20 border border-green-500 rounded-lg px-3 py-1">
              <span className="text-green-400 text-sm font-medium">
                🎯 {analytics.overview.predictionAccuracy}% Prediction Accuracy
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon: any = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Perfect Moment Alerts Banner */}
      {analytics.perfectMomentAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/20 to-red-500/20 border-b border-yellow-500/30 px-6 py-3"
        >
          <div className="flex items-center space-x-4">
            <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
            <div>
              <h3 className="font-bold text-yellow-400">Perfect Moment Alerts Active</h3>
              <p className="text-yellow-200 text-sm">
                {analytics.perfectMomentAlerts.length} optimization opportunities detected
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-400">
                      {formatCurrency(analytics.overview.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500 text-sm">+24% vs last month</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Conversions</p>
                    <p className="text-3xl font-bold text-blue-400">
                      {analytics.overview.totalConversions.toLocaleString()}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-400" />
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500 text-sm">+18% conversion rate</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Engagement Score</p>
                    <p className="text-3xl font-bold text-purple-400">
                      {Math.round(analytics.overview.avgEngagementScore)}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-400" />
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500 text-sm">EngageMax™ active</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Overall Performance</p>
                    <p className="text-3xl font-bold text-yellow-400">
                      {analytics.overview.overallPerformance}%
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500 text-sm">All systems optimal</span>
                </div>
              </motion.div>
            </div>

            {/* Branded Features Performance */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2 text-purple-400" />
                Branded Features Performance
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analytics.brandedFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.featureName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-900/50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{feature.featureName}</h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium`}
                           style={{
                             backgroundColor: `${statusColors[feature.status]}20`,
                             color: statusColors[feature.status],
                             border: `1px solid ${statusColors[feature.status]}40`
                           }}>
                        {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Promised: {feature.promisedImprovement}</span>
                        <span className="text-white">Actual: {feature.actualImprovement.toFixed(1)}%</span>
                      </div>

                      <div className="bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(feature.performanceRatio * 100, 100)}%`,
                            backgroundColor: statusColors[feature.status]
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {feature.kpis.slice(0, 2).map((kpi) => (
                        <div key={kpi.name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center">
                            {getTrendIcon(kpi.trend)}
                            <span className="ml-1">{kpi.name}</span>
                          </span>
                          <span className="text-white">
                            {kpi.current.toFixed(kpi.unit === '%' ? 1 : 0)}{kpi.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Real-Time Metrics Chart */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Activity className="w-6 h-6 mr-2 text-blue-400" />
                Historical Performance (30 Days)
              </h2>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2 }}
                      name="Revenue ($)"
                    />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                      name="Engagement Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                      name="Attendance (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Alerts */}
            {analytics.perfectMomentAlerts.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <Bell className="w-6 h-6 mr-2 text-yellow-400 animate-pulse" />
                  Perfect Moment Alerts ({analytics.perfectMomentAlerts.length})
                </h2>

                <div className="space-y-4">
                  {analytics.perfectMomentAlerts.slice(0, 3).map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900/50 border-l-4 rounded-lg p-4"
                      style={{ borderLeftColor: severityColors[alert.severity] }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle
                              className="w-5 h-5"
                              style={{ color: severityColors[alert.severity] }}
                            />
                            <h3 className="font-semibold text-white">{alert.title}</h3>
                            <span className="text-xs px-2 py-1 rounded-full"
                                  style={{
                                    backgroundColor: `${severityColors[alert.severity]}20`,
                                    color: severityColors[alert.severity]
                                  }}>
                              {alert.confidence}% confidence
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                          <p className="text-blue-400 text-sm font-medium mb-1">
                            💡 {alert.recommendation}
                          </p>
                          <p className="text-green-400 text-xs">
                            Expected Impact: {alert.expectedImpact}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                          <p>Expires: {alert.expiresAt.toLocaleTimeString()}</p>
                          <p>{alert.createdAt.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Brain className="w-6 h-6 mr-2 text-purple-400" />
                AI Predictions & Forecasting
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {analytics.predictions.map((prediction, index) => (
                  <motion.div
                    key={prediction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-900/50 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{prediction.name}</h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        prediction.accuracy === 'very-high' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        prediction.accuracy === 'high' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        prediction.accuracy === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {prediction.accuracy.toUpperCase()}
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-400">
                          {prediction.prediction.value.toFixed(prediction.prediction.unit === '%' ? 1 : 0)}
                          {prediction.prediction.unit}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Range: {prediction.prediction.range.min.toFixed(prediction.prediction.unit === '%' ? 1 : 0)}-
                          {prediction.prediction.range.max.toFixed(prediction.prediction.unit === '%' ? 1 : 0)}
                          {prediction.prediction.unit}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">{prediction.prediction.timeframe}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-300">Impact Factors</h4>
                      {prediction.factors.slice(0, 3).map((factor) => (
                        <div key={factor.name} className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{factor.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-700 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  factor.impact > 0 ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.abs(factor.impact)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              factor.impact > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {factor.impact > 0 ? '+' : ''}{factor.impact}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Confidence: {prediction.confidenceScore}%</span>
                        <span>Updated: {prediction.lastUpdated.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-400" />
                Revenue Attribution by Branded Features
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Attribution Table */}
                <div className="space-y-4">
                  {analytics.revenueAttribution.map((item, index) => (
                    <motion.div
                      key={item.source}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900/50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{item.feature}</h3>
                          <p className="text-gray-400 text-sm">{item.source}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-lg">
                            {formatCurrency(item.revenue)}
                          </p>
                          <div className="flex items-center">
                            {getTrendIcon(item.trend)}
                            <span className="text-gray-400 text-sm ml-1">
                              {item.contributionPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Conversions</p>
                          <p className="text-white font-semibold">{item.conversions}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">AOV</p>
                          <p className="text-white font-semibold">{formatCurrency(item.avgOrderValue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Direct Attribution</p>
                          <p className="text-white font-semibold">
                            {formatPercentage(item.attribution.direct)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Revenue Pie Chart */}
                <div className="bg-gray-900/50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.revenueAttribution as any}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ feature, contributionPercentage }: any) =>
                            `${feature} (${contributionPercentage.toFixed(1)}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {analytics.revenueAttribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={[
                              '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'
                            ][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Target className="w-6 h-6 mr-2 text-blue-400" />
                AI Optimization Recommendations
              </h2>

              <div className="space-y-4">
                {analytics.recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-gray-900/50 rounded-lg p-6 border-l-4 ${
                      rec.priority === 'critical' ? 'border-red-500' :
                      rec.priority === 'high' ? 'border-orange-500' :
                      rec.priority === 'medium' ? 'border-yellow-500' :
                      'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            rec.priority === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-medium">
                            {rec.category.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-4">{rec.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-sm">Expected Impact</p>
                        <p className="text-green-400 font-semibold">
                          +{rec.expectedImpact.improvement}% {rec.expectedImpact.metric}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {rec.expectedImpact.confidence}% confidence • {rec.expectedImpact.timeframe}
                        </p>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-sm">Effort Level</p>
                        <p className={`font-semibold ${
                          rec.effort === 'low' ? 'text-green-400' :
                          rec.effort === 'medium' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {rec.effort.charAt(0).toUpperCase() + rec.effort.slice(1)}
                        </p>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-sm">Implementation Cost</p>
                        <p className={`font-semibold ${
                          rec.implementationCost === 'free' ? 'text-green-400' :
                          rec.implementationCost === 'low' ? 'text-green-400' :
                          rec.implementationCost === 'medium' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {rec.implementationCost.charAt(0).toUpperCase() + rec.implementationCost.slice(1)}
                        </p>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-400 text-sm">Expected ROI</p>
                        <p className="text-purple-400 font-semibold">{rec.roi.toFixed(1)}x</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Action Steps</h4>
                      <ul className="space-y-1">
                        {rec.actionSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="text-sm text-gray-400 flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          rec.status === 'pending' ? 'bg-yellow-400' :
                          rec.status === 'in-progress' ? 'bg-blue-400' :
                          rec.status === 'completed' ? 'bg-green-400' :
                          'bg-gray-400'
                        }`} />
                        <span className="text-sm text-gray-400 capitalize">{rec.status}</span>
                      </div>

                      {rec.status === 'pending' && (
                        <button
                          onClick={() => insightEngine.completeRecommendation(rec.id)}
                          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {analytics.recommendations.length === 0 && (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No optimization recommendations at this time</p>
                  <p className="text-gray-500">All systems are performing optimally!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}