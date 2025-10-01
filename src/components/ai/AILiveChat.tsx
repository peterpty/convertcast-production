'use client';

import { useState, useEffect, useRef } from 'react';
import { ViewerProfile } from '@/lib/ai/scoringEngine';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isStreamer: boolean;
  isSynthetic: boolean;
  intentLevel?: 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT_LEAD' | 'JACKPOT';
  avatar?: string;
}

interface AILiveChatProps {
  viewers: ViewerProfile[];
  onTriggerOverlay: (action: string, data: any) => void;
  streamId: string;
}

const SYNTHETIC_TESTIMONIALS = [
  "This is exactly what I was looking for! 🔥",
  "Just signed up - can't wait to get started!",
  "Amazing value here, definitely investing",
  "Been following for months, finally ready to join! 💯",
  "This changed my business completely",
  "ROI already paying off after just 2 weeks",
  "Wish I found this sooner, game changer!",
  "The results speak for themselves 📈",
  "Already recommended to 3 friends",
  "This is pure gold, thank you! ⭐",
  "Finally something that actually works",
  "Best investment I've made all year",
  "The community alone is worth it",
  "Just got my first result using this! 🎉",
  "Crystal clear explanation, love it"
];

const TRUST_BUILDING_MESSAGES = [
  "I've tried everything else, this is different",
  "The step-by-step approach really works",
  "Love the transparency and honesty here",
  "No fluff, just real actionable content",
  "You can tell this comes from real experience",
  "The support team is incredible",
  "Money back guarantee gives me confidence",
  "Seeing real results, not just promises",
  "This person knows what they're talking about",
  "Finally found someone who delivers",
  "The proof is in the results shown",
  "Authentic and genuine approach",
  "Quality over quantity, exactly what I needed"
];

const SYNTHETIC_NAMES = [
  'Sarah M.', 'Mike T.', 'Jessica L.', 'David R.', 'Amanda K.',
  'Chris P.', 'Lisa W.', 'Ryan S.', 'Nicole B.', 'James H.',
  'Emma C.', 'Tyler G.', 'Rachel D.', 'Kevin M.', 'Ashley F.',
  'Brandon N.', 'Megan J.', 'Alex V.', 'Stephanie Q.', 'Jordan L.'
];

const AVATARS = [
  '👩‍💼', '👨‍💻', '👩‍🎨', '👨‍🚀', '👩‍⚕️', '👨‍🏫', '👩‍🔬', '👨‍⚖️',
  '👩‍🌾', '👨‍🍳', '👩‍🎤', '👨‍🎨', '👩‍💻', '👨‍⚕️', '👩‍🏫', '👨‍🔬'
];

