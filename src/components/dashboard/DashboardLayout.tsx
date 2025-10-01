'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="pl-80">
        <div className="min-h-screen">
          {/* Page Header */}
          {(title || description) && (
            <div className="bg-gradient-to-r from-slate-900/40 to-slate-800/40 backdrop-blur-xl border-b border-slate-700/30 sticky top-0 z-40">
              <div className="px-8 py-6">
                {title && (
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-purple-200/80 mt-2">{description}</p>
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