'use client';

import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ConnectionStatus } from '@/lib/websocket/useWebSocket';

interface WebSocketErrorBoundaryProps {
  connectionStatus: ConnectionStatus;
  error: string | null;
  isStudio?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function WebSocketErrorBoundary({
  connectionStatus,
  error,
  isStudio = false,
  onRetry,
  children
}: WebSocketErrorBoundaryProps) {
  // Show children if connected
  if (connectionStatus === 'connected') {
    return <>{children}</>;
  }

  // Show loading state while connecting
  if (connectionStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-200">Connecting to live features...</p>
        </div>
      </div>
    );
  }

  // Show reconnecting state
  if (connectionStatus === 'reconnecting') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-yellow-400 font-medium">Reconnecting...</p>
          <p className="text-gray-400 text-sm">Restoring live features</p>
        </div>
      </div>
    );
  }

  // Show error state for failed/disconnected
  const errorConfig = {
    studio: {
      icon: WifiOff,
      title: 'Studio Features Unavailable',
      message: 'Cannot broadcast overlays - WebSocket disconnected',
      description: 'Live overlay broadcasting requires an active WebSocket connection. Start the WebSocket server and refresh.',
      actionText: 'Retry Connection'
    },
    viewer: {
      icon: WifiOff,
      title: 'Live Features Unavailable',
      message: 'Live features unavailable - Connection lost',
      description: 'Real-time chat, reactions, and overlays require an active connection. Check your internet connection.',
      actionText: 'Retry Connection'
    }
  };

  const config = errorConfig[isStudio ? 'studio' : 'viewer'];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-8 h-8 text-red-400" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          {config.title}
        </h3>

        <p className="text-red-400 font-medium mb-3">
          {config.message}
        </p>

        <p className="text-gray-400 text-sm mb-6">
          {config.description}
        </p>

        {error && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm text-left">
                {error}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {config.actionText}
            </button>
          )}

          <details className="text-left">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
              Troubleshooting Steps
            </summary>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>1. Check WebSocket server is running on port 3003</p>
              <p>2. Verify NEXT_PUBLIC_WEBSOCKET_URL is set correctly</p>
              <p>3. Check your internet connection</p>
              <p>4. Try refreshing the page</p>
              {isStudio && (
                <p>5. Ensure WebSocket server allows connections from the app domain</p>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

// Simplified error overlay for inline use
export function WebSocketErrorOverlay({
  connectionStatus,
  error,
  isStudio = false,
  className = ''
}: {
  connectionStatus: ConnectionStatus;
  error: string | null;
  isStudio?: boolean;
  className?: string;
}) {
  if (connectionStatus === 'connected') {
    return null;
  }

  const message = isStudio
    ? 'Cannot broadcast overlays - WebSocket disconnected'
    : 'Live features unavailable - Connection lost';

  return (
    <div className={`bg-red-400/10 border border-red-400/30 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <div>
          <p className="text-red-400 text-sm font-medium">
            {message}
          </p>
          {error && (
            <p className="text-red-300 text-xs mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}