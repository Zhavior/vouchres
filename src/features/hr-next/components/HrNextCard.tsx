import React from 'react';
import { Plus, Star, TrendingUp, Search, Sparkles } from 'lucide-react';
import { AuroraMaxPanel } from '../../../components/aurora-max/AuroraMaxPrimitives';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { extractCardData } from '../utils/cardUtils';
import { HrNextReceiptTray } from './HrNextReceiptTray';
import { useResearchStore } from '../../../stores/useResearchStore';

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
    hrStatus,
    receipt,
  } = extractCardData(row);

  const lineupText = confirmed ? 'Confirmed' : lineupLabel;
  const selectedPlayer = useResearchStore((s) => s.selectedPlayer);
  const isDrawerOpen = useResearchStore((s) => s.isDrawerOpen);
  const openDrawer = useResearchStore((s) => s.openDrawer);
  const closeDrawer = useResearchStore((s) => s.closeDrawer);

  const isResearched = isDrawerOpen && String(selectedPlayer?.id) === String(row.playerId || row.stableId);

  const handleToggleResearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isResearched) {
      closeDrawer();
    } else {
      openDrawer({ id: row.playerId || row.stableId, name: row.playerName });
    }
  };

  const onTicketActivate = () => {
    onSelect(row.stableId);
    onToggleReceipt?.(row.stableId);
  };

  // Determine card appearance: Bronze for 2+ HR, Yellow for 1 HR, Aurora Emerald for standard
  const isMultiHr = hrStatus.tier === 'multi';
  const isSingleHr = hrStatus.tier === 'single';

  let containerStyling = 'bg-[#0a1010] border border-white/5 hover:border-[var(--aurora-max-emerald)]/40 hover:bg-[#0f1818]';
  if (isMultiHr) {
    containerStyling = 'border-[#cd7f32] bg-gradient-to-r from-[#cd7f32]/25 via-[#18110b]/95 to-[#0a1010] shadow-[0_0_30px_rgba(205,127,50,0.35)] ring-1 ring-[#cd7f32]/70';
  } else if (isSingleHr) {
    containerStyling = 'border-amber-400 bg-gradient-to-r from-amber-500/20 via-[#18150a]/95 to-[#0a1010] shadow-[0_0_24px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/60';
  } else if (active) {
    containerStyling = 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.15)] ring-1 ring-[var(--aurora-max-emerald)]/50 shadow-[0_0_15px_rgba(0,217,160,0.1)]';
  }

  let headshotBorder = 'border-white/10 bg-black/40';
  if (isMultiHr) {
    headshotBorder = 'border-[#cd7f32] shadow-[0_0_12px_rgba(205,127,50,0.6)] bg-black/60';
  } else if (isSingleHr) {
    headshotBorder = 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] bg-black/60';
  }

  return (
    <div
      className={`hr-max-ticket group transition-all duration-200 w-full rounded-xl ${containerStyling}`}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 88px',
      }}
      data-testid={`hr-card-${row.stableId}`}
      data-hr-tier={hrStatus.tier}
    >
      <div className="flex min-h-[78px] items-center gap-2.5 px-3 py-2">
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
            className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full border shadow-inner ${headshotBorder}`}
            style={{ width: 40, height: 40, aspectRatio: '1 / 1' }}
          >
            <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={40} />
            {confirmed && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--aurora-max-emerald)] border border-black shadow" title="Confirmed Lineup" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Top row: Name + Badges + Catalyst */}
            <div className="flex min-w-0 items-center gap-2">
              <h4
                className={`font-mono text-xs font-bold leading-tight truncate max-w-[130px] sm:max-w-[160px] ${
                  isMultiHr 
                    ? 'text-[#fce4c8]' 
                    : isSingleHr 
                      ? 'text-amber-200' 
                      : active 
                        ? 'text-[var(--aurora-max-emerald)]' 
                        : 'text-white'
                }`}
              >
                {row.playerName}
              </h4>

              {/* Dynamic Live Today HR Badges */}
              {isMultiHr && (
                <span className="px-2 py-0.5 rounded-full bg-[#cd7f32]/30 text-[#f5c394] border border-[#cd7f32] font-black text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-[0_0_12px_rgba(205,127,50,0.5)] shrink-0">
                  👑 {hrStatus.badgeLabel}
                </span>
              )}

              {isSingleHr && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-300 border border-amber-400 font-black text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.4)] shrink-0">
                  💥 {hrStatus.badgeLabel}
                </span>
              )}

              {/* Recent HR Badge (matching HR Intelligence: player made HR recently) */}
              {!isMultiHr && !isSingleHr && recentHrs != null && recentHrs > 0 && (
                <span 
                  className="px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30 font-mono font-bold text-[9px] tracking-wider flex items-center gap-1 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.15)]"
                  title={`Hit ${recentHrs} HR${recentHrs > 1 ? 's' : ''} in last 7 days`}
                >
                  🔥 {recentHrs > 1 ? `${recentHrs}x HR` : 'HR'}
                </span>
              )}

              <p className="min-w-0 flex-1 truncate font-mono text-[10px] font-semibold leading-tight text-white/80">
                <TrendingUp className={`mr-0.5 inline h-3 w-3 ${isMultiHr ? 'text-[#cd7f32]' : isSingleHr ? 'text-amber-400' : 'text-[var(--aurora-max-emerald)]'}`} aria-hidden="true" />
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
              {recentHrs != null && recentHrs > 0 && !isMultiHr && !isSingleHr && (
                <span className="text-amber-300/90 font-bold tabular-nums flex items-center gap-0.5">
                  🔥 {recentHrs} HR in 7 Days
                </span>
              )}
            </div>
          </div>

          {/* HRPI Score Display */}
          <div className="flex shrink-0 flex-col items-end leading-none">
            <span className={`font-mono text-base font-black tabular-nums ${
              isMultiHr 
                ? 'text-[#f5c394] drop-shadow-[0_0_10px_rgba(205,127,50,0.5)]' 
                : isSingleHr 
                  ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                  : 'text-[var(--aurora-max-emerald)] drop-shadow-[0_0_8px_rgba(0,217,160,0.3)]'
            }`}>
              {score}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
              HRPI
            </span>
          </div>
        </button>

        {/* Card Actions (Save & Slip & Research) */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleToggleResearch}
            title={isResearched ? "Close Research" : "Open Deep Research"}
            aria-label={`${isResearched ? 'Close' : 'Open'} Research for ${row.playerName}`}
            className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
              isResearched
                ? 'border-[var(--aurora-max-emerald)] bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] shadow-[0_0_10px_rgba(0,217,160,0.2)]'
                : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onToggleSaved(row.stableId)}
            aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
            className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
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
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2.5 font-mono text-[9px] font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/25"
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
          <div className="border-t border-white/[0.08] px-3 pb-2.5 pt-2 bg-black/40">
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
