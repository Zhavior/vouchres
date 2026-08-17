import React, { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useFeedScrollRoot } from '../../../context/FeedScrollContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
import { estimateCardRowSize } from '../estimateDeskRowSize';
import {
  CARD_BOARD_INNER_OVERSCAN,
  CARD_BOARD_PAGE_OVERSCAN,
  measureScrollMargin,
  resolveLiveCardBoardScroller,
} from '../resolveCardBoardScroller';
import { HrMaxPlayerCard } from './HrMaxPlayerCard';

const TIERS = [
  { key: 'Elite', label: 'Elite', tone: '#00d9a0', desc: 'Highest signal alignment across power & matchup' },
  { key: 'Strong', label: 'Strong', tone: '#34d399', desc: 'Favorable matchup vulnerability and park conditions' },
  { key: 'Watch', label: 'Watch', tone: '#a8d8b6', desc: 'Live candidate with elevated situational upside' },
  { key: 'Sleepers', label: 'Sleepers', tone: '#fbbf24', desc: 'Deep value bats with isolated power metrics' },
] as const;

function getRowTier(row: HrMaxDeskRow): string {
  if (row.displayTier) return row.displayTier;
  if (row.score >= 80) return 'Elite';
  if (row.score >= 70) return 'Strong';
  if (row.score >= 60) return 'Watch';
  return 'Sleepers';
}

interface TierColumnProps {
  tier: (typeof TIERS)[number];
  rows: HrMaxDeskRow[];
  activeId?: string | null;
  receiptId?: string | null;
  isSaved: (id: string) => boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt?: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
  compactHeader?: boolean;
  pageScroll: boolean;
  feedScrollRoot: RefObject<HTMLDivElement | null> | null;
}

/**
 * One 1D virtualizer per tier (Twitter Lite windowing).
 * estimateSize is Reddit-style height-from-data (receiptOpen + evidence).
 * measureElement still owns painted height (L029).
 * md+ attaches to the page scroller (#inner-view-slot or body), not window.
 */
const CARD_GAP = 8;

const TierColumn = React.memo(function TierColumn({
  tier,
  rows,
  activeId,
  receiptId,
  isSaved,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
  onAddToSlip,
  compactHeader = false,
  pageScroll,
  feedScrollRoot,
}: TierColumnProps) {
  const tierRows = useMemo(
    () => rows.filter((r) => getRowTier(r) === tier.key),
    [rows, tier.key],
  );
  const innerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const getScrollElement = useCallback(
    () =>
      resolveLiveCardBoardScroller({
        pageScroll,
        inner: innerRef.current,
        feedRoot: feedScrollRoot?.current ?? null,
      }),
    [pageScroll, feedScrollRoot],
  );

  const virtualizer = useVirtualizer({
    count: tierRows.length,
    getScrollElement,
    estimateSize: (index) => {
      const row = tierRows[index];
      if (!row) return estimateCardRowSize({ receiptOpen: false, evidenceCount: 0 });
      return estimateCardRowSize({
        receiptOpen: row.id === receiptId,
        evidenceCount: row.evidence.length,
      });
    },
    overscan: pageScroll ? CARD_BOARD_PAGE_OVERSCAN : CARD_BOARD_INNER_OVERSCAN,
    gap: CARD_GAP,
    getItemKey: (index) => tierRows[index]?.id ?? index,
    scrollMargin: pageScroll ? scrollMargin : 0,
  });
  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  useLayoutEffect(() => {
    virtualizerRef.current.measure();
  }, [receiptId, pageScroll, scrollMargin]);

  useLayoutEffect(() => {
    if (!pageScroll) {
      setScrollMargin(0);
      return;
    }
    const list = listRef.current;
    const scroller = getScrollElement();
    if (!list || !scroller) {
      setScrollMargin(0);
      return;
    }
    const update = () => {
      setScrollMargin(measureScrollMargin(list, scroller));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [getScrollElement, pageScroll, receiptId, tierRows.length]);

  const virtualItems = virtualizer.getVirtualItems();
  const origin = pageScroll ? scrollMargin : 0;

  return (
    <div className="hr-max-tier-column flex flex-col gap-2.5">
      <div
        className={`hr-max-tier-column__head items-center justify-between border-b border-white/10 pb-2 ${compactHeader ? 'hidden md:flex' : 'flex'}`}
      >
        <div>
          <h3 className="font-mono text-xs font-black uppercase tracking-[0.14em]" style={{ color: tier.tone }}>
            {tier.label}
          </h3>
          <p className="text-[10px] text-white/40">{tier.desc}</p>
        </div>
        <span className="font-mono text-xs font-bold tabular-nums text-white/50">
          ({tierRows.length})
        </span>
      </div>

      {tierRows.length === 0 ? (
        <div className="border border-dashed border-white/10 p-4 text-center text-[11px] text-white/30">
          No batters in {tier.label} on this slate.
        </div>
      ) : (
        <div
          ref={innerRef}
          className={
            pageScroll
              ? 'hr-max-tier-column__scroller hr-max-tier-column__scroller--page'
              : 'hr-max-tier-column__scroller hr-max-tier-column__scroller--inner'
          }
        >
          <div
            ref={listRef}
            className="hr-max-tier-column__list"
            style={{ position: 'relative', height: virtualizer.getTotalSize(), width: '100%' }}
          >
            {virtualItems.map((virtualRow) => {
              const row = tierRows[virtualRow.index];
              const receiptOpen = row.id === receiptId;
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
                    transform: `translateY(${virtualRow.start - origin}px)`,
                    zIndex: receiptOpen ? 2 : 1,
                  }}
                >
                  <HrMaxPlayerCard
                    row={row}
                    active={row.id === activeId}
                    saved={isSaved(row.id)}
                    isReceiptOpen={receiptOpen}
                    onSelect={onSelect}
                    onToggleSaved={onToggleSaved}
                    onToggleReceipt={onToggleReceipt}
                    onAddToSlip={onAddToSlip}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export function HrMaxCardBoard({
  rows,
  activeId,
  receiptId,
  isSaved,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
  onAddToSlip,
  selectedTiers,
}: {
  rows: HrMaxDeskRow[];
  activeId?: string | null;
  receiptId?: string | null;
  isSaved: (id: string) => boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt?: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
  selectedTiers?: string[];
}) {
  const visibleTiers = selectedTiers?.length
    ? TIERS.filter((tier) => selectedTiers.includes(tier.key))
    : TIERS;
  const compactHeader = (selectedTiers?.length ?? 4) <= 1;
  const pageScroll = useMediaQuery('(min-width: 768px)');
  const feedScrollRoot = useFeedScrollRoot();

  return (
    <div className="hr-max-card-board grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {visibleTiers.map((tier) => (
        <TierColumn
          key={tier.key}
          tier={tier}
          rows={rows}
          activeId={activeId}
          receiptId={receiptId}
          isSaved={isSaved}
          onSelect={onSelect}
          onToggleSaved={onToggleSaved}
          onToggleReceipt={onToggleReceipt}
          onAddToSlip={onAddToSlip}
          compactHeader={compactHeader}
          pageScroll={pageScroll}
          feedScrollRoot={feedScrollRoot}
        />
      ))}
    </div>
  );
}
