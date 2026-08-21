import { useEffect, useMemo, useState } from 'react';
import { useDailyReport } from '../../../hooks/queries/useDailyReport';
import { useDailyHrBoard } from '../../hr/hooks/useDailyHrBoard';
import { todayISO } from '../../../hooks/queries/hrBoardQuery';
import { buildBoard } from '../../hr/utils/normalizeHrWatch';
import { buildTodayDecision, type TodayDecision } from '../../../components/today/todayDecisionModel';
import type { TodayFieldState } from '../../../components/today/TodayFieldDesk';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { ApiGame, DailyMlbReport, DataQuality } from '../../../types/mlb';
import type { Parlay } from '../../../types';

/* ────────────────────────────────────────────────────────────────────────────
 * Today Next — home model.
 *
 * This is the daily command desk, not a research board. It answers "what
 * should I do right now", surfaces the state of the slate, and routes into the
 * workspaces that do the deep work. The ranked evidence lives on HR
 * Intelligence; here it is only ever a preview.
 * ──────────────────────────────────────────────────────────────────────────── */

const LIVE_STATUS = /live|in progress|manager challenge|delayed|warmup/i;
const FINAL_STATUS = /final|game over|completed/i;

export function isLiveGame(game: ApiGame): boolean {
  return !FINAL_STATUS.test(game.status ?? '') && LIVE_STATUS.test(game.status ?? '');
}

export function isFinalGame(game: ApiGame): boolean {
  return FINAL_STATUS.test(game.status ?? '');
}

export interface TodayNextVitals {
  matchups: number | null;
  live: number;
  final: number;
  upcoming: number;
  hrSignals: number | null;
  confirmed: number;
  pendingSlips: number;
  dataQuality: DataQuality | null;
}

export interface TodayNextFirstPitch {
  game: ApiGame;
  kickoffMs: number;
  /** Null once the game has started or the time is unparseable. */
  countdownMs: number | null;
  /** True once client timer has mounted to prevent SSR hydration mismatch. */
  isMounted: boolean;
}

export interface TodayNextSignalPreview {
  id: string;
  playerName: string;
  team: string;
  opponent: string;
  score: number;
  tier: string;
  oddsLabel: string | null;
  confirmed: boolean;
  headline: string;
  hitterPower?: number | null;
  pitcherVuln?: number | null;
  parkFactor?: number | null;
}

export interface TodayNextReceipt {
  updated: string;
  sources: string[];
  missing: string;
}

function parseGameTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatClock(value: string | null | undefined): string {
  const parsed = parseGameTime(value);
  if (parsed == null) return 'Time unavailable';
  return new Date(parsed).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatReportDate(value: string | null | undefined): string {
  const parsed = parseGameTime(value);
  if (parsed == null) return value?.trim() || 'Slate date unavailable';
  return new Date(parsed).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function freshnessLabel(report: DailyMlbReport | null, boardUpdatedAt: Date | null): string {
  const generated = parseGameTime(report?.generatedAt);
  const board = boardUpdatedAt?.getTime() ?? null;
  const newest = Math.max(generated ?? 0, board ?? 0);
  if (!newest) return 'Freshness unavailable';
  const ageMin = Math.max(0, Math.round((Date.now() - newest) / 60_000));
  if (ageMin < 1) return 'Updated just now';
  if (ageMin < 60) return `Updated ${ageMin}m ago`;
  const hours = Math.floor(ageMin / 60);
  return `Updated ${hours}h ago`;
}

/** A one-second tick with SSR hydration guard. */
function useTicker(active: boolean): { now: number; isMounted: boolean } {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!active || !mounted) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active, mounted]);

  return { now, isMounted: mounted };
}

