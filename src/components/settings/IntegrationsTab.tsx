'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Plus,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Trash2,
  Settings,
  DollarSign,
  Users,
  Send,
} from 'lucide-react';
import { AddIntegrationWizard } from './AddIntegrationWizard';

interface Integration {
  id: string;
  service_type: string;
  service_name: string;
  status: 'pending' | 'verified' | 'failed' | 'disabled';
  is_active: boolean;
  is_primary: boolean;
  capabilities: {
    email: boolean;
    sms: boolean;
    contacts: boolean;
    lists: boolean;
  };
  total_sent: number;
  total_failed: number;
  last_used_at: string | null;
  created_at: string;
}

const SERVICE_ICONS: Record<string, string> = {
  mailgun: '📧',
  sendgrid: '📨',
  mailchimp: '🐵',
  brevo: '📬',
  twilio: '📱',
  whatsapp_business: '💬',
  telegram: '✈️',
};

const SERVICE_NAMES: Record<string, string> = {
  mailgun: 'Mailgun',
  sendgrid: 'SendGrid',
  mailchimp: 'Mailchimp',
  brevo: 'Brevo',
  custom_smtp: 'Custom SMTP',
  twilio: 'Twilio',
  whatsapp_business: 'WhatsApp Business',
  telegram: 'Telegram',
};

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddWizard, setShowAddWizard] = useState(false);

  // Fetch integrations on mount
  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations');
      const data = await response.json();

      if (data.success) {
        setIntegrations(data.integrations || []);
      } else {
        setError(data.error || 'Failed to load integrations');
      }
    } catch (err) {
      setError('Network error - please try again');
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this integration?')) return;

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setIntegrations(integrations.filter((i) => i.id !== id));
      } else {
        alert(data.error || 'Failed to delete integration');
      }
    } catch (err) {
      alert('Network error - please try again');
      console.error('Failed to delete integration:', err);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      const data = await response.json();

      if (data.success) {
        setIntegrations(
          integrations.map((i) =>
            i.id === id ? { ...i, is_active: !isActive } : i
          )
        );
      } else {
        alert(data.error || 'Failed to update integration');
      }
    } catch (err) {
      alert('Network error - please try again');
      console.error('Failed to toggle integration:', err);
    }
  };

  const handleSyncContacts = async (id: string) => {
    try {
      const response = await fetch(`/api/integrations/${id}/sync`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Synced ${data.syncedCount} contacts successfully!`);
        fetchIntegrations(); // Refresh list
      } else {
        alert(data.error || 'Failed to sync contacts');
      }
    } catch (err) {
      alert('Network error - please try again');
      console.error('Failed to sync contacts:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <div>
            <h4 className="text-red-200 font-semibold">Error Loading Integrations</h4>
            <p className="text-red-300/80 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchIntegrations}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const emailIntegrations = integrations.filter((i) => i.capabilities.email);
  const smsIntegrations = integrations.filter((i) => i.capabilities.sms);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Email & SMS Integrations</h3>
          <p className="text-purple-200/80 text-sm">
            Connect your own Mailchimp, Mailgun, Twilio, or other services. You get billed directly by them.
          </p>
        </div>
        <button
          onClick={() => setShowAddWizard(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Integration
        </button>
      </div>

      {/* Empty State */}
      {integrations.length === 0 && (
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📧</div>
          <h4 className="text-xl font-bold text-white mb-2">No Integrations Yet</h4>
          <p className="text-purple-200/80 mb-6 max-w-md mx-auto">
            Connect your email or SMS service to send event notifications to your audience using your own API keys and billing.
          </p>
          <button
            onClick={() => setShowAddWizard(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Integration
          </button>
        </div>
      )}

      {/* Email Integrations */}
      {emailIntegrations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-semibold text-white">Email Services</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {emailIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onSyncContacts={handleSyncContacts}
              />
            ))}
          </div>
        </div>
      )}

      {/* SMS Integrations */}
      {smsIntegrations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-semibold text-white">SMS Services</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {smsIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onSyncContacts={handleSyncContacts}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Integration Wizard */}
      {showAddWizard && (
        <AddIntegrationWizard
          onClose={() => setShowAddWizard(false)}
          onSuccess={fetchIntegrations}
        />
      )}
    </div>
  );
}

function IntegrationCard({
  integration,
  onDelete,
  onToggleActive,
  onSyncContacts,
}: {
  integration: Integration;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onSyncContacts: (id: string) => void;
}) {
  const icon = SERVICE_ICONS[integration.service_type] || '🔌';
  const displayName = SERVICE_NAMES[integration.service_type] || integration.service_type;

  const getStatusColor = () => {
    switch (integration.status) {
      case 'verified':
        return 'bg-green-600/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-600/20 text-red-400 border-red-500/30';
      case 'disabled':
        return 'bg-gray-600/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusIcon = () => {
    switch (integration.status) {
      case 'verified':
        return <Check className="w-4 h-4" />;
      case 'failed':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{icon}</div>
          <div>
            <h4 className="text-white font-semibold flex items-center gap-2">
              {integration.service_name}
              {integration.is_primary && (
                <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30">
                  Primary
                </span>
              )}
            </h4>
            <p className="text-purple-200/60 text-sm">{displayName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getStatusColor()}`}>
            {getStatusIcon()}
            {integration.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <Send className="w-4 h-4" />
            <span>Sent</span>
          </div>
          <div className="text-white font-bold text-lg">{integration.total_sent.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
            <X className="w-4 h-4" />
            <span>Failed</span>
          </div>
          <div className="text-white font-bold text-lg">{integration.total_failed.toLocaleString()}</div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {integration.capabilities.email && (
          <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full">Email</span>
        )}
        {integration.capabilities.sms && (
          <span className="text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded-full">SMS</span>
        )}
        {integration.capabilities.contacts && (
          <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full">Contacts</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onToggleActive(integration.id, integration.is_active)}
          className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            integration.is_active
              ? 'bg-yellow-600/20 border border-yellow-500/30 text-yellow-200 hover:bg-yellow-600/30'
              : 'bg-green-600/20 border border-green-500/30 text-green-200 hover:bg-green-600/30'
          }`}
        >
          {integration.is_active ? 'Pause' : 'Activate'}
        </button>

        {integration.capabilities.contacts && (
          <button
            onClick={() => onSyncContacts(integration.id)}
            className="px-3 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-200 hover:bg-blue-600/30 rounded-xl transition-all"
            title="Sync Contacts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onDelete(integration.id)}
          className="px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-200 hover:bg-red-600/30 rounded-xl transition-all"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
