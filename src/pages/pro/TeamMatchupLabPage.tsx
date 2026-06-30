import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Activity,
  ArrowDownAZ,
  BarChart3,
  ClipboardCopy,
  Filter,
  Flame,
  RefreshCcw,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { ProPageHeader, VerifiedDataNotice } from '../../components/pro';
import { apiUrl } from '../../lib/apiBase';

type MatrixLabel = 'STRONG PLAY' | 'LEAN OVER' | 'NEUTRAL' | 'AVOID';

interface MatchupMatrixRow {
  pitcherId: number | null;
  pitcherName: string;
  team: string;
  opponent: string;
  gameId: number;
  gameTime: string;
  pitcherHand: 'L' | 'R' | 'U';
  score: number | null;
  label: MatrixLabel;
  metrics: {
    k9: number | null;
    kPerGame: number | null;
    era: number | null;
    whip: number | null;
    ip: number | null;
    gs: number | null;
    whiffPct: number | null;
    kPct: number | null;
    xera: number | null;
    oppKPct: number | null;
    opponentVsHand: string | null;
    parkFactor: number | null;
    weather: string | null;
  };
  dataQuality: {
    probablePitcher: 'official' | 'projected' | 'unknown';
    statcast: 'available' | 'missing';
    weather: 'available' | 'missing';
  };
  confidence: 'High' | 'Medium' | 'Low';
}

interface MatchupMatrixResponse {
  date: string;
  generatedAt: string;
  rows: MatchupMatrixRow[];
}

type SortKey = 'score' | 'kPct' | 'whiffPct' | 'oppKPct' | 'xera' | 'kPerGame';
type SortDirection = 'desc' | 'asc';

interface LegacyMatchupPitcher {
  id?: number;
  name?: string;
  throws?: 'L' | 'R' | 'U' | string;
}

interface LegacyMatchupTeam {
  name?: string;
  abbreviation?: string;
  probablePitcher?: LegacyMatchupPitcher | null;
}

interface LegacyMatchup {
  gamePk: number;
  gameTime: string;
  away?: LegacyMatchupTeam;
  home?: LegacyMatchupTeam;
}

interface LegacyMatchupsResponse {
  date?: string;
  generatedAt?: string;
  updatedAt?: string;
  matchups?: LegacyMatchup[];
  games?: LegacyMatchup[];
}

const labelFilters: Array<'ALL' | MatrixLabel> = ['ALL', 'STRONG PLAY', 'LEAN OVER', 'NEUTRAL', 'AVOID'];

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'score', label: 'Score' },
  { key: 'kPct', label: 'K%' },
  { key: 'whiffPct', label: 'Whiff%' },
  { key: 'oppKPct', label: 'Opp K%' },
  { key: 'xera', label: 'xERA' },
  { key: 'kPerGame', label: 'K/Game' },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function displayValue(value: number | string | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'number' ? `${value}${suffix}` : value;
}

function labelClass(label: MatrixLabel): string {
  if (label === 'STRONG PLAY') return 'border-emerald-300/35 bg-emerald-400/15 text-emerald-100';
  if (label === 'LEAN OVER') return 'border-yellow-300/35 bg-yellow-400/15 text-yellow-100';
  if (label === 'AVOID') return 'border-rose-300/35 bg-rose-400/15 text-rose-100';
  return 'border-slate-400/25 bg-slate-500/10 text-slate-200';
}

function confidenceClass(confidence: MatchupMatrixRow['confidence']): string {
  if (confidence === 'High') return 'text-emerald-200';
  if (confidence === 'Medium') return 'text-yellow-200';
  return 'text-slate-400';
}

function heatStyle(value: number | null, direction: 'higher' | 'lower' = 'higher'): CSSProperties {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { background: 'rgba(15, 23, 42, 0.36)' };
  }

  let normalized = value;
  if (direction === 'lower') {
    normalized = 100 - value;
  }

  if (normalized >= 75) return { background: 'rgba(16, 185, 129, 0.18)', color: '#bbf7d0' };
  if (normalized >= 55) return { background: 'rgba(234, 179, 8, 0.16)', color: '#fef3c7' };
  if (normalized >= 35) return { background: 'rgba(249, 115, 22, 0.16)', color: '#fed7aa' };
  return { background: 'rgba(244, 63, 94, 0.16)', color: '#fecdd3' };
}

