import React, { useRef, useState, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChunkA } from '../api/contracts';
import { ChunkACard } from './ChunkACard';
import { CompactHrRow } from './CompactHrRow';
import { TierSectionHeader } from './TierSectionHeader';
import { TierType } from './TierFilterTabs';
import { AuroraMaxRankedWorkspace } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { TIER_VERY_HIGH_MIN, TIER_HIGH_MIN } from '../constants';

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

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (viewMode === 'table' ? 76 : 190),
    overscan: 3,
  });

  return (
    <AuroraMaxRankedWorkspace
      title="Home Run Intelligence V10"
      subtitle="Zero-latency probability engine & tiered telemetry deck"
    >
      <div
        ref={parentRef}
        className="max-h-[calc(100vh-280px)] min-h-[500px] overflow-y-auto pr-1 mt-6 rounded-2xl scrollbar-thin scrollbar-thumb-white/10"
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
                  <div className="flex flex-col gap-3 mt-3">
                    {veryHighItems.map((item) =>
                      viewMode === 'table' ? (
                        <CompactHrRow key={item.playerId} data={item} sortBy={sortBy} />
                      ) : (
                        <ChunkACard key={item.playerId} data={item} sortBy={sortBy} />
                      )
                    )}
                  </div>
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
                  <div className="flex flex-col gap-3 mt-3">
                    {highItems.map((item) =>
                      viewMode === 'table' ? (
                        <CompactHrRow key={item.playerId} data={item} sortBy={sortBy} />
                      ) : (
                        <ChunkACard key={item.playerId} data={item} sortBy={sortBy} />
                      )
                    )}
                  </div>
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
                  <div className="flex flex-col gap-3 mt-3">
                    {moderateItems.map((item) =>
                      viewMode === 'table' ? (
                        <CompactHrRow key={item.playerId} data={item} sortBy={sortBy} />
                      ) : (
                        <ChunkACard key={item.playerId} data={item} sortBy={sortBy} />
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Single Filtered Tier with Virtualization */
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index];
              if (!item) return null;

              return (
                <div
                  key={item.playerId}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: viewMode === 'table' ? '8px' : '16px',
                  }}
                >
                  {viewMode === 'table' ? (
                    <CompactHrRow data={item} sortBy={sortBy} />
                  ) : (
                    <ChunkACard data={item} sortBy={sortBy} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuroraMaxRankedWorkspace>
  );
});
