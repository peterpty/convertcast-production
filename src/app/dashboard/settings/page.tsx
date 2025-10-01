'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  Settings,
  User,
  Bell,
  Zap,
  Shield,
  CreditCard,
  Database,
  Globe,
  Save,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

interface TabProps {
  id: string;
  name: string;
  icon: any;
}

const tabs: TabProps[] = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'features', name: 'AI Features', icon: Zap },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'integrations', name: 'Integrations', icon: Database },
  { id: 'global', name: 'Global Settings', icon: Globe },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Profile Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue="john@company.com"
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Company</label>
                  <input
                    type="text"
                    defaultValue="ConvertCast Demo"
                    className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Time Zone</label>
                  <select className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400">
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
              <div className="space-y-6">
                {[
                  { name: 'ShowUp Surge™ Alerts', desc: 'Get notified when attendance patterns change' },
                  { name: 'EngageMax™ Updates', desc: 'Real-time engagement optimization alerts' },
                  { name: 'AutoOffer™ Performance', desc: 'Conversion rate and revenue notifications' },
                  { name: 'AI Live Chat Messages', desc: 'Important viewer support notifications' },
                  { name: 'InsightEngine™ Reports', desc: 'Weekly analytics and insights' },
                  { name: 'SmartScheduler Updates', desc: 'Optimal timing recommendations' },
                ].map((item, index) => (
                  <div key={index} className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">{item.name}</h4>
                        <p className="text-purple-200/80 text-sm mt-1">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">AI Feature Configuration</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { name: 'ShowUp Surge™', status: 'Active', performance: '+95%' },
                  { name: 'EngageMax™', status: 'Active', performance: '+215%' },
                  { name: 'AutoOffer™', status: 'Optimizing', performance: '+186%' },
                  { name: 'AI Live Chat', status: 'Active', performance: '+920%' },
                  { name: 'InsightEngine™', status: 'Learning', performance: '+104%' },
                  { name: 'SmartScheduler', status: 'Active', performance: '+147%' },
                ].map((feature, index) => (
                  <div key={index} className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-semibold">{feature.name}</h4>
                      <span className="text-green-400 text-sm">{feature.status}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-purple-200/80 text-sm">Performance</span>
                      <span className="text-green-400 font-bold">{feature.performance}</span>
                    </div>
                    <button className="w-full bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/30 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200">
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4">API Key Management</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">Production API Key</label>
                      <div className="flex gap-3">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value="cc_prod_1234567890abcdef"
                          readOnly
                          className="flex-1 px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white"
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="px-4 py-3 bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white rounded-xl"
                        >
                          {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                      Regenerate Key
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200/80">Secure your account with 2FA</p>
                      <p className="text-sm text-gray-400">Currently disabled</p>
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Billing & Subscription</h3>
              <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-3xl p-8">
                <h4 className="text-2xl font-bold text-white mb-2">ConvertCast Pro</h4>
                <p className="text-purple-200/80 mb-6">All 6 AI features included with unlimited streaming</p>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">$297</div>
                    <div className="text-sm text-purple-300">Per month</div>
                  </div>
                  <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">∞</div>
                    <div className="text-sm text-purple-300">Concurrent viewers</div>
                  </div>
                  <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">6</div>
                    <div className="text-sm text-purple-300">AI features</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                    Update Payment Method
                  </button>
                  <button className="border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/20 px-6 py-3 rounded-xl font-semibold transition-all duration-200">
                    View Invoices
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Integrations</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { name: 'Zoom', status: 'Connected', desc: 'Backup streaming option' },
                  { name: 'YouTube Live', status: 'Available', desc: 'Multi-platform streaming' },
                  { name: 'Facebook Live', status: 'Available', desc: 'Social media reach' },
                  { name: 'Zapier', status: 'Connected', desc: 'Automation workflows' },
                  { name: 'Salesforce', status: 'Available', desc: 'CRM integration' },
                  { name: 'HubSpot', status: 'Connected', desc: 'Marketing automation' },
                ].map((integration, index) => (
                  <div key={index} className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-semibold">{integration.name}</h4>
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        integration.status === 'Connected'
                          ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {integration.status}
                      </span>
                    </div>
                    <p className="text-purple-200/80 text-sm mb-4">{integration.desc}</p>
                    <button className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      integration.status === 'Connected'
                        ? 'bg-red-600/20 border border-red-500/30 text-red-200 hover:text-white hover:bg-red-600/30'
                        : 'bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/30'
                    }`}>
                      {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'global':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Global Settings</h3>
              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4">Regional Settings</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">Default Language</label>
                      <select className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400">
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-300 mb-2">Currency</label>
                      <select className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400">
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4">Performance Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white">High-Quality Streaming</span>
                        <p className="text-purple-200/80 text-sm">4K streaming with AI optimization</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white">Real-time Analytics</span>
                        <p className="text-purple-200/80 text-sm">Live InsightEngine™ processing</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Content for {activeTab}</div>;
    }
  };

  return (
    <DashboardLayout
      title="Settings"
      description="Configure your ConvertCast platform"
    >
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 shadow-2xl">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-white'
                      : 'text-purple-200 hover:bg-purple-600/10 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-purple-500/20">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-200 flex items-center gap-2"
                >
                  {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
                {saved && (
                  <span className="text-green-400 text-sm">Settings saved successfully</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}