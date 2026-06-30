import { Bell, Crown, FlaskConical, Gauge, Map, Radio, ScrollText, Shield, Sparkles, Target, Trophy, UserCircle } from "lucide-react";

type Props = {
  onSectionChange?: (section: string) => void;
};

const zones = [
  {
    title: "Today’s Board",
    subtitle: "AI picks, live games, high-run spots",
    section: "dashboard",
    icon: Target,
    tag: "Start here",
  },
  {
    title: "Parlay Dock",
    subtitle: "Build, save, scan, and track parlays",
    section: "parlays",
    icon: Shield,
    tag: "Builder",
  },
  {
    title: "Research Lab",
    subtitle: "Player, pitcher, HR, matchup research",
    section: "research",
    icon: FlaskConical,
    tag: "Deep dive",
  },
  {
    title: "Ledger Vault",
    subtitle: "Wins, losses, ROI, and history",
    section: "results",
    icon: ScrollText,
    tag: "Proof",
  },
  {
    title: "Notification Beacon",
    subtitle: "HR alerts, parlay alerts, live updates",
    section: "notifications",
    icon: Bell,
    tag: "Alerts",
  },
  {
    title: "Pro Tower",
    subtitle: "Premium tools and upgrade path",
    section: "premium",
    icon: Crown,
    tag: "Pro",
  },
];

export default function EdgeIslandCommandCenter({ onSectionChange }: Props) {
  const go = (section: string) => {
    if (onSectionChange) onSectionChange(section);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_28%),linear-gradient(180deg,#020617,#0f172a)]" />

        <section className="rounded-[2rem] border border-cyan-300/20 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                The Edge Island
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                Your sports command island.
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold text-slate-300 sm:text-base">
                Start with today’s board, build parlays, research matchups, track your ledger, and unlock Pro tools without going back to the Welcome Portal.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Gauge className="mx-auto mb-2 h-5 w-5 text-cyan-200" />
                <div className="text-2xl font-black">82</div>
                <div className="text-[11px] font-bold uppercase text-slate-400">Edge Score</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Radio className="mx-auto mb-2 h-5 w-5 text-amber-200" />
                <div className="text-2xl font-black">4</div>
                <div className="text-[11px] font-bold uppercase text-slate-400">Live Alerts</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Trophy className="mx-auto mb-2 h-5 w-5 text-emerald-200" />
                <div className="text-2xl font-black">Pro</div>
                <div className="text-[11px] font-bold uppercase text-slate-400">Rank Path</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Island Zones</h2>
                <p className="text-sm font-semibold text-slate-400">Tap a zone to jump into the app.</p>
              </div>
              <Map className="h-6 w-6 text-cyan-200" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {zones.map((zone) => {
                const Icon = zone.icon;
                return (
                  <button
                    key={zone.title}
                    type="button"
                    onClick={() => go(zone.section)}
                    className="group rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="rounded-2xl bg-cyan-300/10 p-3 text-cyan-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                        {zone.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-black">{zone.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-400">{zone.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-5">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <UserCircle className="h-5 w-5 text-amber-200" />
                Vouch AI Captain
              </h2>
              <p className="mt-3 text-sm font-semibold text-amber-50/85">
                Today’s route: review the board first, save your strongest parlay, then check the Ledger Vault after games finish.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-black">Daily Missions</h2>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-300">
                <div className="rounded-2xl bg-white/5 p-3">✅ Open Today’s Board</div>
                <div className="rounded-2xl bg-white/5 p-3">⬜ Save 1 parlay</div>
                <div className="rounded-2xl bg-white/5 p-3">⬜ Review yesterday’s results</div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-5">
              <h2 className="text-xl font-black">Edge Rank</h2>
              <p className="mt-2 text-sm font-semibold text-emerald-50/85">
                Rookie Scout → Data Grinder → Sharp Builder → Edge Captain
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/30">
                <div className="h-full w-2/3 rounded-full bg-emerald-300" />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
