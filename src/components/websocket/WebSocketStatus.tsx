'use client';

import { ConnectionStatus } from '@/lib/websocket/useWebSocket';

interface WebSocketStatusProps {
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  error: string | null;
  className?: string;
}

export function WebSocketStatus({
  connectionStatus,
  reconnectAttempts,
  error,
  className = ''
}: WebSocketStatusProps) {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/30',
          icon: '🔄',
          text: 'Connecting...',
          description: 'Establishing WebSocket connection'
        };
      case 'connected':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/30',
          icon: '✅',
          text: 'Connected',
          description: 'Live features active'
        };
      case 'disconnected':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/30',
          icon: '❌',
          text: 'Disconnected',
          description: 'Live features unavailable'
        };
      case 'reconnecting':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/30',
          icon: '🔄',
          text: `Reconnecting... (${reconnectAttempts}/5)`,
          description: 'Attempting to restore connection'
        };
      case 'failed':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/30',
          icon: '🚫',
          text: 'Connection Failed',
          description: 'WebSocket server unavailable'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/30',
          icon: '❓',
          text: 'Unknown',
          description: 'Unknown connection state'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <span className="text-sm">{config.icon}</span>
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${config.color}`}>
          {config.text}
        </span>
        {error ? (
          <span className="text-xs text-red-300">
            {error}
          </span>
        ) : (
          <span className="text-xs text-gray-400">
            {config.description}
          </span>
        )}
      </div>
    </div>
  );
}

export function WebSocketIndicator({
  connectionStatus,
  className = ''
}: {
  connectionStatus: ConnectionStatus;
  className?: string;
}) {
  const getIndicatorConfig = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          color: 'bg-yellow-400',
          animation: 'animate-pulse'
        };
      case 'connected':
        return {
          color: 'bg-green-400',
          animation: 'animate-pulse'
        };
      case 'disconnected':
      case 'failed':
        return {
          color: 'bg-red-400',
          animation: ''
        };
      case 'reconnecting':
        return {
          color: 'bg-yellow-400',
          animation: 'animate-bounce'
        };
      default:
        return {
          color: 'bg-gray-400',
          animation: ''
        };
    }
  };

  const config = getIndicatorConfig();

  return (
    <div className={`w-2 h-2 rounded-full ${config.color} ${config.animation} ${className}`} />
  );
}