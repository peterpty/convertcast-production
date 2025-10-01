'use client';

import { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, AlertCircle, CheckCircle, XCircle, Radio } from 'lucide-react';

interface WebSocketDebugPanelProps {
  connected: boolean;
  connectionStatus: string;
  error: string | null;
  streamId: string;
  websocketUrl?: string;
  lastEvent?: { type: string; data: any; timestamp: string } | null;
  eventLog?: Array<{ type: string; data: any; timestamp: string }>;
}

export function WebSocketDebugPanel({
  connected,
  connectionStatus,
  error,
  streamId,
  websocketUrl,
  lastEvent,
  eventLog = []
}: WebSocketDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<Array<{ type: string; data: any; timestamp: string }>>(eventLog);

  useEffect(() => {
    if (lastEvent) {
      setEvents(prev => [...prev.slice(-19), lastEvent]);
    }
  }, [lastEvent]);

  const getStatusIcon = () => {
    if (connected) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') {
      return <Radio className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = () => {
    if (connected) return 'bg-green-500';
    if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transition-all"
        title="WebSocket Debug Panel"
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">WS Debug</span>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[600px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-white" />
              <h3 className="text-white font-semibold">WebSocket Debugger</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {/* Connection Status */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">Connection Status</span>
                {connected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                <span className="text-white text-sm font-mono">{connectionStatus}</span>
              </div>
            </div>

            {/* WebSocket URL */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-gray-400 text-xs font-medium block mb-1">WebSocket URL</span>
              <code className="text-green-400 text-xs break-all">
                {websocketUrl || 'Not configured'}
              </code>
            </div>

            {/* Stream ID */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-gray-400 text-xs font-medium block mb-1">Stream ID</span>
              <code className="text-blue-400 text-xs break-all">{streamId}</code>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 p-3 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-red-400 text-xs font-medium block mb-1">Error</span>
                  <p className="text-red-300 text-xs">{error}</p>
                </div>
              </div>
            )}

            {/* Event Log */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs font-medium">Event Log</span>
                <span className="text-gray-500 text-xs">{events.length} events</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">No events yet</p>
                ) : (
                  events.slice().reverse().map((event, idx) => (
                    <div key={idx} className="bg-gray-900 p-2 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-purple-400 font-mono font-semibold">
                          {event.type}
                        </span>
                        <span className="text-gray-500 text-[10px]">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-gray-300 text-[10px] overflow-x-auto">
                        {JSON.stringify(event.data, null, 2).substring(0, 200)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Connection Test */}
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-gray-400 text-xs font-medium block mb-2">Quick Tests</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">WebSocket URL Set</span>
                  {websocketUrl ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Socket Connected</span>
                  {connected ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">Events Received</span>
                  {events.length > 0 ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/30 border border-blue-500/50 p-3 rounded-lg">
              <p className="text-blue-300 text-xs mb-2 font-medium">
                🔍 Debugging Tips:
              </p>
              <ul className="text-blue-200 text-[11px] space-y-1">
                <li>• Check if WebSocket URL is configured</li>
                <li>• Verify Socket Connected is ✅</li>
                <li>• Watch for overlay-update events</li>
                <li>• Test from Studio → Stream Info → Test Overlay</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
