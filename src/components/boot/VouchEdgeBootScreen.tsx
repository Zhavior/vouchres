import type { VouchEdgeBootState } from "../../features/hr/hooks/useVouchEdgeBoot";

type Props = {
  boot: VouchEdgeBootState;
};

const leftFeatures = [
  "Daily Players",
  "Live Game Lab",
  "Player Research",
  "AI Research",
];

const rightFeatures = [
  "Daily HR Board",
  "Parlay Hub",
  "VouchBoard",
  "Results Ledger",
];

export default function VouchEdgeBootScreen({ boot }: Props) {
  const progress = Math.max(0, Math.min(100, boot.progress));

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[hsl(var(--ve-bg))] text-white">
      <div className="absolute inset-0 ve-motion-bg" aria-hidden="true">
        <div className="ve-motion-grid" />
        <div className="ve-motion-noise" />
        <div className="ve-motion-spotlight" />
        <div className="ve-motion-orb ve-motion-orb-a" />
        <div className="ve-motion-orb ve-motion-orb-b" />
        <div className="ve-motion-orb ve-motion-orb-c" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-5 py-8">
        <div className="grid w-full max-w-7xl items-center gap-6 lg:grid-cols-[1fr_1.35fr_1fr]">
          <FeatureRail title="Research Tools" items={leftFeatures} side="left" />

          <main className="relative overflow-hidden rounded-[2rem] border border-[hsl(var(--ve-border-strong))] bg-[hsl(var(--ve-surface)/0.72)] p-6 text-center shadow-[0_30px_120px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-8">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--ve-accent))] to-transparent" />

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[hsl(var(--ve-accent)/0.35)] bg-[hsl(var(--ve-accent)/0.12)] shadow-[0_0_55px_hsl(var(--ve-accent-glow)/0.35)]">
              <span className="text-3xl font-black tracking-tight">VE</span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.36em] text-[hsl(var(--ve-accent))]">
              Entering VouchEdge Island
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Research Command Center
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Syncing today’s slate, warming player intelligence, and preparing your betting research island.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/24 p-4 text-left">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                    Now loading
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">{boot.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tabular-nums text-white">{progress}%</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {boot.completed}/{boot.total} systems
                  </p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[hsl(var(--ve-accent))] shadow-[0_0_30px_hsl(var(--ve-accent-glow)/0.8)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <BootPill label={boot.activeFeature} active />
                <BootPill label={boot.timedOut ? "Deep tools warming" : "Live cache sync"} />
                <BootPill label="No blank panels" />
              </div>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              The Island opens when the core systems are ready. Deeper labs can continue warming in the background.
            </p>
          </main>

          <FeatureRail title="Edge Systems" items={rightFeatures} side="right" />
        </div>
      </div>
    </div>
  );
}

function FeatureRail({
  title,
  items,
  side,
}: {
  title: string;
  items: string[];
  side: "left" | "right";
}) {
  return (
    <aside className="hidden lg:block">
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-slate-500">{title}</p>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-xl"
              style={{
                animation: `veBootFloat 4.8s ease-in-out ${index * 0.25}s infinite ${side === "right" ? "alternate" : ""}`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--ve-accent))] shadow-[0_0_18px_hsl(var(--ve-accent-glow)/0.9)]" />
                <span className="text-sm font-black">{item}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Preloading signals for faster Island navigation.
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function BootPill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full border border-[hsl(var(--ve-accent)/0.45)] bg-[hsl(var(--ve-accent)/0.12)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-accent))]"
          : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400"
      }
    >
      {label}
    </span>
  );
}
