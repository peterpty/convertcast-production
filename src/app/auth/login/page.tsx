'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [isEmailAuthLoading, setIsEmailAuthLoading] = useState(false);
  const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleAuthLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setIsGoogleAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsEmailAuthLoading(true);
      setError(null);

      if (mode === 'signin') {
        await signInWithEmail(email, password);
        // AuthContext will handle redirect via onAuthStateChange
      } else {
        await signUpWithEmail(email, password);
        setError(null);
        // Show success message for email verification
        setError('Check your email to verify your account, then sign in.');
        setMode('signin');
        setPassword('');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || `Failed to ${mode === 'signin' ? 'sign in' : 'sign up'}`);
      setIsEmailAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <Play className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-white">ConvertCast</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <div className="pt-24 pb-12 px-4 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Sign In Card */}
          <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
            {/* Card Header */}
            <div className="p-6 sm:p-8 pb-6">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </h1>
                <p className="text-sm sm:text-base text-gray-400">
                  {mode === 'signin'
                    ? 'Sign in to access your dashboard'
                    : 'Get started with ConvertCast'}
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6 bg-slate-700/30 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null); }}
                  className={`flex-1 py-2.5 sm:py-2 px-4 rounded-md font-medium transition-all text-sm sm:text-base touch-manipulation ${
                    mode === 'signin'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className={`flex-1 py-2.5 sm:py-2 px-4 rounded-md font-medium transition-all text-sm sm:text-base touch-manipulation ${
                    mode === 'signup'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error/Success Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 rounded-lg p-4 ${
                    error.includes('Check your email')
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  <p className={`text-sm text-center ${
                    error.includes('Check your email') ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isEmailAuthLoading}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isEmailAuthLoading}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 transition-all"
                    required
                    minLength={6}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {mode === 'signup' && 'At least 6 characters'}
                    </p>
                    {mode === 'signin' && (
                      <Link
                        href="/auth/reset-password"
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isEmailAuthLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {isEmailAuthLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                    </div>
                  ) : (
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-800/60 text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={isGoogleAuthLoading}
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isGoogleAuthLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Google</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Card Footer */}
            <div className="px-8 py-6 bg-slate-900/40 border-t border-slate-700/50">
              <p className="text-center text-gray-400 text-xs">
                By {mode === 'signin' ? 'signing in' : 'creating an account'}, you agree to our{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                  Terms
                </a>
                {' '}and{' '}
                <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Text */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Transform your presentations into interactive live streams
          </p>
        </motion.div>
      </div>

      {/* Subtle Accent - Bottom Right */}
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-600/5 to-transparent pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-600/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
