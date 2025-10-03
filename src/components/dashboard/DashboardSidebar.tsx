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
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 to-slate-950 border-r border-purple-500/20 z-50 overflow-hidden ${className}`}
      initial={false}
      animate={{
        width: isCollapsed ? '80px' : '280px',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
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
          <div className="flex items-center justify-between">
            {/* Logo - changes based on collapsed state */}
            {isCollapsed ? (
              <Link href="/" className="mx-auto">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Play className="w-6 h-6 text-white" fill="currentColor" />
                </motion.div>
              </Link>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white" fill="currentColor" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                    ConvertCast
                  </span>
                </Link>
              </motion.div>
            )}

            {/* Collapse/Expand Button - only show when expanded */}
            {!isCollapsed && (
              <motion.button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-blue-600/30 transition-all duration-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="w-4 h-4 text-purple-300" />
              </motion.button>
            )}
          </div>

          {/* Expand button when collapsed - at bottom of logo area */}
          {isCollapsed && (
            <motion.button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full mt-4 p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-blue-600/30 transition-all duration-200 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <ChevronRight className="w-4 h-4 text-purple-300" />
            </motion.button>
          )}
        </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-purple-500/20">
        {isCollapsed ? (
          <div className="flex justify-center">
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
          </div>
        ) : (
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
            <motion.div
              className="flex-1 min-w-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-semibold text-white truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-purple-300 truncate">{user?.email || 'user@example.com'}</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/40 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-gradient-to-r hover:from-purple-600/10 hover:to-blue-600/10 hover:text-white hover:border hover:border-purple-500/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-purple-300' : 'text-purple-400'} ${isCollapsed ? '' : 'flex-shrink-0'}`} />

                {!isCollapsed && (
                  <motion.div
                    className="ml-3 flex-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-purple-400">{item.description}</div>
                  </motion.div>
                )}

                {/* Active indicator */}
                {isActive && !isCollapsed && (
                  <motion.div
                    className="absolute right-2 w-2 h-2 bg-purple-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Active indicator for collapsed state */}
                {isActive && isCollapsed && (
                  <motion.div
                    className="absolute -right-1 w-1 h-8 bg-purple-400 rounded-l-full"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-4 py-3 bg-slate-800/95 backdrop-blur-sm text-white text-sm rounded-xl border border-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
                    <div className="font-semibold text-purple-300">{item.name}</div>
                    <div className="text-xs text-purple-400 mt-1">{item.description}</div>
                  </div>
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
          className={`w-full flex items-center py-3 text-purple-200 hover:text-white hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-700/20 rounded-xl transition-all duration-200 group border border-transparent hover:border-red-500/30 ${
            isCollapsed ? 'justify-center px-3' : 'px-4'
          }`}
        >
          <LogOut className="w-5 h-5 text-red-400" />
          {!isCollapsed && (
            <motion.span
              className="ml-3 text-sm font-medium"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              Logout
            </motion.span>
          )}

          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-4 py-2 bg-slate-800/95 backdrop-blur-sm text-white text-sm rounded-xl border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl">
              <div className="font-semibold text-red-300">Logout</div>
            </div>
          )}
        </button>
      </div>
      </div>
    </motion.div>
  );
}