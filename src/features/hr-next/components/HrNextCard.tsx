import React from 'react';
import { Plus, Star, TrendingUp } from 'lucide-react';
import { AuroraMaxPanel } from '../../../components/aurora-max/AuroraMaxPrimitives';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { extractCardData } from '../utils/cardUtils';
import { HrNextReceiptTray } from './HrNextReceiptTray';

export interface HrNextCardProps {
  row: HrWatchRow;
  active: boolean;
  saved: boolean;
  isReceiptOpen: boolean;
  compact?: boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt?: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}

export const HrNextCard = React.memo(function HrNextCard({
  row,
  active,
  saved,
  isReceiptOpen,
  compact,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
  onAddToSlip,
}: HrNextCardProps) {
  const teamLogo = logoByTeamName(row.team);
  
  const {
    matchupLabel,
    catalyst,
    pips,
    lineupLabel,
    confirmed,
    score,
    evEdge,
    bookOddsLabel,
    recentHrs,
    receipt,
  } = extractCardData(row);

  const lineupText = confirmed ? 'Confirmed' : lineupLabel;

  const onTicketActivate = () => {
    onSelect(row.stableId);
    onToggleReceipt?.(row.stableId);
  };

  return (
    <div
      className={`hr-max-ticket group transition-colors duration-150 w-full rounded-lg ${
        active
          ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.15)] ring-1 ring-[var(--aurora-max-emerald)]/50 shadow-[0_0_15px_rgba(0,217,160,0.1)]'
          : 'bg-[#0a1010] border border-white/5 hover:border-[var(--aurora-max-emerald)]/40 hover:bg-[#0f1818]'
      }`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 88px',
      }}
    >
      <div className="flex min-h-[78px] items-center gap-2.5 px-2.5 py-2">
        <button
          type="button"
          onClick={onTicketActivate}
          aria-expanded={Boolean(onToggleReceipt) && isReceiptOpen}
          aria-label={
            onToggleReceipt
              ? `${isReceiptOpen ? 'Hide' : 'Open'} receipt for ${row.playerName}`
              : `Select ${row.playerName}`
          }
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          {/* Headshot with Status Halo */}
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-inner"
            style={{ width: 40, height: 40, aspectRatio: '1 / 1' }}
          >
            <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={40} />
            {confirmed && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--aurora-max-emerald)] border border-black shadow" title="Confirmed Lineup" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Top row: Name + Catalyst */}
            <div className="flex min-w-0 items-baseline gap-2">
              <h4
                className={`font-mono text-xs font-bold leading-tight truncate max-w-[130px] sm:max-w-[160px] ${
                  active ? 'text-[var(--aurora-max-emerald)]' : 'text-white'
                }`}
              >
                {row.playerName}
              </h4>
              <p className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold leading-tight text-white/80">
                <TrendingUp className="mr-0.5 inline h-3 w-3 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
                {catalyst}
              </p>
            </div>

            {/* Middle row: Matchup line, pips, lineup */}
            <div className="mt-1 flex min-w-0 items-center gap-1.5 font-mono text-[9px]">
              {teamLogo ? (
                <img src={teamLogo} alt="" width={12} height={12} className="h-3 w-3 shrink-0 object-contain" />
              ) : null}
              <span className="min-w-0 truncate text-white/50">
                {matchupLabel}
              </span>
              <span className="flex shrink-0 items-center gap-1" aria-label="Power, pitcher, and park layers">
                {pips.map((pip) => (
                  <span
                    key={pip.key}
                    className={`hr-max-pip hr-max-pip--${pip.tone}`}
                    title={pip.label}
                    aria-label={pip.label}
                  />
                ))}
              </span>
              <span className="shrink-0 truncate font-bold uppercase tracking-[0.08em] text-white/40">
                {lineupText}
              </span>
            </div>

            {/* Bottom Row: Mini Metrics & EV / Odds */}
            <div className="mt-1.5 flex items-center gap-2 font-mono text-[9px]">
              {bookOddsLabel && (
                <span className="px-1 py-0.2 rounded bg-white/5 border border-white/10 text-white/70 font-bold tabular-nums">
                  {bookOddsLabel}
                </span>
              )}
              {evEdge != null && (
                <span className={`font-bold tabular-nums ${evEdge > 0 ? 'text-[var(--aurora-max-emerald)]' : 'text-white/40'}`}>
                  {evEdge > 0 ? `+${evEdge}% EV` : `${evEdge}% EV`}
                </span>
              )}
              {recentHrs != null && recentHrs > 0 && (
                <span className="text-amber-300/80 font-bold tabular-nums flex items-center gap-0.5">
                  🔥 {recentHrs} HR
                </span>
              )}
            </div>
          </div>

          {/* HRPI Score Display */}
          <div className="flex shrink-0 flex-col items-end leading-none">
            <span className="font-mono text-base font-black tabular-nums text-[var(--aurora-max-emerald)] drop-shadow-[0_0_8px_rgba(0,217,160,0.3)]">
              {score}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
              HRPI
            </span>
          </div>
        </button>

        {/* Card Actions (Save & Slip) */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleSaved(row.stableId)}
            aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
            className={`grid h-8 w-8 place-items-center border transition ${
              saved
                ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
                : 'border-white/10 text-white/40 hover:text-white'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onAddToSlip(row)}
            title="Add to parlay slip"
            className="inline-flex h-8 items-center gap-1 border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2 font-mono text-[9px] font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/25"
          >
            <Plus className="h-3 w-3" /> Slip
          </button>
        </div>
      </div>

      {/* Expandable Receipt Tray */}
      <div 
        className={`grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isReceiptOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.08] px-2 pb-2 pt-2 bg-black/40">
            <HrNextReceiptTray 
              playerName={row.playerName}
              receipt={receipt}
              onClose={() => onToggleReceipt?.(row.stableId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
