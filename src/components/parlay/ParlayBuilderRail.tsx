import React, { useMemo } from 'react';
import { Share2 } from 'lucide-react';
import type { Leg } from '../../types';
import { assessSlipOdds } from '../../lib/parlays/slipOddsPolicy';
import { SmartParlayLegCardFromLeg } from './smart/SmartParlayLegCard';

export interface ParlayBuilderRailProps {
  legs: Leg[];
  onRemoveLeg: (legId: string) => void;
  onSaveParlay?: () => void;
  onShareParlay?: () => void;
  shareLabel?: string;
  shareDisabled?: boolean;
  isSharing?: boolean;
  totalOdds?: string;
  stake: number;
  onStakeChange: (stake: number) => void;
  potentialPayout?: number | null;
  saveLabel?: string;
  isSaving?: boolean;
  saveDisabled?: boolean;
  title?: string;
  subtitle?: string;
  showLiveIndicator?: boolean;
  legContent?: React.ReactNode;
  footerExtra?: React.ReactNode;
  className?: string;
  /** Live stat progress keyed by leg id */
  liveProgressByLegId?: Record<string, { current: number; target: number; label: string }>;
  /** inline = flows in parent column; fixed = xl+ right rail only; sheet = mobile bottom sheet body */
  layout?: 'inline' | 'fixed' | 'sheet';
}

function EmptySlip() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-fuse rounded-xl">
      <p className="text-sm font-mono font-bold text-flash opacity-70 uppercase tracking-wider">Slip Empty</p>
      <p className="mt-2 text-[10px] font-mono text-flash opacity-40 max-w-[220px] leading-relaxed">
        Add legs from the builder or AI picks — nothing is pre-filled.
      </p>
    </div>
  );
}

export default function ParlayBuilderRail({
  legs,
  onRemoveLeg,
  onSaveParlay,
  onShareParlay,
  shareLabel = 'Lock to Ledger',
  shareDisabled = false,
  isSharing = false,
  totalOdds = '—',
  stake,
  onStakeChange,
  potentialPayout = null,
  saveLabel = 'Lock Slate',
  isSaving = false,
  saveDisabled = false,
  title = 'Active Slate',
  subtitle,
  showLiveIndicator = false,
  legContent,
  footerExtra,
  className = '',
  layout = 'inline',
  liveProgressByLegId,
}: ParlayBuilderRailProps) {
  const oddsAssessment = useMemo(
    () => assessSlipOdds(legs.map((leg) => ({
      odds: leg.odds,
      oddsSource: leg.oddsSource,
    }))),
    [legs],
  );
  const displayTotalOdds = oddsAssessment.canShowCombined
    ? (totalOdds !== '—' ? totalOdds : oddsAssessment.combined?.american ?? '—')
    : 'TBD';
  const displayPayout = oddsAssessment.canShowPayout ? potentialPayout : null;

  const legCountLabel = legs.length === 0
    ? 'No legs queued'
    : `${legs.length} ${legs.length === 1 ? 'Edge' : 'Edges'} Queued`;

  const shellClass = layout === 'fixed'
    ? 'hidden xl:flex fixed right-0 top-16 bottom-0 w-80 bg-[var(--bg-obsidian)]/95 backdrop-blur-xl border-l border-fuse z-40 flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]'
    : layout === 'sheet'
      ? 'flex max-h-[70vh] flex-col overflow-hidden bg-[var(--bg-obsidian)]'
      : 'flex flex-col rounded-2xl border border-fuse bg-[var(--bg-graphite)]/50 overflow-hidden';

  return (
    <aside className={`${shellClass} ${className}`} aria-label="Parlay builder slip">
      <div className="p-5 border-b border-fuse bg-graphite/50 shrink-0">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-flash font-mono text-sm uppercase tracking-widest font-bold">{title}</h2>
          {showLiveIndicator && legs.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-voltage lighting-pulse" />
              <span className="text-[10px] font-mono text-voltage tracking-widest uppercase">Live</span>
            </div>
          ) : null}
        </div>
        <p className="text-[10px] font-mono text-flash opacity-50 uppercase tracking-wider">
          {subtitle ?? legCountLabel}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
        {legContent ?? (
          legs.length === 0 ? (
            <EmptySlip />
          ) : (
            legs.map((leg, index) => (
              <SmartParlayLegCardFromLeg
                key={leg.id}
                leg={{
                  ...leg,
                  actual: liveProgressByLegId?.[leg.id]?.current ?? leg.actual,
                  statTarget: liveProgressByLegId?.[leg.id]?.target ?? leg.statTarget,
                }}
                index={index}
                liveProgress={liveProgressByLegId?.[leg.id]}
                onRemove={() => onRemoveLeg(leg.id)}
                compact={layout === 'sheet'}
              />
            ))
          )
        )}
      </div>

      <div className="p-5 border-t border-fuse bg-graphite shrink-0">
        {oddsAssessment.blockReason ? (
          <p className="mb-3 text-[10px] font-mono text-amber-200/80 leading-snug">{oddsAssessment.blockReason}</p>
        ) : null}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-mono text-flash opacity-60 uppercase tracking-widest">Total Odds</span>
          <span className="text-xl font-bold font-mono text-voltage">{displayTotalOdds}</span>
        </div>

        <div className="relative flex items-center mb-6 border border-fuse bg-[var(--bg-obsidian)] focus-within:border-ion transition-colors">
          <span className="absolute left-3 text-flash opacity-50 font-mono">$</span>
          <input
            type="number"
            min={1}
            max={10000}
            value={stake}
            onChange={(e) => onStakeChange(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Stake amount in dollars"
            className="w-full bg-transparent border-none text-flash font-mono text-right p-3 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-mono text-flash opacity-50 uppercase tracking-widest">To Win</span>
          <span className="text-lg font-bold font-mono text-flash">
            {displayPayout != null ? `$${displayPayout.toFixed(2)}` : oddsAssessment.hasTbdLegs || oddsAssessment.hasEstimatedLegs ? '—' : '—'}
          </span>
        </div>

        {footerExtra}

        {onShareParlay ? (
          <button
            type="button"
            onClick={onShareParlay}
            disabled={shareDisabled || isSharing || legs.length === 0}
            className="relative mb-3 w-full border border-vouch-emerald/40 bg-vouch-emerald/10 py-3.5 group overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed min-h-[2.75rem] rounded-sm"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm font-mono font-bold text-vouch-emerald uppercase tracking-widest">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {isSharing ? 'Locking in…' : shareLabel}
            </span>
          </button>
        ) : null}

        {onSaveParlay ? (
          <button
            type="button"
            onClick={onSaveParlay}
            disabled={saveDisabled || isSaving || legs.length === 0}
            className="relative w-full plasma-shimmer bg-ion/10 border border-ion py-4 group overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed min-h-[2.75rem]"
          >
            <div className="absolute inset-0 bg-ion opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-200" />
            <span className="relative z-10 text-sm font-mono font-bold text-ion group-hover:text-[var(--bg-obsidian)] uppercase tracking-widest transition-colors duration-200">
              {isSaving ? 'Saving…' : saveLabel}
            </span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
