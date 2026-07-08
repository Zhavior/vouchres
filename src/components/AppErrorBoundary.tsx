import React from 'react';

type Props = {
  children: React.ReactNode;
  resetKey: string;
  onBackHome: () => void;
};

type State = {
  error: Error | null;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-[#020617] p-6 text-slate-100">
        <div className="mx-auto mt-16 max-w-xl rounded-3xl border border-red-400/20 bg-slate-950/80 p-6 shadow-2xl">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-red-300">Screen failed safely</div>
          <h1 className="mt-3 text-2xl font-black text-white">VouchEdge could not finish loading this screen.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The app stayed running instead of going to a black screen. Try returning home or reloading the page.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-red-100">
            {this.state.error.message}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.props.onBackHome}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-black text-white"
            >
              Back Home
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-black text-slate-100"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
