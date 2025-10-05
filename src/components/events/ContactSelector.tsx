'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Mail, MessageSquare, Check, AlertCircle, Loader2 } from 'lucide-react';

interface Integration {
  id: string;
  service_type: string;
  service_name: string;
  capabilities: {
    email: boolean;
    sms: boolean;
    contacts: boolean;
  };
  is_active: boolean;
  status: string;
}

interface Contact {
  id: string;
  integration_id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  tags?: string[];
  consent_email: boolean;
  consent_sms: boolean;
}

interface ContactSelectorProps {
  notificationType: 'email' | 'sms' | 'both';
  onContactsChange: (selectedContactIds: string[], selectedIntegrationId: string | null) => void;
}

export function ContactSelector({ notificationType, onContactsChange }: ContactSelectorProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load integrations on mount
  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Load contacts when integration is selected
  useEffect(() => {
    if (selectedIntegration) {
      fetchContacts(selectedIntegration);
    } else {
      setContacts([]);
      setSelectedContacts(new Set());
    }
  }, [selectedIntegration]);

  // Notify parent when selection changes
  useEffect(() => {
    onContactsChange(Array.from(selectedContacts), selectedIntegration);
  }, [selectedContacts, selectedIntegration]);

  const fetchIntegrations = async () => {
    try {
      setLoadingIntegrations(true);
      const response = await fetch('/api/integrations');
      const data = await response.json();

      if (data.success) {
        // Filter integrations based on notification type and capabilities
        const filtered = data.integrations.filter((int: Integration) => {
          if (int.status !== 'verified' || !int.is_active) return false;
          if (!int.capabilities.contacts) return false;

          if (notificationType === 'email') return int.capabilities.email;
          if (notificationType === 'sms') return int.capabilities.sms;
          if (notificationType === 'both') return int.capabilities.email || int.capabilities.sms;

          return false;
        });

        setIntegrations(filtered);

        // Auto-select first integration if only one available
        if (filtered.length === 1) {
          setSelectedIntegration(filtered[0].id);
        }
      } else {
        setError(data.error || 'Failed to load integrations');
      }
    } catch (err) {
      setError('Network error - please try again');
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const fetchContacts = async (integrationId: string) => {
    try {
      setLoadingContacts(true);
      setError(null);

      const response = await fetch(`/api/integrations/${integrationId}/contacts?limit=1000`);
      const data = await response.json();

      if (data.success) {
        // Filter contacts based on consent
        const filtered = data.contacts.filter((contact: Contact) => {
          if (notificationType === 'email') return contact.consent_email && contact.email;
          if (notificationType === 'sms') return contact.consent_sms && contact.phone;
          if (notificationType === 'both') {
            return (contact.consent_email && contact.email) || (contact.consent_sms && contact.phone);
          }
          return false;
        });

        setContacts(filtered);
      } else {
        setError(data.error || 'Failed to load contacts');
      }
    } catch (err) {
      setError('Network error - please try again');
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const toggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const selectAll = () => {
    const filtered = getFilteredContacts();
    const allIds = new Set(filtered.map(c => c.id));
    setSelectedContacts(allIds);
  };

  const deselectAll = () => {
    setSelectedContacts(new Set());
  };

  const getFilteredContacts = () => {
    if (!searchQuery) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => {
      const name = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const phone = (contact.phone || '').toLowerCase();

      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  };

  const filteredContacts = getFilteredContacts();

  if (loadingIntegrations) {
    return (
      <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="ml-3 text-purple-200">Loading integrations...</span>
        </div>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-200 font-semibold mb-2">No Integrations Found</h4>
            <p className="text-yellow-300/80 text-sm mb-4">
              You need to connect an email or SMS service with contact syncing capabilities.
            </p>
            <a
              href="/dashboard/settings"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Add Integration
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Selector */}
      <div>
        <label className="block text-purple-300 font-medium mb-3">Select Contact Source</label>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((integration) => (
            <button
              key={integration.id}
              onClick={() => setSelectedIntegration(integration.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedIntegration === integration.id
                  ? 'border-purple-500 bg-purple-600/20'
                  : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {integration.capabilities.email ? (
                  <Mail className="w-4 h-4 text-purple-400" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                )}
                <span className="text-white font-semibold text-sm">{integration.service_name}</span>
              </div>
              <p className="text-purple-200/70 text-xs capitalize">{integration.service_type}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Contact List */}
      {selectedIntegration && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-purple-300 font-medium flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Contacts ({selectedContacts.size} selected)
            </label>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-purple-400 hover:text-purple-300 px-3 py-1 rounded-lg hover:bg-purple-600/20 transition-all"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-purple-400 hover:text-purple-300 px-3 py-1 rounded-lg hover:bg-purple-600/20 transition-all"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Loading state */}
          {loadingContacts && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              <span className="ml-3 text-purple-200">Loading contacts...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Contacts grid */}
          {!loadingContacts && !error && (
            <>
              {filteredContacts.length === 0 ? (
                <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-8 text-center">
                  <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {searchQuery ? 'No contacts match your search' : 'No contacts found'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => fetchContacts(selectedIntegration)}
                      className="mt-4 text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Sync contacts from integration
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => {
                      const isSelected = selectedContacts.has(contact.id);
                      const displayName = contact.first_name || contact.last_name
                        ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                        : contact.email || contact.phone || 'Unknown';

                      return (
                        <button
                          key={contact.id}
                          onClick={() => toggleContact(contact.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isSelected
                              ? 'bg-purple-600/30 border-2 border-purple-500'
                              : 'bg-slate-700/50 border-2 border-transparent hover:border-purple-500/30'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-purple-600' : 'bg-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>

                          <div className="flex-1 text-left">
                            <div className="text-white font-medium text-sm">{displayName}</div>
                            <div className="text-purple-200/60 text-xs">
                              {contact.email && <span>{contact.email}</span>}
                              {contact.email && contact.phone && <span className="mx-2">•</span>}
                              {contact.phone && <span>{contact.phone}</span>}
                            </div>
                          </div>

                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {contact.tags.slice(0, 2).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {contact.tags.length > 2 && (
                                <span className="text-xs text-purple-400">+{contact.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredContacts.length > 0 && (
                <p className="text-purple-200/60 text-sm mt-3">
                  Showing {filteredContacts.length} of {contacts.length} contacts
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
