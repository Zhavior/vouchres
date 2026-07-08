import React, { Suspense, lazy, useEffect, useState } from 'react';

const VouchEdgeTerminalPage = lazy(() => import('../pages/VouchEdgeTerminalPage'));

type MarketingLandingPageProps = {
  onAuthed: () => void;
  onSectionChange: (section: string) => void;
};

type Pick = {
  id?: string;
  player?: string;
  team?: string;
  pitcher?: string;
  confidence?: number;
  line?: string;
};

export default function MarketingLandingPage({ onAuthed, onSectionChange }: MarketingLandingPageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [liveRes, boardRes] = await Promise.all([
          fetch('/api/mlb/live'),
          fetch('/api/mlb/hr-board/today?previewLimit=3'),
        ]);

        const live = await liveRes.json();
        const board = await boardRes.json();

        setConfidence(live.confidence ?? live.data?.confidence ?? 84);
        setPicks(board.rows ?? board.data?.rows ?? []);
      } catch {
        setConfidence(84);
        setPicks([]);
      }
    }

    loadLiveData();
  }, []);

  if (showLogin) {
    return (
      <div className="min-h-screen bg-[#020617] text-white">
        <button
          onClick={() => setShowLogin(false)}
          className="fixed left-6 top-6 z-50 rounded-full border border-white/10 bg-black/50 px-5 py-2 text-xs font-black uppercase tracking-widest text-white/60 hover:text-cyan-300"
        >
          ← Back
        </button>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-cyan-300">Loading secure terminal...</div>}><VouchEdgeTerminalPage onAuthed={onAuthed} /></Suspense>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,.24),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#000_55%,#020617_100%)]" />
      <div className="fixed inset-0 opacity-[0.055] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-3xl font-black italic tracking-tight">
            Vouch<span className="text-cyan-300">Edge</span>
          </div>

          <button
            onClick={() => setShowLogin(true)}
            className="rounded-full border border-cyan-300/40 px-5 py-2 text-xs font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-300 hover:text-black"
          >
            Login
          </button>
        </nav>

        <div className="grid min-h-[82vh] items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="mb-6 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300">
              Live MLB Intelligence
            </div>

            <h1 className="text-6xl font-black uppercase leading-[0.86] tracking-tighter md:text-8xl">
              The edge before
              <span className="block text-cyan-300 drop-shadow-[0_0_35px_rgba(103,232,249,.45)]">
                the market moves.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-white/60">
              AI confidence, live MLB signal, and community conviction built into one premium betting command center.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => setShowLogin(true)}
                className="rounded-2xl bg-cyan-300 px-8 py-4 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_45px_rgba(103,232,249,.28)] hover:bg-white"
              >
                Enter Edge Island
              </button>

              <button
                onClick={() => onSectionChange('today')}
                className="rounded-2xl border border-white/15 bg-white/[0.04] px-8 py-4 text-sm font-black uppercase tracking-widest text-white/70 hover:border-white/40 hover:text-white"
              >
                Preview Today
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">The Pulse</div>
                <div className="mt-1 text-xs text-white/35">Live from VouchEdge</div>
              </div>
              <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_#34d399]" />
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              <Stat label="AI Edge" value={`${confidence}%`} />
              <Stat label="Vouches" value="Live" />
              <Stat label="Market" value="Moving" />
            </div>

            <div className="space-y-3">
              {(picks.length ? picks : [
                { id: '1', player: 'Aaron Judge', team: 'NYY', pitcher: 'Live Pitcher', confidence: 88, line: '+390' },
                { id: '2', player: 'Shohei Ohtani', team: 'LAD', pitcher: 'Live Pitcher', confidence: 86, line: '+420' },
                { id: '3', player: 'Ronald Acuña Jr.', team: 'ATL', pitcher: 'Live Pitcher', confidence: 83, line: '+450' },
              ]).slice(0, 3).map((pick, index) => (
                <div key={pick.id ?? pick.player ?? index} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
                  <div className="flex justify-between gap-4">
                    <div>
                      <div className="text-xl font-black">{pick.player}</div>
                      <div className="text-sm text-white/45">{pick.team} vs {pick.pitcher}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-cyan-300">{pick.line}</div>
                      <div className="text-sm text-emerald-300">{pick.confidence}% AI</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowLogin(true)}
                    className="mt-4 w-full rounded-xl bg-cyan-300 py-3 text-xs font-black uppercase tracking-widest text-black hover:bg-white"
                  >
                    Vouch This Pick
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/35">{label}</div>
      <div className="mt-2 text-2xl font-black text-cyan-300">{value}</div>
    </div>
  );
}
