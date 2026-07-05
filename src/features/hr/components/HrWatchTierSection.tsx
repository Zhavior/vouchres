import { HrWatchCard } from './HrWatchCard';
import type { HrWatchRow } from '../types/hrWatch';

export function HrWatchTierSection({
  title,
  subtitle,
  rows,
  visibleCount,
  onLoadMore,
  onAddHrLeg,
}: {
  title: string;
  subtitle: string;
  rows: readonly HrWatchRow[];
  visibleCount: number;
  onLoadMore: () => void;
  onAddHrLeg?: (row: HrWatchRow, target: 1 | 2) => void;
}) {
  const shownRows = rows.slice(0, visibleCount);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-[hsl(var(--ve-text-primary))]">{title}</h2>
          <p className="mt-1 text-xs text-[hsl(var(--ve-text-muted))]">{subtitle}</p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
            Showing {shownRows.length}/{rows.length}
          </div>
          {shownRows.length < rows.length ? (
            <button
              type="button"
              onClick={onLoadMore}
              className="mt-1 rounded-full border border-[hsl(var(--ve-border)/0.24)] bg-[hsl(var(--ve-surface-raised)/0.16)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-primary))]"
            >
              Load 18 more
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {shownRows.map((row) => (
          <HrWatchCard key={row.stableId} row={row} onAddHrLeg={onAddHrLeg} />
        ))}
      </div>
    </section>
  );
}
