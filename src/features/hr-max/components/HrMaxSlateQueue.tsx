import { useLayoutEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, Star } from 'lucide-react';
import {
  AuroraMaxFallback,
  AuroraMaxReceiptAction,
  AuroraMaxTruthBadge,
} from '../../../components/aurora-max/AuroraMaxPrimitives';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
import { estimateQueueRowSize } from '../estimateDeskRowSize';
import { HrMaxReceiptTray } from './HrMaxReceiptTray';

export function HrMaxSlateQueue({
  rows,
  activeId,
  isSaved,
  receiptId,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
}: {
  rows: HrMaxDeskRow[];
  activeId: string | null;
  isSaved: (id: string) => boolean;
  receiptId: string | null;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt: (id: string) => void;
}) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      estimateQueueRowSize({ receiptOpen: rows[index]?.id === receiptId }),
    overscan: 10,
    getItemKey: (index) => rows[index]?.id ?? index,
  });
  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  useLayoutEffect(() => {
    virtualizerRef.current.measure();
  }, [receiptId]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="hr-max-queue">
      <div className="hr-max-queue__head">
        <span>Matchup</span>
        <span>Top research row</span>
        <span>HRPI</span>
        <span>Lineup</span>
        <span>Attention</span>
        <span className="text-right">Receipt</span>
      </div>
      {rows.length === 0 ? (
        <AuroraMaxFallback
          compact
          title="No ranked matchups"
          detail="The active workspace filter returned no eligible slate rows."
        />
      ) : (
        <div ref={parentRef} className="overflow-y-auto max-h-[calc(100vh-16rem)] overscroll-contain">
          <div style={{ position: 'relative', height: virtualizer.getTotalSize(), width: '100%' }}>
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index];
              const active = row.id === activeId;
              const receiptOpen = receiptId === row.id;
              const saved = isSaved(row.id);
              
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    zIndex: receiptOpen ? 2 : 1,
                  }}
                >
                  <div className={`hr-max-queue__row ${active ? 'is-active' : ''}`}>
                    {active ? <span className="hr-max-queue__accent" aria-hidden="true" /> : null}
                    <button
                      type="button"
                      onClick={() => onSelect(row.id)}
                      aria-pressed={active}
                      className="hr-max-queue__select"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`grid h-6 w-6 shrink-0 place-items-center border font-mono text-[11px] ${active ? 'border-[rgba(0,217,160,0.3)] bg-[rgba(0,217,160,0.1)] text-[#a8d8b6]' : 'border-white/[0.07] text-white/20'}`}>
                          {String(virtualRow.index + 1).padStart(2, '0')}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[10px] font-bold text-[#e9e8e1]">{row.matchupLabel}</span>
                          <span className="mt-1 block text-[10px] text-white/35">{row.gameTimeLabel}</span>
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[10px] font-semibold text-white/70">{row.playerName}</span>
                        <span className="mt-1 block truncate text-[10px] text-white/30">{row.team}</span>
                      </span>
                      <span className={`font-mono text-sm font-semibold tabular-nums ${active ? 'text-[#b9e8c8]' : 'text-white/70'}`}>
                        {row.score}
                      </span>
                      <AuroraMaxTruthBadge state={row.truthState}>
                        {row.confirmed ? 'Confirmed' : row.lineupLabel}
                      </AuroraMaxTruthBadge>
                      <span>
                        <span className="font-mono text-[11px] text-white/55">{row.attention ?? '—'}</span>
                        <span className="ml-1 text-[11px] text-white/25">index</span>
                      </span>
                    </button>
                    <span className="hr-max-queue__actions">
                      <button
                        type="button"
                        onClick={() => onToggleSaved(row.id)}
                        aria-label={`${saved ? 'Remove' : 'Add'} ${row.playerName} ${saved ? 'from' : 'to'} My List`}
                        className={`hr-max-queue__icon ${saved ? 'is-on' : ''}`}
                      >
                        <Star className={`h-3 w-3 ${saved ? 'fill-current' : ''}`} />
                      </button>
                      <AuroraMaxReceiptAction
                        onClick={() => onToggleReceipt(row.id)}
                        expanded={receiptOpen}
                        label={`${receiptOpen ? 'Close' : 'Open'} ${row.playerName} receipt`}
                      >
                        <ChevronDown className={`h-3 w-3 transition ${receiptOpen ? 'rotate-180' : ''}`} />
                      </AuroraMaxReceiptAction>
                    </span>
                  </div>
                  {receiptOpen ? <HrMaxReceiptTray row={row} onClose={() => onToggleReceipt(row.id)} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
