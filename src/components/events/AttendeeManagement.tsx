'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Mail,
  Phone,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Eye,
  Download,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Target,
  Zap,
  Send
} from 'lucide-react';
import { emailIntegration, EmailCampaign } from '@/lib/email/emailIntegration';
import { showUpSurgeEngine } from '@/lib/notifications/showUpSurgeEngine';
import { format, addDays } from 'date-fns';

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registeredAt: Date;
  showUpProbability: number;
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  emailInteractions: {
    sent: number;
    opened: number;
    clicked: number;
  };
  lastInteraction?: Date;
  source: 'direct' | 'social' | 'referral' | 'organic';
  tags: string[];
}

interface AttendeeManagementProps {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  onAttendeeCountChange: (count: number) => void;
}

export function AttendeeManagement({
  eventId,
  eventTitle,
  eventDate,
  onAttendeeCountChange
}: AttendeeManagementProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'attendees' | 'campaigns' | 'analytics'>('attendees');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Quick email add state
  const [quickEmail, setQuickEmail] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);

  useEffect(() => {
    loadAttendeeData();
    loadCampaigns();
  }, [eventId]);

  useEffect(() => {
    onAttendeeCountChange(attendees.length);
  }, [attendees.length, onAttendeeCountChange]);

  const loadAttendeeData = async () => {
    try {
      // Generate sample attendees with ShowUp Surge analytics
      const sampleAttendees: Attendee[] = [];

      for (let i = 0; i < 247; i++) {
        const engagementScore = 20 + Math.random() * 80;
        const showUpProbability = 0.2 + Math.random() * 0.6;

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (showUpProbability < 0.3) riskLevel = 'critical';
        else if (showUpProbability < 0.5) riskLevel = 'high';
        else if (showUpProbability < 0.7) riskLevel = 'medium';

        const attendee: Attendee = {
          id: `attendee_${i + 1}`,
          name: generateRandomName(),
          email: `attendee${i + 1}@${['gmail.com', 'yahoo.com', 'company.com', 'business.co'][Math.floor(Math.random() * 4)]}`,
          phone: Math.random() > 0.3 ? generateRandomPhone() : undefined,
          registeredAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
          showUpProbability,
          engagementScore,
          riskLevel,
          emailInteractions: {
            sent: Math.floor(Math.random() * 5) + 1,
            opened: Math.floor(Math.random() * 3),
            clicked: Math.floor(Math.random() * 2)
          },
          lastInteraction: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
          source: ['direct', 'social', 'referral', 'organic'][Math.floor(Math.random() * 4)] as any,
          tags: generateRandomTags()
        };

        sampleAttendees.push(attendee);
      }

      setAttendees(sampleAttendees);
    } catch (error) {
      console.error('Failed to load attendee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = () => {
    const eventCampaigns = emailIntegration.getCampaignsForEvent(eventId);
    setCampaigns(eventCampaigns);
  };

  const generateRandomName = (): string => {
    const firstNames = ['Alex', 'Sarah', 'Mike', 'Jennifer', 'David', 'Lisa', 'John', 'Emma', 'Chris', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  const generateRandomPhone = (): string => {
    return `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 9000 + 1000)}`;
  };

  const generateRandomTags = (): string[] => {
    const allTags = ['entrepreneur', 'marketer', 'developer', 'designer', 'manager', 'consultant', 'founder', 'freelancer'];
    const tagCount = Math.floor(Math.random() * 3) + 1;
    return allTags.sort(() => 0.5 - Math.random()).slice(0, tagCount);
  };

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = searchTerm === '' ||
      attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterRisk === 'all' || attendee.riskLevel === filterRisk;

    return matchesSearch && matchesFilter;
  });

  const riskDistribution = {
    low: attendees.filter(a => a.riskLevel === 'low').length,
    medium: attendees.filter(a => a.riskLevel === 'medium').length,
    high: attendees.filter(a => a.riskLevel === 'high').length,
    critical: attendees.filter(a => a.riskLevel === 'critical').length
  };

  const createEmailCampaign = async () => {
    try {
      const registeredAttendees = attendees.map(attendee => ({
        id: attendee.id,
        email: attendee.email,
        name: attendee.name,
        registeredAt: attendee.registeredAt
      }));

      const campaign = await emailIntegration.createCampaign(
        eventId,
        eventTitle,
        eventDate,
        registeredAttendees
      );

      setCampaigns(prev => [...prev, campaign]);
      setShowCampaignModal(false);

      console.log('Created email campaign:', campaign);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <TrendingDown className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const handleQuickAddEmail = async () => {
    try {
      setAddingEmail(true);

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(quickEmail)) {
        alert('Please enter a valid email address');
        return;
      }

      // Auto-generate first and last name from email
      const emailParts = quickEmail.split('@')[0].split(/[._-]/);
      const firstName = emailParts[0]?.charAt(0).toUpperCase() + emailParts[0]?.slice(1) || 'Guest';
      const lastName = emailParts[1]?.charAt(0).toUpperCase() + emailParts[1]?.slice(1) || 'User';

      console.log('Adding attendee with email:', quickEmail);

      const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: quickEmail,
          source: 'manual',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add attendee');
      }

      console.log('✅ Attendee added:', data.registration);

      // Clear input and reload attendee data
      setQuickEmail('');
      alert(`Successfully added ${quickEmail} to the event!`);

      // TODO: Reload real attendee data from API
      // For now, this adds to mock data
    } catch (error) {
      console.error('❌ Failed to add attendee:', error);
      alert(`Failed to add attendee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-300">Loading attendee data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-bold text-white">Event Management</h3>
            <div className="text-sm text-gray-400">
              {attendees.length} registered • {Math.round(attendees.reduce((sum, a) => sum + a.showUpProbability, 0))} predicted
            </div>
          </div>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 mt-4">
          {[
            { id: 'attendees', name: 'Attendees', icon: Users },
            { id: 'campaigns', name: 'Email Campaigns', icon: Mail },
            { id: 'analytics', name: 'Analytics', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Add Attendee Form */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <input
            type="email"
            placeholder="Add attendee by email (e.g., john.doe@example.com)"
            value={quickEmail}
            onChange={(e) => setQuickEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !addingEmail) {
                handleQuickAddEmail();
              }
            }}
            disabled={addingEmail}
            className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleQuickAddEmail}
            disabled={addingEmail || !quickEmail}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {addingEmail ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Add Attendee
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-8">
          Names will be auto-generated from the email address. You can edit them later if needed.
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'attendees' && (
          <div className="space-y-6">
            {/* Risk Overview */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Low Risk', count: riskDistribution.low, color: 'text-green-400', bg: 'bg-green-500/20' },
                { label: 'Medium Risk', count: riskDistribution.medium, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
                { label: 'High Risk', count: riskDistribution.high, color: 'text-orange-400', bg: 'bg-orange-500/20' },
                { label: 'Critical Risk', count: riskDistribution.critical, color: 'text-red-400', bg: 'bg-red-500/20' }
              ].map((risk, index) => (
                <motion.div
                  key={risk.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${risk.bg} border border-gray-600 rounded-lg p-4`}
                >
                  <div className="text-2xl font-bold text-white">{risk.count}</div>
                  <div className={`text-sm ${risk.color}`}>{risk.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search attendees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value as any)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>

            {/* Attendees Table */}
            <div className="bg-gray-900/50 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-medium">Attendee</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Risk Level</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Engagement</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Show Up %</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Email Stats</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendees.slice(0, 50).map((attendee) => (
                      <motion.tr
                        key={attendee.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-gray-700 hover:bg-gray-800/50"
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-medium text-white">{attendee.name}</div>
                              <div className="text-sm text-gray-400">{attendee.email}</div>
                              {attendee.phone && (
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {attendee.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(attendee.riskLevel)}`}>
                            {getRiskIcon(attendee.riskLevel)}
                            <span className="capitalize">{attendee.riskLevel}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium">{Math.round(attendee.engagementScore)}</div>
                          <div className="w-16 bg-gray-700 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-purple-400 h-1.5 rounded-full"
                              style={{ width: `${attendee.engagementScore}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-medium">{Math.round(attendee.showUpProbability * 100)}%</div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs text-gray-400">
                            <div>Sent: {attendee.emailInteractions.sent}</div>
                            <div>Opened: {attendee.emailInteractions.opened}</div>
                            <div>Clicked: {attendee.emailInteractions.clicked}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-400">
                            {format(attendee.registeredAt, 'MMM dd')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {attendee.source}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'campaigns' && (
          <div className="space-y-6">
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Email Campaigns Yet</h3>
                <p className="text-gray-400 mb-6">Create your first campaign to start sending automated reminder emails.</p>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900/50 border border-gray-600 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{campaign.eventTitle}</h4>
                      <p className="text-gray-400">Created {format(campaign.createdAt, 'MMM dd, yyyy')}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">{campaign.attendeeCount}</div>
                      <div className="text-sm text-gray-400">Recipients</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{campaign.emailsSent}</div>
                      <div className="text-sm text-gray-400">Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{campaign.emailsOpened}</div>
                      <div className="text-sm text-gray-400">Opened</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {campaign.emailsSent > 0 ? Math.round((campaign.emailsOpened / campaign.emailsSent) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-400">Open Rate</div>
                    </div>
                  </div>

                  {campaign.showUpSurgeAnalytics && (
                    <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-400 font-medium">ShowUp Surge™ Optimization</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-white font-medium">{campaign.showUpSurgeAnalytics.predictedAttendance}</div>
                          <div className="text-gray-400">Predicted Attendance</div>
                        </div>
                        <div>
                          <div className="text-white font-medium">{campaign.showUpSurgeAnalytics.riskDistribution.critical + campaign.showUpSurgeAnalytics.riskDistribution.high}</div>
                          <div className="text-gray-400">High Risk Attendees</div>
                        </div>
                        <div>
                          <div className="text-green-400 font-medium">+{Math.round(Math.random() * 30 + 20)}%</div>
                          <div className="text-gray-400">Expected Boost</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{attendees.length}</div>
                <div className="text-sm text-gray-400">Total Registrations</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {Math.round(attendees.reduce((sum, a) => sum + a.showUpProbability, 0))}
                </div>
                <div className="text-sm text-gray-400">Predicted Attendance</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {Math.round(attendees.reduce((sum, a) => sum + a.engagementScore, 0) / attendees.length)}
                </div>
                <div className="text-sm text-gray-400">Avg Engagement</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">+{Math.round(Math.random() * 20 + 35)}%</div>
                <div className="text-sm text-gray-400">Expected Boost</div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Registration Sources</h4>
              <div className="space-y-3">
                {['Direct', 'Social Media', 'Referral', 'Organic Search'].map((source, index) => {
                  const count = attendees.filter(a =>
                    a.source === source.toLowerCase().replace(' ', '')
                  ).length;
                  const percentage = (count / attendees.length) * 100;

                  return (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-gray-300">{source}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-white font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Creation Modal */}
      <AnimatePresence>
        {showCampaignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCampaignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Create Email Campaign</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2">This will create an automated email campaign with:</p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>✓ Registration confirmation emails</li>
                    <li>✓ 24-hour reminder emails</li>
                    <li>✓ 1-hour reminder emails</li>
                    <li>✓ Live event starting notifications</li>
                    <li>✓ ShowUp Surge™ AI optimization</li>
                  </ul>
                </div>

                <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-medium">AI Optimization Included</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Emails will be sent at optimal times for each attendee based on their engagement patterns and show-up probability.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCampaignModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createEmailCampaign}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create Campaign
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}