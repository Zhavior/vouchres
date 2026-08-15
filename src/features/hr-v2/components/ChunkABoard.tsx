import React, { useRef, useState, useMemo, useCallback, useEffect, memo } from 'react';
import { ChunkA } from '../api/contracts';
import { ChunkACard } from './ChunkACard';
import { CompactHrRow } from './CompactHrRow';
import { TierSectionHeader } from './TierSectionHeader';
import { MatchupSectionHeader } from './MatchupSectionHeader';
import { GameMatchupSliderNav, GameSliderItem } from './GameMatchupSliderNav';
import { DeepResearchDrawer } from './DeepResearchDrawer';
import { useDeepResearch } from '../hooks/useDeepResearch';
import { TierType } from './TierFilterTabs';
import { AuroraMaxRankedWorkspace } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { TIER_VERY_HIGH_MIN, TIER_HIGH_MIN } from '../constants';
import { useProgressiveRender } from '../../../hooks/useProgressiveRender';

export type GroupByOption = 'matchup' | 'tier';

/* ─── ChunkATierSection ───
 * Renders continuous, preloaded rows from memory.
 * Eliminates scroll opacity delays and deloading flicker.
 */
const ChunkATierSection = memo(function ChunkATierSection({
  items,
  viewMode,
  sortBy,
  onOpenResearch,
}: {
  items: ChunkA[];
  viewMode: 'card' | 'table';
  sortBy: 'score' | 'ev' | 'odds';
  onOpenResearch?: (item: ChunkA) => void;
}) {
  // Eager in-memory rendering for standard sections (<= 40 items)
  // Progressive 1500px buffered expansion for massive 100+ lists
  const [visibleItems, sentinelRef] = useProgressiveRender(items, 60, 40);
  const displayItems = items.length <= 40 ? items : visibleItems;

  return (
    <div
      className="flex flex-col gap-3 mt-3"
      style={{ contain: 'layout style paint' }}
    >
      {displayItems.map((item) =>
        viewMode === 'table' ? (
          <CompactHrRow
            key={item.playerId}
            data={item}
            sortBy={sortBy}
            onOpenResearch={onOpenResearch}
          />
        ) : (
          <ChunkACard
            key={item.playerId}
            data={item}
            sortBy={sortBy}
            onOpenResearch={onOpenResearch}
          />
        )
      )}
      {items.length > 40 && <div ref={sentinelRef} aria-hidden="true" />}
    </div>
  );
});

interface ChunkABoardProps {
  items: ChunkA[];
  viewMode?: 'card' | 'table';
  selectedTier?: TierType;
  groupBy?: GroupByOption;
  sortBy?: 'score' | 'ev' | 'odds';
}

interface GameMatchupGroup {
  gameId: string;
  awayTeam: string;
  homeTeam: string;
  gameTime: string;
  timestamp: number;
  lifecycle: string;
  stadiumName?: string;
  items: ChunkA[];
}

