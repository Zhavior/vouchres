import React from 'react';
import { Plus, Star, TrendingUp } from 'lucide-react';
import { AuroraMaxPanel } from '../../../components/aurora-max/AuroraMaxPrimitives';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
import {
  deskMatchupLine,
  evidencePips,
  primaryCatalystLabel,
} from '../presentHrMaxTicket';
import { HrMaxReceiptTray } from './HrMaxReceiptTray';

export interface HrMaxPlayerCardProps {
  row: HrMaxDeskRow;
  active: boolean;
  saved: boolean;
  isReceiptOpen: boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt?: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
}

/**
 * SIR (closed ticket, ~78px):
 * flex row · items-center · gap 8 · px 8
 *   36×36 headshot (fixed)
 *   min-w-0 flex-1 column
 *     row: name (truncate, max 140px) | catalyst (truncate)
 *     row: matchup · time | 3 pips | lineup
 *   HRPI stack
 *   star + slip (sibling buttons — not nested in the receipt control)
 * Virtualizer parent stays position:absolute (L029 overlay exception).
 */
export const HrMaxPlayerCard = React.memo(function HrMaxPlayerCard({
  row,
  active,
  saved,
  isReceiptOpen,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
  onAddToSlip,
}: HrMaxPlayerCardProps) {
  const teamLogo = logoByTeamName(row.team);
  const catalyst = primaryCatalystLabel(row);
  const pips = evidencePips(row);
  const matchupLine = deskMatchupLine(row);
  const lineupText = row.confirmed ? 'Confirmed' : row.lineupLabel;

  const onTicketActivate = () => {
    onSelect(row.id);
    onToggleReceipt?.(row.id);
  };

  return (
    <AuroraMaxPanel
      className={`hr-max-ticket group ${
        active
          ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.06)] ring-1 ring-[var(--aurora-max-emerald)]/50'
          : 'hover:border-[var(--aurora-max-emerald)]/40'
      }`}
    >
      <div className="flex min-h-[78px] items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          onClick={onTicketActivate}
          aria-expanded={Boolean(onToggleReceipt) && isReceiptOpen}
          aria-label={
            onToggleReceipt
              ? `${isReceiptOpen ? 'Hide' : 'Open'} receipt for ${row.playerName}`
              : `Select ${row.playerName}`
          }
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div
            className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40"
            style={{ width: 36, height: 36, aspectRatio: '1 / 1' }}
          >
            <PlayerHeadshot name={row.playerName} playerId={row.player.id} size={36} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline gap-2">
              <h4
                className={`font-mono text-xs font-bold leading-tight truncate max-w-[140px] ${
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
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              {teamLogo ? (
                <img src={teamLogo} alt="" width={10} height={10} className="h-2.5 w-2.5 shrink-0 object-contain" />
              ) : null}
              <span className="min-w-0 truncate font-mono text-[9px] leading-tight text-white/45">
                {matchupLine}
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
              <span className="shrink-0 truncate font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-white/40">
                {lineupText}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end leading-none">
            <span className="font-mono text-sm font-black tabular-nums text-[var(--aurora-max-emerald)]">
              {row.score}
            </span>
            <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
              HRPI
            </span>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleSaved(row.id)}
            aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
            className={`grid h-8 w-8 place-items-center border ${
              saved
                ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]'
                : 'border-white/10 text-white/40 hover:text-white'
            }`}
          >
            <Star className={`h-3 w-3 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onAddToSlip(row)}
            title="Add to parlay slip"
            className="inline-flex h-8 items-center gap-0.5 border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-1.5 font-mono text-[9px] font-bold uppercase text-[var(--aurora-max-emerald)]"
          >
            <Plus className="h-3 w-3" /> Slip
          </button>
        </div>
      </div>

      {isReceiptOpen && onToggleReceipt ? (
        <div className="border-t border-white/[0.08] px-2 pb-2 pt-2">
          <HrMaxReceiptTray row={row} onClose={() => onToggleReceipt(row.id)} />
        </div>
      ) : null}
    </AuroraMaxPanel>
  );
});
