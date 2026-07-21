import React, { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ProLockedCard } from "../../components/pro/ProLockedCard";
import { useEntitlements } from "../../features/hr/hooks/useEntitlements";
import { Grid3x3, ChevronLeft, ChevronRight, Calendar, RefreshCw, AlertOctagon, Flame } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import PlayerHeadshot from '../../components/parlays/PlayerHeadshot';
import { useTreemapLayout, type HierarchyDatum } from '../../lib/hierarchy/useHierarchyLayout';
import type { HierarchyRectangularNode } from 'd3-hierarchy';
import {
  Z8_PAGE,
  Z8_PAGE_SHELL,
  Z8_PANEL,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_LABEL,
  Z8_ICON_BOX,
  Z8_CYAN_HEX,
  Z8_EMERALD_HEX,
  Z8_AMBER_HEX
} from '../../theme/z8Tokens';

// ─── Types (mirror server payload shapes) ──────────────────────────────────

interface MatchupTeam {
  teamId: number;
  name: string;
  abbreviation: string;
  logo: string;
  probablePitcher: { id: number; name: string; throws: string; vulnerability: number } | null;
}

interface GameMatchup {
  gamePk: number;
  status: string;
  isLive: boolean;
  isFinal: boolean;
  gameTime: string;
  venue: string;
  away: MatchupTeam;
  home: MatchupTeam;
}

interface StatcastQuality {
  playerId: number;
  pa: number | null;
  xwoba: number | null;
  barrelPct: number | null;
  hardHitPct: number | null;
  avgExitVelo: number | null;
}

interface SeasonStats {
  pa: number;
  avg: number;
  obp: number;
  slg: number;
  iso: number;
  ops: number;
  hr: number;
}

interface BvpStats {
  ab: number;
  h: number;
  hr: number;
  bb: number;
  k: number;
  avgText: string | null;
  slgText: string | null;
  opsText: string | null;
}

interface HitterRow {
  id: number;
  name: string;
  bats: 'L' | 'R' | 'S' | 'U';
  position: string;
  lineupSpot: number | null;
  headshotUrl?: string | null;
  recentForm: { games: number; hr: number; hits: number; atBats: number; strikeOuts: number } | null;
  vsPitcher: BvpStats | null;
  seasonStats: SeasonStats | null;
  statcast: StatcastQuality | null;
  tags: string[];
}

