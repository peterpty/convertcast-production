'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Check, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Update Password</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your new password below
            </CardDescription>
          </CardHeader>

          {!isValidSession && error ? (
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">
                    Invalid Session
                  </h3>
                  <p className="text-sm text-slate-300">
                    {error}
                  </p>
                </div>
              </div>

              <div className="text-center pt-4">
                <Link
                  href="/auth/reset-password"
                  className="text-purple-400 hover:text-purple-300 text-sm underline"
                >
                  Request new reset link
                </Link>
              </div>
            </CardContent>
          ) : success ? (
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4 p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">
                    Password Updated!
                  </h3>
                  <p className="text-sm text-slate-300">
                    Your password has been successfully updated.
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">{error}</span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-slate-400">At least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3"
                  disabled={isLoading || !isValidSession}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Updating password...
                    </div>
                  ) : (
                    'Update Password'
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Back to{' '}
                    <span className="text-purple-400 hover:text-purple-300">login</span>
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>

      {/* Background Accents */}
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-600/5 to-transparent pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-600/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
