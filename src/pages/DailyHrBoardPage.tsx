import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flame, RefreshCw, AlertTriangle } from 'lucide-react';
import type { HrBoardResponse, HrBoardRow } from '../types/hrBoard';
import HrBoardFilters from '../components/hr-board/HrBoardFilters';
import HrGameTierBoard from '../components/hr-board/HrGameTierBoard';
import HrTierView from '../components/hr-board/HrTierView';
import HrPlayerDrawer from '../components/hr-board/HrPlayerDrawer';
import type { CreatorProofProfile, MLBPlayer } from '../types';
import { hasTierAccess } from '../components/pro/ProAccessGate';
import { bootDataStore } from '../lib/boot/bootDataStore';
import { useDailyHrBoard } from '../hooks/useDailyHrBoard';
import { useHrBoardFilters } from '../hooks/useHrBoardFilters';
import { useHrBoardSelection } from '../hooks/useHrBoardSelection';
import { useHrBoardViewModel } from '../hooks/useHrBoardViewModel';


function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstFiniteNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function formTagFromRecentPowerScore(score: number | null): HrBoardRow["formTag"] {
  if (score == null) return "Cold";
  if (score >= 70) return "Hot";
  if (score <= 35) return "Cold";
  return "Cold";
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
  const { selected, setSelected, clearSelected } = useHrBoardSelection();
  const { data: board, loading, error, lastUpdated, refresh } = useDailyHrBoard(date);

  const {
    previewMeta,
    boardMode,
    confirmedCandidates,
    projectedCandidates,
    allProjectedCandidates,
    selectedProjectedCandidates,
    games,
    teams,
    isVercelSafePartial,
    truthCounts,
    truthSummary,
    candidateBuckets,
    confirmedCount,
    projectedCount,
    allProjectedCount,
    hiddenProjectedCount,
    blockedCount,
    totalTruthPool,
    totalVisiblePool,
    displayedPreviewCount,
    totalPreviewPool,
  } = useHrBoardViewModel(board, projectedPoolView);

  const { filters, update, filteredRows: filteredGames } = useHrBoardFilters(games, isVercelSafePartial);
  const totalRows = filteredGames.reduce((sum, game) => sum + game.rows.length, 0);

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
          filteredGames.map((g) => (
            <HrGameTierBoard key={g.gamePk} game={g} onSelect={setSelected} onAddLeg={onAddLegToParlay} />
          ))
        )
      )}

      <HrPlayerDrawer row={selected} onClose={clearSelected} isProUser={profile ? hasTierAccess(profile, 'GOLD') : false} />
    </div>
  );
}