export function useTodayNextHome(savedSlips: readonly Parlay[]) {
  const reportQuery = useDailyReport();
  const hrBoardQuery = useDailyHrBoard(todayISO());

  const report = reportQuery.data ?? null;

  const hrBoard = useMemo(
    () => (hrBoardQuery.data ? buildBoard(hrBoardQuery.data) : null),
    [hrBoardQuery.data],
  );

  const visibleRows = useMemo<HrWatchRow[]>(() => {
    if (!hrBoard) return [];
    if (hrBoard.confirmed.length > 0) return hrBoard.confirmed;
    if (hrBoard.curated.length > 0) return hrBoard.curated;
    return hrBoard.all;
  }, [hrBoard]);

  const pendingSlips = useMemo(
    () => savedSlips.filter((slip) => String(slip.status || 'PENDING').toUpperCase() === 'PENDING'),
    [savedSlips],
  );

  const games = report?.games ?? [];

  const liveGames = useMemo(() => games.filter(isLiveGame), [games]);

  const firstPitchGame = useMemo(() => {
    let best: { game: ApiGame; at: number } | null = null;
    for (const game of games) {
      if (isLiveGame(game) || isFinalGame(game)) continue;
      const at = parseGameTime(game.gameDate);
      if (at == null) continue;
      if (!best || at < best.at) best = { game, at };
    }
    return best;
  }, [games]);

  // SSR hydration guard on countdown ticker
  const { now, isMounted } = useTicker(Boolean(firstPitchGame));

  const firstPitch = useMemo<TodayNextFirstPitch | null>(() => {
    if (!firstPitchGame) return null;
    const remaining = firstPitchGame.at - now;
    return {
      game: firstPitchGame.game,
      kickoffMs: firstPitchGame.at,
      countdownMs: remaining > 0 ? remaining : null,
      isMounted,
    };
  }, [firstPitchGame, now, isMounted]);

  const vitals = useMemo<TodayNextVitals>(() => {
    let live = 0;
    let final = 0;
    for (const game of games) {
      if (isFinalGame(game)) final += 1;
      else if (isLiveGame(game)) live += 1;
    }
    return {
      matchups: report?.gameCount ?? (games.length || null),
      live,
      final,
      upcoming: Math.max(0, games.length - live - final),
      hrSignals: hrBoard ? visibleRows.length : null,
      confirmed: hrBoard?.confirmed.length ?? 0,
      pendingSlips: pendingSlips.length,
      dataQuality: report?.dataQuality ?? null,
    };
  }, [games, hrBoard, pendingSlips.length, report, visibleRows.length]);

  const decision = useMemo<TodayDecision>(
    () =>
      buildTodayDecision({
        report,
        loading: reportQuery.isLoading,
        hasError: reportQuery.isError,
        savedSlips: savedSlips.length,
        pendingSlips: pendingSlips.length,
        hrSignalCount: hrBoard ? visibleRows.length : null,
        hrSignalsLoading: hrBoardQuery.loading,
      }),
    [
      hrBoard,
      hrBoardQuery.loading,
      pendingSlips.length,
      report,
      reportQuery.isError,
      reportQuery.isLoading,
      savedSlips.length,
      visibleRows.length,
    ],
  );

  /** A preview only — the ranked board itself lives on HR Intelligence. */
  const topSignals = useMemo<TodayNextSignalPreview[]>(() => {
    return [...visibleRows]
      .sort((a, b) => b.hrScore - a.hrScore)
      .slice(0, 5)
      .map((row) => ({
        id: row.stableId,
        playerName: row.playerName,
        team: row.team,
        opponent: row.opponent,
        score: Math.max(0, Math.min(100, Math.round(row.hrScore))),
        tier: row.riskTier || 'Watch',
        oddsLabel: row.oddsLabel?.trim()
          ? row.oddsLabel.trim()
          : typeof row.bookOdds === 'number' && Number.isFinite(row.bookOdds)
            ? `${row.bookOdds > 0 ? '+' : ''}${row.bookOdds}`
            : null,
        confirmed: row.truthStatus === 'official',
        headline: row.reasons.find((reason) => reason?.trim())?.trim() ?? 'No model rationale published.',
        hitterPower: row.hitterPower,
        pitcherVuln: row.pitcherVulnerability,
        parkFactor: row.parkContext ?? row.parkFactor ?? row.parkIndex,
      }));
  }, [visibleRows]);

  const receipt = useMemo<TodayNextReceipt>(() => {
    const sources: string[] = [];
    if (report) sources.push('Daily MLB report');
    if (hrBoard) sources.push('Validated HR board');
    if (vitals.confirmed > 0) sources.push('Official lineups');
    if (sources.length === 0) sources.push('No source responded');

    const gaps: string[] = [];
    if (!report) gaps.push('The daily report did not load.');
    if (!hrBoard) gaps.push('The HR board did not load.');
    if (report?.dataQuality === 'partial') gaps.push('Report flags partial input coverage.');
    if (report?.dataQuality === 'limited') gaps.push('Report flags limited input coverage.');
    if (hrBoard && vitals.confirmed === 0) gaps.push('No confirmed lineup has been published yet.');

    return {
      updated: freshnessLabel(report, hrBoardQuery.lastUpdated ?? null),
      sources,
      missing: gaps.length > 0 ? gaps.join(' ') : 'No material source gaps.',
    };
  }, [hrBoard, hrBoardQuery.lastUpdated, report, vitals.confirmed]);

  const unionRows = useMemo<HrWatchRow[]>(() => {
    if (!hrBoard) return [];
    const seen = new Map<string, HrWatchRow>();
    for (const row of [...hrBoard.confirmed, ...hrBoard.curated, ...hrBoard.all]) {
      if (!seen.has(row.stableId)) seen.set(row.stableId, row);
    }
    return [...seen.values()];
  }, [hrBoard]);

  const refresh = () => {
    void Promise.all([reportQuery.refetch(), hrBoardQuery.refresh()]);
  };

  const isLoading = reportQuery.isLoading || hrBoardQuery.loading;
  const isDegraded = reportQuery.isError || Boolean(hrBoardQuery.error) || report?.dataQuality === 'limited';

  const deskState: TodayFieldState = isLoading
    ? 'loading'
    : isDegraded
      ? 'degraded'
      : report?.gameCount === 0
        ? 'no-slate'
        : decision.liveGames > 0
          ? 'live'
          : decision.upcomingGames > 0
            ? 'pregame'
            : 'postgame';

  return {
    report,
    decision,
    vitals,
    topSignals,
    deskRows: visibleRows,
    deskConfirmedRows: hrBoard?.confirmed ?? [],
    deskAllRows: unionRows,
    deskState,
    gameCount: report?.gameCount ?? null,
    firstPitch,
    liveGames,
    pendingSlips,
    receipt,
    reportDateLabel: formatReportDate(report?.date),
    freshness: receipt.updated,
    isLoading,
    isRefreshing: reportQuery.isFetching && !reportQuery.isLoading,
    error: reportQuery.isError ? (reportQuery.error ?? new Error('Daily report unavailable')) : null,
    isDegraded,
    refresh,
  };
}