export const ChunkABoard = memo(function ChunkABoard({
  items,
  viewMode = 'card',
  selectedTier = 'all',
  groupBy = 'matchup',
  sortBy = 'score',
}: ChunkABoardProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeGameIndex, setActiveGameIndex] = useState<number>(-1); // -1 = All Slate, 0..N-1 = Specific Game Slide
  const [activeResearchPlayer, setActiveResearchPlayer] = useState<ChunkA | null>(null);

  // Single Hoisted Deep Research Subscription at the board root
  const { chunkC, loading: isLoadingC } = useDeepResearch(
    activeResearchPlayer?.playerId || '',
    Boolean(activeResearchPlayer)
  );

  const handleOpenResearch = useCallback((item: ChunkA) => {
    setActiveResearchPlayer(item);
  }, []);

  const handleCloseResearch = useCallback(() => {
    setActiveResearchPlayer(null);
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Group items by chronological Game Matchups
  const gameMatchups = useMemo<GameMatchupGroup[]>(() => {
    const gameMap = new Map<string, GameMatchupGroup>();

    for (const item of items) {
      const gState = item.gameState;
      const teamAbbr = item.identity?.teamAbbreviation || 'MLB';
      const oppTeam = item.opponentTeamId || 'OPP';
      const gameId = gState?.gameId || `${teamAbbr}_${oppTeam}`;
      const gameTime = gState?.gameTime || item.gameTime || '';
      const parsedTime = Date.parse(gameTime);
      const timestamp = Number.isFinite(parsedTime) ? parsedTime : Number.MAX_SAFE_INTEGER;

      // Determine home vs away team identifiers
      const homeTeam = gState?.homeTeamId || (oppTeam !== teamAbbr ? oppTeam : teamAbbr);
      const awayTeam = gState?.awayTeamId || (teamAbbr !== homeTeam ? teamAbbr : oppTeam);

      let group = gameMap.get(gameId);
      if (!group) {
        group = {
          gameId,
          awayTeam,
          homeTeam,
          gameTime,
          timestamp,
          lifecycle: gState?.lifecycle || 'scheduled',
          stadiumName: gState?.stadiumId,
          items: [],
        };
        gameMap.set(gameId, group);
      }
      group.items.push(item);
    }

    // Sort strictly chronologically: earliest game of the day (lowest timestamp) first!
    return Array.from(gameMap.values()).sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return a.gameId.localeCompare(b.gameId);
    });
  }, [items]);

  // Convert to lightweight slider items
  const sliderItems = useMemo<GameSliderItem[]>(() => {
    return gameMatchups.map((g) => ({
      gameId: g.gameId,
      awayTeam: g.awayTeam,
      homeTeam: g.homeTeam,
      gameTime: g.gameTime,
      lifecycle: g.lifecycle,
      count: g.items.length,
    }));
  }, [gameMatchups]);

  // Slide navigation handlers
  const handlePrevGame = useCallback(() => {
    if (gameMatchups.length === 0) return;
    setActiveGameIndex((prev) => {
      if (prev <= 0) return gameMatchups.length - 1;
      return prev - 1;
    });
  }, [gameMatchups.length]);

  const handleNextGame = useCallback(() => {
    if (gameMatchups.length === 0) return;
    setActiveGameIndex((prev) => {
      if (prev === -1 || prev >= gameMatchups.length - 1) return 0;
      return prev + 1;
    });
  }, [gameMatchups.length]);

  // Global keybindings: ArrowLeft / ArrowRight to slide games
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevGame();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevGame, handleNextGame]);

  // Group items by confidence tier
  const veryHighItems = useMemo(
    () => items.filter((i) => (i.score?.hrIndex ?? 0) >= TIER_VERY_HIGH_MIN),
    [items]
  );
  const highItems = useMemo(
    () =>
      items.filter(
        (i) =>
          (i.score?.hrIndex ?? 0) >= TIER_HIGH_MIN &&
          (i.score?.hrIndex ?? 0) < TIER_VERY_HIGH_MIN
      ),
    [items]
  );
  const moderateItems = useMemo(
    () => items.filter((i) => (i.score?.hrIndex ?? 0) < TIER_HIGH_MIN),
    [items]
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const showGameSlider = groupBy === 'matchup' || viewMode === 'table';

  return (
    <AuroraMaxRankedWorkspace
      title="Home Run Intelligence V10"
      subtitle="Zero-latency probability engine & tiered telemetry deck"
    >
      {/* Game Matchup Carousel Slider (Supports Left / Right Arrow Keybindings) */}
      {showGameSlider && gameMatchups.length > 0 && (
        <GameMatchupSliderNav
          games={sliderItems}
          activeIndex={activeGameIndex}
          onSelectIndex={setActiveGameIndex}
          onPrev={handlePrevGame}
          onNext={handleNextGame}
        />
      )}

      <div
        ref={parentRef}
        className="max-h-[calc(100vh-280px)] min-h-[500px] overflow-y-auto pr-1 rounded-2xl scrollbar-thin scrollbar-thumb-white/10"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* SINGLE ACTIVE SLIDE MODE */}
        {showGameSlider && activeGameIndex >= 0 && gameMatchups[activeGameIndex] ? (
          <div key={gameMatchups[activeGameIndex].gameId} className="animate-in fade-in duration-200">
            <MatchupSectionHeader
              gameId={gameMatchups[activeGameIndex].gameId}
              gameIndex={activeGameIndex + 1}
              totalGames={gameMatchups.length}
              awayTeam={gameMatchups[activeGameIndex].awayTeam}
              homeTeam={gameMatchups[activeGameIndex].homeTeam}
              gameTime={gameMatchups[activeGameIndex].gameTime}
              lifecycle={gameMatchups[activeGameIndex].lifecycle}
              stadiumName={gameMatchups[activeGameIndex].stadiumName}
              items={gameMatchups[activeGameIndex].items}
              isCollapsed={false}
              onToggleCollapse={() => {}}
            />
            <ChunkATierSection
              items={gameMatchups[activeGameIndex].items}
              viewMode={viewMode}
              sortBy={sortBy}
              onOpenResearch={handleOpenResearch}
            />
          </div>
        ) : groupBy === 'matchup' ? (
          /* GROUP BY MATCHUPS / TEAMS (Chronological: first game of the day to later games) */
          <div className="flex flex-col gap-6">
            {gameMatchups.map((game, index) => {
              const isCollapsed = Boolean(collapsedSections[game.gameId]);
              return (
                <div key={game.gameId}>
                  <MatchupSectionHeader
                    gameId={game.gameId}
                    gameIndex={index + 1}
                    totalGames={gameMatchups.length}
                    awayTeam={game.awayTeam}
                    homeTeam={game.homeTeam}
                    gameTime={game.gameTime}
                    lifecycle={game.lifecycle}
                    stadiumName={game.stadiumName}
                    items={game.items}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => toggleCollapse(game.gameId)}
                  />
                  {!isCollapsed && (
                    <ChunkATierSection
                      items={game.items}
                      viewMode={viewMode}
                      sortBy={sortBy}
                      onOpenResearch={handleOpenResearch}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : selectedTier === 'all' ? (
          /* GROUP BY CONFIDENCE TIERS (Tier 1 -> Tier 2 -> Tier 3) */
          <div className="flex flex-col gap-6">
            {/* Tier 1: Very High */}
            {veryHighItems.length > 0 && (
              <div>
                <TierSectionHeader
                  tierName="very_high"
                  items={veryHighItems}
                  isCollapsed={Boolean(collapsedSections.very_high)}
                  onToggleCollapse={() => toggleCollapse('very_high')}
                />
                {!collapsedSections.very_high && (
                  <ChunkATierSection
                    items={veryHighItems}
                    viewMode={viewMode}
                    sortBy={sortBy}
                    onOpenResearch={handleOpenResearch}
                  />
                )}
              </div>
            )}

            {/* Tier 2: High */}
            {highItems.length > 0 && (
              <div>
                <TierSectionHeader
                  tierName="high"
                  items={highItems}
                  isCollapsed={Boolean(collapsedSections.high)}
                  onToggleCollapse={() => toggleCollapse('high')}
                />
                {!collapsedSections.high && (
                  <ChunkATierSection
                    items={highItems}
                    viewMode={viewMode}
                    sortBy={sortBy}
                    onOpenResearch={handleOpenResearch}
                  />
                )}
              </div>
            )}

            {/* Tier 3: Moderate */}
            {moderateItems.length > 0 && (
              <div>
                <TierSectionHeader
                  tierName="moderate"
                  items={moderateItems}
                  isCollapsed={Boolean(collapsedSections.moderate)}
                  onToggleCollapse={() => toggleCollapse('moderate')}
                />
                {!collapsedSections.moderate && (
                  <ChunkATierSection
                    items={moderateItems}
                    viewMode={viewMode}
                    sortBy={sortBy}
                    onOpenResearch={handleOpenResearch}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          /* Single Filtered Tier */
          <ChunkATierSection
            items={items}
            viewMode={viewMode}
            sortBy={sortBy}
            onOpenResearch={handleOpenResearch}
          />
        )}
      </div>

      {/* Single Hoisted Deep Research Drawer */}
      {activeResearchPlayer && (
        <DeepResearchDrawer
          isOpen={Boolean(activeResearchPlayer)}
          onClose={handleCloseResearch}
          data={activeResearchPlayer}
          chunkC={chunkC}
          isLoading={isLoadingC}
        />
      )}
    </AuroraMaxRankedWorkspace>
  );
});
