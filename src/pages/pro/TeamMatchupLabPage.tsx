import { useEffect, useMemo, useRef, useState } from 'react';
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
import { VerifiedDataNotice } from '../../components/pro';
import PitcherMatchupDrawer from '../../components/matchups/PitcherMatchupDrawer';
import PlayerHeadshot from '../../components/parlays/PlayerHeadshot';
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
  mode?: 'live' | 'enriched';
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

interface ScheduleGame {
  gamePk: number;
  gameDate: string;
  awayTeam: { name?: string; abbreviation?: string };
  homeTeam: { name?: string; abbreviation?: string };
  probablePitchers?: {
    away?: { pitcherId?: number; pitcherName?: string; throws?: 'L' | 'R' | 'U' | string } | null;
    home?: { pitcherId?: number; pitcherName?: string; throws?: 'L' | 'R' | 'U' | string } | null;
  };
  weather?: { condition?: string; tempF?: number; windMph?: number; windDir?: string } | null;
}

interface ScheduleGamesResponse {
  date?: string;
  games?: ScheduleGame[];
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
  if (label === 'STRONG PLAY') return 'border-[hsl(var(--ve-success)/0.34)] bg-[hsl(var(--ve-success)/0.10)] text-[hsl(var(--ve-success))]';
  if (label === 'LEAN OVER') return 'border-[hsl(var(--ve-accent-gold)/0.34)] bg-[hsl(var(--ve-accent-gold)/0.10)] text-[hsl(var(--ve-accent-gold))]';
  if (label === 'AVOID') return 'border-[hsl(var(--ve-danger)/0.34)] bg-[hsl(var(--ve-danger)/0.10)] text-[hsl(var(--ve-danger))]';
  return 'border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.34)] text-[hsl(var(--ve-text-secondary))]';
}

function confidenceClass(confidence: MatchupMatrixRow['confidence']): string {
  if (confidence === 'High') return 'text-[hsl(var(--ve-success))]';
  if (confidence === 'Medium') return 'text-[hsl(var(--ve-accent-gold))]';
  return 'text-[hsl(var(--ve-text-muted))]';
}

function heatStyle(value: number | null, direction: 'higher' | 'lower' = 'higher'): CSSProperties {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { background: 'hsl(var(--ve-bg-panel) / 0.36)' };
  }

  let normalized = value;
  if (direction === 'lower') {
    normalized = 100 - value;
  }

  if (normalized >= 75) return { background: 'hsl(var(--ve-success) / 0.14)', color: 'hsl(var(--ve-success))' };
  if (normalized >= 55) return { background: 'hsl(var(--ve-accent-gold) / 0.14)', color: 'hsl(var(--ve-accent-gold))' };
  if (normalized >= 35) return { background: 'hsl(var(--ve-accent-pink) / 0.12)', color: 'hsl(var(--ve-accent-pink))' };
  return { background: 'hsl(var(--ve-danger) / 0.12)', color: 'hsl(var(--ve-danger))' };
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

function schedulePitcherRow(
  game: ScheduleGame,
  side: 'away' | 'home',
  requestedDate: string
): MatchupMatrixRow {
  const team = side === 'away' ? game.awayTeam : game.homeTeam;
  const opponent = side === 'away' ? game.homeTeam : game.awayTeam;
  const pitcher = side === 'away' ? game.probablePitchers?.away : game.probablePitchers?.home;
  const weather = game.weather
    ? [
        game.weather.condition,
        typeof game.weather.tempF === 'number' ? `${game.weather.tempF}F` : null,
        typeof game.weather.windMph === 'number' ? `${game.weather.windMph} mph${game.weather.windDir ? ` ${game.weather.windDir}` : ''}` : null,
      ].filter(Boolean).join(' · ') || null
    : null;

  return {
    pitcherId: pitcher?.pitcherId ?? null,
    pitcherName: pitcher?.pitcherName ?? 'Probable pitcher TBD',
    team: team.abbreviation || team.name || 'TBD',
    opponent: opponent.abbreviation || opponent.name || 'TBD',
    gameId: game.gamePk,
    gameTime: game.gameDate,
    pitcherHand: pitcher?.throws === 'L' || pitcher?.throws === 'R' ? pitcher.throws : 'U',
    score: null,
    label: 'NEUTRAL',
    metrics: { ...emptyMetrics(), weather },
    dataQuality: {
      probablePitcher: pitcher ? 'official' : 'unknown',
      statcast: 'missing',
      weather: weather ? 'available' : 'missing',
    },
    confidence: 'Low',
  };
}

