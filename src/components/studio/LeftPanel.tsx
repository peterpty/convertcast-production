'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, MessageSquare, DollarSign } from 'lucide-react';
import { OverlayControls } from './OverlayControls';
import { EngageMaxTab } from './EngageMaxTab';
import { AutoOfferTab } from './AutoOfferTab';
import type { Database } from '@/types/database';

type Stream = Database['public']['Tables']['streams']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

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

interface LeftPanelProps {
  activeTab: 'overlays' | 'engagemax' | 'autooffer';
  onTabChange: (tab: 'overlays' | 'engagemax' | 'autooffer') => void;
  overlayState: OverlayState;
  onOverlayUpdate: (updates: Partial<OverlayState>) => void;
  onEngageMaxAction: (action: string, data: any) => void;
  stream: Stream & { events: Event };
  connected?: boolean;
  connectionStatus?: string;
}

export function LeftPanel({
  activeTab,
  onTabChange,
  overlayState,
  onOverlayUpdate,
  onEngageMaxAction,
  stream,
  connected = true,
  connectionStatus
}: LeftPanelProps) {
  const tabs = [
    {
      id: 'overlays' as const,
      name: 'Overlays',
      fullName: 'Overlay Controls',
      description: 'Visual elements & graphics',
      icon: <Layers className="w-5 h-5" />,
      gradient: 'from-purple-500 to-purple-600',
      color: 'purple'
    },
    {
      id: 'engagemax' as const,
      name: 'EngageMax™',
      fullName: 'EngageMax™',
      description: 'Polls, reactions & CTAs',
      icon: <MessageSquare className="w-5 h-5" />,
      gradient: 'from-blue-500 to-blue-600',
      color: 'blue'
    },
    {
      id: 'autooffer' as const,
      name: 'AutoOffer™',
      fullName: 'AutoOffer™',
      description: 'Dynamic pricing & A/B tests',
      icon: <DollarSign className="w-5 h-5" />,
      gradient: 'from-green-500 to-green-600',
      color: 'green'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Professional Tab Navigation - Enhanced Mobile */}
      <div className="p-2 sm:p-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg sm:rounded-xl p-1">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left transition-all duration-200 rounded-lg group min-h-[48px] sm:min-h-auto ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                {/* Active Background */}
                {isActive && (
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-lg`}
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Tab Content */}
                <div className={`relative z-10 flex items-center gap-3 w-full`}>
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-white/20' : 'bg-slate-700 group-hover:bg-slate-600'
                  }`}>
                    {tab.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{tab.name}</div>
                    <div className={`text-xs truncate ${
                      isActive ? 'text-white/80' : 'text-gray-500 group-hover:text-gray-400'
                    }`}>
                      {tab.description}
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content with Animation - Enhanced Mobile */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={activeTab}
          className="h-full overflow-y-auto px-2 sm:px-4 pb-2 sm:pb-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overlays' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <OverlayControls
                overlayState={overlayState}
                onUpdate={onOverlayUpdate}
                connected={connected}
                connectionStatus={connectionStatus}
              />
            </motion.div>
          )}

          {activeTab === 'engagemax' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <EngageMaxTab
                stream={stream}
                overlayState={overlayState.engageMax}
                onAction={onEngageMaxAction}
                onUpdate={(updates) => onOverlayUpdate({ engageMax: { ...overlayState.engageMax, ...updates } })}
              />
            </motion.div>
          )}

          {activeTab === 'autooffer' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <AutoOfferTab
                stream={stream}
                onAction={(action, data) => {
                  // Handle AutoOffer actions
                  console.log('AutoOffer action:', action, data);
                }}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}