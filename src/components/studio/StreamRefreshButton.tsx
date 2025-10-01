'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface StreamRefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export function StreamRefreshButton({ onRefresh, isLoading = false }: StreamRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Show animation for at least 1 second
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading || isRefreshing}
      className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-white hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
      title="Refresh stream credentials"
    >
      <RefreshCw
        className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`}
      />
      {isRefreshing ? 'Refreshing...' : 'Refresh Stream'}
    </button>
  );
}