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
  ChevronLeft,
  ChevronRight,
  User
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
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    <motion.div
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-purple-500/20 z-50 ${className}`}
      initial={false}
      animate={{
        width: isCollapsed ? '80px' : '280px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header with Logo */}
      <div className="p-6 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center"
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <ConvertCastLogo size="sm" />
          </motion.div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-purple-300" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-purple-300" />
            )}
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-purple-500/20">
        <div className="flex items-center space-x-3">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="User avatar"
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <motion.div
            className="flex-1 min-w-0"
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-semibold text-white truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-purple-300 truncate">{user?.email || 'user@example.com'}</p>
          </motion.div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                className={`group relative flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 text-white'
                    : 'text-purple-200 hover:bg-purple-600/10 hover:text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-300' : 'text-purple-400'}`} />

                <motion.div
                  className="ml-3 flex-1"
                  animate={{
                    opacity: isCollapsed ? 0 : 1,
                    width: isCollapsed ? 0 : 'auto'
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-purple-400">{item.description}</div>
                </motion.div>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute right-2 w-2 h-2 bg-purple-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg border border-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-purple-300">{item.description}</div>
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-purple-500/20">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-4 py-3 text-purple-200 hover:text-white hover:bg-red-600/10 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <motion.span
            className="ml-3 text-sm font-medium"
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            Logout
          </motion.span>

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg border border-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
}