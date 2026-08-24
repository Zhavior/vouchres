import React from 'react';
import { Plus, ArrowUpRight } from 'lucide-react';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { tierForScore } from '../../hr-next/utils/tierPartition';
import { assessVerifiedNow } from '../../hr-next/utils/verifiedNow';
import { HrNextCollisionField } from '../../hr-next/components/HrNextCollisionField';

/**
 * Collision Stage.
 *
 * Sticky beside the register rather than stacked above it: the whole point of
 * an instrument is that the reading stays visible while you scan alternatives.
 * Selecting any row updates this in place through the board's existing
 * activeId contract — the stage never remounts, only its values change.
 *
 * Every figure is a published board field. Nothing is modelled here.
 */

export interface HrLabStageProps {
  row: HrWatchRow | null;
  rank: number | null;
  isLeader: boolean;
  onAddToSlip: (row: HrWatchRow) => void;
  onOpenResearch: (row: HrWatchRow) => void;
}

export function HrLabStage({ row, rank, isLeader, onAddToSlip, onOpenResearch }: HrLabStageProps) {
  if (!row) {
    return (
      <div className="flex min-h-[420px] items-center justify-center border border-white/[0.08] bg-obsidian-950">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/25">
          Select a candidate
        </p>
      </div>
    );
  }

  const hrpi = Number.isFinite(row.hrScore) ? Math.round(row.hrScore) : null;
  const tier = tierForScore(hrpi ?? 0);
  const verified = assessVerifiedNow(row).verified;

  return (
    <section
      aria-label="Selected candidate"
      className="border border-white/[0.08] bg-obsidian-950"
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
        <span className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.22em]">
          <span className="tabular-nums text-white/30">
            {rank == null ? '—' : String(rank).padStart(2, '0')}
          </span>
          <span className="text-ve-emerald">{isLeader ? 'HRPI Leader' : 'Selected candidate'}</span>
        </span>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.2em]"
          style={{ color: tier.accent }}
        >
          {tier.label}
        </span>
      </div>

      {/* Identity — the one display statement on this surface. */}
      <div className="px-5 pt-6">
        <h2 className="text-3xl font-bold italic leading-[0.98] tracking-tighter text-white xl:text-4xl">
          {row.playerName}
        </h2>

        <p className="mt-3 font-sans text-sm font-light text-white/45">
          {row.team} @ {row.opponent?.trim() || 'TBD'}
          {row.pitcherName?.trim() ? (
            <>
              <span className="text-white/20"> · </span>vs {row.pitcherName.trim()}
            </>
          ) : null}
        </p>

        <div className="mt-6 flex items-end gap-3 border-b border-white/[0.08] pb-5">
          <span
            className="font-mono text-5xl font-bold leading-none tabular-nums"
            style={{ color: tier.accent }}
          >
            {hrpi == null ? '—' : hrpi}
          </span>
          <span className="pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">
            HRPI
          </span>
          <span
            className={`ml-auto pb-1 font-mono text-[9px] uppercase tracking-[0.2em] ${
              verified ? 'text-ve-emerald' : 'text-ve-amber'
            }`}
          >
            {verified ? 'Source complete' : 'Partial evidence'}
          </span>
        </div>
      </div>

      {/* The collision field carries its own text register. */}
      <HrNextCollisionField row={row} />

      <div className="flex items-center gap-2 border-t border-white/[0.08] px-5 py-4">
        <button
          type="button"
          onClick={() => onAddToSlip(row)}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-ve-cyan px-5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add to slip
        </button>
        <button
          type="button"
          onClick={() => onOpenResearch(row)}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/12 px-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 transition-colors hover:border-ve-cyan hover:text-white"
        >
          Full evidence
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default HrLabStage;
