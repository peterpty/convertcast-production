'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Twitter, Linkedin, Youtube, Facebook } from 'lucide-react';

export function ConvertCastFooter() {
  return (
    <footer className="bg-gradient-to-b from-slate-900 via-purple-950 to-indigo-950 border-t border-purple-500/20">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">ConvertCast</span>
              <p className="text-gray-400 mt-4 leading-relaxed">
                The ultimate AI-powered webinar platform that transforms ordinary presentations
                into high-converting revenue engines.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <Mail className="w-4 h-4 mr-3" />
                <span>hello@convertcast.com</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="w-4 h-4 mr-3" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="w-4 h-4 mr-3" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Product</h3>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#integrations" className="text-gray-400 hover:text-white transition-colors">Integrations</Link></li>
              <li><Link href="#api" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
              <li><Link href="#security" className="text-gray-400 hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Resources</h3>
            <ul className="space-y-3">
              <li><Link href="#getting-started" className="text-gray-400 hover:text-white transition-colors">Getting Started</Link></li>
              <li><Link href="#documentation" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="#community" className="text-gray-400 hover:text-white transition-colors">Community</Link></li>
              <li><Link href="#blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#case-studies" className="text-gray-400 hover:text-white transition-colors">Case Studies</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Company</h3>
            <ul className="space-y-3">
              <li><Link href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#press" className="text-gray-400 hover:text-white transition-colors">Press</Link></li>
              <li><Link href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="#partners" className="text-gray-400 hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 pt-8 border-t border-purple-500/20">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                Stay Updated with ConvertCast
              </span>
            </h3>
            <p className="text-gray-400 mb-6">
              Get the latest updates, tips, and insights delivered to your inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-slate-800/60 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
              <button className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                ConvertCast is in Closed Beta
              </span>
            </h3>
            <p className="text-gray-300 mb-4">
              We're currently accepting a limited number of beta users. Join the waitlist to get early access.
            </p>
            <button className="bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200">
              Join Beta Waitlist
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-purple-500/20 bg-gradient-to-b from-slate-950 to-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              © 2024 ConvertCast. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="#cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}