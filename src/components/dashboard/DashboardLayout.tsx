'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
      {/* Floating Gradient Blobs (Homepage style) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-60 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ y: [0, 15, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <DashboardSidebar />

      {/* Main Content Area - padding matches expanded sidebar width (280px = pl-[280px]) */}
      <div className="pl-[280px] relative z-10 transition-all duration-300">
        <div className="min-h-screen">
          {/* Page Header */}
          {(title || description) && (
            <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-40">
              <div className="px-8 py-6">
                {title && (
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent mb-1">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-purple-200/70 mt-1">{description}</p>
                )}
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="p-8 bg-transparent">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}