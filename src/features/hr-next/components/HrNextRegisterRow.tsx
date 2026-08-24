import React from 'react';
import { Plus, Check, Bookmark } from 'lucide-react';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { HrNextTierDef } from '../utils/tierPartition';

/**
 * One line of the ranked opportunity register.
 *
 * The board's dominant object is the ranked set, so its default presentation is
 * a register rather than a card wall: rank, identity, matchup, then the same
 * evidence sub-scores the Collision Field plots. Every value is a published
 * board field — an absent layer prints as a dash rather than a zero, because
 * "no reading" and "a reading of nothing" are different claims.
 *
 * Props mirror HrNextCard exactly so the board's selection, saved-state,
 * receipt and add-to-slip handlers attach unchanged.
 */

export interface HrNextRegisterRowProps {
  row: HrWatchRow;
  rank: number;
  active: boolean;
  saved: boolean;
  tier?: HrNextTierDef;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null;

function Metric({ value, tone = 'text-white/70' }: { value: number | null; tone?: string }) {
  return (
    <span className={`font-mono text-xs tabular-nums ${value == null ? 'text-white/20' : tone}`}>
      {value == null ? '—' : value}
    </span>
  );
}

export const HrNextRegisterRow = React.memo(function HrNextRegisterRow({
  row,
  rank,
  active,
  saved,
  tier,
  onSelect,
  onToggleSaved,
  onAddToSlip,
}: HrNextRegisterRowProps) {
  const hrpi = num(row.hrScore);
  const power = num(row.hitterPower);
  const vuln = num(row.pitcherVulnerability);
  const park = num(row.parkContext) ?? num(row.parkFactor);
  const confirmed = row.truthStatus === 'official';

  return (
    <tr
      id={`player-card-${row.stableId}`}
      onClick={() => onSelect(row.stableId)}
      aria-selected={active}
      className={`group cursor-pointer border-b border-white/[0.06] transition-colors ${
        active ? 'bg-ve-cyan/[0.07]' : 'hover:bg-white/[0.025]'
      }`}
    >
      {/* Rank — the selected line is marked by a cyan rule, not a fill. */}
      <td className="relative py-2.5 pl-3 pr-2 align-middle">
        {active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[2px] bg-ve-cyan" />}
        <span className="font-mono text-[11px] tabular-nums text-white/35">
          {String(rank).padStart(2, '0')}
        </span>
      </td>

      <td className="min-w-0 py-2.5 pr-3 align-middle">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-sans text-sm font-medium text-white">{row.playerName}</span>
          {confirmed && (
            <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.16em] text-ve-emerald">
              CONF
            </span>
          )}
        </span>
      </td>

      <td className="hidden py-2.5 pr-3 align-middle sm:table-cell">
        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-white/45">
          {row.team} @ {row.opponent?.trim() || 'TBD'}
        </span>
      </td>

      <td className="py-2.5 pr-3 text-right align-middle">
        <span
          className="font-mono text-sm font-bold tabular-nums"
          style={tier ? { color: tier.accent } : undefined}
        >
          {hrpi == null ? '—' : hrpi}
        </span>
      </td>

      <td className="hidden py-2.5 pr-3 text-right align-middle md:table-cell">
        <Metric value={power} tone="text-ve-emerald" />
      </td>
      <td className="hidden py-2.5 pr-3 text-right align-middle md:table-cell">
        <Metric value={vuln} tone="text-ve-cyan" />
      </td>
      <td className="hidden py-2.5 pr-3 text-right align-middle lg:table-cell">
        <Metric value={park} />
      </td>

      <td className="py-2.5 pr-3 text-right align-middle">
        <span className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSaved(row.stableId);
            }}
            aria-label={saved ? `Remove ${row.playerName} from list` : `Save ${row.playerName}`}
            aria-pressed={saved}
            className={`inline-flex h-8 w-8 items-center justify-center transition-colors ${
              saved ? 'text-ve-emerald' : 'text-white/25 hover:text-white'
            }`}
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToSlip(row);
            }}
            aria-label={`Add ${row.playerName} to slip`}
            className="inline-flex h-8 items-center gap-1 border border-white/10 px-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/55 transition-colors hover:border-ve-cyan hover:text-ve-cyan"
          >
            <Plus className="h-3 w-3" />
            Slip
          </button>
        </span>
      </td>
    </tr>
  );
});

export default HrNextRegisterRow;
