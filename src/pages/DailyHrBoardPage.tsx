import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flame, RefreshCw, AlertTriangle } from 'lucide-react';
import type { HrBoardResponse, HrBoardRow, HrBoardFilterState, SortKey } from '../types/hrBoard';
import HrBoardFilters from '../components/hr-board/HrBoardFilters';
import HrBoardTable from '../components/hr-board/HrBoardTable';
import HrTierView from '../components/hr-board/HrTierView';
import HrPlayerDrawer from '../components/hr-board/HrPlayerDrawer';
import type { CreatorProofProfile, MLBPlayer } from '../types';
import { hasTierAccess } from '../components/pro/ProAccessGate';
import { bootDataStore } from '../lib/boot/bootDataStore';
import { useDailyHrBoard } from '../hooks/useDailyHrBoard';

const GRADE_RANK: Record<string, number> = { 'A+': 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_FILTERS: HrBoardFilterState = {
  team: 'ALL', grade: 'ALL', risk: 'ALL', hotOnly: false, sneakyOnly: false,
  confirmedOnly: false, minPitcherVuln: 0, search: '', sortKey: 'hrEdge',
};

function formTagFromRecentPowerScore(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return 'Average';
  if (score >= 82) return 'Hot';
  if (score >= 68) return 'Average';
  if (score >= 54) return 'Cold';
  return 'Slump';
}

function firstFiniteNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

function sortRows(rows: HrBoardRow[], key: SortKey): HrBoardRow[] {
  const arr = [...rows];
  switch (key) {
    case 'grade': return arr.sort((a, b) => (GRADE_RANK[b.grade] ?? 0) - (GRADE_RANK[a.grade] ?? 0) || b.hrEdge - a.hrEdge);
    case 'bestOdds':
      return arr.sort((a, b) => {
        const cleanOdds = (value: unknown) => {
          const parsed = Number.parseInt(String(value ?? '').replace(/[^-+0-9]/g, ''), 10);
          return Number.isFinite(parsed) ? parsed : -9999;
        };

        return cleanOdds(b.bestOdds) - cleanOdds(a.bestOdds);
      });
    case 'lineupSpot':
      return arr.sort((a, b) => {
        const aSpot = typeof a.lineupSpot === 'number' ? a.lineupSpot : 99;
        const bSpot = typeof b.lineupSpot === 'number' ? b.lineupSpot : 99;
        return aSpot - bSpot;
      });
    case 'vouchScore': return arr.sort((a, b) => b.vouchScore - a.vouchScore);
    case 'pitcherVulnerability': return arr.sort((a, b) => b.pitcherVulnerability - a.pitcherVulnerability);
    case 'dataConfidence': return arr.sort((a, b) => b.dataConfidence - a.dataConfidence);
    case 'weatherBoost': return arr.sort((a, b) => b.weatherBoost - a.weatherBoost);
    default: return arr.sort((a, b) => b.hrEdge - a.hrEdge);
  }
}

interface HrBoardPageProps {
  onAddLegToParlay?: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string; gamePk?: string | number }) => void;
  profile?: CreatorProofProfile;
}

