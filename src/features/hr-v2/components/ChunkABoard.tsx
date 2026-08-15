import React, { useRef, useState, memo } from 'react';
import { ChunkA } from '../api/contracts';
import { ChunkACard } from './ChunkACard';
import { CompactHrRow } from './CompactHrRow';
import { TierSectionHeader } from './TierSectionHeader';
import { TierType } from './TierFilterTabs';
import { AuroraMaxRankedWorkspace } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { HrScrollReveal } from '../../../components/ui/HrScrollReveal';
import { TIER_VERY_HIGH_MIN, TIER_HIGH_MIN } from '../constants';
import { useProgressiveRender } from '../../../hooks/useProgressiveRender';

/* ─── ChunkATierSection ───
 * Extracted as its own component so `useProgressiveRender` is called
 * unconditionally at the top level — never inside a conditional render.
 * Wrapped in React.memo so toggling collapse on one tier doesn't
 * re-render the card lists of other tiers.
 */
const ChunkATierSection = memo(function ChunkATierSection({
  items,
  viewMode,
  sortBy,
}: {
  items: ChunkA[];
  viewMode: 'card' | 'table';
  sortBy: 'score' | 'ev' | 'odds';
}) {
  const [visibleItems, sentinelRef] = useProgressiveRender(items, 24, 24);

  return (
    <div
      className="flex flex-col gap-3 mt-3"
      style={{ contain: 'layout style paint' }}
    >
      {visibleItems.map((item, index) =>
        viewMode === 'table' ? (
          <HrScrollReveal key={item.playerId} index={index} intrinsicHeight={60}>
            <CompactHrRow data={item} sortBy={sortBy} />
          </HrScrollReveal>
        ) : (
          <HrScrollReveal key={item.playerId} index={index} intrinsicHeight={200}>
            <ChunkACard data={item} sortBy={sortBy} />
          </HrScrollReveal>
        )
      )}
      {/* Sentinel — triggers next batch of 24 when it enters viewport */}
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
});

interface ChunkABoardProps {
  items: ChunkA[];
  viewMode?: 'card' | 'table';
  selectedTier?: TierType;
  sortBy?: 'score' | 'ev' | 'odds';
}

export const ChunkABoard = memo(function ChunkABoard({
  items,
  viewMode = 'card',
  selectedTier = 'all',
  sortBy = 'score',
}: ChunkABoardProps) {
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({
    very_high: false,
    high: false,
    moderate: false,
  });

  const toggleCollapse = (tier: string) => {
    setCollapsedTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  // Group items by confidence tier
  const veryHighItems = items.filter((i) => i.score.hrIndex >= TIER_VERY_HIGH_MIN);
  const highItems = items.filter(
    (i) => i.score.hrIndex >= TIER_HIGH_MIN && i.score.hrIndex < TIER_VERY_HIGH_MIN
  );
  const moderateItems = items.filter((i) => i.score.hrIndex < TIER_HIGH_MIN);

  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <AuroraMaxRankedWorkspace
      title="Home Run Intelligence V10"
      subtitle="Zero-latency probability engine & tiered telemetry deck"
    >
      <div
        ref={parentRef}
        className="max-h-[calc(100vh-280px)] min-h-[500px] overflow-y-auto pr-1 mt-6 rounded-2xl scrollbar-thin scrollbar-thumb-white/10"
        style={{ overscrollBehavior: 'contain' }}
      >
        {selectedTier === 'all' ? (
          <div className="flex flex-col gap-6">
            {/* Tier 1: Very High */}
            {veryHighItems.length > 0 && (
              <div>
                <TierSectionHeader
                  tierName="very_high"
                  items={veryHighItems}
                  isCollapsed={collapsedTiers.very_high}
                  onToggleCollapse={() => toggleCollapse('very_high')}
                />
                {!collapsedTiers.very_high && (
                  <ChunkATierSection items={veryHighItems} viewMode={viewMode} sortBy={sortBy} />
                )}
              </div>
            )}

            {/* Tier 2: High */}
            {highItems.length > 0 && (
              <div>
                <TierSectionHeader
                  tierName="high"
                  items={highItems}
                  isCollapsed={collapsedTiers.high}
                  onToggleCollapse={() => toggleCollapse('high')}
                />
                {!collapsedTiers.high && (
                  <ChunkATierSection items={highItems} viewMode={viewMode} sortBy={sortBy} />
                )}
              </div>
            )}

            {/* Tier 3: Moderate */}
            {moderateItems.length > 0 && (
              <div>
                <TierSectionHeader
                  tierName="moderate"
                  items={moderateItems}
                  isCollapsed={collapsedTiers.moderate}
                  onToggleCollapse={() => toggleCollapse('moderate')}
                />
                {!collapsedTiers.moderate && (
                  <ChunkATierSection items={moderateItems} viewMode={viewMode} sortBy={sortBy} />
                )}
              </div>
            )}
          </div>
        ) : (
          /* Single Filtered Tier */
          <ChunkATierSection items={items} viewMode={viewMode} sortBy={sortBy} />
        )}
      </div>
    </AuroraMaxRankedWorkspace>
  );
});
