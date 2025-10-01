'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '@/types/database';

type Stream = Database['public']['Tables']['streams']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface EngageMaxState {
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
}

interface EngageMaxTabProps {
  stream: Stream & { events: Event };
  overlayState: EngageMaxState;
  onAction: (action: string, data: any) => void;
  onUpdate: (updates: Partial<EngageMaxState>) => void;
}

export function EngageMaxTab({ stream, overlayState, onAction, onUpdate }: EngageMaxTabProps) {
  const [activeSection, setActiveSection] = useState<string>('polls');
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  const [quizMode, setQuizMode] = useState(false);
  const [smartCTAMessage, setSmartCTAMessage] = useState('Don\'t miss this limited-time opportunity!');

  const sections = [
    { id: 'polls', name: 'Live Polls', icon: '📊', description: 'Real-time audience polling' },
    { id: 'quiz', name: 'Quiz Builder', icon: '🧠', description: 'Interactive knowledge tests' },
    { id: 'reactions', name: 'Emoji Reactions', icon: '😍', description: 'Live audience reactions' },
    { id: 'smartcta', name: 'Smart CTAs', icon: '🎯', description: 'AI-powered calls to action' }
  ];

  const handleStartPoll = () => {
    if (!newPollQuestion.trim() || newPollOptions.filter(opt => opt.trim()).length < 2) {
      alert('Please enter a question and at least 2 options');
      return;
    }

    const pollId = uuidv4();
    const pollData = {
      pollId,
      question: newPollQuestion.trim(),
      options: newPollOptions.filter(opt => opt.trim()),
      isQuiz: quizMode,
      correctAnswer: quizMode ? 0 : null // First option as correct for demo
    };

    onAction('start-poll', pollData);
    
    // Reset form
    setNewPollQuestion('');
    setNewPollOptions(['', '']);
  };

  const handleEndPoll = () => {
    if (overlayState.currentPoll.id) {
      onAction('end-poll', { pollId: overlayState.currentPoll.id });
    }
  };

  const addPollOption = () => {
    if (newPollOptions.length < 6) {
      setNewPollOptions([...newPollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (newPollOptions.length > 2) {
      setNewPollOptions(newPollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...newPollOptions];
    updated[index] = value;
    setNewPollOptions(updated);
  };

  const handleSmartCTATrigger = () => {
    onAction('show-smart-cta', {
      message: smartCTAMessage,
      action: 'register',
      trigger: 'manual',
      duration: 10000 // 10 seconds
    });
  };

  const predefinedPolls = [
    {
      question: "What's your biggest challenge with online marketing?",
      options: ["Lead Generation", "Conversion Rates", "Content Creation", "Analytics & Tracking"]
    },
    {
      question: "How familiar are you with ConvertCast?",
      options: ["First time hearing", "Heard of it", "Used before", "Expert user"]
    },
    {
      question: "What type of business do you run?",
      options: ["E-commerce", "SaaS/Tech", "Consulting", "Local Business", "Other"]
    }
  ];

  const predefinedCTAs = [
    "🚀 Register now for exclusive bonus content!",
    "⏰ Limited spots available - secure yours today!",
    "💎 Upgrade to premium for advanced features!",
    "🎯 Don't miss this limited-time opportunity!",
    "🔥 Join thousands of successful entrepreneurs!"
  ];

  return (
    <div className="p-4 space-y-4">
      {/* EngageMax™ Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-4 text-white">
        <h2 className="font-bold text-lg mb-2">🚀 EngageMax™ Control Center</h2>
        <p className="text-purple-100 text-sm">
          Boost engagement by 234% with AI-powered interactive features
        </p>
      </div>

      {/* Section Selector */}
      <div className="grid grid-cols-2 gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`p-3 rounded-lg text-left transition-colors ${
              activeSection === section.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="text-lg mb-1">{section.icon}</div>
            <div className="font-medium text-sm">{section.name}</div>
            <div className="text-xs opacity-75">{section.description}</div>
          </button>
        ))}
      </div>

      {/* Live Polls Section */}
      {activeSection === 'polls' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center">
              📊 Live Polling
              {overlayState.currentPoll.visible && (
                <span className="ml-2 px-2 py-1 bg-green-600 text-xs rounded-full animate-pulse">
                  ACTIVE
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={quizMode}
                  onChange={(e) => setQuizMode(e.target.checked)}
                  className="mr-2"
                />
                Quiz Mode
              </label>
            </div>
          </div>

          {/* Current Poll Status */}
          {overlayState.currentPoll.visible && (
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-medium">Active Poll</span>
                <button
                  onClick={handleEndPoll}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                >
                  End Poll
                </button>
              </div>
              <p className="text-white text-sm font-medium mb-2">
                {overlayState.currentPoll.question}
              </p>
              <div className="space-y-1">
                {overlayState.currentPoll.options.map((option, index) => (
                  <div key={index} className="text-gray-300 text-sm">
                    {index + 1}. {option}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Poll */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Poll Question {quizMode && <span className="text-yellow-400">(Quiz)</span>}
              </label>
              <input
                type="text"
                value={newPollQuestion}
                onChange={(e) => setNewPollQuestion(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                placeholder={quizMode ? "Enter quiz question..." : "What would you like to ask your audience?"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Options</label>
              <div className="space-y-2">
                {newPollOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm w-4">{index + 1}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                      placeholder={`Option ${index + 1}`}
                    />
                    {index > 1 && (
                      <button
                        onClick={() => removePollOption(index)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    )}
                    {quizMode && index === 0 && (
                      <span className="text-green-400 text-xs">✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
              
              {newPollOptions.length < 6 && (
                <button
                  onClick={addPollOption}
                  className="mt-2 text-purple-400 hover:text-purple-300 text-sm flex items-center"
                >
                  + Add Option
                </button>
              )}
            </div>

            <button
              onClick={handleStartPoll}
              disabled={overlayState.currentPoll.visible}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quizMode ? '🧠 Start Quiz' : '📊 Launch Poll'}
            </button>
          </div>

          {/* Quick Poll Templates */}
          <div>
            <h4 className="text-white font-medium mb-2">Quick Poll Templates</h4>
            <div className="space-y-2">
              {predefinedPolls.map((poll, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setNewPollQuestion(poll.question);
                    setNewPollOptions([...poll.options]);
                  }}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="text-white text-sm font-medium mb-1">
                    {poll.question}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {poll.options.join(" • ")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Builder Section */}
      {activeSection === 'quiz' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">🧠 Interactive Quiz Builder</h3>
          
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-4 text-white">
            <div className="font-semibold mb-2">Quiz Mode Features:</div>
            <ul className="text-sm space-y-1">
              <li>✅ Correct/incorrect answer tracking</li>
              <li>🏆 Real-time leaderboard</li>
              <li>🎯 Engagement scoring integration</li>
              <li>📊 Performance analytics</li>
            </ul>
          </div>

          <div className="text-gray-300 text-sm">
            Use the poll section above and enable "Quiz Mode" to create interactive quizzes.
            The first option will be marked as the correct answer.
          </div>
        </div>
      )}

      {/* Emoji Reactions Section */}
      {activeSection === 'reactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">😍 Live Reactions</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={overlayState.reactions.enabled}
                onChange={(e) => onUpdate({ reactions: { ...overlayState.reactions, enabled: e.target.checked } })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdate({ reactions: { ...overlayState.reactions, position: 'floating' } })}
                  className={`p-3 rounded text-sm ${
                    overlayState.reactions.position === 'floating'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  🎈 Floating
                </button>
                <button
                  onClick={() => onUpdate({ reactions: { ...overlayState.reactions, position: 'bottom-bar' } })}
                  className={`p-3 rounded text-sm ${
                    overlayState.reactions.position === 'bottom-bar'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  📍 Bottom Bar
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-3">Available Reactions</h4>
              <div className="grid grid-cols-4 gap-3">
                {['❤️', '👍', '👏', '🔥', '😍', '🤯', '💯', '🚀'].map((emoji) => (
                  <div
                    key={emoji}
                    className="bg-gray-700 rounded-lg p-3 text-center text-2xl cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
              <div className="text-blue-400 font-medium mb-1">💡 Pro Tip</div>
              <div className="text-blue-200 text-sm">
                Reactions drive 312% more engagement and help identify your most engaged viewers for AI Hot Leads.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart CTAs Section */}
      {activeSection === 'smartcta' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">🎯 Smart Call-to-Actions</h3>
          
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">CTA Message</label>
              <textarea
                value={smartCTAMessage}
                onChange={(e) => setSmartCTAMessage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500 h-20"
                placeholder="Enter your call-to-action message..."
              />
            </div>

            <button
              onClick={handleSmartCTATrigger}
              className="w-full py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-md"
            >
              🚀 Trigger Smart CTA
            </button>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Predefined CTAs</h4>
            <div className="space-y-2">
              {predefinedCTAs.map((cta, index) => (
                <button
                  key={index}
                  onClick={() => setSmartCTAMessage(cta)}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="text-white text-sm">{cta}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
            <div className="text-green-400 font-medium mb-1">🎯 AI Optimization</div>
            <div className="text-green-200 text-sm">
              Smart CTAs are automatically timed based on viewer engagement patterns and deliver 189% higher conversion rates.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}