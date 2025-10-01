'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}