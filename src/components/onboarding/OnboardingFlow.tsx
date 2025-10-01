'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Play, Settings, Users, Zap, Target, ArrowRight, ArrowLeft } from 'lucide-react';
import { analytics } from '@/lib/monitoring/analytics';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: string;
  optional?: boolean;
}

interface OnboardingFlowProps {
  onComplete: (data: any) => void;
  userType: 'creator' | 'marketer' | 'business';
}

export function OnboardingFlow({ onComplete, userType }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [startTime] = useState(Date.now());

  // Track onboarding start
  useEffect(() => {
    analytics.trackEvent('onboarding_started', {
      userType,
      timestamp: new Date().toISOString()
    });
  }, [userType]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ConvertCast',
      description: 'The enterprise live streaming platform that converts viewers into customers',
      icon: <Play className="w-8 h-8" />,
      content: <WelcomeStep userType={userType} onData={(data) => updateData('profile', data)} />
    },
    {
      id: 'streaming',
      title: 'Set Up Your First Stream',
      description: 'Connect your streaming software and configure your broadcast settings',
      icon: <Settings className="w-8 h-8" />,
      content: <StreamingSetupStep onData={(data) => updateData('streaming', data)} />
    },
    {
      id: 'audience',
      title: 'Define Your Audience',
      description: 'Set up targeting and registration flows to maximize conversions',
      icon: <Users className="w-8 h-8" />,
      content: <AudienceSetupStep userType={userType} onData={(data) => updateData('audience', data)} />
    },
    {
      id: 'monetization',
      title: 'Configure Monetization',
      description: 'Set up payments, offers, and conversion tracking',
      icon: <Target className="w-8 h-8" />,
      content: <MonetizationStep onData={(data) => updateData('monetization', data)} />
    },
    {
      id: 'launch',
      title: 'Launch Your Stream',
      description: 'You\'re ready to go live and start converting viewers',
      icon: <Zap className="w-8 h-8" />,
      content: <LaunchStep onboardingData={onboardingData} />
    }
  ];

  const updateData = (section: string, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handleNext = () => {
    const step = steps[currentStep];

    // Mark step as completed
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps(prev => [...prev, step.id]);
    }

    // Track step completion
    analytics.trackEvent('onboarding_step_completed', {
      stepId: step.id,
      stepTitle: step.title,
      stepNumber: currentStep + 1,
      totalSteps: steps.length,
      userType,
      timeSpent: Date.now() - startTime
    });

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      analytics.trackConversion('registration');
      analytics.trackEvent('onboarding_completed', {
        userType,
        completedSteps: completedSteps.length,
        totalSteps: steps.length,
        totalTime: Date.now() - startTime,
        onboardingData
      });

      onComplete({
        ...onboardingData,
        completedAt: new Date().toISOString(),
        userType
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    analytics.trackEvent('onboarding_step_skipped', {
      stepId: steps[currentStep].id,
      stepNumber: currentStep + 1,
      userType
    });

    handleNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Get Started</h1>
            <div className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center space-y-2 ${
                  index <= currentStep ? 'text-white' : 'text-gray-600'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-purple-500 text-white'
                      : index < currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-gray-400'
                  }`}
                >
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs text-center max-w-20 leading-tight">
                  {step.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-8"
          >
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-4">
                {steps[currentStep].icon}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-300 text-lg">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {steps[currentStep].content}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  currentStep === 0
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-white hover:bg-slate-800 border border-slate-600'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex gap-4">
                {steps[currentStep].optional && (
                  <button
                    onClick={handleSkip}
                    className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
                  >
                    Skip for now
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-medium"
                >
                  {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Individual Step Components
function WelcomeStep({ userType, onData }: { userType: string; onData: (data: any) => void }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [goal, setGoal] = useState('');

  useEffect(() => {
    onData({ name, company, goal });
  }, [name, company, goal, onData]);

  const goals = [
    'Increase product sales',
    'Generate high-quality leads',
    'Build brand awareness',
    'Educate customers',
    'Launch new products',
    'Host virtual events'
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Company name
        </label>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          placeholder="Enter your company name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          What's your primary goal with live streaming?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((goalOption) => (
            <button
              key={goalOption}
              onClick={() => setGoal(goalOption)}
              className={`p-4 rounded-xl border text-left transition-all ${
                goal === goalOption
                  ? 'border-purple-500 bg-purple-500/20 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-gray-300 hover:border-slate-500'
              }`}
            >
              {goalOption}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StreamingSetupStep({ onData }: { onData: (data: any) => void }) {
  const [software, setSoftware] = useState('');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    onData({ software, experience });
  }, [software, experience, onData]);

  const softwareOptions = [
    { id: 'obs', name: 'OBS Studio', description: 'Free and open source' },
    { id: 'xsplit', name: 'XSplit', description: 'Professional streaming' },
    { id: 'streamlabs', name: 'Streamlabs', description: 'All-in-one solution' },
    { id: 'other', name: 'Other', description: 'Custom setup' }
  ];

  const experienceOptions = [
    'New to live streaming',
    'Some experience',
    'Experienced streamer',
    'Professional broadcaster'
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Which streaming software do you use?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {softwareOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSoftware(option.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                software === option.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              }`}
            >
              <div className="font-medium text-white">{option.name}</div>
              <div className="text-sm text-gray-400">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          What's your streaming experience level?
        </h3>
        <div className="space-y-3">
          {experienceOptions.map((option) => (
            <button
              key={option}
              onClick={() => setExperience(option)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                experience === option
                  ? 'border-purple-500 bg-purple-500/20 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-gray-300 hover:border-slate-500'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-300 mb-1">RTMP Setup</h4>
            <p className="text-sm text-blue-200/80">
              We'll provide you with RTMP credentials to connect your streaming software after setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AudienceSetupStep({ userType, onData }: { userType: string; onData: (data: any) => void }) {
  const [targetAudience, setTargetAudience] = useState('');
  const [expectedViewers, setExpectedViewers] = useState('');
  const [registrationRequired, setRegistrationRequired] = useState(true);

  useEffect(() => {
    onData({ targetAudience, expectedViewers, registrationRequired });
  }, [targetAudience, expectedViewers, registrationRequired, onData]);

  const audiences = [
    'B2B decision makers',
    'Small business owners',
    'Enterprise customers',
    'Consumers',
    'Industry professionals',
    'Students/learners'
  ];

  const viewerRanges = [
    '1-50 viewers',
    '50-200 viewers',
    '200-1,000 viewers',
    '1,000+ viewers'
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Who is your target audience?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {audiences.map((audience) => (
            <button
              key={audience}
              onClick={() => setTargetAudience(audience)}
              className={`p-4 rounded-xl border text-left transition-all ${
                targetAudience === audience
                  ? 'border-purple-500 bg-purple-500/20 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-gray-300 hover:border-slate-500'
              }`}
            >
              {audience}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          How many viewers do you expect?
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {viewerRanges.map((range) => (
            <button
              key={range}
              onClick={() => setExpectedViewers(range)}
              className={`p-4 rounded-xl border text-center transition-all ${
                expectedViewers === range
                  ? 'border-purple-500 bg-purple-500/20 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-gray-300 hover:border-slate-500'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Registration Settings
        </h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={registrationRequired}
              onChange={(e) => setRegistrationRequired(e.target.checked)}
              className="w-5 h-5 text-purple-500 bg-slate-800 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-white">Require registration to view stream</span>
          </label>

          <div className="text-sm text-gray-400 ml-8">
            Registration helps you capture leads and track conversions more effectively.
          </div>
        </div>
      </div>
    </div>
  );
}

function MonetizationStep({ onData }: { onData: (data: any) => void }) {
  const [revenue, setRevenue] = useState('');
  const [pricing, setPricing] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    onData({ revenue, pricing, paymentMethod });
  }, [revenue, pricing, paymentMethod, onData]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          How do you plan to generate revenue?
        </h3>
        <div className="space-y-3">
          {[
            'Product sales during stream',
            'Course/webinar ticket sales',
            'Lead generation (free)',
            'Subscription/membership sales',
            'Consulting/service bookings',
            'No monetization planned'
          ].map((option) => (
            <button
              key={option}
              onClick={() => setRevenue(option)}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                revenue === option
                  ? 'border-purple-500 bg-purple-500/20 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-gray-300 hover:border-slate-500'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-green-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-300 mb-2">AutoOffer™ Technology</h4>
            <p className="text-sm text-green-200/80 mb-3">
              Our AI-powered system automatically adjusts offers based on viewer engagement and behavior to maximize conversions.
            </p>
            <div className="text-xs text-green-300 font-medium">
              ✓ Dynamic pricing • ✓ A/B testing • ✓ Urgency triggers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaunchStep({ onboardingData }: { onboardingData: any }) {
  return (
    <div className="text-center space-y-8">
      <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl p-8">
        <Zap className="w-16 h-16 mx-auto text-purple-400 mb-4" />
        <h3 className="text-2xl font-bold text-white mb-4">
          You're Ready to Go Live!
        </h3>
        <p className="text-gray-300 text-lg">
          Your ConvertCast streaming studio is configured and ready to convert viewers into customers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6">
          <Play className="w-8 h-8 text-blue-400 mb-3" />
          <h4 className="font-semibold text-white mb-2">Stream Setup</h4>
          <p className="text-sm text-gray-400">
            Your RTMP credentials are ready for {onboardingData.streaming?.software || 'your streaming software'}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6">
          <Users className="w-8 h-8 text-green-400 mb-3" />
          <h4 className="font-semibold text-white mb-2">Audience</h4>
          <p className="text-sm text-gray-400">
            Targeting {onboardingData.audience?.targetAudience || 'your audience'} with {onboardingData.audience?.expectedViewers || 'viewers'}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6">
          <Target className="w-8 h-8 text-purple-400 mb-3" />
          <h4 className="font-semibold text-white mb-2">Revenue</h4>
          <p className="text-sm text-gray-400">
            {onboardingData.monetization?.revenue || 'Monetization'} strategy configured
          </p>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <p className="text-yellow-200 text-sm">
          💡 <strong>Pro Tip:</strong> Your first stream is the most important. We'll provide you with a pre-stream checklist to ensure maximum success.
        </p>
      </div>
    </div>
  );
}