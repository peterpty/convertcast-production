'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { type MuxLiveStream } from '@/lib/streaming/muxProductionService';
import {
  Settings,
  Key,
  Users,
  Play,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Monitor,
  Globe,
  Mail,
  Link,
  QrCode
} from 'lucide-react';

interface StreamSetupWizardProps {
  stream: any;
  onSetupComplete: () => void;
}

type SetupStep = 'connect' | 'test' | 'invite' | 'ready';

interface StreamHealth {
  connected: boolean;
  bitrate: number;
  resolution: string;
  fps: number;
  stability: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export function StreamSetupWizard({ stream, onSetupComplete }: StreamSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('connect');
  const [streamKey, setStreamKey] = useState('');
  const [rtmpServerUrl, setRtmpServerUrl] = useState('');
  const [muxStream, setMuxStream] = useState<MuxLiveStream | null>(null);
  const [copied, setCopied] = useState(false);
  const [streamHealth, setStreamHealth] = useState<StreamHealth>({
    connected: false,
    bitrate: 0,
    resolution: '0x0',
    fps: 0,
    stability: 'disconnected'
  });
  const [inviteMethod, setInviteMethod] = useState<'email' | 'link' | 'qr'>('link');
  const [inviteEmails, setInviteEmails] = useState('');
  const [registrationUrl, setRegistrationUrl] = useState('');

  // Initialize Mux stream and get real RTMP credentials
  useEffect(() => {
    async function initializeStream() {
      try {
        console.log('🔄 Initializing production streaming...');

        // ALWAYS create a NEW stream for this user (don't reuse existing streams)
        console.log('🎥 Creating new Mux stream for user...');
        const response = await fetch('/api/mux/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventTitle: stream.events.title || 'Live Stream'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to create stream: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Stream API response:', data);

        if (data.success && data.stream) {
          setMuxStream(data.stream);
          setStreamKey(data.stream.stream_key);
          setRtmpServerUrl(data.stream.rtmp_server_url);

          console.log('✅ Production Mux stream created');
          console.log('🔑 Stream key:', data.stream.stream_key.substring(0, 8) + '...');
          console.log('🌐 RTMP URL:', data.stream.rtmp_server_url);
        } else {
          throw new Error(data.error || 'Failed to create stream');
        }

        setRegistrationUrl(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/join/${stream.id}`);
      } catch (error) {
        console.error('❌ PRODUCTION ERROR - Failed to initialize stream:', error);
        // Show error to user - no fallback in production
        alert(`PRODUCTION ERROR: Failed to initialize streaming. Please check your Mux credentials.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    }

    initializeStream();
  }, [stream.id, stream.events.title]);

  // Stream health monitoring via API
  useEffect(() => {
    if (currentStep === 'test' && muxStream) {
      const interval = setInterval(async () => {
        try {
          console.log('🔍 Getting stream health for:', muxStream.id);

          const response = await fetch(`/api/stream-health?streamId=${muxStream.id}`);
          if (!response.ok) {
            throw new Error(`Stream health check failed: ${response.status}`);
          }

          const data = await response.json();
          console.log('🌡️ Health data:', data);

          if (data.success && data.health) {
            const health = data.health;
            // Enhanced connection detection - check for active stream states
            const isConnected = health.status === 'excellent' ||
                              health.status === 'good' ||
                              (health.status !== 'offline' && health.bitrate > 0);

            console.log('🌡️ Health status:', health.status, 'Bitrate:', health.bitrate, 'Connected:', isConnected);

            setStreamHealth({
              connected: isConnected,
              bitrate: Math.round(health.bitrate / 1000), // Convert to kbps
              resolution: health.resolution,
              fps: health.framerate,
              stability: health.status === 'excellent' ? 'excellent' :
                       health.status === 'good' ? 'good' :
                       health.status === 'poor' ? 'poor' : 'disconnected'
            });
          } else {
            throw new Error('Invalid health data response');
          }
        } catch (error) {
          console.error('❌ PRODUCTION ERROR - Failed to get stream health:', error);
          // Show connection error in production
          setStreamHealth({
            connected: false,
            bitrate: 0,
            resolution: '0x0',
            fps: 0,
            stability: 'disconnected'
          });
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [currentStep, muxStream]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvites = () => {
    // Mock sending invites
    console.log('Sending invites via', inviteMethod);
    if (inviteMethod === 'email') {
      console.log('Emails:', inviteEmails.split(',').map(e => e.trim()));
    }
  };

  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const steps = [
    { id: 'connect', title: 'Connect OBS', description: 'Set up your streaming software' },
    { id: 'test', title: 'Test Stream', description: 'Verify connection quality' },
    { id: 'invite', title: 'Invite Viewers', description: 'Share registration links' },
    { id: 'ready', title: 'Go Live', description: 'Start your stream' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 'connect':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <Monitor className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Connect Your Streaming Software</h3>
              <p className="text-purple-200/80">Configure OBS Studio or your preferred streaming software to connect to ConvertCast</p>
            </div>

            <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Stream Configuration
                </h4>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-xs font-medium">PRODUCTION MUX</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Server URL (RTMP)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={rtmpServerUrl || 'Loading...'}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(rtmpServerUrl)}
                      className="p-3 bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white rounded-xl"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-2">Stream Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={streamKey}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(streamKey)}
                      className="p-3 bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white rounded-xl"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-purple-300/60 mt-1">Keep this key private and secure</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-blue-500/20 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">OBS Studio Setup Guide</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <div>
                    <p className="text-white font-medium">Open OBS Studio Settings</p>
                    <p className="text-purple-200/80 text-sm">Go to File → Settings → Stream</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <div>
                    <p className="text-white font-medium">Select "Custom..." Service</p>
                    <p className="text-purple-200/80 text-sm">Choose Custom streaming service from the dropdown</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                  <div>
                    <p className="text-white font-medium">Enter Server and Stream Key</p>
                    <p className="text-purple-200/80 text-sm">Copy and paste the values from above</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                  <div>
                    <p className="text-white font-medium">Click "Start Streaming"</p>
                    <p className="text-purple-200/80 text-sm">Begin streaming to test the connection</p>
                  </div>
                </div>
              </div>

              <a
                href="https://obsproject.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-white rounded-xl text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Download OBS Studio
              </a>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStep('test')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Test Connection
              </button>
            </div>
          </div>
        );

      case 'test':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <Settings className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Test Your Stream</h3>
              <p className="text-purple-200/80">We're monitoring your stream connection and quality</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className={streamHealth.connected ? "w-5 h-5 text-green-400" : "w-5 h-5 text-red-400"} />
                  Connection Status
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Status:</span>
                    <span className={streamHealth.connected ? "text-green-400" : "text-red-400"}>
                      {streamHealth.connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Bitrate:</span>
                    <span className="text-white">{Math.round(streamHealth.bitrate)} kbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Resolution:</span>
                    <span className="text-white">{streamHealth.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">FPS:</span>
                    <span className="text-white">{streamHealth.fps}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Stream Health</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-purple-300">Stability:</span>
                      <span className={getStabilityColor(streamHealth.stability)}>
                        {streamHealth.stability.charAt(0).toUpperCase() + streamHealth.stability.slice(1)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          streamHealth.stability === 'excellent' ? 'bg-green-500 w-full' :
                          streamHealth.stability === 'good' ? 'bg-yellow-500 w-3/4' :
                          streamHealth.stability === 'poor' ? 'bg-red-500 w-1/2' :
                          'bg-gray-500 w-1/4'
                        }`}
                      />
                    </div>
                  </div>

                  {streamHealth.connected && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3">
                      <p className="text-green-300 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Stream is ready for live broadcast
                      </p>
                    </div>
                  )}

                  {!streamHealth.connected && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                      <p className="text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Check OBS connection and stream key
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('connect')}
                className="border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/20 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Back to Setup
              </button>
              <button
                onClick={() => setCurrentStep('invite')}
                disabled={!streamHealth.connected}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Invite Viewers
              </button>
            </div>
          </div>
        );

      case 'invite':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <Users className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Invite Your Audience</h3>
              <p className="text-purple-200/80">Share registration links to build your audience</p>
            </div>

            <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Registration URL</h4>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={registrationUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white text-sm"
                />
                <button
                  onClick={() => copyToClipboard(registrationUrl)}
                  className="p-3 bg-purple-600/20 border border-purple-500/30 text-purple-200 hover:text-white rounded-xl"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-purple-300/60">Share this link for viewers to register for your event</p>
            </div>

            <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Invitation Method</h4>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setInviteMethod('link')}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    inviteMethod === 'link'
                      ? 'bg-purple-600/20 border-purple-500/30 text-white'
                      : 'bg-slate-800/60 border-purple-500/20 text-purple-300'
                  }`}
                >
                  <Link className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Share Link</span>
                </button>
                <button
                  onClick={() => setInviteMethod('email')}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    inviteMethod === 'email'
                      ? 'bg-purple-600/20 border-purple-500/30 text-white'
                      : 'bg-slate-800/60 border-purple-500/20 text-purple-300'
                  }`}
                >
                  <Mail className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Email Invites</span>
                </button>
                <button
                  onClick={() => setInviteMethod('qr')}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    inviteMethod === 'qr'
                      ? 'bg-purple-600/20 border-purple-500/30 text-white'
                      : 'bg-slate-800/60 border-purple-500/20 text-purple-300'
                  }`}
                >
                  <QrCode className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">QR Code</span>
                </button>
              </div>

              {inviteMethod === 'email' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Email Addresses (comma separated)
                    </label>
                    <textarea
                      rows={3}
                      value={inviteEmails}
                      onChange={(e) => setInviteEmails(e.target.value)}
                      placeholder="john@example.com, jane@example.com, ..."
                      className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <button
                    onClick={sendInvites}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    Send Invitations
                  </button>
                </div>
              )}

              {inviteMethod === 'qr' && (
                <div className="text-center">
                  <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-black" />
                  </div>
                  <p className="text-purple-300 text-sm">QR Code for {registrationUrl}</p>
                </div>
              )}
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
              <h5 className="text-blue-300 font-semibold mb-2">💡 Pro Tips</h5>
              <ul className="text-blue-200/80 text-sm space-y-1">
                <li>• Share the registration link on social media for maximum reach</li>
                <li>• Send invites 24-48 hours before your event for best attendance</li>
                <li>• Use the QR code for in-person event promotion</li>
                <li>• Track registration numbers in the Events dashboard</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('test')}
                className="border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/20 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Back to Test
              </button>
              <button
                onClick={() => setCurrentStep('ready')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Ready to Go Live
              </button>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <Play className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Go Live!</h3>
              <p className="text-purple-200/80">All systems are configured and ready for broadcast</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Setup Complete
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-green-200">
                    <Check className="w-4 h-4" />
                    OBS connected and streaming
                  </li>
                  <li className="flex items-center gap-2 text-green-200">
                    <Check className="w-4 h-4" />
                    Stream quality verified
                  </li>
                  <li className="flex items-center gap-2 text-green-200">
                    <Check className="w-4 h-4" />
                    Registration link active
                  </li>
                  <li className="flex items-center gap-2 text-green-200">
                    <Check className="w-4 h-4" />
                    AI features enabled
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Event Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Event:</span>
                    <span className="text-white">{stream.events?.title || 'Untitled Event'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Stream Key:</span>
                    <span className="text-white font-mono text-xs">...{streamKey.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Registration URL:</span>
                    <span className="text-blue-400 text-xs">convertcast.com/join/...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">AI Features:</span>
                    <span className="text-green-400">6/6 Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
              <h4 className="text-red-300 font-semibold mb-2">⚠️ Going Live Checklist</h4>
              <ul className="text-red-200/80 text-sm space-y-1">
                <li>• Ensure your OBS scenes are properly configured</li>
                <li>• Test your microphone and camera one final time</li>
                <li>• Have your presentation materials ready</li>
                <li>• Share the registration link if you haven't already</li>
                <li>• Take a deep breath - ConvertCast AI will handle the rest!</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('invite')}
                className="border border-purple-500/30 text-purple-200 hover:text-white hover:bg-purple-600/20 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                Back to Invites
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('💾 Saving stream to database...');
                    const response = await fetch('/api/streams/save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventTitle: stream.events?.title || 'My Live Stream',
                        eventDescription: stream.events?.description || 'Live streaming event',
                        muxStreamId: muxStream?.id,
                        muxPlaybackId: muxStream?.playback_id,
                        streamKey: streamKey,
                        rtmpServerUrl: rtmpServerUrl
                      })
                    });

                    if (!response.ok) {
                      const error = await response.json();
                      throw new Error(error.error || 'Failed to save stream');
                    }

                    const data = await response.json();
                    console.log('✅ Stream saved to database:', data);

                    // Call the setup complete callback
                    onSetupComplete();
                  } catch (error) {
                    console.error('❌ Failed to save stream:', error);
                    alert(`Failed to save stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-red-500/30 transition-all duration-200 flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Go Live Now!
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : isCompleted
                          ? 'bg-green-600 border-green-400 text-white'
                          : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}>
                      {isCompleted ? <Check className="w-6 h-6" /> : <span className="font-semibold">{index + 1}</span>}
                    </div>
                    <div className="text-center mt-3">
                      <div className={`font-medium ${isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-slate-400'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-slate-600'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl"
        >
          {renderStepContent()}
        </motion.div>
      </div>
    </div>
  );
}