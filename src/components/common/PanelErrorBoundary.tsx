import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type PanelErrorBoundaryProps = {
  title?: string;
  children: React.ReactNode;
};

type PanelErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

export class PanelErrorBoundary extends React.Component<
  PanelErrorBoundaryProps,
  PanelErrorBoundaryState
> {
  state: PanelErrorBoundaryState = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: unknown): PanelErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown panel error",
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("[PanelErrorBoundary]", this.props.title || "Panel", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="rounded-3xl border border-rose-900/50 bg-rose-950/20 p-5 text-sm text-rose-100 shadow-lg shadow-rose-950/20">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-rose-800/60 bg-rose-950/60 p-2">
            <AlertTriangle className="h-5 w-5 text-rose-300" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-black text-white">
              {this.props.title || "Panel"} could not load
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
              This section failed safely. Your active parlay slip and the rest of the Command Center stayed open.
            </p>
            {this.state.message && (
              <p className="mt-2 rounded-xl border border-rose-900/50 bg-black/20 px-3 py-2 font-mono text-[11px] text-rose-100/80">
                {this.state.message}
              </p>
            )}

            <button
              type="button"
              onClick={this.reset}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-800/60 bg-rose-900/40 px-3 py-2 text-xs font-bold text-rose-50 transition hover:bg-rose-800/50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try section again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
