import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Crown, Flame, Search } from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { HrBoardResponse, HrBoardRow } from '../types/hrBoard';
import ProGraphShell from '../components/pro/ProGraphShell';
import ProLockedCard from '../components/pro/ProLockedCard';
import ProSignalBar from '../components/pro/ProSignalBar';

type GameGroup = {
  key: string;
  awayOrFirst: string;
  homeOrOpponent: string;
  venue: string;
  pitcher: string;
  lineupStatus: string;
  confidence: number;
  rows: HrBoardRow[];
};

function asRows(board: HrBoardResponse | null): HrBoardRow[] {
  if (!board) return [];
  if (Array.isArray(board.games)) return board.games.flatMap((game) => Array.isArray(game.rows) ? game.rows : []);
  return [];
}

function groupRows(rows: HrBoardRow[]): GameGroup[] {
  const map = new Map<string, HrBoardRow[]>();
  rows.forEach((row) => {
    const key = String(row.gamePk ?? `${row.team}-${row.opponent ?? 'TBD'}`);
    map.set(key, [...(map.get(key) ?? []), row]);
  });

  return Array.from(map.entries()).map(([key, gameRows]) => {
    const first = gameRows[0];
    const teams = Array.from(new Set(gameRows.flatMap((row) => [row.team, row.opponent].filter(Boolean) as string[])));
    const confidence = Math.round(gameRows.reduce((sum, row) => sum + (row.dataConfidence ?? 0), 0) / Math.max(1, gameRows.length));

    return {
      key,
      awayOrFirst: teams[0] ?? first?.team ?? 'TBD',
      homeOrOpponent: teams[1] ?? first?.opponent ?? 'TBD',
      venue: first?.venue ?? 'Unknown venue',
      pitcher: first?.opponentPitcherName ?? first?.pitcherName ?? 'Probable pitcher unavailable',
      lineupStatus: first?.lineupStatus ?? 'unknown',
      confidence,
      rows: gameRows.sort((a, b) => (b.hrEdge ?? 0) - (a.hrEdge ?? 0)),
    };
  });
}

