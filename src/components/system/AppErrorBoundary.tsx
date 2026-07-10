import React from 'react';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
  resetKey?: string;
  onBackHome?: () => void;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string | null;
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown app error',
    };
  }

  componentDidUpdate(prevProps: AppErrorBoundaryProps) {
    if (
      prevProps.resetKey !== this.props.resetKey
      && this.state.hasError
    ) {
      this.setState({ hasError: false, errorMessage: null });
    }
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[VouchEdge Stability Shield]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleBackHome = () => {
    if (this.props.onBackHome) {
      this.props.onBackHome();
      this.setState({ hasError: false, errorMessage: null });
      return;
    }

    window.location.hash = '#hr-board';
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-ve-obsidian px-4 py-10 text-slate-100">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-3xl border border-sky-400/20 bg-slate-950/80 p-6 shadow-[0_0_60px_rgba(14,165,233,0.12)]">
            <div className="mb-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-200">
              VouchEdge Stability Shield
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white">
              VouchEdge recovered from a screen error
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              One part of the app failed while loading. The full site did not crash. Reload the app or return to the HR Board.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-xl bg-sky-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-sky-300"
              >
                Reload app
              </button>

              <button
                type="button"
                onClick={this.handleBackHome}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-black text-slate-100 hover:border-sky-400/50"
              >
                {this.props.onBackHome ? 'Back Home' : 'Go to HR Board'}
              </button>
            </div>

            {import.meta.env.DEV && this.state.errorMessage && (
              <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-3">
                <p className="text-xs font-black uppercase tracking-wider text-red-200">
                  Dev error
                </p>
                <p className="mt-2 break-words text-xs text-red-100">
                  {this.state.errorMessage}
                </p>
              </div>
            )}

            <p className="mt-6 text-xs text-slate-600">
              This is a recovery screen, not a sports data result.
            </p>
          </div>
        </div>
      </main>
    );
  }
}