export function AILiveChat({ viewers, onTriggerOverlay, streamId }: AILiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [syntheticEnabled, setSyntheticEnabled] = useState(true);
  const [streamerMessage, setStreamerMessage] = useState('');
  const [autoTestimonials, setAutoTestimonials] = useState(true);
  const [trustBuilding, setTrustBuilding] = useState(true);
  const [chatFrequency, setChatFrequency] = useState(3); // Messages per minute
  const [isStreamerOverride, setIsStreamerOverride] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate synthetic chat messages
  useEffect(() => {
    if (!syntheticEnabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      generateSyntheticMessage();
    }, (60 / chatFrequency) * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [syntheticEnabled, chatFrequency, viewers]);

  const generateSyntheticMessage = () => {
    if (viewers.length === 0) return;

    const messageType = Math.random();
    let message: string;
    let intentLevel: ChatMessage['intentLevel'];

    // Weight message types based on viewer engagement
    const hotLeads = viewers.filter(v => v.intentScore >= 75);
    const warmLeads = viewers.filter(v => v.intentScore >= 60);

    if (messageType < 0.4 && autoTestimonials) {
      // 40% testimonials
      message = SYNTHETIC_TESTIMONIALS[Math.floor(Math.random() * SYNTHETIC_TESTIMONIALS.length)];
      intentLevel = hotLeads.length > 0 ? 'HOT_LEAD' : 'WARM';
    } else if (messageType < 0.7 && trustBuilding) {
      // 30% trust building
      message = TRUST_BUILDING_MESSAGES[Math.floor(Math.random() * TRUST_BUILDING_MESSAGES.length)];
      intentLevel = 'WARM';
    } else if (messageType < 0.85) {
      // 15% questions/engagement
      const questions = [
        "How do you track ROI on this?",
        "Can beginners really do this?",
        "What's the time commitment?",
        "Is there a community for support?",
        "How quickly do people see results?",
        "What makes this different from other programs?"
      ];
      message = questions[Math.floor(Math.random() * questions.length)];
      intentLevel = 'LUKEWARM';
    } else {
      // 15% general engagement
      const general = [
        "This is so helpful! 🙏",
        "Taking notes over here 📝",
        "Mind = blown 🤯",
        "Thanks for sharing this!",
        "Great explanation 👍",
        "This makes so much sense now"
      ];
      message = general[Math.floor(Math.random() * general.length)];
      intentLevel = 'LUKEWARM';
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: SYNTHETIC_NAMES[Math.floor(Math.random() * SYNTHETIC_NAMES.length)],
      message,
      timestamp: new Date(),
      isStreamer: false,
      isSynthetic: true,
      intentLevel,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
    };

    setMessages(prev => [...prev.slice(-49), newMessage]); // Keep last 50 messages
  };

  const handleStreamerSend = () => {
    if (!streamerMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: 'Streamer',
      message: streamerMessage,
      timestamp: new Date(),
      isStreamer: true,
      isSynthetic: false,
      avatar: '🎙️'
    };

    setMessages(prev => [...prev.slice(-49), newMessage]);
    setStreamerMessage('');
    setIsStreamerOverride(false);
  };

  const handleQuickResponse = (response: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      username: 'Streamer',
      message: response,
      timestamp: new Date(),
      isStreamer: true,
      isSynthetic: false,
      avatar: '🎙️'
    };

    setMessages(prev => [...prev.slice(-49), newMessage]);
  };

  const getMessageColor = (message: ChatMessage) => {
    if (message.isStreamer) return 'text-yellow-400';
    if (!message.isSynthetic) return 'text-white';

    switch (message.intentLevel) {
      case 'JACKPOT': return 'text-red-400';
      case 'HOT_LEAD': return 'text-orange-400';
      case 'WARM': return 'text-yellow-400';
      case 'LUKEWARM': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
      {/* Header with Controls */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg flex items-center">
            🤖 AI Live Chat Engine
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${syntheticEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-white text-sm">{messages.filter(m => m.isSynthetic).length} synthetic</span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-white text-sm flex items-center">
              <input
                type="checkbox"
                checked={syntheticEnabled}
                onChange={(e) => setSyntheticEnabled(e.target.checked)}
                className="mr-2"
              />
              🎭 Synthetic Viewers
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-xs">Freq:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={chatFrequency}
                onChange={(e) => setChatFrequency(parseInt(e.target.value))}
                className="w-16"
              />
              <span className="text-white text-xs">{chatFrequency}/min</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <label className="text-white text-sm flex items-center">
              <input
                type="checkbox"
                checked={autoTestimonials}
                onChange={(e) => setAutoTestimonials(e.target.checked)}
                className="mr-2"
              />
              💬 Testimonials
            </label>
            <label className="text-white text-sm flex items-center">
              <input
                type="checkbox"
                checked={trustBuilding}
                onChange={(e) => setTrustBuilding(e.target.checked)}
                className="mr-2"
              />
              🤝 Trust Building
            </label>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start space-x-2 ${message.isStreamer ? 'bg-yellow-900/20' : message.isSynthetic ? 'bg-purple-900/10' : 'bg-gray-800/30'} rounded p-2`}>
            <div className="flex-shrink-0">
              <span className="text-lg">{message.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`font-medium text-sm ${getMessageColor(message)}`}>
                  {message.username}
                </span>
                {message.isSynthetic && (
                  <span className="bg-purple-600 text-white text-xs px-1 rounded">AI</span>
                )}
                {message.intentLevel && (
                  <span className={`text-xs px-1 rounded ${{
                    'JACKPOT': 'bg-red-600 text-white',
                    'HOT_LEAD': 'bg-orange-600 text-white',
                    'WARM': 'bg-yellow-600 text-black',
                    'LUKEWARM': 'bg-blue-600 text-white',
                    'COLD': 'bg-gray-600 text-white'
                  }[message.intentLevel]}`}>
                    {message.intentLevel}
                  </span>
                )}
                <span className="text-gray-500 text-xs">{formatTime(message.timestamp)}</span>
              </div>
              <p className="text-white text-sm">{message.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Responses */}
      <div className="p-3 border-t border-gray-700">
        <div className="mb-2">
          <div className="text-purple-400 text-sm mb-2">⚡ Quick Responses:</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Thanks for joining! 🎉",
              "Great question!",
              "Yes, this works for beginners too",
              "I'll cover that in detail",
              "Absolutely, let me explain",
              "That's exactly right! 💯"
            ].map((response, index) => (
              <button
                key={index}
                onClick={() => handleQuickResponse(response)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded transition-colors"
              >
                {response}
              </button>
            ))}
          </div>
        </div>

        {/* Streamer Override Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={streamerMessage}
            onChange={(e) => setStreamerMessage(e.target.value)}
            onFocus={() => setIsStreamerOverride(true)}
            onKeyPress={(e) => e.key === 'Enter' && handleStreamerSend()}
            placeholder="Override: Type your message..."
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none text-sm"
          />
          <button
            onClick={handleStreamerSend}
            disabled={!streamerMessage.trim()}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
          >
            Send
          </button>
        </div>

        {/* AI Chat Stats */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <span>
            Messages: {messages.length} • Synthetic: {Math.round((messages.filter(m => m.isSynthetic).length / Math.max(messages.length, 1)) * 100)}%
          </span>
          <span>
            Engagement Level: {viewers.length > 0 ? Math.round(viewers.reduce((sum, v) => sum + v.intentScore, 0) / viewers.length) : 0}
          </span>
        </div>
      </div>
    </div>
  );
}