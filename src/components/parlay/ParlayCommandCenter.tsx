import { Bot, Crown, Flame, Layers3, Radio, Save, Sparkles, Wand2 } from "lucide-react";
import { PanelErrorBoundary } from "../common/PanelErrorBoundary";
import {
  selectActiveParlayPanel,
  selectDraftLegs,
  selectSavedSlips,
  useParlayCommandStore,
  type ParlayCommandPanel,
} from "../../stores/parlayCommandStore";

const tabs: Array<{
  id: ParlayCommandPanel;
  label: string;
  eyebrow: string;
  icon: typeof Layers3;
}> = [
  { id: "build", label: "Build Slip", eyebrow: "Manual builder", icon: Layers3 },
  { id: "ai", label: "V.A.I Picks", eyebrow: "AI discovery", icon: Bot },
  { id: "live", label: "Live Parlays", eyebrow: "Saved + synced", icon: Radio },
  { id: "premium", label: "Premium", eyebrow: "Posted slips", icon: Crown },
];

function LivePulseBars({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="flex h-5 items-end gap-[3px]" aria-label="Live parlay activity">
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className="w-[3px] rounded-full bg-cyan-300/90 shadow-[0_0_10px_rgba(34,211,238,0.65)]"
          style={{
            height: `${8 + (bar % 3) * 4}px`,
            animation: "ve-command-live-bar 0.9s ease-in-out infinite",
            animationDelay: `${bar * 110}ms`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Layers3;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/55 p-6 shadow-2xl shadow-black/20">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">{body}</p>
        </div>
      </div>
    </div>
  );
}

function BuildSlipPanel() {
  const draftLegs = useParlayCommandStore(selectDraftLegs);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-3xl border border-slate-800/80 bg-[#07101d]/90 p-5 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Build Slip</p>
            <h3 className="mt-1 text-xl font-black text-white">One canonical builder</h3>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-xs font-black text-emerald-300">
            {draftLegs.length} legs
          </div>
        </div>

        <div className="mt-5">
          {draftLegs.length === 0 ? (
            <EmptyPanel
              icon={Wand2}
              title="Start from AI picks or manual props"
              body="This will become the unified builder. V.A.I picks and manual player props will land in this same slip before saving through /api/me/parlays."
            />
          ) : (
            <div className="space-y-3">
              {draftLegs.map((leg) => (
                <div key={leg.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm font-black text-white">{leg.playerName || leg.selection}</p>
                  <p className="mt-1 text-xs text-slate-400">{leg.marketLabel || leg.marketCode || "Player prop"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/15 bg-cyan-950/10 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Slip Actions</p>
        <h3 className="mt-1 text-lg font-black text-white">Backend contract locked</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Save/post actions will reuse buildSaveParlayPayload and POST /api/me/parlays. No second parlay system.
        </p>
        <button
          type="button"
          disabled
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-black text-slate-500"
        >
          <Save className="h-4 w-4" />
          Save wiring next
        </button>
      </div>
    </div>
  );
}

function AiSmartPicksPanel() {
  return (
    <EmptyPanel
      icon={Bot}
      title="V.A.I Smart Picks will live here"
      body="AI pick discovery will become a panel inside the Command Center. Add to Slip will push canonical legs into the same Zustand draft."
    />
  );
}

function LiveSavedParlaysPanel() {
  const allSlips = useParlayCommandStore(selectSavedSlips);
  const liveSlips = allSlips.filter((slip) => ['pending', 'live', 'open', 'active'].includes(String(slip.status).toLowerCase()));

  return (
    <div className="rounded-3xl border border-slate-800/80 bg-[#07101d]/90 p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Live Parlays</p>
          <h3 className="mt-1 text-xl font-black text-white">Saved and synced slips</h3>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 px-3 py-2">
          <LivePulseBars active={liveSlips.length > 0} />
          <span className="text-xs font-black text-cyan-200">{liveSlips.length} live</span>
        </div>
      </div>

      <div className="mt-5">
        {allSlips.length === 0 ? (
          <EmptyPanel
            icon={Radio}
            title="No synced parlays yet"
            body="Once the backend saved slips are hydrated into the Command Center store, this panel will show pending/live cards with animation bars."
          />
        ) : (
          <div className="grid gap-3">
            {allSlips.map((slip) => (
              <div key={slip.publicId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{slip.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{slip.summary}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-black uppercase text-slate-300">
                    {slip.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PremiumPostedPanel() {
  return (
    <EmptyPanel
      icon={Crown}
      title="Premium posted slips will be unified"
      body="Subscriber and premium slips will use the same public display model, so customer cards never show clientRef, meta, or raw IDs."
    />
  );
}

function CommandPanel() {
  const activePanel = useParlayCommandStore(selectActiveParlayPanel);

  if (activePanel === "ai") return <AiSmartPicksPanel />;
  if (activePanel === "live") return <LiveSavedParlaysPanel />;
  if (activePanel === "premium") return <PremiumPostedPanel />;
  return <BuildSlipPanel />;
}

export default function ParlayCommandCenter() {
  const activePanel = useParlayCommandStore(selectActiveParlayPanel);
  const setActivePanel = useParlayCommandStore((state) => state.setActivePanel);
  const draftLegs = useParlayCommandStore(selectDraftLegs);
  const savedSlips = useParlayCommandStore(selectSavedSlips);
  const liveSlips = savedSlips.filter((slip) => ['pending', 'live', 'open', 'active'].includes(String(slip.status).toLowerCase()));

  return (
    <section className="min-h-screen bg-[#020817] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <style>{`
        @keyframes ve-command-live-bar {
          0%, 100% { transform: scaleY(0.45); opacity: 0.45; }
          50% { transform: scaleY(1.25); opacity: 1; }
        }
      `}</style>

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-[#07101d] via-[#061120] to-[#020817] p-6 shadow-2xl shadow-cyan-950/20">
          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-[-90px] left-[-90px] h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Parlay Command Center
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Build, AI-select, save, and monitor in one place.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                This replaces the split Build Parlay, V.A.I Smart Picks, and old Parlay Hub surfaces with one app page that still saves through the canonical backend.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] font-black uppercase text-slate-500">Draft legs</p>
                <p className="mt-1 text-2xl font-black text-white">{draftLegs.length}</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3">
                <p className="text-[10px] font-black uppercase text-cyan-300">Live</p>
                <p className="mt-1 text-2xl font-black text-white">{liveSlips.length}</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3">
                <p className="text-[10px] font-black uppercase text-emerald-300">Backend</p>
                <p className="mt-1 text-sm font-black text-emerald-200">Canonical</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePanel === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePanel(tab.id)}
                className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                  isActive
                    ? "border-cyan-400/50 bg-cyan-950/25 shadow-lg shadow-cyan-950/20"
                    : "border-slate-800 bg-slate-950/55 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={`rounded-2xl border p-2 ${
                    isActive ? "border-cyan-400/30 bg-cyan-500/10" : "border-slate-800 bg-slate-900"
                  }`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-cyan-300" : "text-slate-400"}`} />
                  </div>
                  {tab.id === "live" && <LivePulseBars active={liveSlips.length > 0} />}
                </div>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  {tab.eyebrow}
                </p>
                <p className="mt-1 text-sm font-black text-white">{tab.label}</p>
              </button>
            );
          })}
        </div>

        <PanelErrorBoundary title="Parlay Command Center Panel">
          <CommandPanel />
        </PanelErrorBoundary>
      </div>
    </section>
  );
}