function metricQuality(metric: keyof MatchupMatrixRow['metrics'], value: number | null): CSSProperties {
  if (value === null || value === undefined) return heatStyle(null);
  switch (metric) {
    case 'era':
      return heatStyle(Math.max(0, Math.min(100, ((6 - value) / 3.75) * 100)));
    case 'whip':
      return heatStyle(Math.max(0, Math.min(100, ((1.6 - value) / 0.7) * 100)));
    case 'xera':
      return heatStyle(Math.max(0, Math.min(100, ((6 - value) / 3.75) * 100)));
    case 'parkFactor':
      return heatStyle(Math.max(0, Math.min(100, 100 - Math.abs(value - 100) * 2)));
    case 'ip':
      return heatStyle(Math.max(0, Math.min(100, ((value - 40) / 70) * 100)));
    case 'gs':
      return heatStyle(Math.max(0, Math.min(100, (value / 12) * 100)));
    case 'k9':
      return heatStyle(Math.max(0, Math.min(100, ((value - 5.5) / 6.5) * 100)));
    case 'kPerGame':
      return heatStyle(Math.max(0, Math.min(100, ((value - 2.5) / 6) * 100)));
    default:
      return heatStyle(value);
  }
}

function sortValue(row: MatchupMatrixRow, key: SortKey): number | null {
  if (key === 'score') return row.score;
  return row.metrics[key];
}

function formatGameTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '-';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function rowCopyText(row: MatchupMatrixRow): string {
  return [
    `${row.pitcherName} (${row.team} vs ${row.opponent})`,
    `Score: ${displayValue(row.score)} | Label: ${row.label} | Confidence: ${row.confidence}`,
    `K/9: ${displayValue(row.metrics.k9)} | K/Game: ${displayValue(row.metrics.kPerGame)} | ERA: ${displayValue(row.metrics.era)} | WHIP: ${displayValue(row.metrics.whip)}`,
    `Data: probable pitcher ${row.dataQuality.probablePitcher}, Statcast ${row.dataQuality.statcast}, weather ${row.dataQuality.weather}`,
  ].join('\n');
}

function emptyMetrics(): MatchupMatrixRow['metrics'] {
  return {
    k9: null,
    kPerGame: null,
    era: null,
    whip: null,
    ip: null,
    gs: null,
    whiffPct: null,
    kPct: null,
    xera: null,
    oppKPct: null,
    opponentVsHand: null,
    parkFactor: null,
    weather: null,
  };
}

function legacyPitcherRow(
  matchup: LegacyMatchup,
  side: 'away' | 'home',
  requestedDate: string
): MatchupMatrixRow {
  const team = side === 'away' ? matchup.away : matchup.home;
  const opponent = side === 'away' ? matchup.home : matchup.away;
  const pitcher = team?.probablePitcher ?? null;

  return {
    pitcherId: pitcher?.id ?? null,
    pitcherName: pitcher?.name ?? 'Probable pitcher TBD',
    team: team?.abbreviation || team?.name || 'TBD',
    opponent: opponent?.abbreviation || opponent?.name || 'TBD',
    gameId: matchup.gamePk,
    gameTime: matchup.gameTime,
    pitcherHand: pitcher?.throws === 'L' || pitcher?.throws === 'R' ? pitcher.throws : 'U',
    score: null,
    label: 'NEUTRAL',
    metrics: emptyMetrics(),
    dataQuality: {
      probablePitcher: pitcher ? 'official' : 'unknown',
      statcast: 'missing',
      weather: 'missing',
    },
    confidence: 'Low',
  };
}

