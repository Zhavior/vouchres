import React from 'react';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';
import { HrScrollReveal } from '../../../components/ui/HrScrollReveal';
import { useProgressiveRender } from '../../../hooks/useProgressiveRender';
import { HrMaxPlayerCard } from './HrMaxPlayerCard';

const TIERS = [
  { key: 'Elite', label: 'Elite', tone: '#00d9a0', desc: 'Highest signal alignment across power & matchup' },
  { key: 'Strong', label: 'Strong', tone: '#38bdf8', desc: 'Favorable matchup vulnerability and park conditions' },
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

/* ─── TierColumn Props ─── */

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
}

/* ─── TierColumn ───
 * Extracted as its own component so `useProgressiveRender` is called
 * unconditionally at the top level — never inside a .map() loop.
 * Wrapped in React.memo so that clicking a card in ELITE doesn't
 * re-render STRONG/WATCH/SLEEPERS columns.
 */
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
}: TierColumnProps) {
  const tierRows = rows.filter((r) => getRowTier(r) === tier.key);
  const [visibleRows, sentinelRef] = useProgressiveRender(tierRows, 24, 24);

  return (
    <div
      className="flex flex-col gap-2.5"
      style={{ contain: 'layout style paint' }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
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

      {/* Column Cards */}
      <div className="flex flex-col gap-2">
        {tierRows.length === 0 ? (
          <div className="border border-dashed border-white/10 p-4 text-center text-[11px] text-white/30">
            No batters in {tier.label} on this slate.
          </div>
        ) : (
          <>
            {visibleRows.map((row, i) => (
              <HrScrollReveal key={row.id} index={i} variant="subtle" intrinsicHeight={160} className="h-full">
                <HrMaxPlayerCard
                  row={row}
                  active={row.id === activeId}
                  saved={isSaved(row.id)}
                  isReceiptOpen={row.id === receiptId}
                  onSelect={onSelect}
                  onToggleSaved={onToggleSaved}
                  onToggleReceipt={onToggleReceipt}
                  onAddToSlip={onAddToSlip}
                />
              </HrScrollReveal>
            ))}
            {/* Sentinel — triggers next batch of 24 when it enters viewport */}
            <div ref={sentinelRef} aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
});

/* ─── HrMaxCardBoard ───
 * Thin shell that renders 4 memoized TierColumn instances.
 * GPU-promoted grid wrapper with scroll-chain prevention.
 */
export function HrMaxCardBoard({
  rows,
  activeId,
  receiptId,
  isSaved,
  onSelect,
  onToggleSaved,
  onToggleReceipt,
  onAddToSlip,
}: {
  rows: HrMaxDeskRow[];
  activeId?: string | null;
  receiptId?: string | null;
  isSaved: (id: string) => boolean;
  onSelect: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleReceipt?: (id: string) => void;
  onAddToSlip: (row: HrMaxDeskRow) => void;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
      style={{
        willChange: 'transform',
        alignItems: 'start',
        overscrollBehavior: 'contain',
      }}
    >
      {TIERS.map((tier) => (
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
        />
      ))}
    </div>
  );
}
