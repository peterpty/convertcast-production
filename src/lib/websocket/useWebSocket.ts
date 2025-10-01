'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketConfig {
  streamId: string;
  userType?: 'viewer' | 'streamer';
  userId?: string;
  onViewerCountUpdate?: (count: number) => void;
  onOverlayUpdate?: (overlayData: any) => void;
  onChatMessage?: (message: any) => void;
  onViewerReaction?: (reaction: any) => void;
  onPollVoteUpdate?: (vote: any) => void;
  onStreamStatusChanged?: (status: any) => void;
  onError?: (error: string) => void;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

interface WebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
  emit: (event: string, data: any) => void;
  disconnect: () => void;
  joinStream: (streamId: string, userType?: string, userId?: string) => void;
  leaveStream: (streamId?: string) => void;
  broadcastOverlay: (overlayType: string, overlayData: any) => void;
  sendChatMessage: (message: string, username?: string) => void;
  sendReaction: (reactionType: string) => void;
  voteOnPoll: (pollId: string, optionId: string) => void;
  error: string | null;
}

export function useWebSocket(config: WebSocketConfig): WebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

  // Clear error and notify callback
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    config.onError?.(errorMessage);
  }, [config]);

  // Join stream room
  const joinStream = useCallback((streamId: string, userType = 'viewer', userId?: string) => {
    if (!socket || !connected) {
      handleError('Cannot join stream - WebSocket not connected');
      return;
    }

    socket.emit('join-stream', {
      streamId,
      userType,
      userId: userId || socket.id
    });
  }, [socket, connected, handleError]);

  // Leave stream room
  const leaveStream = useCallback((streamId?: string) => {
    if (!socket) return;

    socket.emit('leave-stream', {
      streamId: streamId || config.streamId
    });
  }, [socket, config.streamId]);

  // Broadcast overlay (for streamers)
  const broadcastOverlay = useCallback((overlayType: string, overlayData: any) => {
    if (!socket || !connected) {
      handleError('Cannot broadcast overlay - WebSocket disconnected');
      return;
    }

    socket.emit('broadcast-overlay', {
      streamId: config.streamId,
      overlayType,
      overlayData,
      timestamp: new Date().toISOString()
    });
  }, [socket, connected, config.streamId, handleError]);

  // Send chat message
  const sendChatMessage = useCallback((message: string, username = 'Anonymous') => {
    if (!socket || !connected) {
      handleError('Cannot send message - WebSocket disconnected');
      return;
    }

    socket.emit('send-chat-message', {
      streamId: config.streamId,
      message: message.substring(0, 500),
      username,
      timestamp: new Date().toISOString()
    });
  }, [socket, connected, config.streamId, handleError]);

  // Send viewer reaction
  const sendReaction = useCallback((reactionType: string) => {
    if (!socket || !connected) {
      handleError('Cannot send reaction - WebSocket disconnected');
      return;
    }

    socket.emit('send-reaction', {
      streamId: config.streamId,
      reactionType,
      userId: config.userId || socket.id
    });
  }, [socket, connected, config.streamId, config.userId, handleError]);

  // Vote on poll
  const voteOnPoll = useCallback((pollId: string, optionId: string) => {
    if (!socket || !connected) {
      handleError('Cannot vote - WebSocket disconnected');
      return;
    }

    socket.emit('poll-vote', {
      streamId: config.streamId,
      pollId,
      optionId,
      userId: config.userId || socket.id
    });
  }, [socket, connected, config.streamId, config.userId, handleError]);

  // Generic emit function
  const emit = useCallback((event: string, data: any) => {
    if (!socket || !connected) {
      handleError(`Cannot emit ${event} - WebSocket disconnected`);
      return;
    }

    socket.emit(event, data);
  }, [socket, connected, handleError]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [socket]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!websocketUrl) {
      setConnectionStatus('failed');
      handleError('WebSocket URL not configured - Set NEXT_PUBLIC_WEBSOCKET_URL');
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    const socketInstance = io(websocketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5,
    });

    // Connection successful
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected to', websocketUrl);
      setConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setError(null);

      // Auto-join stream room on connection
      if (config.streamId) {
        socketInstance.emit('join-stream', {
          streamId: config.streamId,
          userType: config.userType || 'viewer',
          userId: config.userId || socketInstance.id
        });
      }
    });

    // Connection lost
    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setConnected(false);
      setConnectionStatus('disconnected');

      if (reason === 'io server disconnect') {
        handleError('Server disconnected - Refresh page to reconnect');
      } else {
        handleError('Connection lost - Attempting to reconnect...');
      }
    });

    // Reconnection attempt
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      setConnectionStatus('reconnecting');
      setReconnectAttempts(attemptNumber);
      setError(`Reconnecting... (attempt ${attemptNumber}/5)`);
    });

    // Reconnection successful
    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setError(null);
    });

    // Reconnection failed
    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect to WebSocket server');
      setConnectionStatus('failed');
      setConnected(false);
      handleError('WebSocket server unavailable - Check your connection');
    });

    // Connection error
    socketInstance.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      setConnected(false);

      if (connectionStatus === 'connecting') {
        setConnectionStatus('failed');
        handleError('WebSocket server unavailable - Unable to connect');
      }
    });

    // WebSocket server events
    socketInstance.on('join-stream-success', (data) => {
      console.log('✅ Successfully joined stream:', data.streamId);
    });

    socketInstance.on('viewer-count-update', (data) => {
      config.onViewerCountUpdate?.(data.count);
    });

    socketInstance.on('overlay-update', (data) => {
      console.log('📡 Overlay update received:', data.overlayType);
      config.onOverlayUpdate?.(data);
    });

    socketInstance.on('broadcast-overlay-success', (data) => {
      console.log(`✅ Overlay broadcast successful: ${data.overlayType} to ${data.viewerCount} viewers`);
    });

    socketInstance.on('chat-message', (data) => {
      config.onChatMessage?.(data);
    });

    socketInstance.on('viewer-reaction', (data) => {
      config.onViewerReaction?.(data);
    });

    socketInstance.on('poll-vote-update', (data) => {
      config.onPollVoteUpdate?.(data);
    });

    socketInstance.on('stream-status-changed', (data) => {
      config.onStreamStatusChanged?.(data);
    });

    // WebSocket error handling
    socketInstance.on('error', (error) => {
      console.error('🚨 WebSocket error:', error);
      handleError(error.message || 'WebSocket error occurred');
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [websocketUrl, config.streamId, config.userType, config.userId]);

  return {
    socket,
    connected,
    connectionStatus,
    reconnectAttempts,
    emit,
    disconnect,
    joinStream,
    leaveStream,
    broadcastOverlay,
    sendChatMessage,
    sendReaction,
    voteOnPoll,
    error
  };
}

// Legacy support - remove useSmartWebSocket completely
export function useSmartWebSocket(config: WebSocketConfig): WebSocketReturn & { isMockMode: boolean } {
  const result = useWebSocket(config);
  return {
    ...result,
    isMockMode: false // No more mock mode
  };
}