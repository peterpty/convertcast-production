'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ConvertCastLogo } from '@/components/ui/ConvertCastLogo';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Video,
  BarChart3,
  Users,
  Settings,
  LogOut,
  User,
  Play
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  description: string;
}

const navigationItems: SidebarItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, description: 'Dashboard overview' },
  { name: 'Events', href: '/dashboard/events', icon: Calendar, description: 'Create & manage events' },
  { name: 'Streaming Studio', href: '/dashboard/stream/studio', icon: Video, description: 'Live streaming controls' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, description: 'InsightEngine™ analytics' },
  { name: 'Audiences', href: '/dashboard/audiences', icon: Users, description: 'Viewer profiles' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, description: 'Integrations & config' },
];

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className = '' }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full w-[280px] bg-gradient-to-b from-slate-900 to-slate-950 border-r border-purple-500/20 z-50 overflow-hidden ${className}`}
    >
      {/* Floating Gradient Blobs (like homepage) */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-10 right-5 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-5 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ y: [0, 10, 0], scale: [1, 0.95, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content with relative positioning */}
      <div className="relative h-full flex flex-col">
        {/* Header with Logo */}
        <div className="p-6 border-b border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              ConvertCast
            </span>
          </Link>
        </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-purple-500/20">
        <div className="flex items-center space-x-3">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="User avatar"
              className="w-10 h-10 rounded-full ring-2 ring-purple-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center ring-2 ring-purple-500/30">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-purple-300 truncate">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                className={`group relative flex items-center rounded-xl transition-all duration-200 px-4 py-3 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/40 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-gradient-to-r hover:from-purple-600/10 hover:to-blue-600/10 hover:text-white hover:border hover:border-purple-500/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-300' : 'text-purple-400'} flex-shrink-0`} />

                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-purple-400">{item.description}</div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute right-2 w-2 h-2 bg-purple-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-purple-500/30 bg-gradient-to-r from-red-500/5 to-purple-500/5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center py-3 px-4 text-purple-200 hover:text-white hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-700/20 rounded-xl transition-all duration-200 group border border-transparent hover:border-red-500/30"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="ml-3 text-sm font-medium">
            Logout
          </span>
        </button>
      </div>
      </div>
    </div>
  );
}