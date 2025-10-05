'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Mail,
  MessageSquare,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

interface Service {
  type: string;
  name: string;
  icon: string;
  category: 'email' | 'sms';
  description: string;
  docsUrl: string;
}

const SERVICES: Service[] = [
  {
    type: 'mailgun',
    name: 'Mailgun',
    icon: '📧',
    category: 'email',
    description: 'Powerful email API for developers',
    docsUrl: 'https://documentation.mailgun.com/en/latest/api-intro.html',
  },
  {
    type: 'sendgrid',
    name: 'SendGrid',
    icon: '📨',
    category: 'email',
    description: 'Email delivery & marketing platform',
    docsUrl: 'https://docs.sendgrid.com/api-reference',
  },
  {
    type: 'mailchimp',
    name: 'Mailchimp',
    icon: '🐵',
    category: 'email',
    description: 'Marketing automation & email campaigns',
    docsUrl: 'https://mailchimp.com/developer/marketing/api/',
  },
  {
    type: 'brevo',
    name: 'Brevo (Sendinblue)',
    icon: '📬',
    category: 'email',
    description: 'Email & SMS marketing platform',
    docsUrl: 'https://developers.brevo.com/',
  },
  {
    type: 'twilio',
    name: 'Twilio',
    icon: '📱',
    category: 'sms',
    description: 'SMS, Voice & WhatsApp API',
    docsUrl: 'https://www.twilio.com/docs/sms',
  },
  {
    type: 'whatsapp_business',
    name: 'WhatsApp Business',
    icon: '💬',
    category: 'sms',
    description: 'WhatsApp Business messaging',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
  },
  {
    type: 'telegram',
    name: 'Telegram Bot',
    icon: '✈️',
    category: 'sms',
    description: 'Telegram bot messaging (free!)',
    docsUrl: 'https://core.telegram.org/bots/api',
  },
];

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'password' | 'email' | 'select';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
}

const SERVICE_FIELDS: Record<string, FieldConfig[]> = {
  mailgun: [
    {
      name: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      placeholder: 'key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      helpText: 'Found in Settings > API Keys',
    },
    {
      name: 'domain',
      label: 'Domain',
      type: 'text',
      required: true,
      placeholder: 'mg.yourdomain.com',
      helpText: 'Your verified Mailgun domain',
    },
    {
      name: 'senderEmail',
      label: 'Sender Email',
      type: 'email',
      required: true,
      placeholder: 'notifications@yourdomain.com',
    },
    {
      name: 'region',
      label: 'Region',
      type: 'select',
      required: false,
      options: [
        { value: 'us', label: 'US (api.mailgun.net)' },
        { value: 'eu', label: 'EU (api.eu.mailgun.net)' },
      ],
    },
  ],
  sendgrid: [
    {
      name: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      placeholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      helpText: 'Created in Settings > API Keys with "Mail Send" permission',
    },
    {
      name: 'senderEmail',
      label: 'Sender Email',
      type: 'email',
      required: true,
      placeholder: 'notifications@yourdomain.com',
      helpText: 'Must be a verified sender in SendGrid',
    },
  ],
  mailchimp: [
    {
      name: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1',
      helpText: 'Found in Account > Extras > API Keys (format: key-serverprefix)',
    },
    {
      name: 'senderEmail',
      label: 'Sender Email',
      type: 'email',
      required: true,
      placeholder: 'notifications@yourdomain.com',
      helpText: 'Must be verified in Mailchimp',
    },
  ],
  brevo: [
    {
      name: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      placeholder: 'xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      helpText: 'Found in Settings > SMTP & API > API Keys',
    },
    {
      name: 'senderEmail',
      label: 'Sender Email',
      type: 'email',
      required: true,
      placeholder: 'notifications@yourdomain.com',
    },
  ],
  twilio: [
    {
      name: 'apiKey',
      label: 'Account SID',
      type: 'text',
      required: true,
      placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      helpText: 'Found in Console Dashboard at twilio.com/console',
    },
    {
      name: 'apiSecret',
      label: 'Auth Token',
      type: 'password',
      required: true,
      placeholder: 'your_auth_token',
      helpText: 'Found in Console Dashboard (click to reveal)',
    },
    {
      name: 'senderPhone',
      label: 'Twilio Phone Number',
      type: 'text',
      required: true,
      placeholder: '+1234567890',
      helpText: 'Your Twilio phone number in E.164 format',
    },
  ],
  whatsapp_business: [
    {
      name: 'apiKey',
      label: 'Access Token',
      type: 'password',
      required: true,
      placeholder: 'EAAxxxxxxxxxxxxxxxxxxxxxxx',
      helpText: 'System user access token from Meta Business Manager',
    },
    {
      name: 'phoneNumberId',
      label: 'Phone Number ID',
      type: 'text',
      required: true,
      placeholder: '1234567890123456',
      helpText: 'WhatsApp Business phone number ID from Meta',
    },
  ],
  telegram: [
    {
      name: 'apiKey',
      label: 'Bot Token',
      type: 'password',
      required: true,
      placeholder: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz',
      helpText: 'Get from @BotFather on Telegram (format: bot_id:token)',
    },
  ],
};

