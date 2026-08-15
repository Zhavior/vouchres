import React from 'react';
import { FileCheck2, Plus, Star, TrendingUp } from 'lucide-react';
import {
  AuroraMaxPanel,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import { logoByTeamName } from '../../../lib/teamLogos';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
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

  return (
    <AuroraMaxPanel
      className={`h-full group cursor-pointer transition ${
        active
          ? 'border-[var(--aurora-max-emerald)] bg-[rgba(0,217,160,0.06)] ring-1 ring-[var(--aurora-max-emerald)]/50 shadow-[0_0_15px_rgba(0,217,160,0.2)]'
          : 'hover:border-[var(--aurora-max-emerald)]/40 hover:bg-white/[0.02]'
      }`}
    >
      <div className="p-3" onClick={() => onSelect(row.id)}>
        {/* Top: Truth badge & Score */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/40">
              <PlayerHeadshot name={row.playerName} playerId={row.player.id} size={36} />
            </div>
            <div className="min-w-0">
              <AuroraMaxTruthBadge state={row.truthState}>
                {row.confirmed ? 'Confirmed' : row.lineupLabel}
              </AuroraMaxTruthBadge>
              <h4 className={`mt-0.5 truncate text-xs font-bold transition-colors ${active ? 'text-[var(--aurora-max-emerald)] font-black' : 'text-white group-hover:text-[var(--aurora-max-emerald)]'}`}>
                {row.playerName}
              </h4>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-[9px] text-white/40">
                {teamLogo ? <img src={teamLogo} alt="" className="h-2.5 w-2.5 object-contain" /> : null}
                <span>{row.team} · {row.matchupLabel} · {row.gameTimeLabel}</span>
              </p>
            </div>
          </div>
          <AuroraMaxScoreBadge score={row.score} />
        </div>

        {/* Signal Summary */}
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/70">
          <TrendingUp className="h-3 w-3 shrink-0 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
          <span className="truncate">{row.signal}</span>
        </div>

        {/* Evidence Metric Chips */}
        {row.evidence.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {row.evidence.slice(0, 3).map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1 border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 font-mono text-[9px] text-white/60"
              >
                <span className="uppercase text-white/35">{item.label}</span>
                <span className="font-bold text-white/80">{item.value}</span>
              </span>
            ))}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">
            {row.evidence.length} layers
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSaved(row.id);
              }}
              aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
              className={`grid h-7 w-7 place-items-center border ${saved ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]' : 'border-white/10 text-white/40 hover:text-white'}`}
            >
              <Star className={`h-3 w-3 ${saved ? 'fill-current' : ''}`} />
            </button>
            {onToggleReceipt ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReceipt(row.id);
                }}
                title="Toggle Research Receipt"
                className={`inline-flex h-7 items-center gap-1 border px-2 font-mono text-[9px] font-bold uppercase transition ${
                  isReceiptOpen
                    ? 'border-[var(--aurora-max-emerald)] bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)]'
                    : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                }`}
              >
                <FileCheck2 className="h-3 w-3" /> Receipt
              </button>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToSlip(row);
              }}
              title="Add to Parlay Slip"
              className="inline-flex h-7 items-center gap-1 border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2 font-mono text-[10px] font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/20"
            >
              <Plus className="h-3 w-3" /> Slip
            </button>
          </div>
        </div>

        {/* Inline Receipt Tray */}
        {isReceiptOpen && onToggleReceipt ? (
          <div className="mt-2.5 border-t border-white/[0.08] pt-2" onClick={(e) => e.stopPropagation()}>
            <HrMaxReceiptTray row={row} onClose={() => onToggleReceipt(row.id)} />
          </div>
        ) : null}
      </div>
    </AuroraMaxPanel>
  );
});
