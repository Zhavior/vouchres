import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Search } from 'lucide-react';
import { navigateToSection } from '../lib/appNavigation';
import {
  GameSignalPanel,
  ProGraphShell,
  ProLockedCard,
  VerifiedDataNotice,
  VerifiedGraphEmptyState,
} from '../components/pro';
import {
  buildGamePayload,
  safeNumber,
  useHrBoardProData,
} from './pro/proLabData';

export default function LiveGameLabPage() {
  const { rows, groups, topGame, loading, error, source } = useHrBoardProData();
  const [selectedGameKey, setSelectedGameKey] = useState<string | null>(null);
  const selected = groups.find((game) => game.key === selectedGameKey) ?? topGame;
  const gamePayload = useMemo(() => buildGamePayload(selected), [selected]);
  const topRow = selected?.rows[0] || rows[0] || null;

  return (
    <main className="min-h-screen bg-[#020617] p-4 text-slate-100 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[28px] border border-cyan-400/15 bg-gradient-to-br from-[#07111f] via-[#06101e] to-[#020617] p-6 shadow-[0_30px_90px_rgba(8,47,73,0.18)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  Pro Preview
                </span>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                  No Fake Data
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Live Game Pro Lab</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Visual matchup research powered by verified HR Board rows. Deeper run, RBI, hit, strikeout, weather, history, and bullpen sections stay locked until verified feeds exist.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-400">
              <div className="font-black uppercase tracking-[0.18em] text-slate-200">
                {loading ? 'Loading' : source === 'network' ? 'Verified Feed' : 'Verified Feed Required'}
              </div>
              <div className="mt-1">No invented RBI, run, hit, strikeout, weather, bullpen, or pitcher graphs.</div>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="h-5 w-5" />
            {error}. No fake game data shown.
          </div>
        )}

        <VerifiedDataNotice
          variant={source === 'network' ? 'coming-soon' : 'feed-required'}
          title={source === 'network' ? 'Live Game Lab using verified HR Board data' : 'Verified data feed required'}
          detail="GameSignalPanel renders only production HR Board candidates. All unavailable feeds remain locked."
        />

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-100">
              <Search className="h-4 w-4 text-cyan-300" />
              Game Selector
            </div>
            <div className="space-y-2">
              {loading && <div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-500">Loading verified board context...</div>}
              {!loading && groups.length === 0 && <div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-500">No verified game rows available.</div>}
              {groups.map((game) => (
                <button
                  key={game.key}
                  type="button"
                  onClick={() => setSelectedGameKey(game.key)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selected?.key === game.key ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
                >
                  <div className="text-sm font-black text-slate-100">{game.matchup}</div>
                  <div className="mt-1 text-xs text-slate-500">{game.venue || 'Venue locked'} · {game.rows.length} hitters</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => navigateToSection('player_edge_lab')} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-left text-sm font-black text-cyan-100 hover:border-cyan-300/35">
                Open Player Edge Lab
              </button>
              <button type="button" onClick={() => navigateToSection('team_matchup_lab')} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4 text-left text-sm font-black text-emerald-100 hover:border-emerald-300/35">
                Open Team Matchup Lab
              </button>
              <button type="button" onClick={() => navigateToSection('pro_graphs_lab')} className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-left text-sm font-black text-amber-100 hover:border-amber-300/35">
                Open Pro Graphs Lab
              </button>
            </div>

            {gamePayload ? (
              <GameSignalPanel payload={gamePayload} maxPlayers={8} />
            ) : (
              <VerifiedGraphEmptyState
                variant="feed-required"
                title="Verified game feed required"
                detail="The Live Game Lab needs /api/mlb/hr-board/today game rows before rendering GameSignalPanel."
              />
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <PressureCard title="Top HR Edge" value={safeNumber(topRow?.hrEdge ?? topRow?.hrScore) ?? 0} label="From HR board" color="text-cyan-200" />
              <PressureCard title="Pitcher Risk" value={safeNumber(topRow?.pitcherVulnerability ?? topRow?.scoreBreakdown?.pitcherVulnerability) ?? 0} label="P.VULN signal" color="text-amber-200" />
              <PressureCard title="Confidence" value={safeNumber(topRow?.dataConfidence) ?? 0} label="Data confidence" color="text-emerald-200" />
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">RBI / Run / Hit</div>
                <div className="mt-2 text-xl font-black text-slate-200">Locked</div>
                <p className="mt-1 text-xs text-slate-500">Verified feed required.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ProGraphShell
                icon={Activity}
                title="Can do now"
                description="Show HR threats, game context, and player signal panels from verified HR Board rows."
              />
              <div className="grid gap-2">
                <ProLockedCard title="RBI / Run / Hit Boards" description="Locked until verified RBI, run, and hit feeds are connected." />
                <ProLockedCard title="Strikeout Props" description="Locked until a verified strikeout model and pitcher feed are available." />
                <ProLockedCard title="Weather / Bullpen / History" description="Locked until verified weather, bullpen, and matchup-history feeds exist." />
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function PressureCard({ title, value, label, color }: { title: string; value: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className={`mt-2 text-2xl font-black ${color}`}>{Math.round(value)}</div>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