function matrixFromSchedule(data: ScheduleGamesResponse, requestedDate: string): MatchupMatrixResponse {
  const games = data.games ?? [];
  return {
    date: data.date ?? requestedDate,
    generatedAt: new Date().toISOString(),
    mode: 'live',
    rows: games.flatMap((game) => [
      schedulePitcherRow(game, 'away', requestedDate),
      schedulePitcherRow(game, 'home', requestedDate),
    ]),
  };
}

async function fetchJsonResponse<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { accept: 'application/json' },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${rawText.slice(0, 180) || response.statusText}`);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    const preview = rawText
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);

    throw new Error(
      `Expected JSON but received ${contentType || 'unknown content-type'} from ${url}. Preview: ${preview || 'empty response'}`
    );
  }
}

export default function TeamMatchupLabPage() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<MatchupMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labelFilter, setLabelFilter] = useState<'ALL' | MatrixLabel>('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [opponentFilter, setOpponentFilter] = useState('ALL');
  const [handFilter, setHandFilter] = useState<'ALL' | 'L' | 'R' | 'U'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPitcher, setSelectedPitcher] = useState<MatchupMatrixRow | null>(null);
  const hasRowsRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(!hasRowsRef.current);
    setEnriching(false);
    setError(null);

    async function loadMatrix() {
      try {
        const live = await fetchJsonResponse<MatchupMatrixResponse>(
          apiUrl(`/api/mlb/matchup-matrix/live?date=${encodeURIComponent(date)}`),
          controller.signal
        ).catch(async () => {
          const schedulePath = date === todayISO()
            ? '/api/mlb/games/today'
            : `/api/mlb/games/date/${encodeURIComponent(date)}`;
          return matrixFromSchedule(
            await fetchJsonResponse<ScheduleGamesResponse>(apiUrl(schedulePath), controller.signal),
            date
          );
        }).catch(async () => {
          const fallback = await fetchJsonResponse<LegacyMatchupsResponse>(
            apiUrl('/api/mlb/matchups/today'),
            controller.signal
          );
          return fallbackMatrixFromMatchups(fallback, date);
        });

        if (controller.signal.aborted) return;
        setData(live);
        setLoading(false);
        setEnriching(true);

        const enriched = await fetchJsonResponse<MatchupMatrixResponse>(
          apiUrl(`/api/mlb/matchup-matrix?date=${encodeURIComponent(date)}`),
          controller.signal
        );

        if (!controller.signal.aborted && enriched.rows.length > 0) {
          setData(enriched);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Matchup Matrix unavailable');
          setLoading(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setEnriching(false);
        }
      }
    }

    loadMatrix();

    return () => controller.abort();
  }, [date]);

  const rows = data?.rows ?? [];

  useEffect(() => {
    hasRowsRef.current = rows.length > 0;
  }, [rows.length]);

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
    <main className="ve-page-shell relative min-h-screen overflow-hidden px-3 py-4 text-[hsl(var(--ve-text-primary))] sm:px-4 lg:py-5">
      <div className="relative mx-auto max-w-7xl space-y-4">
        <section className="ve-premium-panel relative overflow-hidden rounded-2xl p-4">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ve-accent-cyan)/0.55),transparent)]" />
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[hsl(var(--ve-accent-cyan)/0.08)] blur-3xl" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="ve-chip ve-chip-primary px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]">
                <Target className="h-3.5 w-3.5" />
                Matchup Matrix
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-[hsl(var(--ve-text-primary))] sm:text-3xl">Team Matchup Lab</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[hsl(var(--ve-text-secondary))]">
                Professional pitcher strikeout research using sourced MLB schedule, probable pitcher, season stat, park, and weather fields already available in Vouchres.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="ve-chip px-2.5 py-1 uppercase tracking-wide">Official probables only</span>
                <span className="ve-chip px-2.5 py-1 uppercase tracking-wide">No fake Statcast</span>
                <span className="ve-chip px-2.5 py-1 uppercase tracking-wide">Drawer-ready rows</span>
              </div>
            </div>

            <div className="ve-card-compact rounded-xl p-3 lg:min-w-64">
              <label className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--ve-text-muted))]" htmlFor="matchup-date">
                Slate Date
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="matchup-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value || todayISO())}
                  className="ve-input min-h-10 min-w-0 flex-1 rounded-xl px-3 text-sm font-black"
                />
                <button
                  type="button"
                  onClick={() => setDate(todayISO())}
                  className="ve-button-secondary min-h-10 rounded-xl px-3"
                  aria-label="Refresh today"
                  title="Refresh today"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 text-xs font-bold text-[hsl(var(--ve-text-muted))]">
                {rows.length > 0
                  ? enriching || loading
                    ? `${rows.length} live rows locked · refreshing`
                    : `${rows.length} pitcher rows loaded`
                  : 'Preparing live MLB slate'}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: Flame, label: 'Strong Plays', value: summary.strong, tone: 'success' },
              { icon: Activity, label: 'Lean Overs', value: summary.lean, tone: 'gold' },
              { icon: ShieldAlert, label: 'Avoid', value: summary.avoid, tone: 'danger' },
              { icon: BarChart3, label: 'Highest Opp K%', value: summary.highestOppKPct, tone: 'cyan' },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="ve-stat-card relative overflow-hidden rounded-xl p-3">
                <span className={`absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--tone),transparent)] ${tone === 'success' ? '[--tone:hsl(var(--ve-success)/0.58)]' : tone === 'gold' ? '[--tone:hsl(var(--ve-accent-gold)/0.58)]' : tone === 'danger' ? '[--tone:hsl(var(--ve-danger)/0.52)]' : '[--tone:hsl(var(--ve-accent-cyan)/0.58)]'}`} />
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.38)]">
                    <Icon className={`h-4 w-4 ${tone === 'success' ? 'text-[hsl(var(--ve-success))]' : tone === 'gold' ? 'text-[hsl(var(--ve-accent-gold))]' : tone === 'danger' ? 'text-[hsl(var(--ve-danger))]' : 'text-[hsl(var(--ve-accent-cyan))]'}`} />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">{label}</span>
                </div>
                <div className={`mt-3 font-mono text-xl font-black ${tone === 'success' ? 'text-[hsl(var(--ve-success))]' : tone === 'gold' ? 'text-[hsl(var(--ve-accent-gold))]' : tone === 'danger' ? 'text-[hsl(var(--ve-danger))]' : 'text-[hsl(var(--ve-accent-cyan))]'}`}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <VerifiedDataNotice variant="feed-required" />

        <section className="ve-premium-panel relative overflow-hidden rounded-2xl p-3 sm:p-4">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ve-accent-cyan)/0.45),transparent)]" />
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="ve-chip ve-chip-primary px-2.5 py-1 text-[10px] uppercase tracking-wide">
                <Filter className="h-4 w-4" />
                Pitcher K Matchups
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[hsl(var(--ve-text-muted))]">
                Missing Statcast, opponent split, or weather fields stay blank and lower confidence.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[680px]">
              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="ve-input min-h-10 rounded-xl px-3 text-sm font-black"
              >
                <option value="ALL">Team</option>
                {teams.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
              <select
                value={opponentFilter}
                onChange={(event) => setOpponentFilter(event.target.value)}
                className="ve-input min-h-10 rounded-xl px-3 text-sm font-black"
              >
                <option value="ALL">Opponent</option>
                {opponents.map((opponent) => <option key={opponent} value={opponent}>{opponent}</option>)}
              </select>
              <select
                value={handFilter}
                onChange={(event) => setHandFilter(event.target.value as 'ALL' | 'L' | 'R' | 'U')}
                className="ve-input min-h-10 rounded-xl px-3 text-sm font-black"
              >
                <option value="ALL">Pitcher hand</option>
                <option value="R">Right</option>
                <option value="L">Left</option>
                <option value="U">Unknown</option>
              </select>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="ve-input min-h-10 rounded-xl px-3 text-sm font-black"
              >
                {sortOptions.map((option) => <option key={option.key} value={option.key}>Sort: {option.label}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {labelFilters.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setLabelFilter(label)}
                className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                  labelFilter === label
                    ? label === 'ALL'
                    ? 'border-[hsl(var(--ve-accent-cyan)/0.46)] bg-[hsl(var(--ve-accent-cyan)/0.12)] text-[hsl(var(--ve-accent-cyan))]'
                      : labelClass(label)
                    : 'border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.30)] text-[hsl(var(--ve-text-muted))] hover:border-[hsl(var(--ve-accent-cyan)/0.26)] hover:bg-[hsl(var(--ve-surface-raised)/0.44)] hover:text-[hsl(var(--ve-text-primary))]'
                }`}
              >
                {label === 'ALL' ? 'All' : label.replace('LEAN OVER', 'Lean Over').replace('STRONG PLAY', 'Strong Play')}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-bg-panel)/0.74)] shadow-[inset_0_1px_0_hsl(var(--ve-text-primary)/0.05)]">
            <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.24)] px-4 py-3">
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-wide text-[hsl(var(--ve-text-secondary))]">
                  {rows.length > 0 ? `${filteredRows.length} of ${rows.length} rows` : 'Preparing live MLB slate'}
                </span>
                <p className="mt-0.5 hidden text-[11px] font-bold text-[hsl(var(--ve-text-muted))] sm:block">
                  {enriching || (loading && rows.length > 0)
                    ? 'The current matrix stays visible while fresh MLB data hydrates.'
                    : 'Select a pitcher profile to open the premium matchup drawer.'}
                </p>
              </div>
              {data?.mode && (
                <span className={`hidden rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide sm:inline-flex ${
                  data.mode === 'enriched'
                    ? 'border-[hsl(var(--ve-success)/0.30)] bg-[hsl(var(--ve-success)/0.10)] text-[hsl(var(--ve-success))]'
                    : 'border-[hsl(var(--ve-accent-cyan)/0.30)] bg-[hsl(var(--ve-accent-cyan)/0.10)] text-[hsl(var(--ve-accent-cyan))]'
                }`}>
                  {data.mode === 'enriched' ? 'Enriched' : 'Live MLB'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
                className="ve-button-secondary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black"
              >
                <ArrowDownAZ className="h-3.5 w-3.5" />
                {sortDirection === 'desc' ? 'High to low' : 'Low to high'}
              </button>
            </div>

            {error && (
              <div className="m-3 rounded-xl border border-[hsl(var(--ve-danger)/0.24)] bg-[hsl(var(--ve-danger)/0.08)] p-4 text-sm font-bold text-[hsl(var(--ve-danger))]">
                {error}
              </div>
            )}

            {!loading && !error && rows.length === 0 && (
              <div className="m-3 rounded-xl border border-[hsl(var(--ve-accent-cyan)/0.22)] bg-[hsl(var(--ve-accent-cyan)/0.08)] p-5 text-sm text-[hsl(var(--ve-text-secondary))]">
                No matchup rows are available for this date. Probable pitchers may not be posted yet, or the MLB schedule feed returned no games.
              </div>
            )}

            {loading && rows.length === 0 && (
              <div className="grid gap-2 p-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-[260px_80px_90px_90px_90px_1fr] gap-3 rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.22)] p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 animate-pulse rounded-full bg-[hsl(var(--ve-surface-raised)/0.42)]" />
                      <div className="space-y-2">
                        <div className="h-3 w-32 animate-pulse rounded bg-[hsl(var(--ve-surface-raised)/0.42)]" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-[hsl(var(--ve-surface-raised)/0.42)]" />
                      </div>
                    </div>
                    <div className="h-8 animate-pulse rounded bg-[hsl(var(--ve-surface-raised)/0.42)]" />
                    <div className="h-8 animate-pulse rounded bg-[hsl(var(--ve-surface-raised)/0.42)]" />
                    <div className="h-8 animate-pulse rounded bg-[hsl(var(--ve-surface-raised)/0.42)]" />
                    <div className="h-8 animate-pulse rounded bg-[hsl(var(--ve-surface-raised)/0.42)]" />
                    <div className="h-8 animate-pulse rounded bg-[hsl(var(--ve-surface-raised)/0.42)]" />
                  </div>
                ))}
              </div>
            )}

            {!error && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-[1540px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">
                      {['Pitcher', 'Team', 'Opponent', 'Game Time', 'Score', 'Label', 'K/9', 'K/Game', 'ERA', 'WHIP', 'IP', 'GS', 'Whiff%', 'K%', 'xERA', 'Opp K%', 'Opponent vs Hand', 'Park Factor', 'Weather', 'Confidence', 'Research'].map((heading) => (
                        <th
                          key={heading}
                          className={`border-b border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.96)] px-3 py-3 font-black ${
                            heading === 'Pitcher' ? 'sticky left-0 z-20 min-w-64' : 'min-w-24'
                          }`}
                        >
                          {['Score', 'K%', 'Whiff%', 'Opp K%', 'xERA', 'K/Game'].includes(heading) ? (
                            <button
                              type="button"
                              onClick={() => handleSort(heading === 'K/Game' ? 'kPerGame' : heading === 'K%' ? 'kPct' : heading === 'Whiff%' ? 'whiffPct' : heading === 'Opp K%' ? 'oppKPct' : heading === 'xERA' ? 'xera' : 'score')}
                              className="text-left font-black text-[hsl(var(--ve-text-secondary))] hover:text-[hsl(var(--ve-text-primary))]"
                            >
                              {heading}
                            </button>
                          ) : heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const rowKey = `${row.gameId}-${row.pitcherId ?? row.team}`;
                      return (
                        <tr key={rowKey} className="group transition hover:bg-[hsl(var(--ve-surface-raised)/0.22)]">
                          <td className="sticky left-0 z-10 border-b border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-bg-panel)/0.98)] px-3 py-3 align-top shadow-[10px_0_20px_hsl(var(--ve-shadow)/0.24)]">
                            <button
                              type="button"
                              onClick={(event) => event.preventDefault()}
                              disabled
                              className="flex w-full items-center gap-3 rounded-2xl border border-transparent p-1.5 text-left transition hover:border-transparent hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-transparent disabled:hover:bg-transparent"
                              title="Pitcher matchup drawer is temporarily disabled"
                            >
                              <div className="relative shrink-0 rounded-full bg-[linear-gradient(135deg,hsl(var(--ve-accent-cyan)/0.36),hsl(var(--ve-accent-gold)/0.18))] p-0.5 shadow-[0_0_22px_hsl(var(--ve-accent-cyan)/0.10)]">
                                <PlayerHeadshot name={row.pitcherName} playerId={row.pitcherId} size={46} />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-black text-[hsl(var(--ve-text-primary))] group-hover:text-[hsl(var(--ve-accent-cyan))]">{row.pitcherName}</div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <span className="rounded-md border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.34)] px-1.5 py-0.5 text-[10px] font-black uppercase text-[hsl(var(--ve-text-muted))]">
                                    {row.pitcherHand === 'U' ? 'Hand TBD' : `${row.pitcherHand}HP`}
                                  </span>
                                  <span className="rounded-md border border-[hsl(var(--ve-success)/0.24)] bg-[hsl(var(--ve-success)/0.08)] px-1.5 py-0.5 text-[10px] font-black uppercase text-[hsl(var(--ve-success))]">
                                    {row.dataQuality.probablePitcher === 'official' ? 'Official' : 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          </td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-black text-[hsl(var(--ve-text-secondary))]">{row.team}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-black text-[hsl(var(--ve-text-secondary))]">{row.opponent}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 text-[hsl(var(--ve-text-secondary))]">{formatGameTime(row.gameTime)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono font-black" style={heatStyle(row.score)}>{displayValue(row.score)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${labelClass(row.label)}`}>{row.label}</span>
                          </td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('k9', row.metrics.k9)}>{displayValue(row.metrics.k9)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('kPerGame', row.metrics.kPerGame)}>{displayValue(row.metrics.kPerGame)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('era', row.metrics.era)}>{displayValue(row.metrics.era)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('whip', row.metrics.whip)}>{displayValue(row.metrics.whip)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('ip', row.metrics.ip)}>{displayValue(row.metrics.ip)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('gs', row.metrics.gs)}>{displayValue(row.metrics.gs)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('whiffPct', row.metrics.whiffPct)}>{displayValue(row.metrics.whiffPct, '%')}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('kPct', row.metrics.kPct)}>{displayValue(row.metrics.kPct, '%')}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('xera', row.metrics.xera)}>{displayValue(row.metrics.xera)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('oppKPct', row.metrics.oppKPct)}>{displayValue(row.metrics.oppKPct, '%')}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 text-[hsl(var(--ve-text-secondary))]">{displayValue(row.metrics.opponentVsHand)}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-mono" style={metricQuality('parkFactor', row.metrics.parkFactor)}>{displayValue(row.metrics.parkFactor)}</td>
                          <td className="max-w-48 border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 text-xs text-[hsl(var(--ve-text-secondary))]">{displayValue(row.metrics.weather)}</td>
                          <td className={`border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3 font-black ${confidenceClass(row.confidence)}`}>{row.confidence}</td>
                          <td className="border-b border-[hsl(var(--ve-border)/0.24)] px-3 py-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCopy(row);
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--ve-accent-cyan)/0.26)] bg-[hsl(var(--ve-accent-cyan)/0.08)] px-3 py-2 text-xs font-black text-[hsl(var(--ve-accent-cyan))] hover:border-[hsl(var(--ve-accent-cyan)/0.44)]"
                            >
                              <ClipboardCopy className="h-3.5 w-3.5" />
                              {copiedKey === rowKey ? 'Copied' : 'Copy Research'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {(loading || enriching) && (
                  <div className="border-t border-[hsl(var(--ve-border)/0.28)] px-4 py-3 text-xs font-black uppercase tracking-wide text-[hsl(var(--ve-accent-cyan))]">
                    Matrix locked while fresh MLB data syncs
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <PitcherMatchupDrawer
          open={!!selectedPitcher}
          gamePk={selectedPitcher?.gameId ?? null}
          pitcherId={selectedPitcher?.pitcherId ?? null}
          date={date}
          matchupScore={selectedPitcher?.score ?? null}
          matchupLabel={selectedPitcher?.label ?? null}
          team={selectedPitcher?.team}
          opponent={selectedPitcher?.opponent}
          pitcherName={selectedPitcher?.pitcherName}
          pitcherHand={selectedPitcher?.pitcherHand}
          onClose={() => setSelectedPitcher(null)}
        />

        <section className="grid gap-3 lg:grid-cols-2">
          <div className="ve-card relative overflow-hidden rounded-2xl p-4">
            <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ve-accent-cyan)/0.42),transparent)]" />
            <div className="text-sm font-black uppercase tracking-wide text-[hsl(var(--ve-text-primary))]">Scoring Model</div>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--ve-text-secondary))]">
              Score weights: 30% pitcher strikeout skill, 25% opponent strikeout weakness, 15% workload and innings safety,
              15% run prevention and control, 10% recent form, and 5% context. Missing components are excluded from the
              weighted average and reflected in confidence.
            </p>
          </div>
          <div className="ve-card relative overflow-hidden rounded-2xl p-4">
            <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ve-accent-gold)/0.38),transparent)]" />
            <div className="text-sm font-black uppercase tracking-wide text-[hsl(var(--ve-text-primary))]">Best K Environment</div>
            <p className="mt-3 font-mono text-xl font-black text-[hsl(var(--ve-accent-gold))]">{summary.bestKEnvironment}</p>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--ve-text-secondary))]">
              Current version favors sourced pitcher skill, workload, control, recent logs, and lower run-environment context.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