interface PitcherMatchupResponse {
  gamePk: number;
  pitcher: { id: number; name: string; team: string; throws: 'L' | 'R' | 'U' };
  opponent: { team: string; projectedLineup: HitterRow[] };
  warnings: string[];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoAddDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// ─── Heatmap color scale ────────────────────────────────────────────────────
// Thresholds are standard, defensible sabermetric benchmarks (2024-25 MLB
// league context) — not arbitrary. Same green/yellow/red vocabulary used
// everywhere else real quality signals render in this app.

function scaleColor(value: number | null | undefined, good: number, mid: number, invert = false): CSSProperties {
  if (value == null || !Number.isFinite(value)) {
    return { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)' };
  }
  const pass = invert ? value <= good : value >= good;
  const midPass = invert ? value <= mid : value >= mid;
  if (pass) return { background: 'rgba(0,255,148,0.16)', color: Z8_EMERALD_HEX };
  if (midPass) return { background: 'rgba(251,191,36,0.14)', color: Z8_AMBER_HEX };
  return { background: 'rgba(251,113,133,0.14)', color: '#fb7185' };
}

const scales = {
  avg: (v: number | null) => scaleColor(v, 0.28, 0.24),
  obp: (v: number | null) => scaleColor(v, 0.35, 0.31),
  slg: (v: number | null) => scaleColor(v, 0.47, 0.40),
  iso: (v: number | null) => scaleColor(v, 0.20, 0.14),
  ops: (v: number | null) => scaleColor(v, 0.80, 0.68),
  xwoba: (v: number | null) => scaleColor(v, 0.35, 0.31),
  barrel: (v: number | null) => scaleColor(v, 10, 6),
  hardHit: (v: number | null) => scaleColor(v, 45, 35),
};

// ─── Sample-size legend — real BvP at-bats, career vs this exact pitcher ───

type SampleTier = 'high' | 'medium' | 'thin' | 'none';

function sampleTier(ab: number | undefined): SampleTier {
  if (!ab) return 'none';
  if (ab >= 15) return 'high';
  if (ab >= 6) return 'medium';
  return 'thin';
}

const SAMPLE_COLOR: Record<SampleTier, string> = {
  high: Z8_EMERALD_HEX,
  medium: 'rgba(255,255,255,0.75)',
  thin: Z8_AMBER_HEX,
  none: '#fb7185',
};

const SAMPLE_LABEL: Record<SampleTier, string> = {
  high: 'High (15+ AB vs this pitcher)',
  medium: 'Medium (6-14 AB)',
  thin: 'Thin (1-5 AB)',
  none: 'No history (0 AB)',
};

function fmt3(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(3).replace(/^0\./, '.').replace(/^-0\./, '-.');
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(1)}%`;
}

// ─── Matchup selector strip ─────────────────────────────────────────────────

const MatchupStrip: React.FC<{
  games: GameMatchup[];
  selected: number | null;
  onSelect: (gamePk: number) => void;
}> = ({ games, selected, onSelect }) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {games.map((g) => {
      const active = g.gamePk === selected;
      return (
        <button
          key={g.gamePk}
          type="button"
          onClick={() => onSelect(g.gamePk)}
          className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-2.5 transition ${
            active
              ? 'border-vouch-cyan/50 bg-vouch-cyan/10'
              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-1.5 text-sm font-bold text-white">
            <img src={g.away.logo} alt={g.away.abbreviation} className="h-5 w-5 object-contain" loading="lazy" decoding="async" />
            <span>{g.away.abbreviation}</span>
            <span className="text-white/30">@</span>
            <img src={g.home.logo} alt={g.home.abbreviation} className="h-5 w-5 object-contain" loading="lazy" decoding="async" />
            <span>{g.home.abbreviation}</span>
          </div>
          <span className="text-[10px] font-semibold text-white/40">
            {g.isLive ? 'LIVE' : new Date(g.gameTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
        </button>
      );
    })}
    {games.length === 0 && (
      <p className="px-2 py-3 text-xs text-white/40">No games scheduled for this date.</p>
    )}
  </div>
);

// ─── Hitter heatmap table ───────────────────────────────────────────────────

const HitterHeatmapTable: React.FC<{
  title: string;
  pitcherName: string;
  rows: HitterRow[];
}> = ({ title, pitcherName, rows }) => {
  if (rows.length === 0) {
    return (
      <div className={`${Z8_PANEL} p-6 text-center text-xs text-white/40`}>
        No lineup data yet for {title} vs {pitcherName}.
      </div>
    );
  }

  return (
    <div className={`${Z8_PANEL} overflow-hidden rounded-2xl border-white/[0.06] bg-black/20`}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <Grid3x3 className="h-4 w-4 text-vouch-cyan" />
        <span className="text-sm font-bold text-white">{title}</span>
        <span className="text-xs text-white/40">vs {pitcherName}</span>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="min-w-[1180px] border-separate border-spacing-0 text-left text-xs">
          <thead>
            <tr className={`${Z8_LABEL} bg-black/40 text-white/40`}>
              {['Hitter', 'AVG', 'OBP', 'SLG', 'ISO', 'xwOBA', 'Barrel%', 'HH%', 'Form (L10)', 'vs Pit AB', 'vs Pit AVG', 'vs Pit OPS', 'Tags'].map((h) => (
                <th key={h} className="whitespace-nowrap border-b border-white/[0.06] px-3 py-2.5 font-black">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const tier = sampleTier(row.vsPitcher?.ab);
              const season = row.seasonStats;
              const sc = row.statcast;
              return (
                <tr key={row.id} className="transition hover:bg-white/[0.03]" style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td className="whitespace-nowrap border-b border-white/[0.04] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <PlayerHeadshot name={row.name} playerId={row.id} headshotUrl={row.headshotUrl} size={26} />
                      <div>
                        <div className="font-bold" style={{ color: SAMPLE_COLOR[tier] }} title={SAMPLE_LABEL[tier]}>{row.name}</div>
                        <div className="text-[10px] text-white/35">{row.bats} · {row.position}{row.lineupSpot ? ` · #${row.lineupSpot}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.avg(season?.avg ?? null)}>{fmt3(season?.avg)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.obp(season?.obp ?? null)}>{fmt3(season?.obp)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.slg(season?.slg ?? null)}>{fmt3(season?.slg)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.iso(season?.iso ?? null)}>{fmt3(season?.iso)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.xwoba(sc?.xwoba ?? null)}>{fmt3(sc?.xwoba)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.barrel(sc?.barrelPct ?? null)}>{fmtPct(sc?.barrelPct)}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.hardHit(sc?.hardHitPct ?? null)}>{fmtPct(sc?.hardHitPct)}</td>
                  <td className="whitespace-nowrap border-b border-white/[0.04] px-3 py-2.5 text-white/70">
                    {row.recentForm ? `${row.recentForm.hits}-${row.recentForm.atBats}, ${row.recentForm.hr} HR` : '—'}
                  </td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono text-white/70">{row.vsPitcher?.ab ?? 0}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.avg(row.vsPitcher?.avgText ? Number(row.vsPitcher.avgText) : null)}>{row.vsPitcher?.avgText ?? '—'}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5 font-mono font-bold" style={scales.ops(row.vsPitcher?.opsText ? Number(row.vsPitcher.opsText) : null)}>{row.vsPitcher?.opsText ?? '—'}</td>
                  <td className="border-b border-white/[0.04] px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {row.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-white/50">{tag}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Best Matchups treemap — real composite from real fetched fields ───────

interface BestMatchupDatum extends HierarchyDatum {
  row?: HitterRow;
}

function compositeScore(row: HitterRow): number {
  const iso = row.seasonStats?.iso ?? 0.1;
  const xwoba = row.statcast?.xwoba ?? 0.31;
  const bvpOps = row.vsPitcher?.opsText ? Number(row.vsPitcher.opsText) : row.seasonStats?.ops ?? 0.7;
  return Math.max(1, Math.round(iso * 200 + xwoba * 200 + bvpOps * 50));
}

const BestMatchupsTreemap: React.FC<{ rows: HitterRow[] }> = ({ rows }) => {
  const W = 900;
  const H = 220;
  const top = useMemo(() => [...rows].sort((a, b) => compositeScore(b) - compositeScore(a)).slice(0, 8), [rows]);

  const data = useMemo<BestMatchupDatum>(() => ({
    name: 'root',
    children: top.map((row) => ({ name: row.name, value: compositeScore(row), row })),
  }), [top]);

  const root = useTreemapLayout(data, W, H, 3);
  const leaves = root.leaves() as HierarchyRectangularNode<BestMatchupDatum>[];

  if (top.length === 0) return null;

  return (
    <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-3`}>
      <div className={`mb-2 flex items-center gap-2 px-1 ${Z8_LABEL} text-white/50`}>
        <Flame className="h-3.5 w-3.5 text-vouch-amber" />
        Best Matchups — this game
        <span className="ml-auto normal-case tracking-normal text-white/30">Tile size = ISO + xwOBA + vs-pitcher OPS (real, blended)</span>
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', minWidth: `${W}px` }} className="w-full h-auto">
          {leaves.map((leaf, i) => {
            const w = leaf.x1 - leaf.x0;
            const h = leaf.y1 - leaf.y0;
            const row = leaf.data.row;
            if (!row || w < 1 || h < 1) return null;
            return (
              <g key={row.id ?? i} transform={`translate(${leaf.x0},${leaf.y0})`}>
                <rect width={w} height={h} rx={4} fill={Z8_CYAN_HEX} fillOpacity={0.14} stroke={Z8_CYAN_HEX} strokeOpacity={0.5} strokeWidth={1}>
                  <title>{row.name} — score {compositeScore(row)}</title>
                </rect>
                {w > 50 && h > 20 && (
                  <text x={6} y={16} fontSize={11} fontWeight={700} fill="#f8fafc" style={{ pointerEvents: 'none' }}>{row.name}</text>
                )}
                {w > 40 && h > 34 && (
                  <text x={6} y={h - 8} fontSize={9} fill="rgba(255,255,255,0.6)" style={{ pointerEvents: 'none' }}>{compositeScore(row)}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────

export default function HitterMatchupZonesPageZ8() {
  const { isPro } = useEntitlements();
  const [date, setDate] = useState(todayISO());
  const [games, setGames] = useState<GameMatchup[]>([]);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [awayVsHome, setAwayVsHome] = useState<PitcherMatchupResponse | null>(null);
  const [homeVsAway, setHomeVsAway] = useState<PitcherMatchupResponse | null>(null);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isToday = date === todayISO();

  useEffect(() => {
    let alive = true;
    setLoadingGames(true);
    setError(null);
    const path = isToday ? '/api/mlb/matchups/today' : `/api/mlb/matchups/date/${date}`;
    apiClient
      .get<{ matchups?: GameMatchup[] }>(path)
      .then((data) => {
        if (!alive) return;
        const list: GameMatchup[] = data.matchups ?? [];
        setGames(list);
        setSelectedGame((prev) => (list.some((g) => g.gamePk === prev) ? prev : list[0]?.gamePk ?? null));
      })
      .catch((err) => { if (alive) setError(err.message || 'Matchups unavailable'); })
      .finally(() => { if (alive) setLoadingGames(false); });
    return () => { alive = false; };
  }, [date, isToday]);

  useEffect(() => {
    const game = games.find((g) => g.gamePk === selectedGame);
    if (!game) { setAwayVsHome(null); setHomeVsAway(null); return; }
    let alive = true;
    setLoadingLineups(true);

    const fetchSide = (pitcherId: number | undefined): Promise<PitcherMatchupResponse | null> => {
      if (!pitcherId) return Promise.resolve(null);
      return apiClient
        .get<PitcherMatchupResponse>(`/api/mlb/matchup-matrix/${game.gamePk}/pitcher/${pitcherId}`, { date })
        .catch(() => null);
    };

    Promise.all([
      fetchSide(game.away.probablePitcher?.id),
      fetchSide(game.home.probablePitcher?.id),
    ]).then(([awayPitcherVsHomeLineup, homePitcherVsAwayLineup]) => {
      if (!alive) return;
      setAwayVsHome(awayPitcherVsHomeLineup);
      setHomeVsAway(homePitcherVsAwayLineup);
    }).finally(() => { if (alive) setLoadingLineups(false); });

    return () => { alive = false; };
  }, [selectedGame, games, date]);

  const combinedRows = useMemo(() => [
    ...(awayVsHome?.opponent.projectedLineup ?? []),
    ...(homeVsAway?.opponent.projectedLineup ?? []),
  ], [awayVsHome, homeVsAway]);

  const selectedGameData = games.find((g) => g.gamePk === selectedGame);

  return (
    <div className={Z8_PAGE}>
      <div className={Z8_PAGE_SHELL}>
        <header className={`${Z8_PANEL} flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4`}>
          <div className="flex items-center gap-3">
            <div className={`${Z8_ICON_BOX} h-11 w-11 rounded-xl`}>
              <Grid3x3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className={Z8_SECTION_HEADER}>HITTER MATCHUP ZONES</h1>
              <p className={`${Z8_LABEL} text-white/40`}>
                Real season + BvP + Statcast quality · {isToday ? 'Today' : date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-1.5 py-1">
            <button type="button" onClick={() => setDate((d) => isoAddDays(d, -1))} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-vouch-cyan">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center gap-1.5 px-2 text-xs font-bold text-white/80">
              <Calendar className="h-3.5 w-3.5 text-white/40" />
              {isToday ? 'Today' : date}
            </span>
            <button type="button" onClick={() => setDate((d) => isoAddDays(d, 1))} className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-vouch-cyan">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setDate(todayISO())} className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.06] hover:text-vouch-cyan" title="Jump to today">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <p className="text-[11px] leading-relaxed text-white/35">
          Season AVG/OBP/SLG/ISO from real MLB Stats API season totals (ISO = SLG − AVG). xwOBA/Barrel%/HH% from real Baseball Savant Statcast
          leaderboards — blank when a hitter is under Savant's minimum-PA threshold, never estimated. vs-Pitcher columns are real career
          batter-vs-this-pitcher plate appearances; hitter names are colored by that real sample size (see legend below). Research/entertainment
          only — not betting advice.
        </p>

        <div className={`${Z8_PANEL} rounded-2xl p-3 border-white/[0.06]`}>
          <MatchupStrip games={games} selected={selectedGame} onSelect={setSelectedGame} />
        </div>

        <div className={`${Z8_PANEL} flex flex-wrap items-center gap-4 rounded-2xl border-white/[0.06] px-4 py-2.5 ${Z8_LABEL} text-white/50`}>
          <span className="normal-case tracking-normal text-white/30">Hitter name = sample size vs this pitcher:</span>
          {(['high', 'medium', 'thin', 'none'] as SampleTier[]).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: SAMPLE_COLOR[t] }} />
              {SAMPLE_LABEL[t]}
            </span>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] px-4 py-3 text-xs font-semibold text-rose-200">
            <AlertOctagon className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loadingGames ? (
          <div className={`${Z8_PANEL} rounded-2xl border-white/[0.06] py-16 text-center text-sm text-white/40`}>Loading today's slate…</div>
        ) : loadingLineups ? (
          <div className={`${Z8_PANEL} rounded-2xl border-white/[0.06] py-16 text-center text-sm text-white/40`}>Loading real matchup data…</div>
        ) : selectedGameData ? (
          <>
            <BestMatchupsTreemap rows={combinedRows} />

            {isPro ? (
              <>
                {awayVsHome && (
                  <HitterHeatmapTable
                    title={selectedGameData.home.name}
                    pitcherName={awayVsHome.pitcher.name}
                    rows={awayVsHome.opponent.projectedLineup}
                  />
                )}

                {homeVsAway && (
                  <HitterHeatmapTable
                    title={selectedGameData.away.name}
                    pitcherName={homeVsAway.pitcher.name}
                    rows={homeVsAway.opponent.projectedLineup}
                  />
                )}
              </>
            ) : (
              <ProLockedCard
                title="Hitter Matchup Zones"
                description="Unlock pitcher vulnerability, lineup edges, BvP context, and advanced matchup intelligence."
                onUpgrade={() =>
                  window.dispatchEvent(
                    new CustomEvent("vouch:navigate", {
                      detail: { section: "premium" },
                    })
                  )
                }
              />
            )}
          </>
        ) : (
          <div className={`${Z8_PANEL} rounded-2xl border-white/[0.06] py-16 text-center text-sm text-white/40`}>Select a matchup above.</div>
        )}
      </div>
    </div>
  );
}
