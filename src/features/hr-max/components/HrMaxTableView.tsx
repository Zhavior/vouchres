import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Star } from 'lucide-react';
import {
  AuroraMaxFallback,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
import { estimateTableRowSize } from '../estimateDeskRowSize';

export function HrMaxTableView({
  rows,
  activeId,
  isSaved,
  onSelect,
  onToggleSaved,
  onAddToSlip,
}: {
  rows: HrMaxDeskRow[];
  activeId: string | null;
  isSaved: (id: string) => boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateTableRowSize,
    overscan: 10,
    getItemKey: (index) => rows[index]?.id ?? index,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (rows.length === 0) {
    return (
      <AuroraMaxFallback
        compact
        title="No table rows"
        detail="The active filter returned no eligible slate rows."
      />
    );
  }

  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
    : 0;

  return (
    <div ref={parentRef} className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-16rem)] overscroll-contain border border-white/10 bg-black/40">
      <table className="w-full text-left font-mono text-xs">
        <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0a110d] text-[10px] uppercase tracking-wider text-white/45 shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <tr>
            <th className="px-3 py-2.5">#</th>
            <th className="px-3 py-2.5">Player</th>
            <th className="px-3 py-2.5">Matchup</th>
            <th className="px-3 py-2.5">Time</th>
            <th className="px-3 py-2.5">HRPI</th>
            <th className="px-3 py-2.5">Lineup</th>
            <th className="px-3 py-2.5">Signal Read</th>
            <th className="px-3 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {paddingTop > 0 && (
            <tr><td style={{ height: `${paddingTop}px` }} colSpan={8} /></tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const active = row.id === activeId;
            const saved = isSaved(row.id);
            return (
              <tr
                key={row.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                onClick={() => onSelect(row.id)}
                className={`cursor-pointer transition hover:bg-white/[0.03] ${active ? 'bg-[var(--aurora-max-emerald)]/[0.07]' : ''}`}
              >
                <td className="px-3 py-3 text-white/30 tabular-nums">
                  {String(virtualRow.index + 1).padStart(2, '0')}
                </td>
                <td className="px-3 py-3">
                  <span className="font-sans font-bold text-white hover:text-[var(--aurora-max-emerald)]">
                    {row.playerName}
                  </span>
                  <span className="ml-2 text-[10px] text-white/40">{row.team}</span>
                </td>
                <td className="px-3 py-3 text-white/60">
                  {row.matchupLabel}
                </td>
                <td className="px-3 py-3 text-[11px] text-white/40">
                  {row.gameTimeLabel}
                </td>
                <td className="px-3 py-3">
                  <AuroraMaxScoreBadge score={row.score} />
                </td>
                <td className="px-3 py-3">
                  <AuroraMaxTruthBadge state={row.truthState}>
                    {row.confirmed ? 'Confirmed' : row.lineupLabel}
                  </AuroraMaxTruthBadge>
                </td>
                <td className="max-w-xs truncate px-3 py-3 font-sans text-[11px] text-white/70">
                  {row.signal}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleSaved(row.id)}
                      aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
                      className={`grid h-7 w-7 place-items-center border ${saved ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)]' : 'border-white/10 text-white/40 hover:text-white'}`}
                    >
                      <Star className={`h-3 w-3 ${saved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToSlip(row)}
                      title="Add to Parlay Slip"
                      className="inline-flex h-7 items-center gap-1 border border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 px-2 font-mono text-[10px] font-bold uppercase text-[var(--aurora-max-emerald)] transition hover:bg-[var(--aurora-max-emerald)]/20"
                    >
                      <Plus className="h-3 w-3" /> Slip
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr><td style={{ height: `${paddingBottom}px` }} colSpan={8} /></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
