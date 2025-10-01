'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ConvertCastLogo } from '@/components/ui/ConvertCastLogo';
import { Menu, X } from 'lucide-react';

export function ConvertCastHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-b border-purple-500/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <ConvertCastLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-white/90 hover:text-white transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link
              href="#features"
              className="text-white/90 hover:text-white transition-colors duration-200"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-white/90 hover:text-white transition-colors duration-200"
            >
              Pricing
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/30">
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="#getting-started"
                className="text-white/90 hover:text-white transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Getting Started
              </Link>
              <Link
                href="#community"
                className="text-white/90 hover:text-white transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Community
              </Link>
              <Link
                href="#features"
                className="text-white/90 hover:text-white transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg w-full mt-4">
                  Start Free Trial
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}