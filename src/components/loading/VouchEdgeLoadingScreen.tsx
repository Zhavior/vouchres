import { Activity, BrainCircuit, Database, ShieldCheck, Zap } from "lucide-react";

type VouchEdgeLoadingScreenProps = {
  progress?: number;
  message?: string;
  compact?: boolean;
};

const loadingSteps = [
  { icon: Database, label: "Loading ledger" },
  { icon: BrainCircuit, label: "Syncing V.A.I" },
  { icon: ShieldCheck, label: "Verifying slips" },
  { icon: Activity, label: "Reading live slate" },
];

export default function VouchEdgeLoadingScreen({
  progress = 72,
  message = "Calibrating VouchEdge intelligence...",
  compact = false,
}: VouchEdgeLoadingScreenProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={`fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-[#020617] text-white ${
        compact ? "p-4" : "p-6"
      }`}
      role="status"
      aria-live="polite"
      aria-label={`VouchEdge loading ${safeProgress}%`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.14),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.10),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950/85 p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-3xl border border-cyan-300/25 bg-cyan-400/10 shadow-xl shadow-cyan-950/30">
            <div className="absolute inset-[-7px] rounded-[2rem] border border-cyan-300/15 animate-pulse" />
            <Zap className="h-8 w-8 text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
              System Online
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
              Vouch<span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">Edge</span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-300">{message}</p>
          </div>

          <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/70 px-3 py-2 text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Loading</p>
            <p className="font-mono text-xl font-black text-cyan-200">{safeProgress}%</p>
          </div>
        </div>

        <div className="relative mt-6">
          <div className="h-3 overflow-hidden rounded-full border border-cyan-300/15 bg-slate-900/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 shadow-[0_0_24px_rgba(34,211,238,0.55)] transition-all duration-500 ease-out"
              style={{ width: `${safeProgress}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {loadingSteps.map((step, index) => {
              const Icon = step.icon;
              const active = safeProgress >= (index + 1) * 20;

              return (
                <div
                  key={step.label}
                  className={`rounded-2xl border px-3 py-2 transition-all ${
                    active
                      ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  <p className="text-[10px] font-black uppercase tracking-[0.08em]">{step.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
          <span>AI Ledger</span>
          <span>Results Sync</span>
          <span>Live Slate</span>
        </div>
      </div>
    </div>
  );
}
