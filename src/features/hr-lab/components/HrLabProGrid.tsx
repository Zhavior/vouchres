import React, { useMemo, useState } from 'react';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { HrNextItem } from '../../hr-next/hooks/useHrNextData';
import { partitionByTier } from '../../hr-next/utils/tierPartition';
import { HrLabProCard } from './HrLabProCard';

/**
 * Pro Mode grid.
 *
 * The register answers "what ranks"; Pro Mode answers "how do these compare".
 * Candidates are banded by HRPI tier and rendered as cards whose evidence bars
 * can be scanned down a column, so shape carries the comparison instead of the
 * reader holding four numbers in their head.
 *
 * Rank stays continuous across bands — 01 is the slate leader, matching the
 * register exactly, so toggling modes never renumbers a candidate.
 *
 * Long bands are capped with an always-visible count and expander rather than
 * silently truncated: SLEEPER routinely carries an order of magnitude more rows
 * than ELITE, and an uncapped grid runs to six figures of pixels.
 */

const CARDS_PER_BAND = 12;

export interface HrLabProGridProps {
  items: HrNextItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  savedMap: Record<string, true>;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}

export function HrLabProGrid({
  items,
  activeId,
  onSelect,
  savedMap,
  onToggleSaved,
  onAddToSlip,
}: HrLabProGridProps) {
  const [expanded, setExpanded] = useState<Record<string, true>>({});
  const columns = useMemo(() => partitionByTier(items), [items]);

  // Continuous rank across every band, computed once against the full order.
  const rankById = useMemo(() => {
    const map = new Map<string, number>();
    let n = 0;
    for (const column of columns) {
      for (const item of column.rows) {
        n += 1;
        map.set(item.row.stableId, n);
      }
    }
    return map;
  }, [columns]);

  const visibleColumns = columns.filter((c) => c.rows.length > 0);

  if (visibleColumns.length === 0) {
    return (
      <p className="py-16 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/25">
        No candidates match the active filters
      </p>
    );
  }

  return (
    <section aria-label="Ranked opportunities" className="min-w-0 space-y-10">
      <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-2">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
          Ranked opportunities
        </h2>
        <span className="font-mono text-[9px] tabular-nums uppercase tracking-[0.18em] text-white/25">
          Pro · {rankById.size} candidates
        </span>
      </div>

      {visibleColumns.map((column) => {
        const isOpen = Boolean(expanded[column.tier.key]);
        const visible = isOpen ? column.rows : column.rows.slice(0, CARDS_PER_BAND);

        return (
          <div key={column.tier.key} className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="flex min-w-0 items-baseline gap-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.22em]">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full"
                  style={{ backgroundColor: column.tier.accent }}
                />
                <span style={{ color: column.tier.accent }}>{column.tier.label}</span>
                <span className="truncate text-white/25">{column.tier.rangeLabel}</span>
              </h3>
              <span className="shrink-0 font-mono text-[9px] tabular-nums text-white/25">
                {column.rows.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {visible.map((item) => (
                <HrLabProCard
                  key={item.row.stableId}
                  row={item.row}
                  rank={rankById.get(item.row.stableId) ?? 0}
                  tier={column.tier}
                  active={activeId === item.row.stableId}
                  saved={Boolean(savedMap[item.row.stableId])}
                  onSelect={onSelect}
                  onToggleSaved={onToggleSaved}
                  onAddToSlip={onAddToSlip}
                />
              ))}
            </div>

            {column.rows.length > CARDS_PER_BAND && (
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => {
                    const next = { ...prev };
                    if (next[column.tier.key]) delete next[column.tier.key];
                    else next[column.tier.key] = true;
                    return next;
                  })
                }
                aria-expanded={isOpen}
                className="mt-3 w-full border border-white/[0.08] py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:border-ve-cyan/40 hover:text-white"
              >
                {isOpen ? `Show top ${CARDS_PER_BAND}` : `Show all ${column.rows.length}`}
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default HrLabProGrid;