function fallbackMatrixFromMatchups(data: LegacyMatchupsResponse, requestedDate: string): MatchupMatrixResponse {
  const matchups = data.matchups ?? data.games ?? [];
  return {
    date: data.date ?? requestedDate,
    generatedAt: data.generatedAt ?? data.updatedAt ?? new Date().toISOString(),
    rows: matchups.flatMap((matchup) => [
      legacyPitcherRow(matchup, 'away', requestedDate),
      legacyPitcherRow(matchup, 'home', requestedDate),
    ]),
  };
}

async function fetchJsonResponse<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json' },
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('application/json')) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export default function TeamMatchupLabPage() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<MatchupMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState<'ALL' | MatrixLabel>('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [opponentFilter, setOpponentFilter] = useState('ALL');
  const [handFilter, setHandFilter] = useState<'ALL' | 'L' | 'R' | 'U'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchJsonResponse<MatchupMatrixResponse>(
      apiUrl(`/api/mlb/matchup-matrix?date=${encodeURIComponent(date)}`),
      controller.signal
    )
      .catch(async () => {
        const fallback = await fetchJsonResponse<LegacyMatchupsResponse>(
          apiUrl('/api/mlb/matchups/today'),
          controller.signal
        );
        return fallbackMatrixFromMatchups(fallback, date);
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || 'Matchup Matrix unavailable');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [date]);

  const rows = data?.rows ?? [];

  const teams = useMemo(() => Array.from(new Set(rows.map((row) => row.team))).sort(), [rows]);
  const opponents = useMemo(() => Array.from(new Set(rows.map((row) => row.opponent))).sort(), [rows]);

  const filteredRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (labelFilter !== 'ALL' && row.label !== labelFilter) return false;
      if (teamFilter !== 'ALL' && row.team !== teamFilter) return false;
      if (opponentFilter !== 'ALL' && row.opponent !== opponentFilter) return false;
      if (handFilter !== 'ALL' && row.pitcherHand !== handFilter) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av === null && bv === null) return a.pitcherName.localeCompare(b.pitcherName);
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortDirection === 'desc' ? bv - av : av - bv;
    });
  }, [handFilter, labelFilter, opponentFilter, rows, sortDirection, sortKey, teamFilter]);

  const summary = useMemo(() => {
    const strong = rows.filter((row) => row.label === 'STRONG PLAY').length;
    const lean = rows.filter((row) => row.label === 'LEAN OVER').length;
    const avoid = rows.filter((row) => row.label === 'AVOID').length;
    const highestOpp = rows
      .filter((row) => row.metrics.oppKPct !== null)
      .sort((a, b) => (b.metrics.oppKPct ?? 0) - (a.metrics.oppKPct ?? 0))[0];
    const bestEnvironment = rows
      .filter((row) => row.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

    return {
      strong,
      lean,
      avoid,
      highestOppKPct: highestOpp ? `${highestOpp.opponent} ${highestOpp.metrics.oppKPct}%` : '-',
      bestKEnvironment: bestEnvironment ? `${bestEnvironment.pitcherName} ${bestEnvironment.score}` : '-',
    };
  }, [rows]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortKey(key);
    setSortDirection('desc');
  };

  const handleCopy = async (row: MatchupMatrixRow) => {
    const key = `${row.gameId}-${row.pitcherId ?? row.team}`;
    try {
      await navigator.clipboard?.writeText(rowCopyText(row));
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      setCopiedKey(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-5 text-slate-100 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <ProPageHeader
          icon={Target}
          title="Team Matchup Lab"
          subtitle="Daily pitcher strikeout matchup matrix using sourced MLB schedule, probable pitcher, season stat, park, and weather fields already available in Vouchres."
          badge="Matchup Matrix"
          accent="#34d399"
          kpiTiles={[
            { icon: Flame, label: 'Strong Plays', value: summary.strong, accent: '#34d399' },
            { icon: Activity, label: 'Lean Overs', value: summary.lean, accent: '#facc15' },
            { icon: ShieldAlert, label: 'Avoid', value: summary.avoid, accent: '#fb7185' },
            { icon: BarChart3, label: 'Highest Opp K%', value: summary.highestOppKPct, accent: '#38bdf8' },
          ]}
          right={
            <div className="flex flex-col gap-2 sm:min-w-52">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500" htmlFor="matchup-date">
                Date
              </label>
              <div className="flex gap-2">
                <input
                  id="matchup-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value || todayISO())}
                  className="min-h-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm font-bold text-slate-100 outline-none focus:border-emerald-300/50"
                />
                <button
                  type="button"
                  onClick={() => setDate(todayISO())}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 text-emerald-100 hover:border-emerald-300/45"
                  aria-label="Refresh today"
                  title="Refresh today"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          }
        />

        <VerifiedDataNotice variant="feed-required" />

        <section className="rounded-2xl border border-white/10 bg-slate-900/55 p-3 shadow-[0_0_40px_rgba(15,23,42,0.35)] sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Filter className="h-4 w-4 text-emerald-300" />
                Pitcher K Matchups
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Missing Statcast, opponent split, or weather fields stay blank and lower confidence.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[680px]">
              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-200 outline-none"
              >
                <option value="ALL">Team</option>
                {teams.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
              <select
                value={opponentFilter}
                onChange={(event) => setOpponentFilter(event.target.value)}
                className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-200 outline-none"
              >
                <option value="ALL">Opponent</option>
                {opponents.map((opponent) => <option key={opponent} value={opponent}>{opponent}</option>)}
              </select>
              <select
                value={handFilter}
                onChange={(event) => setHandFilter(event.target.value as 'ALL' | 'L' | 'R' | 'U')}
                className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-200 outline-none"
              >
                <option value="ALL">Pitcher hand</option>
                <option value="R">Right</option>
                <option value="L">Left</option>
                <option value="U">Unknown</option>
              </select>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="min-h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-200 outline-none"
              >
                {sortOptions.map((option) => <option key={option.key} value={option.key}>Sort: {option.label}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {labelFilters.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setLabelFilter(label)}
                className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                  labelFilter === label
                    ? label === 'ALL'
                      ? 'border-sky-300/50 bg-sky-300/15 text-sky-100'
                      : labelClass(label)
                    : 'border-white/10 bg-slate-950/80 text-slate-400 hover:border-white/25 hover:text-slate-100'
                }`}
              >
                {label === 'ALL' ? 'All' : label.replace('LEAN OVER', 'Lean Over').replace('STRONG PLAY', 'Strong Play')}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
              <span className="text-xs font-bold text-slate-400">
                {loading ? 'Loading matrix...' : `${filteredRows.length} of ${rows.length} rows`}
              </span>
              <button
                type="button"
                onClick={() => setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:border-white/25"
              >
                <ArrowDownAZ className="h-3.5 w-3.5" />
                {sortDirection === 'desc' ? 'High to low' : 'Low to high'}
              </button>
            </div>

            {error && (
              <div className="m-3 rounded-xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm font-bold text-rose-100">
                {error}
              </div>
            )}

            {!loading && !error && rows.length === 0 && (
              <div className="m-3 rounded-xl border border-sky-300/15 bg-sky-500/10 p-5 text-sm text-sky-100">
                No matchup rows are available for this date. Probable pitchers may not be posted yet, or the MLB schedule feed returned no games.
              </div>
            )}

            {!error && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-[1500px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                      {['Pitcher', 'Team', 'Opponent', 'Game Time', 'Score', 'Label', 'K/9', 'K/Game', 'ERA', 'WHIP', 'IP', 'GS', 'Whiff%', 'K%', 'xERA', 'Opp K%', 'Opponent vs Hand', 'Park Factor', 'Weather', 'Confidence', 'Research'].map((heading) => (
                        <th
                          key={heading}
                          className={`border-b border-white/10 bg-slate-950 px-3 py-3 font-black ${
                            heading === 'Pitcher' ? 'sticky left-0 z-20 min-w-44' : 'min-w-24'
                          }`}
                        >
                          {['Score', 'K%', 'Whiff%', 'Opp K%', 'xERA', 'K/Game'].includes(heading) ? (
                            <button
                              type="button"
                              onClick={() => handleSort(heading === 'K/Game' ? 'kPerGame' : heading === 'K%' ? 'kPct' : heading === 'Whiff%' ? 'whiffPct' : heading === 'Opp K%' ? 'oppKPct' : heading === 'xERA' ? 'xera' : 'score')}
                              className="text-left font-black text-slate-300 hover:text-white"
                            >
                              {heading}
                            </button>
                          ) : heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(loading ? [] : filteredRows).map((row) => {
                      const rowKey = `${row.gameId}-${row.pitcherId ?? row.team}`;
                      return (
                        <tr key={rowKey} className="group">
                          <td className="sticky left-0 z-10 border-b border-white/10 bg-slate-950 px-3 py-3 align-top shadow-[10px_0_20px_rgba(2,6,23,0.28)]">
                            <div className="font-black text-white">{row.pitcherName}</div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-400">
                                {row.pitcherHand === 'U' ? 'Hand TBD' : `${row.pitcherHand}HP`}
                              </span>
                              <span className="rounded-md border border-emerald-300/15 bg-emerald-300/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-200">
                                {row.dataQuality.probablePitcher === 'official' ? 'Official' : 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="border-b border-white/10 px-3 py-3 font-black text-slate-200">{row.team}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-black text-slate-200">{row.opponent}</td>
                          <td className="border-b border-white/10 px-3 py-3 text-slate-300">{formatGameTime(row.gameTime)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono font-black" style={heatStyle(row.score)}>{displayValue(row.score)}</td>
                          <td className="border-b border-white/10 px-3 py-3">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${labelClass(row.label)}`}>{row.label}</span>
                          </td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('k9', row.metrics.k9)}>{displayValue(row.metrics.k9)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('kPerGame', row.metrics.kPerGame)}>{displayValue(row.metrics.kPerGame)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('era', row.metrics.era)}>{displayValue(row.metrics.era)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('whip', row.metrics.whip)}>{displayValue(row.metrics.whip)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('ip', row.metrics.ip)}>{displayValue(row.metrics.ip)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('gs', row.metrics.gs)}>{displayValue(row.metrics.gs)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('whiffPct', row.metrics.whiffPct)}>{displayValue(row.metrics.whiffPct, '%')}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('kPct', row.metrics.kPct)}>{displayValue(row.metrics.kPct, '%')}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('xera', row.metrics.xera)}>{displayValue(row.metrics.xera)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('oppKPct', row.metrics.oppKPct)}>{displayValue(row.metrics.oppKPct, '%')}</td>
                          <td className="border-b border-white/10 px-3 py-3 text-slate-300">{displayValue(row.metrics.opponentVsHand)}</td>
                          <td className="border-b border-white/10 px-3 py-3 font-mono" style={metricQuality('parkFactor', row.metrics.parkFactor)}>{displayValue(row.metrics.parkFactor)}</td>
                          <td className="max-w-48 border-b border-white/10 px-3 py-3 text-xs text-slate-300">{displayValue(row.metrics.weather)}</td>
                          <td className={`border-b border-white/10 px-3 py-3 font-black ${confidenceClass(row.confidence)}`}>{row.confidence}</td>
                          <td className="border-b border-white/10 px-3 py-3">
                            <button
                              type="button"
                              onClick={() => handleCopy(row)}
                              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1.5 text-xs font-black text-emerald-100 hover:border-emerald-300/45"
                            >
                              <ClipboardCopy className="h-3.5 w-3.5" />
                              {copiedKey === rowKey ? 'Copied' : 'Use in Parlay Research'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {loading && (
                  <div className="p-5 text-sm font-bold text-slate-400">
                    Loading sourced matchup rows...
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
            <div className="text-sm font-black text-white">Scoring model</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Score weights: 30% pitcher strikeout skill, 25% opponent strikeout weakness, 15% workload and innings safety,
              15% run prevention and control, 10% recent form, and 5% context. Missing components are excluded from the
              weighted average and reflected in confidence.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
            <div className="text-sm font-black text-white">Best K Environment</div>
            <p className="mt-2 font-mono text-lg font-black text-emerald-200">{summary.bestKEnvironment}</p>
            <p className="mt-2 text-sm text-slate-400">
              Current version favors sourced pitcher skill, workload, control, recent logs, and lower run-environment context.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
