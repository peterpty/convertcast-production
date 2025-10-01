'use client';

import { useState, useEffect } from 'react';
import { OverlayRenderer } from '@/components/overlay/OverlayRenderer';
import { useMockWebSocket } from '@/lib/websocket/useWebSocket';

interface PageProps {
  params: Promise<{ streamId: string }>;
}

interface OverlayState {
  lowerThirds: {
    visible: boolean;
    text: string;
    subtext: string;
    position: 'bottom-left' | 'bottom-center' | 'bottom-right';
    style: 'minimal' | 'branded' | 'elegant';
  };
  countdown: {
    visible: boolean;
    targetTime: string;
    message: string;
    style: 'digital' | 'analog' | 'text';
  };
  registrationCTA: {
    visible: boolean;
    headline: string;
    buttonText: string;
    urgency: boolean;
    position: 'top-center' | 'bottom-center' | 'side';
  };
  socialProof: {
    visible: boolean;
    type: 'viewer-count' | 'recent-signups' | 'testimonials';
    position: 'top-right' | 'bottom-left';
  };
  engageMax: {
    currentPoll: {
      id: string | null;
      question: string;
      options: string[];
      visible: boolean;
    };
    reactions: {
      enabled: boolean;
      position: 'floating' | 'bottom-bar';
    };
    smartCTA: {
      visible: boolean;
      message: string;
      action: string;
      trigger: 'time' | 'engagement' | 'manual';
    };
  };
}

const initialOverlayState: OverlayState = {
  lowerThirds: {
    visible: false,
    text: 'Welcome to ConvertCast',
    subtext: 'Professional Live Streaming',
    position: 'bottom-left',
    style: 'branded'
  },
  countdown: {
    visible: false,
    targetTime: '',
    message: 'Starting Soon',
    style: 'digital'
  },
  registrationCTA: {
    visible: false,
    headline: 'Register Now for Exclusive Access',
    buttonText: 'Get Free Access',
    urgency: false,
    position: 'bottom-center'
  },
  socialProof: {
    visible: false,
    type: 'viewer-count',
    position: 'top-right'
  },
  engageMax: {
    currentPoll: {
      id: null,
      question: '',
      options: [],
      visible: false
    },
    reactions: {
      enabled: false,
      position: 'floating'
    },
    smartCTA: {
      visible: false,
      message: '',
      action: '',
      trigger: 'manual'
    }
  }
};

export default function OverlayPage({ params }: PageProps) {
  const [streamId, setStreamId] = useState<string | null>(null);
  const [overlayState, setOverlayState] = useState<OverlayState>(initialOverlayState);
  const [viewerCount, setViewerCount] = useState(1247);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeOverlay() {
      const resolvedParams = await params;
      setStreamId(resolvedParams.streamId);
      setLoading(false);
    }
    
    initializeOverlay();
  }, [params]);

  // WebSocket connection to receive overlay updates from studio
  const { connected } = useMockWebSocket({
    streamId: streamId || 'demo',
    onOverlayUpdate: (newState: Partial<OverlayState>) => {
      setOverlayState(prev => ({ ...prev, ...newState }));
    },
    onViewerCountUpdate: (count: number) => setViewerCount(count)
  });

  if (loading) {
    return (
      <div className="w-screen h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading overlay...</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden">
      {/* OBS Browser Source - Transparent Background */}
      <div className="relative w-full h-full">
        <OverlayRenderer
          overlayState={overlayState}
          viewerCount={viewerCount}
          streamId={streamId || 'demo'}
          connected={connected}
        />
        
        {/* Debug info (only visible in browser, not in OBS) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Stream: {streamId} • Connected: {connected ? '✅' : '❌'}
          </div>
        )}
      </div>
    </div>
  );
}