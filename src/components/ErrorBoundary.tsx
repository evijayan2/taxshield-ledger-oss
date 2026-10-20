import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches uncaught runtime errors in tab views to prevent blank screens.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught rendering exception in view:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="glass-panel p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-xl">
                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-rose-900 dark:text-rose-100">
                  View Rendering Error
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  An error occurred while attempting to render this module.
                </p>
                <p className="font-mono text-xs bg-rose-100/80 dark:bg-rose-900/60 p-2.5 rounded-lg mt-3 overflow-x-auto text-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800">
                  {this.state.error?.message || 'Unknown render error'}
                </p>
                <button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset View
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