export function AddIntegrationWizard({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<'email' | 'sms' | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [isPrimary, setIsPrimary] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredServices = category ? SERVICES.filter(s => s.category === category) : [];
  const fields = selectedService ? SERVICE_FIELDS[selectedService.type] || [] : [];

  const handleCredentialChange = (fieldName: string, value: string) => {
    setCredentials(prev => ({ ...prev, [fieldName]: value }));

    // Store config separately for non-credential fields
    if (fieldName === 'domain' || fieldName === 'region' || fieldName === 'phoneNumberId') {
      setConfiguration(prev => ({ ...prev, [fieldName]: value }));
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: selectedService!.type,
          credentials,
          configuration,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: 'Connection successful! ✅' });
        setTimeout(() => setStep(4), 1500);
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed' });
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Network error - please try again' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!serviceName.trim()) {
      setError('Please enter a name for this integration');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: selectedService!.type,
          service_name: serviceName,
          credentials,
          configuration,
          is_primary: isPrimary,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(5);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Failed to save integration');
      }
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return category !== null;
      case 2:
        return selectedService !== null;
      case 3:
        return fields.every(field => !field.required || credentials[field.name]);
      case 4:
        return serviceName.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/30 rounded-3xl p-8 max-w-3xl w-full my-8 relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-gray-400'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 5 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step > s ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Choose Category</h2>
                <p className="text-purple-200/80 mb-8">
                  Select whether you want to send emails or SMS messages
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setCategory('email')}
                    className={`p-8 rounded-2xl border-2 transition-all ${
                      category === 'email'
                        ? 'border-purple-500 bg-purple-600/20'
                        : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
                    }`}
                  >
                    <Mail className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Email Services</h3>
                    <p className="text-purple-200/70 text-sm">
                      Mailgun, SendGrid, Mailchimp, Brevo
                    </p>
                  </button>

                  <button
                    onClick={() => setCategory('sms')}
                    className={`p-8 rounded-2xl border-2 transition-all ${
                      category === 'sms'
                        ? 'border-purple-500 bg-purple-600/20'
                        : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
                    }`}
                  >
                    <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">SMS Services</h3>
                    <p className="text-purple-200/70 text-sm">
                      Twilio, WhatsApp, Telegram
                    </p>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Select Service</h2>
                <p className="text-purple-200/80 mb-8">
                  Choose the {category} service you want to connect
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {filteredServices.map((service) => (
                    <button
                      key={service.type}
                      onClick={() => {
                        setSelectedService(service);
                        setServiceName(`${service.name} Integration`);
                      }}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${
                        selectedService?.type === service.type
                          ? 'border-purple-500 bg-purple-600/20'
                          : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{service.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
                          <p className="text-purple-200/70 text-sm mb-3">{service.description}</p>
                          <a
                            href={service.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View API Docs <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Enter Credentials</h2>
                <p className="text-purple-200/80 mb-8">
                  Provide your {selectedService?.name} API credentials
                </p>

                <div className="space-y-4 mb-8">
                  {fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-purple-300 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-400 ml-1">*</span>}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          value={credentials[field.name] || ''}
                          onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-400"
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            type={field.type === 'password' && !showPassword[field.name] ? 'password' : 'text'}
                            value={credentials[field.name] || ''}
                            onChange={(e) => handleCredentialChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => setShowPassword(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {showPassword[field.name] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          )}
                        </div>
                      )}

                      {field.helpText && (
                        <p className="text-purple-200/60 text-xs mt-1">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-xl border mb-6 ${
                      testResult.success
                        ? 'bg-green-600/20 border-green-500/30 text-green-200'
                        : 'bg-red-600/20 border-red-500/30 text-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleTestConnection}
                  disabled={!canProceed() || testing}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-gray-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      Test Connection
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Name Your Integration</h2>
                <p className="text-purple-200/80 mb-8">
                  Give this integration a memorable name
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Integration Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder={`My ${selectedService?.name} Account`}
                      className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="w-5 h-5 rounded border-purple-500/30 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="text-white font-medium">Set as primary integration</div>
                        <div className="text-purple-200/60 text-sm">
                          Use this by default for {selectedService?.category} notifications
                        </div>
                      </div>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4 text-red-200 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">Integration Added!</h2>
                <p className="text-purple-200/80 text-lg">
                  Your {selectedService?.name} integration is now active and ready to use.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-purple-500/20">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-3 text-purple-200 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            {step === 4 ? (
              <button
                onClick={handleSave}
                disabled={!canProceed() || saving}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-gray-500 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Integration
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : step !== 3 && (
              <button
                onClick={() => setStep(Math.min(5, step + 1))}
                disabled={!canProceed()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-gray-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