export default function LiveGameLabPage() {
  const [board, setBoard] = useState<HrBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameKey, setSelectedGameKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    vouchedgeApi.hrBoardToday(50)
      .then((data) => {
        if (cancelled) return;
        setBoard(data);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Live Game Pro Lab data is unavailable. No fake game data shown.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => groupRows(asRows(board)), [board]);
  const selected = groups.find((game) => game.key === selectedGameKey) ?? groups[0] ?? null;
  const hrThreats = selected?.rows.slice(0, 6) ?? [];

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
                Visual matchup research for runs, RBIs, HRs, hits, strikeouts, and team pressure. HR threats use the live HR board payload. Deeper sections stay locked until verified feeds exist.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-400">
              <div className="font-black uppercase tracking-[0.18em] text-slate-200">Data Honesty</div>
              <div className="mt-1">No invented RBI, run, hit, history, weather, bullpen, or pitcher graphs.</div>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

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
                  <div className="text-sm font-black text-slate-100">{game.awayOrFirst} vs {game.homeOrOpponent}</div>
                  <div className="mt-1 text-xs text-slate-500">{game.venue}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-[#07111f]/85 p-5 lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-300" />
                  <h2 className="text-lg font-black">Game Snapshot</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Snapshot label="Matchup" value={selected ? `${selected.awayOrFirst} vs ${selected.homeOrOpponent}` : 'Select a game'} />
                  <Snapshot label="Venue" value={selected?.venue ?? 'Unavailable'} />
                  <Snapshot label="Probable Pitcher" value={selected?.pitcher ?? 'Unavailable'} />
                  <Snapshot label="Lineup Status" value={selected?.lineupStatus ?? 'Unknown'} />
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-5">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Data Confidence</div>
                <div className="mt-4 text-5xl font-black text-white">{selected?.confidence ?? 0}%</div>
                <p className="mt-2 text-xs text-slate-400">Based only on available HR board fields.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-5">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                Visual Read
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Snapshot label="HR threats found" value={`${hrThreats.length} verified`} />
                <Snapshot label="RBI board" value="Locked feed" />
                <Snapshot label="Run board" value="Locked feed" />
                <Snapshot label="Hit board" value="Locked feed" />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                HR threats use the verified HR board. RBI, run, and hit projections stay locked until verified formulas and feeds are connected.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <PressureCard title="HR Pressure" value={hrThreats[0]?.hrEdge ?? 0} label="From HR board" color="text-cyan-200" />
              <PressureCard title="Pitcher Risk" value={hrThreats[0]?.pitcherVulnerability ?? 0} label="P.VULN signal" color="text-amber-200" />
              <PressureCard title="Confidence" value={selected?.confidence ?? 0} label="Data confidence" color="text-emerald-200" />
              <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">RBI / Run / Hit</div>
                <div className="mt-2 text-xl font-black text-slate-200">Locked</div>
                <p className="mt-1 text-xs text-slate-500">Verified feed required.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Can do now</div>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
                  <li>• Show HR threats from verified HR board data</li>
                  <li>• Show game snapshot and pitcher context</li>
                  <li>• Show team pressure using connected HR signals</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Locked until verified</div>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
                  <li>• RBI, run, hit, and strikeout player boards</li>
                  <li>• Team match history graphs</li>
                  <li>• Bullpen fatigue and full pitcher risk models</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-4">
              <ThreatColumn title="HR Threats" rows={hrThreats} live />
              <LockedThreat title="RBI Threats" />
              <LockedThreat title="Run Threats" />
              <LockedThreat title="Hit Threats" />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-[#07111f]/80 p-5">
                <h3 className="mb-4 text-sm font-black text-slate-100">Team Pressure Signals</h3>
                <div className="space-y-4">
                  <ProSignalBar label="HR danger" value={hrThreats[0]?.hrEdge ?? null} color="#22d3ee" />
                  <ProSignalBar label="Pitcher vulnerability" value={hrThreats[0]?.pitcherVulnerability ?? null} color="#d6a64f" />
                  <ProSignalBar label="Data confidence" value={selected?.confidence ?? null} color="#34d399" />
                </div>
              </div>
              <ProLockedCard
                title="Pitcher / Bullpen Risk"
                description="Requires verified starter depth, bullpen usage, and recent fatigue feed. No fake pitcher risk shown."
                badge="Verified feed required"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ProGraphShell title="Recent Runs Trend" description="Verified recent team runs trend feed required. No fake graph data shown." />
              <ProGraphShell title="Recent Hits / HR Trend" description="Verified recent hits and HR trend feed required. No fake graph data shown." />
              <ProGraphShell title="Strikeout Pressure Trend" description="Verified strikeout pressure trend feed required. No fake graph data shown." />
              <ProGraphShell title="Pitcher Vulnerability Comparison" description="Verified pitcher vulnerability comparison feed required. No fake graph data shown." />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
              <div className="mb-4 text-sm font-black text-slate-100">Game Research Roadmap</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Snapshot label="Runs graph" value="Locked feed" />
                <Snapshot label="Hits graph" value="Locked feed" />
                <Snapshot label="HR graph" value="HR board connected" />
                <Snapshot label="Strikeouts" value="Locked feed" />
                <Snapshot label="History" value="Locked feed" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-5">
              <div className="mb-4 text-sm font-black text-slate-100">Game Research Roadmap</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Snapshot label="Runs graph" value="Locked feed" />
                <Snapshot label="Hits graph" value="Locked feed" />
                <Snapshot label="HR graph" value="HR board connected" />
                <Snapshot label="Strikeouts" value="Locked feed" />
                <Snapshot label="History" value="Locked feed" />
              </div>
            </div>

            <ProLockedCard
              title="Match History"
              description="Past games between these teams, runs, hits, HRs, and strikeouts require a verified matchup history feed."
              badge="Coming soon"
            />
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
      <div className={`mt-2 text-3xl font-black ${color}`}>{Math.round(value)}</div>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function ThreatColumn({ title, rows }: { title: string; rows: HrBoardRow[]; live?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-100">
        <Flame className="h-4 w-4 text-orange-300" />
        {title}
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <div className="rounded-xl border border-slate-800 p-3 text-xs text-slate-500">No verified HR threats available.</div>}
        {rows.map((row) => (
          <div key={`${row.playerId}-${row.gamePk}`} className="rounded-xl border border-slate-800 bg-slate-900/45 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-slate-100">{row.playerName}</div>
                <div className="text-xs text-slate-500">{row.team} · {row.opponentPitcherName}</div>
              </div>
              <div className="text-lg font-black text-cyan-200">{Math.round(row.hrEdge ?? 0)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LockedThreat({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-100">
        <Crown className="h-4 w-4 text-amber-200" />
        {title}
      </div>
      <div className="rounded-xl border border-dashed border-slate-800 p-4 text-xs leading-5 text-slate-500">
        Verified formula/feed required. No fake player percentages shown.
      </div>
    </div>
  );
}
