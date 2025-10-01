'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { analytics } from '@/lib/monitoring/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 React Error Boundary caught an error:', error);
    console.error('Error info:', errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Track error in analytics
    analytics.trackError(error, {
      type: 'ui',
      severity: 'high',
      context: 'react_error_boundary',
      componentStack: errorInfo.componentStack,
      errorStack: error.stack,
      errorId: this.state.errorId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    analytics.trackEvent('error_boundary_retry', {
      errorId: this.state.errorId,
      errorMessage: this.state.error?.message
    });

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: ''
    });
  };

  handleReportBug = () => {
    analytics.trackEvent('error_boundary_bug_report', {
      errorId: this.state.errorId,
      errorMessage: this.state.error?.message
    });

    // In production, this would open a bug report form or send to support
    const bugReport = {
      errorId: this.state.errorId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    console.log('Bug report data:', bugReport);

    // Copy to clipboard for user
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2)).then(() => {
      alert('Bug report data copied to clipboard. Please paste it when reporting the issue.');
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-8 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="inline-flex p-4 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-300 mb-6">
              We've encountered an unexpected error. Don't worry, we've been notified and will fix it soon.
            </p>

            {/* Error ID */}
            <div className="bg-slate-800/50 rounded-lg p-3 mb-6">
              <div className="text-xs text-gray-400 mb-1">Error ID:</div>
              <div className="text-sm font-mono text-gray-300 break-all">
                {this.state.errorId}
              </div>
            </div>

            {/* Error Details (if enabled) */}
            {this.props.showDetails && this.state.error && (
              <details className="text-left mb-6 bg-slate-800/30 rounded-lg">
                <summary className="p-3 cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Technical Details
                </summary>
                <div className="p-3 border-t border-slate-700/30">
                  <div className="text-xs text-red-300 mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="text-xs text-gray-400 font-mono max-h-32 overflow-y-auto bg-slate-900/50 p-2 rounded">
                      {this.state.error.stack}
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-gray-300 rounded-xl hover:bg-slate-700 transition-all"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>

                <button
                  onClick={this.handleReportBug}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-gray-300 rounded-xl hover:bg-slate-700 transition-all"
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </button>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 mt-6">
              If the problem persists, please contact support with the error ID above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('🚨 Manual error reported:', error);

    analytics.trackError(error, {
      type: 'ui',
      severity: 'medium',
      context: 'manual_error_handler',
      ...errorInfo
    });

    // In development, re-throw to trigger React error boundary
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  };
}