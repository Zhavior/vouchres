import { useEntitlements } from "../../features/hr/hooks/useEntitlements";
import { ProLockedCard } from "../../components/pro/ProLockedCard";
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Activity,
  ArrowDownAZ,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCopy,
  Filter,
  Flame,
  Plus,
  Radio,
  RefreshCcw,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { useLiveGames } from '../../hooks/queries/useLiveGames';
import { VerifiedDataNotice } from '../../components/pro';
import PitcherMatchupDrawer from '../../components/matchups/PitcherMatchupDrawer';
import PlayerHeadshot from '../../components/parlays/PlayerHeadshot';
import { apiClient } from '../../lib/apiClient';
import { Z8_LABEL, Z8_PAGE, Z8_PANEL, Z8_PANEL_PREMIUM, Z8_SECTION_HEADER } from '../../theme/z8Tokens';
import { openParlayAdd } from '../../lib/parlays/parlayAddContract';

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
  if (label === 'LEAN OVER') return 'border-vouch-amber/35 bg-vouch-amber/10 text-vouch-amber';
  if (label === 'AVOID') return 'border-[hsl(var(--ve-danger)/0.34)] bg-[hsl(var(--ve-danger)/0.10)] text-[hsl(var(--ve-danger))]';
  return 'border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.34)] text-[hsl(var(--ve-text-secondary))]';
}

function confidenceClass(confidence: MatchupMatrixRow['confidence']): string {
  if (confidence === 'High') return 'text-[hsl(var(--ve-success))]';
  if (confidence === 'Medium') return 'text-vouch-amber';
  return 'text-[hsl(var(--ve-text-muted))]';
}

function researchLabel(label: MatrixLabel): string {
  if (label === 'STRONG PLAY') return 'Elite K Environment';
  if (label === 'LEAN OVER') return 'Positive K Environment';
  if (label === 'AVOID') return 'High Risk';
  return 'Neutral';
}

