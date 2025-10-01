'use client';

import { useState } from 'react';
import type { Database } from '@/types/database';

type Stream = Database['public']['Tables']['streams']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface AutoOfferTabProps {
  stream: Stream & { events: Event };
  onAction: (action: string, data: any) => void;
}

export function AutoOfferTab({ stream, onAction }: AutoOfferTabProps) {
  const [activeSection, setActiveSection] = useState<string>('pricing');
  const [experimentActive, setExperimentActive] = useState(false);
  const [variantA, setVariantA] = useState({
    price: 497,
    headline: 'Early Bird Special - 50% Off!',
    description: 'Get lifetime access to our premium course'
  });
  const [variantB, setVariantB] = useState({
    price: 697,
    headline: 'Premium Training System',
    description: 'Complete business transformation package'
  });

  const sections = [
    { id: 'pricing', name: 'Dynamic Pricing', icon: '💰', description: 'Smart price optimization' },
    { id: 'experiments', name: 'A/B Testing', icon: '🧪', description: 'Split test offers' },
    { id: 'triggers', name: 'Behavioral Triggers', icon: '⚡', description: 'Smart timing system' },
    { id: 'analytics', name: 'Performance', icon: '📈', description: 'Conversion tracking' }
  ];

  const handleStartExperiment = () => {
    const experimentData = {
      variantA,
      variantB,
      trafficSplit: 50, // 50/50 split
      duration: 3600000, // 1 hour
      goals: ['conversion', 'revenue']
    };

    onAction('start-experiment', experimentData);
    setExperimentActive(true);
  };

  const handleStopExperiment = () => {
    onAction('stop-experiment', {});
    setExperimentActive(false);
  };

  const triggerOffer = (timing: string) => {
    onAction('trigger-offer', {
      timing,
      offerType: 'dynamic',
      targetAudience: 'engaged_viewers'
    });
  };

  const pricingStrategies = [
    { name: 'Early Bird', discount: 50, urgency: 'high', description: 'Limited time launch offer' },
    { name: 'Flash Sale', discount: 30, urgency: 'urgent', description: '24-hour flash discount' },
    { name: 'Bundle Deal', discount: 25, urgency: 'medium', description: 'Package multiple products' },
    { name: 'VIP Access', discount: 20, urgency: 'low', description: 'Exclusive member pricing' }
  ];

  const behaviorTriggers = [
    { name: 'High Engagement', condition: 'engagement > 80%', action: 'Show premium offer' },
    { name: 'Cart Abandonment', condition: 'Viewed pricing but not purchased', action: 'Display discount' },
    { name: 'Time Trigger', condition: 'After 25 minutes', action: 'Limited time offer' },
    { name: 'Exit Intent', condition: 'User about to leave', action: 'Last chance offer' }
  ];

  return (
    <div className="p-4 space-y-4">
      {/* AutoOffer™ Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 text-white">
        <h2 className="font-bold text-lg mb-2">💰 AutoOffer™ Conversion Engine</h2>
        <p className="text-green-100 text-sm">
          Increase conversions by 189% with AI-powered dynamic offers
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
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="text-lg mb-1">{section.icon}</div>
            <div className="font-medium text-sm">{section.name}</div>
            <div className="text-xs opacity-75">{section.description}</div>
          </button>
        ))}
      </div>

      {/* Dynamic Pricing Section */}
      {activeSection === 'pricing' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">💰 Dynamic Pricing Control</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {pricingStrategies.map((strategy, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => {
                  onAction('apply-pricing-strategy', strategy);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">{strategy.name}</span>
                  <span className="text-green-400 font-bold">{strategy.discount}% OFF</span>
                </div>
                <div className="text-gray-400 text-xs mb-2">{strategy.description}</div>
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  strategy.urgency === 'urgent' ? 'bg-red-600 text-white' :
                  strategy.urgency === 'high' ? 'bg-orange-600 text-white' :
                  strategy.urgency === 'medium' ? 'bg-yellow-600 text-black' :
                  'bg-blue-600 text-white'
                }`}>
                  {strategy.urgency.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Quick Price Actions</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => triggerOffer('immediate')}
                className="p-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium"
              >
                ⚡ Flash Offer
              </button>
              <button
                onClick={() => triggerOffer('mid-stream')}
                className="p-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded font-medium"
              >
                🔥 Mid-Stream
              </button>
              <button
                onClick={() => triggerOffer('closing')}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded font-medium"
              >
                🎯 Closing Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A/B Testing Section */}
      {activeSection === 'experiments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">🧪 A/B Testing Lab</h3>
            {experimentActive && (
              <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full animate-pulse">
                EXPERIMENT RUNNING
              </span>
            )}
          </div>

          {/* Variant A */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center">
              🅰️ Variant A
              <span className="ml-2 px-2 py-1 bg-blue-600 text-xs rounded">Control</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Price</label>
                <input
                  type="number"
                  value={variantA.price}
                  onChange={(e) => setVariantA({...variantA, price: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Headline</label>
                <input
                  type="text"
                  value={variantA.headline}
                  onChange={(e) => setVariantA({...variantA, headline: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={variantA.description}
                  onChange={(e) => setVariantA({...variantA, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 h-16"
                />
              </div>
            </div>
          </div>

          {/* Variant B */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3 flex items-center">
              🅱️ Variant B
              <span className="ml-2 px-2 py-1 bg-purple-600 text-xs rounded">Test</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Price</label>
                <input
                  type="number"
                  value={variantB.price}
                  onChange={(e) => setVariantB({...variantB, price: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Headline</label>
                <input
                  type="text"
                  value={variantB.headline}
                  onChange={(e) => setVariantB({...variantB, headline: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={variantB.description}
                  onChange={(e) => setVariantB({...variantB, description: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500 h-16"
                />
              </div>
            </div>
          </div>

          {/* Experiment Controls */}
          <div className="flex space-x-2">
            {!experimentActive ? (
              <button
                onClick={handleStartExperiment}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-md"
              >
                🧪 Start A/B Test
              </button>
            ) : (
              <button
                onClick={handleStopExperiment}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
              >
                ⏹️ Stop Experiment
              </button>
            )}
          </div>
        </div>
      )}

      {/* Behavioral Triggers Section */}
      {activeSection === 'triggers' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">⚡ Behavioral Trigger System</h3>
          
          <div className="space-y-3">
            {behaviorTriggers.map((trigger, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{trigger.name}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={index < 2} // First two enabled by default
                      onChange={(e) => {
                        onAction('toggle-trigger', {
                          triggerName: trigger.name,
                          enabled: e.target.checked
                        });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                <div className="text-gray-400 text-sm mb-2">
                  <strong>Condition:</strong> {trigger.condition}
                </div>
                <div className="text-green-400 text-sm">
                  <strong>Action:</strong> {trigger.action}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
            <div className="text-yellow-400 font-medium mb-1">⚡ Smart Triggers</div>
            <div className="text-yellow-200 text-sm">
              AI analyzes viewer behavior in real-time to trigger the perfect offer at the optimal moment for maximum conversions.
            </div>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {activeSection === 'analytics' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold">📈 Performance Analytics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Conversion Rate</div>
              <div className="text-white text-2xl font-bold">18.7%</div>
              <div className="text-green-400 text-sm">+12.3% from last stream</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Revenue per Viewer</div>
              <div className="text-white text-2xl font-bold">$47.20</div>
              <div className="text-green-400 text-sm">+23.1% from average</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">A/B Test Winner</div>
              <div className="text-white text-2xl font-bold">Variant B</div>
              <div className="text-purple-400 text-sm">+34% better performance</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Total Revenue</div>
              <div className="text-white text-2xl font-bold">$12,847</div>
              <div className="text-green-400 text-sm">This stream</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Top Performing Offers</h4>
            <div className="space-y-2">
              {[
                { name: 'Early Bird Special', conversion: '24.1%', revenue: '$4,200' },
                { name: 'Flash Sale Bundle', conversion: '19.8%', revenue: '$3,850' },
                { name: 'VIP Access Deal', conversion: '16.2%', revenue: '$2,950' }
              ].map((offer, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span className="text-white text-sm">{offer.name}</span>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-400">{offer.conversion}</span>
                    <span className="text-blue-400">{offer.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
            <div className="text-green-400 font-medium mb-1">📈 AutoOffer™ Impact</div>
            <div className="text-green-200 text-sm">
              Your dynamic offers are performing 189% better than static pricing, generating an additional $8,200 in revenue this month.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}