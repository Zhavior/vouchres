import React from 'react';
import { Plus, Check, Bookmark } from 'lucide-react';
import PlayerHeadshot from '../../../components/parlays/PlayerHeadshot';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { HrNextTierDef } from '../../hr-next/utils/tierPartition';

/**
 * Pro Mode candidate card, in the Lab language.
 *
 * The board's Pro Mode was its premium surface and stays premium here — but
 * built from the same vocabulary as the stage and register rather than the old
 * bordered-glass card: obsidian ground, one hairline frame, the name in the
 * display face, every figure in mono, and the three evidence layers as a
 * divided register instead of three little boxes.
 *
 * Selection, saved state and add-to-slip use the same handlers as the register,
 * so the card and the row are interchangeable inputs to the same stage.
 */

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null;

/**
 * One evidence layer as a micro collision bar.
 *
 * This is what Pro Mode buys: the same three sub-scores the Collision Field
 * plots, encoded so a column of candidates can be compared by shape rather than
 * read digit by digit. The bar is a plain scaled div — no canvas per card.
 * A missing layer shows an empty track and an em dash, never a zero-length bar
 * that would read as a real reading of nothing.
 */
function Layer({
  label,
  value,
  tone,
  bar,
}: {
  label: string;
  value: number | null;
  tone: string;
  bar: string;
}) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div className="min-w-0 flex-1 border-l border-white/[0.08] px-2.5 py-2 first:border-l-0 first:pl-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
          {label}
        </span>
        <span
          className={`font-mono text-[11px] tabular-nums ${value == null ? 'text-white/20' : tone}`}
        >
          {value == null ? '—' : value}
        </span>
      </div>
      <div className="mt-1.5 h-[3px] w-full bg-white/[0.06]">
        {value != null && (
          <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export interface HrLabProCardProps {
  row: HrWatchRow;
  rank: number;
  tier: HrNextTierDef;
  active: boolean;
  saved: boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}

export const HrLabProCard = React.memo(function HrLabProCard({
  row,
  rank,
  tier,
  active,
  saved,
  onSelect,
  onToggleSaved,
  onAddToSlip,
}: HrLabProCardProps) {
  const hrpi = num(row.hrScore);
  const confirmed = row.truthStatus === 'official';

  return (
    <article
      id={`player-card-${row.stableId}`}
      onClick={() => onSelect(row.stableId)}
      aria-selected={active}
      className={`group relative cursor-pointer border bg-obsidian-950 transition-colors ${
        active ? 'border-ve-cyan/50 bg-ve-cyan/[0.04]' : 'border-white/[0.08] hover:border-white/20'
      }`}
    >
      {active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[2px] bg-ve-cyan" />}

      {/* Rank + band */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-3.5 py-2">
        <span className="font-mono text-[10px] tabular-nums text-white/30">
          {String(rank).padStart(2, '0')}
        </span>
        <span
          className="font-mono text-[8px] uppercase tracking-[0.2em]"
          style={{ color: tier.accent }}
        >
          {tier.label}
        </span>
      </div>

      {/* Identity */}
      <div className="flex items-start gap-3 px-3.5 pt-3.5">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden border border-white/10 bg-obsidian-800">
          <PlayerHeadshot name={row.playerName} playerId={row.playerId?.toString()} size={44} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold italic leading-tight tracking-tighter text-white">
            {row.playerName}
          </h3>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-white/40">
            {row.team} @ {row.opponent?.trim() || 'TBD'}
          </p>
          {confirmed && (
            <span className="mt-1 inline-block font-mono text-[8px] uppercase tracking-[0.18em] text-ve-emerald">
              Confirmed
            </span>
          )}
        </div>

        <div className="shrink-0 text-right">
          <span
            className="block font-mono text-2xl font-bold leading-none tabular-nums"
            style={{ color: tier.accent }}
          >
            {hrpi == null ? '—' : hrpi}
          </span>
          <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
            HRPI
          </span>
        </div>
      </div>

      {/* Evidence layers — the same three the Collision Field plots. */}
      <div className="mt-3 flex border-t border-white/[0.08] px-3.5">
        <Layer label="Power" value={num(row.hitterPower)} tone="text-ve-emerald" bar="bg-ve-emerald" />
        <Layer label="Vuln" value={num(row.pitcherVulnerability)} tone="text-ve-cyan" bar="bg-ve-cyan" />
        <Layer label="Park" value={num(row.parkContext) ?? num(row.parkFactor)} tone="text-white/70" bar="bg-white/35" />
      </div>

      <div className="flex items-center gap-1 border-t border-white/[0.08] px-2 py-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToSlip(row);
          }}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-ve-cyan"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Slip
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSaved(row.stableId);
          }}
          aria-label={saved ? `Remove ${row.playerName}` : `Save ${row.playerName}`}
          aria-pressed={saved}
          className={`inline-flex h-9 w-9 items-center justify-center transition-colors ${
            saved ? 'text-ve-emerald' : 'text-white/25 hover:text-white'
          }`}
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
        </button>
      </div>
    </article>
  );
});

export default HrLabProCard;
