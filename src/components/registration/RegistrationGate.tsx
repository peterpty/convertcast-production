'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { TrustIndicators } from './TrustIndicators';
import { ProgressiveForm } from './ProgressiveForm';

type Event = Database['public']['Tables']['events']['Row'];

interface RegistrationGateProps {
  event: Event;
  eventId: string;
  onRegistrationSuccess: (data: {
    access_token: string;
    viewer_profile_id: string;
  }) => void;
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export function RegistrationGate({
  event,
  eventId,
  onRegistrationSuccess,
}: RegistrationGateProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: email, 2: name + phone

  // Calculate event timing
  const eventStart = new Date(event.scheduled_start);
  const now = new Date();
  const isLive = event.status === 'live';
  const isUpcoming = eventStart > now;
  const timeUntilStart = isUpcoming ? eventStart.getTime() - now.getTime() : 0;

  // Format time until start
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Starting now!';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    return `Starts in ${minutes}m`;
  };

  const handleEmailSubmit = async (email: string) => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    setError(null);
    setFormData(prev => ({ ...prev, email }));
    setCurrentStep(2);
    return true;
  };

  const handleCompleteRegistration = async (data: {
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    if (!data.firstName.trim() || !data.lastName.trim() || !data.phone.trim()) {
      setError('All fields are required');
      return;
    }

    if (!data.phone.match(/^[\+]?[1-9][\d]{0,15}$/)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create viewer profile
      const { data: viewerProfile, error: profileError } = await supabase
        .from('viewer_profiles')
        .insert({
          email: formData.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          intent_score: 50, // Starting score
        })
        .select()
        .single();

      if (profileError || !viewerProfile) {
        throw new Error(profileError?.message || 'Failed to create profile');
      }

      // Step 2: Generate access token
      const { data: accessToken, error: tokenError } = await supabase.rpc(
        'generate_access_token'
      );

      if (tokenError || !accessToken) {
        throw new Error('Failed to generate access token');
      }

      // Step 3: Create registration
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          viewer_profile_id: viewerProfile.id,
          access_token: accessToken,
          source: 'direct_link',
        })
        .select()
        .single();

      if (regError || !registration) {
        throw new Error('Failed to complete registration');
      }

      // Step 4: Optimize ShowUp Surge™
      try {
        await supabase.rpc('optimize_showup_surge', {
          event_id: eventId,
          viewer_id: viewerProfile.id,
        });
      } catch (surgeError) {
        console.warn('ShowUp Surge optimization failed:', surgeError);
        // Don't fail registration if ShowUp Surge fails
      }

      // Step 5: Calculate initial engagement score
      try {
        await supabase.rpc('calculate_engagement_score', {
          viewer_id: viewerProfile.id,
          time_spent: 0,
          interactions: 0,
          engagement_rate: 0,
          purchase_history: 0,
        });
      } catch (scoreError) {
        console.warn('Engagement scoring failed:', scoreError);
      }

      // Success! Pass data back to parent
      onRegistrationSuccess({
        access_token: accessToken,
        viewer_profile_id: viewerProfile.id,
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Registration failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center pt-8 pb-6">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium mb-4">
            {isLive ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span>🔴 LIVE NOW</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span>{formatTimeRemaining(timeUntilStart)}</span>
              </>
            )}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            {event.title}
          </h1>
          
          <p className="text-xl text-purple-100 max-w-2xl mx-auto px-6">
            {event.description}
          </p>
        </div>

        {/* Registration Form Container */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            {/* Trust Indicators */}
            <TrustIndicators />
            
            {/* Progressive Form */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentStep === 1 ? 'Secure Your Spot' : 'Complete Registration'}
                </h2>
                <p className="text-gray-600">
                  {currentStep === 1 
                    ? 'Enter your email to get instant access'
                    : 'Just a few more details to join the webinar'
                  }
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    1
                  </div>
                  <div className={`w-8 h-1 ${
                    currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-200'
                  }`}></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    2
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <ProgressiveForm
                currentStep={currentStep}
                formData={formData}
                onEmailSubmit={handleEmailSubmit}
                onCompleteRegistration={handleCompleteRegistration}
                isSubmitting={isSubmitting}
              />
            </div>

            {/* Security Notice */}
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm">
                🔒 Your information is secure and never shared with third parties
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-white/60 text-sm">
            Powered by ConvertCast • AI-Optimized Webinar Platform
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}