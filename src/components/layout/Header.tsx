'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Play, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset avatar error state when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [user]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  // Get user's display name or email
  const getUserDisplayName = () => {
    if (!user) return '';

    // Safely extract name, avoiding URLs or long strings
    const fullName = user.user_metadata?.full_name;
    const email = user.email;

    // If full_name exists and doesn't look like a URL, use it
    if (fullName && typeof fullName === 'string' && !fullName.includes('http') && fullName.length < 50) {
      return fullName;
    }

    // Fallback to email username
    if (email && typeof email === 'string') {
      const emailUsername = email.split('@')[0];
      return emailUsername.length > 20 ? emailUsername.substring(0, 20) + '...' : emailUsername;
    }

    return 'User';
  };

  // Get user's avatar URL (for image src)
  const getUserAvatarUrl = () => {
    if (!user) return null;
    const avatarUrl = user.user_metadata?.avatar_url;
    // Only return if it's a valid URL
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    return null;
  };

  // Generate user initials (for text display)
  const getUserInitials = () => {
    if (!user) return 'U';

    // Get clean name, avoiding URLs
    const fullName = user.user_metadata?.full_name;
    let name = '';

    // Use full_name only if it's not a URL and is reasonable length
    if (fullName && typeof fullName === 'string' && !fullName.includes('http') && fullName.length < 50) {
      name = fullName;
    } else if (user.email) {
      // Fallback to email username
      name = user.email.split('@')[0];
    }

    if (!name) return 'U';

    // Generate initials
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-md bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-700/50'
          : 'bg-gradient-to-b from-slate-900 to-slate-950'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-white">ConvertCast</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Success Stories
            </button>
            <button
              onClick={() => scrollToSection('problems')}
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Solutions
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Features
            </button>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="h-10 w-20 bg-gray-700 rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-700 rounded-lg"></div>
              </div>
            ) : user ? (
              /* Authenticated User */
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center px-4 py-2 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors duration-200"
                >
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <motion.button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                      {getUserAvatarUrl() && !avatarError ? (
                        <img
                          src={getUserAvatarUrl()!}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {getUserInitials()}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:block text-sm font-medium">
                      Welcome, {getUserDisplayName()}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1"
                      >
                        <div className="px-4 py-2 border-b border-slate-700">
                          <p className="text-sm text-gray-300">Signed in as</p>
                          <p className="text-sm font-medium text-white truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700 transition-colors"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            signOut();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Unauthenticated User */
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors duration-200"
                >
                  Login
                </Link>
                <motion.button
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Request an Invite
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Colored Bar with Subtitle - Matches design */}
      <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-2">
            <p className="text-white text-sm font-medium">
              Built for: Coaches, Consultants, Course Creators, & Service Providers
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-6 space-y-4">
              <button
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left text-gray-300 hover:text-white py-2 transition-colors duration-200"
              >
                Success Stories
              </button>
              <button
                onClick={() => scrollToSection('problems')}
                className="block w-full text-left text-gray-300 hover:text-white py-2 transition-colors duration-200"
              >
                Solutions
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left text-gray-300 hover:text-white py-2 transition-colors duration-200"
              >
                Features
              </button>

              <div className="pt-4 space-y-3">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-10 w-full bg-gray-700 rounded-lg"></div>
                    <div className="h-10 w-full bg-gray-700 rounded-lg"></div>
                  </div>
                ) : user ? (
                  /* Authenticated User - Mobile */
                  <>
                    {/* Mobile User Info */}
                    <div className="flex items-center space-x-3 px-4 py-3 bg-slate-800/50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                        {getUserAvatarUrl() && !avatarError ? (
                          <img
                            src={getUserAvatarUrl()!}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {getUserInitials()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Welcome, {getUserDisplayName()}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      className="flex items-center justify-center w-full px-4 py-2 text-gray-300 border border-gray-600 rounded-lg transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      className="flex items-center justify-center w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>

                    <button
                      onClick={() => {
                        setIsOpen(false);
                        signOut();
                      }}
                      className="flex items-center justify-center w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  /* Unauthenticated User - Mobile */
                  <>
                    <Link
                      href="/auth/login"
                      className="block w-full text-center px-4 py-2 text-gray-300 border border-gray-600 rounded-lg transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <button
                      className="block w-full px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      Request an Invite
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}