function metricText(value: number | null, suffix = ''): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value}${suffix}`;
}

function signalPercent(
  value: number | null,
  minimum: number,
  maximum: number,
  fallback = 50,
): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  if (maximum <= minimum) return fallback;
  return Math.max(5, Math.min(95, ((value - minimum) / (maximum - minimum)) * 100));
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
  if (normalized >= 55) return { background: 'rgba(245,158,11,0.14)', color: '#f59e0b' };
  if (normalized >= 35) return { background: 'rgba(0,255,148,0.12)', color: '#00FF94' };
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

async function fetchJsonResponse<T>(path: string, signal: AbortSignal): Promise<T> {
  return apiClient.get<T>(path, undefined, signal);
}

import { MatchupPageShell } from '../../features/matchup/MatchupPageShell';

export default function PitcherMatchupIntelligencePageZ8({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { isPro } = useEntitlements();
  const { data: liveData } = useLiveGames();
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

  const liveTeamsSet = useMemo(() => {
    const set = new Set<string>();
    if (liveData?.games) {
      for (const g of liveData.games) {
        if (g.isLive || String(g.status ?? '').toLowerCase().includes('in progress') || String(g.status ?? '').toLowerCase().includes('live')) {
          set.add(String(g.id));
          if (g.awayTeam) set.add(g.awayTeam.toLowerCase());
          if (g.awayAbbr) set.add(g.awayAbbr.toLowerCase());
          if (g.homeTeam) set.add(g.homeTeam.toLowerCase());
          if (g.homeAbbr) set.add(g.homeAbbr.toLowerCase());
        }
      }
    }
    return set;
  }, [liveData]);

  const isPitcherLive = (row: MatchupMatrixRow) => {
    if (row.gameId && liveTeamsSet.has(String(row.gameId))) return true;
    if (row.team && liveTeamsSet.has(row.team.toLowerCase())) return true;
    return false;
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(!hasRowsRef.current);
    setEnriching(false);
    setError(null);

    async function loadMatrix() {
      try {
        const live = await fetchJsonResponse<MatchupMatrixResponse>(
          `/api/mlb/matchup-matrix/live?date=${encodeURIComponent(date)}`,
          controller.signal
        ).catch(async () => {
          const schedulePath = date === todayISO()
            ? '/api/mlb/games/today'
            : `/api/mlb/games/date/${encodeURIComponent(date)}`;
          return matrixFromSchedule(
            await fetchJsonResponse<ScheduleGamesResponse>(schedulePath, controller.signal),
            date
          );
        }).catch(async () => {
          const fallback = await fetchJsonResponse<LegacyMatchupsResponse>(
            '/api/mlb/matchups/today',
            controller.signal
          );
          return fallbackMatrixFromMatchups(fallback, date);
        });

        if (controller.signal.aborted) return;
        setData(live);
        setLoading(false);
        setEnriching(true);

        const enriched = await fetchJsonResponse<MatchupMatrixResponse>(
          `/api/mlb/matchup-matrix?date=${encodeURIComponent(date)}`,
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

  const topPitcher = useMemo(
    () =>
      rows
        .filter((row) => row.pitcherId !== null && row.score !== null)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] ?? null,
    [rows],
  );

  const matchupNavigator = useMemo(
    () =>
      rows
        .filter((row) => row.pitcherId !== null)
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        .slice(0, 8),
    [rows],
  );

  const signalRows = useMemo(
    () =>
      rows
        .filter((row) => row.pitcherId !== null && row.metrics.k9 !== null)
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
        .slice(0, 12),
    [rows],
  );

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

  const handleAddPitcher = (row: MatchupMatrixRow) => {
    if (row.pitcherId == null || row.dataQuality.probablePitcher === 'unknown') return;
    openParlayAdd({
      player: {
        id: String(row.pitcherId),
        name: row.pitcherName,
        team: row.team,
        position: 'P',
        headshot: '',
        propositions: [],
        resolvedGamePk: String(row.gameId),
      },
      propHint: {
        id: `pitcher-${row.gameId}-${row.pitcherId}`,
        market: 'Pitcher Strikeouts',
        odds: null,
        spec: `${row.pitcherName} strikeouts`,
        gamePk: row.gameId,
        playerId: row.pitcherId,
      },
      initialFamily: 'pitcher',
      isPitcher: true,
      source: 'pitcher_research',
      dataStatus: row.dataQuality.probablePitcher === 'official' ? 'official' : 'projected',
      reasoningSnapshot: row.score == null
        ? `Pitcher matchup research available against ${row.opponent}.`
        : `Matchup score ${Math.round(row.score)}/100 against ${row.opponent}.`,
      riskSnapshot: 'Current odds and the final strikeout line still require confirmation.',
    });
  };

  return (
    <MatchupPageShell active="pitcher" onNavigate={onNavigate}>
      <div className="space-y-4">
        <section className={`${Z8_PANEL} relative overflow-hidden rounded-2xl p-4`}>
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/55 to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-vouch-cyan/8 blur-3xl" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className={`inline-flex items-center gap-1.5 border border-vouch-cyan/25 bg-vouch-cyan/10 px-2.5 py-1 ${Z8_LABEL} text-vouch-cyan`}>
                <Target className="h-3.5 w-3.5" />
                Matchup Matrix
              </div>
              <h1 className={`mt-3 ${Z8_SECTION_HEADER} text-white`}>Pitcher Matchup Intelligence</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
                Professional pitcher strikeout research using sourced MLB schedule, probable pitcher, season stat, park, and weather fields already available in Vouchres.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="ve-chip px-2.5 py-1 uppercase tracking-wide">Official probables only</span>
                <span className="ve-chip px-2.5 py-1 uppercase tracking-wide">No fake Statcast</span>
                <span className="ve-chip px-2.5 py-1 uppercase tracking-wide">Drawer-ready rows</span>
              </div>
            </div>

            <div className="ve-card-compact rounded-xl p-3 lg:min-w-64">
              <label className={`${Z8_LABEL} text-[hsl(var(--ve-text-muted))]`} htmlFor="matchup-date">
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
                    ? `${rows.length} live rows · refreshing`
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
                <span className={`absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--tone),transparent)] ${tone === 'success' ? '[--tone:hsl(var(--ve-success)/0.58)]' : tone === 'gold' ? '[--tone:rgba(245,158,11,0.58)]' : tone === 'danger' ? '[--tone:hsl(var(--ve-danger)/0.52)]' : '[--tone:rgba(0,240,255,0.58)]'}`} />
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.38)]">
                    <Icon className={`h-4 w-4 ${tone === 'success' ? 'text-[hsl(var(--ve-success))]' : tone === 'gold' ? 'text-vouch-amber' : tone === 'danger' ? 'text-[hsl(var(--ve-danger))]' : 'text-vouch-cyan'}`} />
                  </span>
                  <span className={`${Z8_LABEL} text-[hsl(var(--ve-text-muted))]`}>{label}</span>
                </div>
                <div className={`mt-3 font-mono text-xl font-black ${tone === 'success' ? 'text-[hsl(var(--ve-success))]' : tone === 'gold' ? 'text-vouch-amber' : tone === 'danger' ? 'text-[hsl(var(--ve-danger))]' : 'text-vouch-cyan'}`}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        {topPitcher && (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(420px,0.82fr)]">
            <article className={`${Z8_PANEL_PREMIUM} relative overflow-hidden rounded-2xl border border-vouch-cyan/20 p-4 sm:p-5`}>
              <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,240,255,0.72),transparent)]" />
              <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-vouch-cyan/10 blur-3xl" />

              <div className="relative flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 border border-vouch-cyan/25 bg-vouch-cyan/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-vouch-cyan">
                      <Target className="h-3.5 w-3.5" />
                      Today’s Top Pitcher Signal
                    </div>
                    <p className="mt-2 text-xs text-[hsl(var(--ve-text-muted))]">
                      Highest current sourced matchup score on the selected slate.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-3xl font-black text-white">
                        {Math.round(topPitcher.score ?? 0)}
                      </div>
                      <div className={`${Z8_LABEL} text-white/40`}>
                        Matchup score
                      </div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 shadow-[0_0_32px_rgba(0,240,255,0.14)]">
                      <span className="font-mono text-sm font-black text-vouch-cyan">/100</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="shrink-0 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 p-1 shadow-[0_0_36px_rgba(0,240,255,0.12)]">
                      <PlayerHeadshot
                        name={topPitcher.pitcherName}
                        playerId={topPitcher.pitcherId}
                        size={88}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className={`truncate ${Z8_SECTION_HEADER} text-white`}>
                          {topPitcher.pitcherName}
                        </h2>
                        {isPitcherLive(topPitcher) && (
                          <span className="flex items-center gap-1 text-[10px] font-black font-mono px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse shrink-0">
                            <Radio className="w-3 h-3 text-rose-400 animate-pulse" /> LIVE
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-sm font-black text-vouch-cyan">
                        {topPitcher.team} vs {topPitcher.opponent}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`inline-flex border px-2.5 py-1 text-[10px] font-black uppercase ${labelClass(topPitcher.label)}`}>
                          {researchLabel(topPitcher.label)}
                        </span>
                        <span className={`inline-flex border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase ${confidenceClass(topPitcher.confidence)}`}>
                          {topPitcher.confidence} confidence
                        </span>
                        <span className="inline-flex border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase text-white/55">
                          {topPitcher.pitcherHand === 'U' ? 'Hand unavailable' : `${topPitcher.pitcherHand}HP`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['K/9', metricText(topPitcher.metrics.k9)],
                      ['K/Game', metricText(topPitcher.metrics.kPerGame)],
                      ['Opp K%', metricText(topPitcher.metrics.oppKPct, '%')],
                      ['ERA', metricText(topPitcher.metrics.era)],
                      ['WHIP', metricText(topPitcher.metrics.whip)],
                      ['Workload', metricText(topPitcher.metrics.ip, ' IP')],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-white/10 bg-black/20 px-3 py-2.5">
                        <div className={`${Z8_LABEL} text-white/38`}>{label}</div>
                        <div className="mt-1 font-mono text-sm font-black text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="border border-[hsl(var(--ve-success)/0.20)] bg-[hsl(var(--ve-success)/0.06)] p-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[hsl(var(--ve-success))]">
                      <CheckCircle2 className="h-4 w-4" />
                      Why this matchup grades well
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/62">
                      {topPitcher.metrics.k9 !== null
                        ? `${topPitcher.metrics.k9} K/9 anchors the pitcher-skill side of the model.`
                        : 'Pitcher strikeout skill is included only when the trusted feed supplies it.'}
                      {' '}
                      {topPitcher.metrics.oppKPct !== null
                        ? `${topPitcher.opponent} carries a ${topPitcher.metrics.oppKPct}% opponent strikeout rate.`
                        : 'Opponent strikeout percentage is currently unavailable and is excluded from confidence.'}
                    </p>
                  </div>

                  <div className="border border-vouch-amber/20 bg-vouch-amber/[0.06] p-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-vouch-amber">
                      <CircleAlert className="h-4 w-4" />
                      What could change
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/62">
                      Final lineups, pitcher confirmation, weather, workload expectations, and the sportsbook strikeout line can change the research context.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPitcher(topPitcher)}
                    className="inline-flex min-h-10 items-center gap-2 border border-vouch-cyan/35 bg-vouch-cyan/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-vouch-cyan transition hover:bg-vouch-cyan/15"
                  >
                    Open Full Research
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={topPitcher.pitcherId === null}
                    onClick={() => handleAddPitcher(topPitcher)}
                    className="inline-flex min-h-10 items-center gap-2 border border-vouch-emerald/30 bg-vouch-emerald/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-vouch-emerald transition hover:bg-vouch-emerald/15 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Plus className="h-4 w-4" />
                    Add Pitcher Market
                  </button>
                </div>
              </div>
            </article>

            <article className={`${Z8_PANEL_PREMIUM} relative overflow-hidden rounded-2xl p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`${Z8_LABEL} text-white`}>
                    Strikeout Signal Field
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/42">
                    Horizontal position uses K/9. Vertical position uses opponent K% when available, otherwise the sourced matchup score.
                  </p>
                </div>
                <BarChart3 className="h-5 w-5 text-vouch-cyan" />
              </div>

              <div className="relative mt-4 h-[300px] overflow-hidden border border-white/10 bg-black/25">
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10" />
                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-white/10" />

                <span className="absolute left-3 top-3 text-[9px] font-black uppercase tracking-wider text-white/30">
                  Higher opponent K environment
                </span>
                <span className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-wider text-white/30">
                  Stronger pitcher K skill
                </span>

                {signalRows.map((row) => {
                  const x = signalPercent(row.metrics.k9, 5, 12);
                  const yMetric = row.metrics.oppKPct ?? row.score;
                  const y = 100 - signalPercent(
                    yMetric,
                    row.metrics.oppKPct !== null ? 15 : 35,
                    row.metrics.oppKPct !== null ? 32 : 90,
                  );

                  return (
                    <button
                      key={`${row.gameId}-${row.pitcherId}`}
                      type="button"
                      onClick={() => setSelectedPitcher(row)}
                      className="group absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      title={`${row.pitcherName}: score ${row.score ?? 'unavailable'}`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-[9px] font-mono font-black shadow-[0_0_18px_rgba(0,240,255,0.12)] transition group-hover:scale-110 ${
                        row === topPitcher
                          ? 'border-vouch-cyan bg-vouch-cyan/25 text-white'
                          : row.label === 'AVOID'
                          ? 'border-[hsl(var(--ve-danger)/0.45)] bg-[hsl(var(--ve-danger)/0.16)] text-[hsl(var(--ve-danger))]'
                          : 'border-white/20 bg-slate-950 text-white/75'
                      }`}>
                        {Math.round(row.score ?? 0)}
                      </span>
                      <span className="pointer-events-none absolute left-1/2 top-9 hidden w-28 -translate-x-1/2 border border-white/10 bg-black/95 px-2 py-1 text-center text-[9px] font-black text-white shadow-xl group-hover:block">
                        {row.pitcherName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </article>
          </section>
        )}

        {matchupNavigator.length > 0 && (
          <section className={`${Z8_PANEL_PREMIUM} overflow-hidden rounded-2xl p-4`}>
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.14em] text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-vouch-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                  Matchup Navigator
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-300">
                  Select any starting pitcher button to open their complete matchup breakdown.
                </p>
              </div>
              <span className="font-mono text-xs font-black uppercase text-vouch-cyan border border-vouch-cyan/30 bg-vouch-cyan/10 px-2.5 py-1 rounded-lg">
                Top {matchupNavigator.length} Pitchers
              </span>
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
              {matchupNavigator.map((row) => {
                const active = selectedPitcher?.pitcherId === row.pitcherId;
                return (
                  <button
                    key={`${row.gameId}-${row.pitcherId}-navigator`}
                    type="button"
                    onClick={() => setSelectedPitcher(row)}
                    aria-current={active ? 'true' : undefined}
                    className={`min-w-[240px] shrink-0 snap-center rounded-xl border p-3.5 text-left transition-all duration-200 cursor-pointer active:scale-[0.97] ${
                      active
                        ? 'border-vouch-cyan/80 bg-gradient-to-br from-[#0c2235] via-[#091a29] to-[#06101c] shadow-[0_0_24px_rgba(0,240,255,0.25)] ring-1 ring-vouch-cyan/50'
                        : 'border-white/20 bg-[#0a121d] hover:border-vouch-cyan/40 hover:bg-[#0f1c2c]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PlayerHeadshot
                        name={row.pitcherName}
                        playerId={row.pitcherId}
                        size={48}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-base font-black uppercase tracking-tight text-white">{row.pitcherName}</div>
                          {isPitcherLive(row) && (
                            <span className="flex items-center gap-1 text-[9px] font-black font-mono px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse shrink-0">
                              <Radio className="w-2.5 h-2.5 text-rose-400" /> LIVE
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-mono text-[11px] font-bold text-slate-200">
                          <span className="text-vouch-cyan">{row.team}</span> vs <span className="text-white">{row.opponent}</span>
                        </div>
                      </div>
                      <div className="font-mono text-xl font-black text-vouch-cyan bg-black/40 px-2 py-1 rounded-lg border border-vouch-cyan/30">
                        {row.score ?? '—'}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${confidenceClass(row.confidence)}`}>
                        {row.confidence} confidence
                      </span>
                      <div className={`inline-flex items-center gap-1 text-[10px] font-black uppercase rounded-lg px-2 py-1 transition ${
                        active ? 'bg-vouch-cyan text-black' : 'bg-white/10 text-white hover:bg-vouch-cyan/20 hover:text-vouch-cyan'
                      }`}>
                        <span>{active ? 'Active' : 'Select'}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className={`${Z8_PANEL_PREMIUM} relative overflow-hidden rounded-2xl p-3 sm:p-4`}>
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,240,255,0.45),transparent)]" />
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
                    ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                      : labelClass(label)
                    : 'border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.30)] text-[hsl(var(--ve-text-muted))] hover:border-vouch-cyan/25 hover:bg-[hsl(var(--ve-surface-raised)/0.44)] hover:text-[hsl(var(--ve-text-primary))]'
                }`}
              >
                {label === 'ALL' ? 'All' : label.replace('LEAN OVER', 'Lean Over').replace('STRONG PLAY', 'Strong Play')}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.24)] px-4 py-3">
              <div className="min-w-0">
                <span className={`${Z8_LABEL} text-[hsl(var(--ve-text-secondary))]`}>
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
                    : 'border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan'
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
              <div className="m-3 rounded-xl border border-vouch-cyan/25 bg-vouch-cyan/10 p-5 text-sm text-[hsl(var(--ve-text-secondary))]">
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
                    <tr className={`${Z8_LABEL} text-[hsl(var(--ve-text-muted))]`}>
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
                              onClick={() => setSelectedPitcher(row)}
                              className="flex w-full items-center gap-3 rounded-2xl border border-transparent p-1.5 text-left transition hover:border-emerald-300/30 hover:bg-emerald-300/5"
                              title="Open pitcher matchup details"
                            >
                              <div className="relative shrink-0 rounded-full bg-[linear-gradient(135deg,rgba(0,240,255,0.36),rgba(245,158,11,0.18))] p-0.5 shadow-[0_0_22px_rgba(0,240,255,0.10)]">
                                <PlayerHeadshot name={row.pitcherName} playerId={row.pitcherId} size={46} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <div className="truncate font-black text-[hsl(var(--ve-text-primary))] group-hover:text-vouch-cyan">{row.pitcherName}</div>
                                  {isPitcherLive(row) && (
                                    <span className="flex items-center gap-1 text-[9px] font-black font-mono px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse shrink-0">
                                      <Radio className="w-2.5 h-2.5 text-rose-400" /> LIVE
                                    </span>
                                  )}
                                </div>
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
                            <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();

                                if (!isPro) {
                                  window.dispatchEvent(
                                    new CustomEvent("vouch:navigate", {
                                      detail: { section: "premium" },
                                    })
                                  );
                                  return;
                                }

                                handleCopy(row);
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-vouch-cyan/25 bg-vouch-cyan/10 px-3 py-2 text-xs font-black text-vouch-cyan hover:border-vouch-cyan/45"
                            >
                              <ClipboardCopy className="h-3.5 w-3.5" />
                              {isPro
                                ? copiedKey === rowKey
                                  ? 'Copied'
                                  : 'Copy Research'
                                : 'Unlock Research'}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleAddPitcher(row);
                              }}
                              disabled={row.pitcherId == null || row.dataQuality.probablePitcher === 'unknown'}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-vouch-emerald/30 bg-vouch-emerald/10 px-3 py-2 text-xs font-black text-vouch-emerald hover:border-vouch-emerald/50 disabled:cursor-not-allowed disabled:opacity-35"
                              title={row.pitcherId == null ? 'Official pitcher ID unavailable' : 'Add a supported pitcher market'}
                            >
                              <Plus className="h-3.5 w-3.5" /> Slip
                            </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {(loading || enriching) && (
                  <div className="border-t border-[hsl(var(--ve-border)/0.28)] px-4 py-3 text-xs font-black uppercase tracking-wide text-vouch-cyan">
                    Matrix live from current matchup slate
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
            <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,240,255,0.42),transparent)]" />
            <div className="text-sm font-black uppercase tracking-wide text-[hsl(var(--ve-text-primary))]">Scoring Model</div>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--ve-text-secondary))]">
              Score weights: 30% pitcher strikeout skill, 25% opponent strikeout weakness, 15% workload and innings safety,
              15% run prevention and control, 10% recent form, and 5% context. Missing components are excluded from the
              weighted average and reflected in confidence.
            </p>
          </div>
          <div className="ve-card relative overflow-hidden rounded-2xl p-4">
            <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,158,11,0.38),transparent)]" />
            <div className="text-sm font-black uppercase tracking-wide text-[hsl(var(--ve-text-primary))]">Best K Environment</div>
            <p className="mt-3 font-mono text-xl font-black text-vouch-amber">{summary.bestKEnvironment}</p>
            <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--ve-text-secondary))]">
              Current version favors sourced pitcher skill, workload, control, recent logs, and lower run-environment context.
            </p>
          </div>
        </section>
      </div>
    </MatchupPageShell>
  );
}
