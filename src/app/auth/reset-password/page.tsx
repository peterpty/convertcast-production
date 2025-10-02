'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Check, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-slate-900/50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-bold text-white">ConvertCast</span>
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl">Reset Password</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>

            {success ? (
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4 p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">
                      Check your email!
                    </h3>
                    <p className="text-sm text-slate-300">
                      We've sent a password reset link to your email address.
                      Please check your inbox and follow the instructions.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <Link
                    href="/auth/login"
                    className="text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    Return to login
                  </Link>
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
                    <Label htmlFor="email" className="text-slate-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Sending reset link...
                      </div>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/auth/login"
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Remember your password?{' '}
                      <span className="text-purple-400 hover:text-purple-300">Sign in</span>
                    </Link>
                  </div>
                </CardFooter>
              </form>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Background Accents */}
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-600/5 to-transparent pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-600/5 to-transparent pointer-events-none"></div>
    </div>
  );
}
