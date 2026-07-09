import React from 'react';
import type { Leg } from '../../types';
import { americanLabel } from '../../lib/odds';

export interface ParlayBuilderRailProps {
  legs: Leg[];
  onRemoveLeg: (legId: string) => void;
  onSaveParlay?: () => void;
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
  formatLegOdds?: (leg: Leg) => string;
  legContent?: React.ReactNode;
  footerExtra?: React.ReactNode;
  className?: string;
  /** inline = flows in parent column; fixed = xl+ right rail only */
  layout?: 'inline' | 'fixed';
}

function defaultFormatLegOdds(leg: Leg): string {
  if (leg.odds == null) return 'TBD';
  return americanLabel(leg.odds);
}

function RailLegCard({
  leg,
  oddsLabel,
  onRemove,
}: {
  leg: Leg;
  oddsLabel: string;
  onRemove: () => void;
}) {
  const marketLabel = leg.market || 'Prop';
  const subtitle = leg.game?.replace(/\s*Live Target$/i, '') || '';

  return (
    <div className="relative glass-command p-4 group transition-transform duration-150 hover:-translate-y-0.5">
      <div className="absolute inset-0 border border-charged opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-mono text-ion uppercase tracking-widest">{marketLabel}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${leg.selection}`}
          className="text-flash opacity-30 hover:opacity-100 hover:text-locked transition-colors min-h-[2.75rem] min-w-[2.75rem] -mr-2 -mt-1 flex items-center justify-center"
        >
          ✕
        </button>
      </div>
      <div className="flex justify-between items-end gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold font-mono text-flash group-hover:text-ion transition-colors duration-150 truncate">
            {leg.selection}
          </div>
          {subtitle ? (
            <div className="text-[10px] font-mono text-flash opacity-50 truncate">{subtitle}</div>
          ) : null}
        </div>
        <div className={`text-sm font-bold font-mono shrink-0 ${leg.odds != null && leg.odds > 0 ? 'text-voltage' : 'text-flash'}`}>
          {oddsLabel}
        </div>
      </div>
    </div>
  );
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
  formatLegOdds = defaultFormatLegOdds,
  legContent,
  footerExtra,
  className = '',
  layout = 'inline',
}: ParlayBuilderRailProps) {
  const legCountLabel = legs.length === 0
    ? 'No legs queued'
    : `${legs.length} ${legs.length === 1 ? 'Edge' : 'Edges'} Queued`;

  const shellClass = layout === 'fixed'
    ? 'hidden xl:flex fixed right-0 top-16 bottom-0 w-80 bg-[var(--bg-obsidian)]/95 backdrop-blur-xl border-l border-fuse z-40 flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]'
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
            legs.map((leg) => (
              <RailLegCard
                key={leg.id}
                leg={leg}
                oddsLabel={formatLegOdds(leg)}
                onRemove={() => onRemoveLeg(leg.id)}
              />
            ))
          )
        )}
      </div>

      <div className="p-5 border-t border-fuse bg-graphite shrink-0">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-mono text-flash opacity-60 uppercase tracking-widest">Total Odds</span>
          <span className="text-xl font-bold font-mono text-voltage">{totalOdds}</span>
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
            {potentialPayout != null ? `$${potentialPayout.toFixed(2)}` : '—'}
          </span>
        </div>

        {footerExtra}

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