export default function DailyHrBoardPage({ onAddLegToParlay, profile }: HrBoardPageProps = {}) {
  const initialDate = todayISO();
  const [view, setView] = useState<'tier' | 'game'>('tier');
  const [projectedPoolView, setProjectedPoolView] = useState<'curated' | 'all'>('curated');
  const [date, setDate] = useState(initialDate);
  const [filters, setFilters] = useState<HrBoardFilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<HrBoardRow | null>(null);
  const { data: board, loading, error, lastUpdated, refresh } = useDailyHrBoard(date);

  const confirmedCandidates = useMemo(
    () => (Array.isArray((board as any)?.candidates) ? (board as any).candidates : []),
    [board]
  );

  const projectedCandidates = useMemo(
    () => (Array.isArray(board?.projectedCandidates) ? board.projectedCandidates : []),
    [board]
  );

  const allProjectedCandidates = useMemo(
    () => {
      const direct = board?.allProjectedCandidates;
      const bucket = board?.candidateBuckets?.allProjected;
      if (Array.isArray(direct)) return direct;
      if (Array.isArray(bucket)) return bucket;
      return projectedCandidates;
    },
    [board, projectedCandidates]
  );

  const selectedProjectedCandidates =
    projectedPoolView === 'all' ? allProjectedCandidates : projectedCandidates;

  const previewMeta = board?.previewMeta;

  const boardMode = confirmedCandidates.length > 0
    ? 'confirmed'
    : selectedProjectedCandidates.length > 0
      ? 'preview'
      : 'empty';

  const games = useMemo(() => {
    const existingGames = Array.isArray((board as any)?.games) ? (board as any).games : [];
    const gamesHaveHrRows = existingGames.some((game: any) =>
      Array.isArray(game?.rows) ||
      Array.isArray(game?.hitters) ||
      Array.isArray(game?.candidates) ||
      Array.isArray(game?.players)
    );

    // In confirmed mode, use backend game rows when available.
    // In preview mode, use the selected projected pool so Curated Preview / All Projected actually changes the board.
    if (existingGames.length && gamesHaveHrRows && boardMode !== 'preview') {
      return existingGames;
    }

    const candidates =
      confirmedCandidates.length ? confirmedCandidates :
      selectedProjectedCandidates.length ? selectedProjectedCandidates :
      Array.isArray((board as any)?.rows) ? (board as any).rows :
      Array.isArray((board as any)?.players) ? (board as any).players :
      Array.isArray((board as any)?.targets) ? (board as any).targets :
      [];

    if (!candidates.length) return [];

    const grouped = new Map<string, any[]>();

    candidates.forEach((candidate: any, index: number) => {
      const team = candidate.teamAbbr ?? candidate.team ?? candidate.teamName ?? 'UNK';
      const opponent = candidate.opponentAbbr ?? candidate.opponent ?? candidate.vs ?? '';
      const gameKey = candidate.gamePk ?? candidate.gameId ?? `${team}${opponent ? ` vs ${opponent}` : ''}`;
      const recentForm = candidate.recentForm ?? null;
      const scoreBreakdown = candidate.scoreBreakdown ?? null;
      const recentPowerScore =
        firstFiniteNumber(recentForm?.recentPowerScore, scoreBreakdown?.recentForm) ?? null;
      const hrScore = firstFiniteNumber(candidate.hrScore, candidate.hrEdge, candidate.score, candidate.vouchScore) ?? 0;
      const finalScore = firstFiniteNumber(scoreBreakdown?.finalScore, hrScore) ?? 0;
      const pitcherVulnerability = firstFiniteNumber(
        scoreBreakdown?.pitcherVulnerability,
        candidate.pitcherVulnerability,
        candidate.pitcherVuln,
        candidate.pitcherScore,
        ((candidate.reasons ?? []).join(" ").match(/HR\/9 = ([\d.]+)/)?.[1] ?? undefined)
      ) ?? 0;
      const parkFactor = firstFiniteNumber(scoreBreakdown?.parkFactor, candidate.parkFactor, candidate.park);
      const lineupStatus = candidate.lineupStatus ?? (boardMode === 'preview' ? 'projected_unconfirmed' : 'projected');
      const projectionType =
        candidate.projectionType ??
        (lineupStatus === 'projected_unconfirmed'
          ? 'Projection Preview'
          : lineupStatus === 'confirmed'
            ? 'Confirmed'
            : lineupStatus === 'projected'
              ? 'Projected'
              : 'Projected');

      const row = {
        id: candidate.id ?? candidate.playerId ?? `${candidate.playerName ?? candidate.name ?? 'player'}-${index}`,
        playerId: candidate.playerId ?? candidate.id ?? index,
        gamePk: candidate.gamePk ?? candidate.gameId ?? gameKey,
        rank: index + 1,
        playerName: candidate.playerName ?? candidate.name ?? candidate.fullName ?? 'Unknown Player',
        team,
        opponent,
        position: candidate.position ?? candidate.primaryPosition ?? '',
        grade: candidate.grade ?? candidate.tier ?? 'B',
        riskLabel: candidate.riskLabel ?? candidate.riskTier ?? candidate.risk ?? 'Standard',
        formTag: recentPowerScore !== null
          ? formTagFromRecentPowerScore(recentPowerScore)
          : candidate.formTag ?? candidate.form ?? 'Average',
        projectionType:
          projectionType,
        lineupStatus,
        battingOrder: candidate.battingOrder ?? candidate.lineupSpot ?? null,
        hrEdge: hrScore,
        vouchScore: finalScore,
        pitcherVulnerability,
        dataConfidence: firstFiniteNumber(candidate.dataConfidence, candidate.confidence) ?? 50,
        weatherBoost:
          candidate.weatherBoost !== undefined && candidate.weatherBoost !== null
            ? Number(candidate.weatherBoost)
            : candidate.parkWeatherBoost !== undefined && candidate.parkWeatherBoost !== null
              ? Number(candidate.parkWeatherBoost)
              : null,
        weatherSource: candidate.weatherSource ?? "unavailable",
        lineupSpot:
          candidate.battingOrder !== undefined && candidate.battingOrder !== null
            ? Number(candidate.battingOrder)
            : candidate.lineupSpot !== undefined && candidate.lineupSpot !== null
              ? Number(candidate.lineupSpot)
              : candidate.projectedLineupSpot !== undefined && candidate.projectedLineupSpot !== null
                ? Number(candidate.projectedLineupSpot)
                : null,
        bestOdds: String(candidate.bestOdds ?? candidate.odds ?? candidate.hrOdds ?? 'N/A'),
        pitcherName: candidate.opponentPitcherName ?? candidate.pitcherName ?? candidate.opponentPitcher ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        opponentPitcher: candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        opponentPitcherName: candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        oppPitcher: candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        opposingPitcher: candidate.opponentPitcherName ?? candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        pitcherTeam: candidate.opponent ?? candidate.pitcherTeam ?? '',
        pTeam: candidate.opponent ?? candidate.pitcherTeam ?? '',
        opposingPitcherTeam: candidate.opponent ?? candidate.pitcherTeam ?? 'TBD',
        pitcherHand: candidate.pitcherHand ?? candidate.pitcherThrows ?? '',
        venue: candidate.venue ?? candidate.ballpark ?? candidate.parkName ?? 'Unknown venue',
        parkFactor: parkFactor ?? 'N/A',
        hrMultiplier: candidate.hrMultiplier ?? candidate.hrMult ?? candidate.multiplier ?? 'N/A',
        gameStatus: candidate.status ?? candidate.gameStatus ?? candidate.lineupStatus ?? (boardMode === 'preview' ? 'projected_unconfirmed' : 'projected'),
        lineMovement:
          candidate.lineMovement !== undefined && candidate.lineMovement !== null
            ? Number(candidate.lineMovement)
            : candidate.movePct !== undefined && candidate.movePct !== null
              ? Number(candidate.movePct)
              : candidate.movement !== undefined && candidate.movement !== null
                ? Number(candidate.movement)
                : null,
        bats: candidate.bats ?? candidate.batSide ?? '',
        reason: candidate.reason ?? candidate.summary ?? candidate.explanation ?? (Array.isArray(candidate.reasons) ? candidate.reasons.join(' • ') : ''),
        tags: Array.isArray(candidate.tags) ? candidate.tags : [candidate.riskTier, candidate.lineupStatus, candidate.injuryStatus].filter(Boolean),
        reasons: Array.isArray(candidate.reasons) ? candidate.reasons : [],
        warnings: Array.isArray(candidate.warnings) ? candidate.warnings : [],
        recentForm,
        scoreBreakdown,
        injuryStatus: candidate.injuryStatus ?? 'unknown',
        headshot: candidate.headshot ?? candidate.imageUrl ?? candidate.playerImage ?? (candidate.playerId ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_80,q_auto:best/v1/people/${candidate.playerId}/headshot/67/current` : ''),
        raw: candidate,
      } as any;

      if (!grouped.has(String(gameKey))) grouped.set(String(gameKey), []);
      grouped.get(String(gameKey))!.push(row);
    });

    return Array.from(grouped.entries()).map(([gameId, rows]) => {
      const firstRow = rows[0] ?? {};
      const team = firstRow.team ?? '';
      const opponent = firstRow.opponent ?? firstRow.pTeam ?? firstRow.pitcherTeam ?? '';
      const matchupLabel = team && opponent ? `${team} vs ${opponent}` : String(gameId);

      return {
        id: gameId,
        gameId,
        matchup: matchupLabel,
        label: matchupLabel,
        rows,
      };
    }) as any[];
  }, [board, boardMode, confirmedCandidates, projectedCandidates]);

  const teams = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      const rows = Array.isArray(g.rows) ? g.rows : [];
      rows.forEach((r) => {
        if (r?.team) set.add(r.team);
      });
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [games]);

  const update = (next: Partial<HrBoardFilterState>) => setFilters((f) => ({ ...f, ...next }));

  const filteredGames = useMemo(() => {
    if (!board) return [];
    const isVercelSafePartial =
      (board as any)?.dataQuality === 'vercel_safe_partial' ||
      (board as any)?.runtime === 'vercel_standalone_no_server_imports';

    const q = filters.search.trim().toLowerCase();
    return games
      .map((g) => {
        const rows = (Array.isArray(g.rows) ? g.rows : []).filter((r) => {
          if (filters.team !== 'ALL' && r.team !== filters.team) return false;
          if (filters.grade !== 'ALL' && r.grade !== filters.grade) return false;
          if (filters.risk !== 'ALL' && r.riskLabel !== filters.risk) return false;
          if (!isVercelSafePartial && filters.hotOnly && r.formTag !== 'Hot') return false;
          if (!isVercelSafePartial && filters.sneakyOnly && r.riskLabel !== 'Sneaky') return false;
          if (!isVercelSafePartial && filters.confirmedOnly && r.projectionType !== 'Confirmed') return false;
          if (r.pitcherVulnerability < filters.minPitcherVuln) return false;
          if (q && !(r.playerName ?? '').toLowerCase().includes(q)) return false;
          return true;
        });
        return { ...g, rows: sortRows(rows, filters.sortKey) };
      })
      .filter((g) => g.rows.length > 0);
  }, [board, games, filters]);

  const totalRows = filteredGames.reduce((s, g) => s + g.rows.length, 0);

  const truthCounts = (board as any)?.counts ?? {};
  const truthSummary = (board as any)?.truthSummary ?? {};
  const candidateBuckets = (board as any)?.candidateBuckets ?? {};

  const confirmedCount =
    Number(truthCounts.confirmedCandidates ?? confirmedCandidates.length ?? 0);

  const projectedCount =
    Number(truthCounts.projectedCandidates ?? projectedCandidates.length ?? 0);

  const allProjectedCount = allProjectedCandidates.length;

  const hiddenProjectedCount =
    Number(
      truthCounts.hiddenProjectedCandidates ??
      Math.max(
        0,
        Number(previewMeta?.eligiblePreviewPoolCount ?? 0) -
          Number(previewMeta?.projectedPreviewCount ?? previewMeta?.scoredPreviewPoolCount ?? 0)
      )
    );

  const blockedCount =
    Number(truthCounts.blockedPlayers ?? candidateBuckets?.blocked?.length ?? 0);

  const totalTruthPool =
    Number(truthCounts.totalTruthPool ?? confirmedCount + projectedCount + hiddenProjectedCount + blockedCount);

  const totalVisiblePool =
    Number(truthCounts.totalVisiblePool ?? confirmedCount + projectedCount);

  const displayedPreviewCount = projectedCount;
  const totalPreviewPool =
    previewMeta?.eligiblePreviewPoolCount ??
    truthCounts.eligiblePreviewPoolCount ??
    previewMeta?.scoredPreviewPoolCount ??
    displayedPreviewCount;

  const truthMode = String(truthSummary.mode ?? boardMode ?? 'loading');
  const truthMessage = String(truthSummary.message ?? (board as any)?.note ?? '');

  const boardSummary = board
    ? `${board.date} · ${board.gameCount} games · ${confirmedCount} confirmed · ${projectedCount} projected · ${hiddenProjectedCount} hidden preview · ${blockedCount} blocked/waiting · ${totalTruthPool} truth pool · data: ${truthMode}`
    : 'Loading today’s slate…';

  // Star Watch source — resilient to where the engine puts it (dev emits it under
  // debug.missingStarChecks; alternate builds may surface it top-level).
  const missingStarChecks = (() => {
    const b = board as any;
    const candidates = [b?.debug?.missingStarChecks, b?.missingStarChecks, b?.starWatch, b?.debug?.starWatch];
    for (const c of candidates) if (Array.isArray(c) && c.length) return c;
    return [];
  })();

  const getStarWatchBadgeClass = (status: string) => {
    switch (status) {
      case 'included':
        return 'bg-emerald-500/15 text-emerald-300';
      case 'preview':
        return 'bg-[hsl(var(--ve-accent-cyan)/0.15)] text-[hsl(var(--ve-accent-cyan))]';
      case 'waiting':
        return 'bg-yellow-500/15 text-yellow-300';
      case 'blocked':
        return 'bg-[hsl(var(--ve-accent-gold)/0.15)] text-[hsl(var(--ve-accent-gold))]';
      default:
        return 'bg-red-500/15 text-red-300';
    }
  };

  const getStarWatchLabel = (star: any) => {
    if (typeof star?.label === 'string' && star.label.trim()) return star.label;

    switch (star?.status) {
      case 'included':
        return 'CONFIRMED';
      case 'preview':
        return 'PREVIEW';
      case 'waiting':
        return 'WAITING';
      case 'blocked':
        return 'BLOCKED';
      default:
        return 'EXCLUDED';
    }
  };

  const getStarWatchReason = (star: any) => {
    if (star?.reason === 'Team mismatch / stale roster assignment') {
      return 'Roster verification conflict';
    }

    return star?.reason ?? '';
  };

  const getStarWatchNote = (star: any) => {
    if (star?.reason === 'Team mismatch / stale roster assignment') {
      return 'MLB active roster and trusted team registry disagree. Hidden for safety until confirmed.';
    }

    return star?.note ?? '';
  };

  return (
    <div className="daily-hr-board ve-page-shell mx-auto max-w-[1320px] px-3 py-4 sm:px-4 lg:py-5">
      {/* Header */}
      <div className="ve-premium-panel mb-3 overflow-hidden rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="ve-chip ve-chip-primary px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]">
                <Flame className="h-3.5 w-3.5 text-[hsl(var(--ve-accent-gold))]" /> HR Research
              </span>
              <span className="ve-chip px-2.5 py-1">
                {boardMode === 'preview' ? 'Preview Mode' : boardMode === 'confirmed' ? 'Confirmed Slate' : 'Slate Loading'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Daily HR Edge Board</h1>
            <p className="mt-1.5 max-w-5xl text-xs leading-5 text-[hsl(var(--ve-text-muted))]">
              {boardSummary}
              {lastUpdated && <span className="text-[hsl(var(--ve-text-muted)/0.76)]"> · updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
            </p>
          </div>
          <button onClick={() => void refresh()} className="ve-btn-secondary px-3.5 py-2.5 text-xs uppercase tracking-wide hover:border-[hsl(var(--ve-accent-cyan)/0.44)] hover:text-[hsl(var(--ve-accent-cyan))]">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-3 flex items-start gap-2 rounded-xl border border-[hsl(var(--ve-accent-gold)/0.18)] bg-[hsl(var(--ve-accent-gold)/0.06)] p-2.5">
        <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--ve-accent-gold))] mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-[hsl(var(--ve-text-muted))] leading-relaxed">
          {board?.disclaimer ?? 'HR edge estimates are probability-based research for entertainment — not betting advice. Lineups, park, and weather are projected placeholders.'}
        </p>
      </div>

      {boardMode === 'preview' && allProjectedCount > projectedCandidates.length && (
        <div className="mb-4 flex rounded-2xl border border-[hsl(var(--ve-border)/0.38)] bg-[hsl(var(--ve-surface-raised)/0.28)] p-1">
          {([
            ['curated', `Curated Preview (${projectedCandidates.length})`],
            ['all', `All Projected (${allProjectedCount})`],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setProjectedPoolView(mode)}
              className={`flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wide transition ${
                projectedPoolView === mode
                  ? 'bg-[hsl(var(--ve-accent-cyan)/0.16)] text-[hsl(var(--ve-accent-cyan))] shadow-[0_0_24px_hsl(var(--ve-accent-cyan)/0.12)]'
                  : 'text-[hsl(var(--ve-text-muted))] hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* HR Watch truth contract */}
      {board && (
        <div className="mb-4 rounded-2xl border border-[hsl(var(--ve-border)/0.42)] bg-[hsl(var(--ve-surface-raised)/0.34)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-300">
              {confirmedCount} Confirmed
            </span>
            <span className="rounded-full border border-[hsl(var(--ve-accent-cyan)/0.28)] bg-[hsl(var(--ve-accent-cyan)/0.1)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[hsl(var(--ve-accent-cyan))]">
              {projectedCount} Projected
            </span>
            {hiddenProjectedCount > 0 && (
              <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-300">
                {hiddenProjectedCount} Hidden Preview
              </span>
            )}
            <span className="rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-yellow-300">
              {blockedCount} Blocked/Waiting
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
              {totalVisiblePool}/{totalTruthPool} Visible Truth Pool
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            {truthMessage || 'HR Watch separates confirmed, projected, and blocked rows so partial MLB data never looks complete.'}
          </p>
        </div>
      )}

      {boardMode === 'preview' && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-[hsl(var(--ve-accent-gold)/0.26)] bg-[hsl(var(--ve-accent-gold)/0.08)] p-3">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--ve-accent-gold))] mt-0.5 flex-shrink-0" />
          <div className="text-[11px] leading-relaxed text-[hsl(var(--ve-accent-gold))]">
            <div className="font-bold">Projected HR Board · official lineups not confirmed yet.</div>
            <div>These rows are active-roster and current-team verified, but they are not confirmed starters. Do not treat them as confirmed HR candidates.</div>
            {typeof previewMeta?.eligiblePreviewPoolCount === 'number' && (
              <div className="mt-1 text-[hsl(var(--ve-accent-gold)/0.86)]">
                Showing Top {previewMeta.projectedPreviewCount} of {previewMeta.eligiblePreviewPoolCount} MLB-verified preview hitters.
              </div>
            )}
          </div>
        </div>
      )}

      {missingStarChecks.length > 0 && (
        <section className="ve-premium-panel mb-3 rounded-2xl p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
            <h2 className="text-sm font-black text-[hsl(var(--ve-text-primary))]">Star Watch</h2>
            <p className="text-xs text-[hsl(var(--ve-text-muted))]">
              Why major HR names are confirmed, in preview, waiting, blocked, or excluded today.
            </p>
            </div>
            <span className="ve-chip px-2.5 py-1 uppercase tracking-wide">
              {missingStarChecks.length} tracked
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {missingStarChecks.map((star: any) => (
              <div key={star.playerName} className="ve-surface-card rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-white">{star.playerName}</div>
                    <div className="text-[11px] text-[hsl(var(--ve-text-muted))]">{star.expectedTeam}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${getStarWatchBadgeClass(star.status)}`}>
                    {getStarWatchLabel(star)}
                  </span>
                </div>

                <div className="mt-2 text-xs text-[hsl(var(--ve-text-secondary))]">{getStarWatchReason(star)}</div>
                {getStarWatchNote(star) && <div className="mt-1 text-[11px] text-[hsl(var(--ve-text-muted))]">{getStarWatchNote(star)}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-3 flex w-fit items-center gap-1 rounded-xl border border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface-raised)/0.44)] p-1 text-[11px] font-bold">
        {(['tier', 'game'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`rounded-lg px-3 py-1 transition-all ${view === v ? 'bg-[hsl(var(--ve-accent-cyan)/0.16)] text-[hsl(var(--ve-accent-cyan))]' : 'text-[hsl(var(--ve-text-muted))] hover:text-[hsl(var(--ve-text-secondary))]'}`}>
            {v === 'tier' ? 'By Tier' : 'By Game'}
          </button>
        ))}
      </div>

      <HrBoardFilters date={date} onDateChange={setDate} teams={teams} filters={filters} onChange={update} />

      {error && <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center text-sm text-red-300">{error}</div>}

      {loading && !board && (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.42)] border border-[hsl(var(--ve-border)/0.28)] animate-pulse" />)}</div>
      )}

      {board && !error && (
        filteredGames.length === 0 ? (
          <div className="p-10 text-center text-sm text-[hsl(var(--ve-text-muted))] font-mono rounded-2xl bg-[hsl(var(--ve-surface-raised)/0.32)] border border-[hsl(var(--ve-border)/0.28)]">
            No hitters match these filters.
          </div>
        ) : view === 'tier' ? (
          <HrTierView games={filteredGames} onSelect={setSelected} onAddLeg={onAddLegToParlay} />
        ) : (
          filteredGames.map((g) => <HrBoardTable key={g.gamePk} game={g} onSelect={setSelected} />)
        )
      )}

      <HrPlayerDrawer row={selected} onClose={() => setSelected(null)} isProUser={profile ? hasTierAccess(profile, 'GOLD') : false} />
    </div>
  );
}
