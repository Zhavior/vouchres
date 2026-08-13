import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureReactError } from '../../../lib/sentry';

interface HrErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface HrErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class HrErrorBoundary extends Component<HrErrorBoundaryProps, HrErrorBoundaryState> {
  public state: HrErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): HrErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[HrErrorBoundary] Render error caught in HR Desk component:', error, errorInfo);
    try {
      captureReactError(error, {
        boundary: 'HrIntelligencePageV10',
        componentName: 'HrIntelligencePageV10',
        error: error.message,
        fallbackTitle: this.props.fallbackTitle || 'HR Intelligence Command Desk Error',
        componentStack: errorInfo?.componentStack ?? undefined,
      });
    } catch {
      // Telemetry errors must never crash or block UI fallback rendering
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center rounded-2xl bg-[#0d121f]/90 border border-red-500/30 text-white shadow-lg flex flex-col items-center justify-center gap-4 my-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-lg font-bold">
            ⚠️
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {this.props.fallbackTitle || 'HR Intelligence Desk Encountered an Error'}
            </h3>
            <p className="text-white/60 text-xs mt-1 max-w-md">
              {this.state.error?.message || 'A render issue occurred while displaying the telemetry board.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-vouch-cyan/20 border border-vouch-cyan/40 text-vouch-cyan hover:bg-vouch-cyan/30 text-xs font-bold transition-all shadow-sm"
          >
            Reload View Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
