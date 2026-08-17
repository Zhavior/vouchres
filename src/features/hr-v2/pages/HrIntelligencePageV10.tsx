import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  LayoutGrid,
  List,
  Kanban as KanbanIcon,
  Box,
  Radio,
  Wifi,
  Sparkles,
  Zap,
  Activity,
  Calendar,
  Layers,
  SlidersHorizontal,
  Crosshair,
  Flame,
} from 'lucide-react';
import { TierFilterTabs, TierType } from '../components/TierFilterTabs';
import { HrErrorBoundary } from '../components/HrErrorBoundary';
import { useHrSlateFeed } from '../hooks/useHrSlateFeed';
import { ChunkA } from '../api/contracts';
import {
  TIER_VERY_HIGH_MIN,
  TIER_HIGH_MIN,
  SLIDER_MIN_SCORE,
  SLIDER_MAX_SCORE,
  DEFAULT_MIN_SCORE,
  SEARCH_DEBOUNCE_MS,
  NOW_TICK_INTERVAL_MS,
  UPDATED_BADGE_DURATION_MS,
  SORT_DIFF_EPSILON,
  UNRANKED_FALLBACK,
  MAX_RETRY_ATTEMPTS,
} from '../constants';
import { AuroraMaxEyebrow } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { usePersistedState } from '../../../hooks/usePersistedState';
import { trackEvent } from '../../../lib/analytics';
import { STRINGS_EN } from '../stringsEn';
import { ChunkABoard, GroupByOption } from '../components/ChunkABoard';
import { KanbanView } from '../components/KanbanView';
import { HrStadium3DView } from '../components/HrStadium3DView';
import { AuroraHqHeaderNav } from '../../aurora-hr-hq/components/AuroraHqHeaderNav';
import { ChunkAEdgeDesk } from '../components/views/ChunkAEdgeDesk';
import { ChunkASlateStacks } from '../components/views/ChunkASlateStacks';
import { ChunkAProjectionMatrix } from '../components/views/ChunkAProjectionMatrix';
import { ChunkAMatchupExtremes } from '../components/views/ChunkAMatchupExtremes';

import { safeNumber } from '../../../utils/safeNumber';

export type ViewMode = 'card' | 'table' | 'kanban' | '3d' | 'edge' | 'stacks' | 'matrix' | 'extremes';
export type SortOption = 'score' | 'ev' | 'odds';

/**
 * Starters filter mode.
 * - 'starters': Show only confirmed_starter players (lineupStatus === 'confirmed_starter').
 * - 'all': Show full active roster (confirmed starters + roster-only players).
 */
export type StartersFilterMode = 'starters' | 'all';

export interface ViewOptionItem {
  key: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
}

export const VIEW_OPTIONS: ViewOptionItem[] = [
  {
    key: 'card',
    label: STRINGS_EN.views.card.label,
    icon: LayoutGrid,
    ariaLabel: STRINGS_EN.views.card.ariaLabel,
  },
  {
    key: 'table',
    label: STRINGS_EN.views.table.label,
    icon: List,
    ariaLabel: STRINGS_EN.views.table.ariaLabel,
  },
  {
    key: 'kanban',
    label: STRINGS_EN.views.kanban.label,
    icon: KanbanIcon,
    ariaLabel: STRINGS_EN.views.kanban.ariaLabel,
  },
  {
    key: '3d',
    label: STRINGS_EN.views.arena3d.label,
    icon: Box,
    ariaLabel: STRINGS_EN.views.arena3d.ariaLabel,
  },
  {
    key: 'edge',
    label: 'Edge',
    icon: Sparkles,
    ariaLabel: 'View Vegas Edge Desk',
  },
  {
    key: 'stacks',
    label: 'Stacks',
    icon: Layers,
    ariaLabel: 'View Team Stacks',
  },
  {
    key: 'matrix',
    label: 'Matrix',
    icon: Crosshair,
    ariaLabel: 'View Projection Matrix',
  },
  {
    key: 'extremes',
    label: 'Extremes',
    icon: Flame,
    ariaLabel: 'View Matchup Extremes',
  },
];

export interface FilterSlateOptions {
  selectedTier: TierType;
  searchQuery: string;
  minScore?: number;
  /**
   * When true, only players with lineupStatus === 'confirmed_starter' are shown.
   * Defaults to true for first-time users so the board surfaces real signal immediately
   * rather than overwhelming new users with 200-400+ roster-baseline players.
   */
  startersOnly: boolean;
}

/**
 * Defensive numeric extractor with fallback for non-finite or non-numeric inputs.
 * Re-exported from shared utils/safeNumber for full backwards compatibility.
 */
export { safeNumber };

/**
 * Validator and sanitizer for persisted viewMode ('card' | 'table' | 'kanban' | '3d' | 'edge' | 'stacks' | 'matrix' | 'extremes', default: 'card').
 */
export function validateViewMode(val: unknown): ViewMode {
  return val === 'card' || val === 'table' || val === 'kanban' || val === '3d' || val === 'edge' || val === 'stacks' || val === 'matrix' || val === 'extremes' ? val : 'card';
}

/**
 * Validator and sanitizer for persisted selectedTier ('all' | 'very_high' | 'high' | 'moderate', default: 'all').
 */
export function validateSelectedTier(val: unknown): TierType {
  return val === 'all' || val === 'very_high' || val === 'high' || val === 'moderate'
    ? val
    : 'all';
}

/**
 * Validator and sanitizer for persisted sortBy ('score' | 'ev' | 'odds', default: 'score').
 */
export function validateSortBy(val: unknown): SortOption {
  return val === 'score' || val === 'ev' || val === 'odds' ? val : 'score';
}

/**
 * Validator and sanitizer for persisted groupBy ('matchup' | 'tier', default: 'matchup').
 */
export function validateGroupBy(val: unknown): GroupByOption {
  return val === 'tier' ? 'tier' : 'matchup';
}

/**
 * Validator and sanitizer for persisted minScore (clamped within SLIDER_MIN_SCORE..SLIDER_MAX_SCORE, default: 60).
 */
export function validateMinScore(val: unknown): number {
  const num = safeNumber(val, DEFAULT_MIN_SCORE);
  if (num < SLIDER_MIN_SCORE) return SLIDER_MIN_SCORE;
  if (num > SLIDER_MAX_SCORE) return SLIDER_MAX_SCORE;
  return Math.round(num);
}

/**
 * Validator and sanitizer for persisted startersOnly boolean (default: true).
 * Defaults to true so first-time users see only confirmed starters (real signal)
 * rather than the full 200-400+ active roster (placeholder signal).
 */
export function validateStartersOnly(val: unknown): boolean {
  if (val === true || val === false) return val;
  // Coerce from localStorage string 'true'/'false'
  if (val === 'true') return true;
  if (val === 'false') return false;
  // First-time users get starters-only ON by default
  return true;
}

/**
 * Security sanitizer for user-facing telemetry and error displays.
 * Strips stack traces, internal URLs, file paths, API tokens, and credentials.
 */
export function sanitizeErrorMessage(rawError: unknown): string {
  if (!rawError) return 'Unknown telemetry error';
  const message =
    rawError instanceof Error
      ? rawError.message
      : typeof rawError === 'string'
        ? rawError
        : String(rawError);

  // Take only top-level message line (strip multiline stack traces)
  let clean = message.split('\n')[0].trim();

  // Redact internal file paths (e.g. /Users/..., /var/..., node_modules/...)
  clean = clean.replace(/(?:\/[a-zA-Z0-9._-]+){2,}/g, '[path]');

  // Redact URLs (http://, https://, postgres://, etc.)
  clean = clean.replace(/[a-zA-Z]+:\/\/[^\s]+/g, '[url]');

  // Redact credentials, tokens, api keys (e.g. token=xyz, bearer xyz, key: 123)
  clean = clean.replace(/\b(?:key|token|secret|password|bearer|auth_key)[:=\s]+[a-zA-Z0-9._-]+/gi, '[redacted]');

  if (!clean || clean === '[path]' || clean === '[url]') {
    return 'A network or telemetry issue occurred. Please retry.';
  }

  return clean.slice(0, 150);
}

/**
 * Format relative elapsed time for stale data telemetry honestly returning 'Update time unavailable' when timestamps are absent.
 * Timezone-agnostic by construction: operates strictly on millisecond deltas between timestamps, independent of wall-clock timezone.
 */
export function formatTimeAgo(
  timestampMs: number | null | undefined,
  currentNowMs: number = Date.now(),
  timeStrings = STRINGS_EN.timeAgo
): string {
  if (!timestampMs || !Number.isFinite(timestampMs) || timestampMs <= 0) {
    return timeStrings.unavailable;
  }
  const seconds = Math.floor((currentNowMs - timestampMs) / 1000);
  if (seconds < 0) return timeStrings.unavailable;
  if (seconds < 5) return timeStrings.justNow;
  if (seconds < 60) return timeStrings.secondsAgo(seconds);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return timeStrings.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  return timeStrings.hoursAgo(hours);
}

/**
 * Calculate expected value (EV = hrIndex/100 - impliedProbability) with defensive bounds.
 */
export function calculateEV(item: ChunkA): number {
  if (!item || !item.odds) return 0;

  const hrIndex = safeNumber(item.score?.hrIndex, 0);
  const impliedProb = safeNumber(item.odds.impliedProbability, 0);

  if (impliedProb <= 0 || hrIndex <= 0) return 0;

  const ev = hrIndex / 100 - impliedProb;
  return safeNumber(ev, 0);
}

/**
 * Pure filter predicate evaluating tier, search query (name/team/opp), optional min score,
 * and the Starters Only toggle.
 *
 * Volume ceiling note (tested 2026-08-13): ~13-15 roster hitters per team, ~230-400+ total
 * on a typical slate. Debounced search + memoized useMemo wrapping this predicate confirm
 * acceptable scroll performance at 400-player scale with content-visibility:auto on card containers.
 */
export interface StartersFilterResolution {
  applyStartersOnly: boolean;
  showingProjectedPreview: boolean;
}

/**
 * Same contract as hr_max / Z8 `useHrBoardViewModel`: do not render an empty
 * confirmed-only desk when the validated board already has a projected pool.
 * Starters-only still applies once any official lineup row exists.
 */
export function resolveStartersOnlyFilter(
  startersOnly: boolean,
  confirmedStarterCount: number,
  slateCount: number,
): StartersFilterResolution {
  if (!startersOnly) {
    return { applyStartersOnly: false, showingProjectedPreview: false };
  }
  if (confirmedStarterCount === 0 && slateCount > 0) {
    return { applyStartersOnly: false, showingProjectedPreview: true };
  }
  return { applyStartersOnly: true, showingProjectedPreview: false };
}

export function filterSlateItem(item: ChunkA, options: FilterSlateOptions): boolean {
  if (!item || !item.score) return false;
  const { selectedTier, searchQuery, minScore, startersOnly } = options;

  // Starters-only filter: applied first as it's the most selective and cheapest check
  if (startersOnly && item.lineupStatus !== 'confirmed_starter') return false;

  const hrpiScore = safeNumber(item.score.hrIndex, 0);

  // Tier filter (only applies when not in Kanban, or can pre-filter Kanban)
  if (selectedTier === 'very_high' && hrpiScore < TIER_VERY_HIGH_MIN) return false;
  if (
    selectedTier === 'high' &&
    (hrpiScore < TIER_HIGH_MIN || hrpiScore >= TIER_VERY_HIGH_MIN)
  ) {
    return false;
  }
  if (selectedTier === 'moderate' && hrpiScore >= TIER_HIGH_MIN) return false;

  // Search filter (player name, team abbreviation, or opponent)
  const q = typeof searchQuery === 'string' ? searchQuery.toLowerCase().trim() : '';
  const playerName = item.identity?.name?.toLowerCase() ?? '';
  const teamAbbr = item.identity?.teamAbbreviation?.toLowerCase() ?? '';
  const opponentId = item.opponentTeamId?.toLowerCase() ?? '';

  const matchesQuery =
    !q ||
    playerName.includes(q) ||
    teamAbbr.includes(q) ||
    opponentId.includes(q);

  // Score threshold filter (if minScore is explicitly provided)
  const validMinScore = safeNumber(minScore, DEFAULT_MIN_SCORE);
  const matchesScore =
    selectedTier !== 'all'
      ? true
      : minScore !== undefined
        ? hrpiScore >= validMinScore
        : true;

  return Boolean(matchesQuery && matchesScore);
}

/**
 * Pure, deterministic sort comparator with tie-breakers (primary -> hrIndex -> rank -> playerId).
 */
export function sortSlateItems(a: ChunkA, b: ChunkA, sortBy: SortOption): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  let diff: number;

  if (sortBy === 'ev') {
    const evA = calculateEV(a);
    const evB = calculateEV(b);
    diff = evB - evA;
  } else if (sortBy === 'odds') {
    const priceA = safeNumber(a.odds?.price, 0);
    const priceB = safeNumber(b.odds?.price, 0);
    diff = priceB - priceA;
  } else {
    const scoreA = safeNumber(a.score?.hrIndex, 0);
    const scoreB = safeNumber(b.score?.hrIndex, 0);
    diff = scoreB - scoreA;
  }

  // Primary difference is significant
  if (Math.abs(diff) > SORT_DIFF_EPSILON) {
    return diff;
  }

  // Fallback tie-breaker 1: HRPI score descending
  const tieScoreA = safeNumber(a.score?.hrIndex, 0);
  const tieScoreB = safeNumber(b.score?.hrIndex, 0);
  const scoreDiff = tieScoreB - tieScoreA;
  if (scoreDiff !== 0) return scoreDiff;

  // Fallback tie-breaker 2: Slate rank ascending
  const rankA = safeNumber(a.rank, UNRANKED_FALLBACK);
  const rankB = safeNumber(b.rank, UNRANKED_FALLBACK);
  const rankDiff = rankA - rankB;
  if (rankDiff !== 0) return rankDiff;

  // Fallback tie-breaker 3: Deterministic alphanumeric playerId compare
  return (a.playerId || '').localeCompare(b.playerId || '');
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-full overflow-hidden" aria-label={STRINGS_EN.states.loadingAriaLabel}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse bg-slate-900/60 h-44 rounded-2xl border border-white/5 p-4 sm:p-5 flex flex-col justify-between w-full max-w-full overflow-hidden"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 w-2/5 min-w-[80px] bg-white/10 rounded" />
              <div className="h-3 w-1/4 min-w-[60px] bg-white/5 rounded" />
            </div>
          </div>
          <div className="h-8 w-full bg-white/5 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/**
 * HrIntelligencePageV10 (HR Intelligence Command Desk)
 *
 * Primary enterprise command desk for Aurora HQ probability models and calibrated MLB home run slate telemetry.
 *
 * @dataSource useHrSlateFeed — same `/api/mlb/hr-board/today` query as hr_max / Aurora HQ.
 * @viewModes 'card' (rich statistical cards), 'table' (dense metrics rows), 'kanban' (probability tier lanes).
 * @persistedState Owned keys (prefix `ve_hr_v10_*`):
 *  - `ve_hr_v10_viewMode` ('card' | 'table' | 'kanban')
 *  - `ve_hr_v10_selectedTier` ('all' | 'very_high' | 'high' | 'moderate')
 *  - `ve_hr_v10_minScore` (50..90 clamped threshold, default: 60)
 *  - `ve_hr_v10_sortBy` ('score' | 'ev' | 'odds')
 *  - `ve_hr_v10_startersOnly` (boolean, default: true) — hides roster-only players until lineups post
 */

export function HrIntelligencePageV10({ onNavigate }: { onNavigate?: (section: string) => void } = {}) {
  const {
    data,
    loading,
    error,
    isRetrying,
    isFailed,
    failureCount,
    dataUpdatedAt,
    refetch,
    isLastGood = false,
  } = useHrSlateFeed();

  // =========================================================================
  // State Architecture:
  // - Ephemeral State: searchQuery (immediate controlled input text),
  //                    now (5s tick trigger for relative time freshness),
  //                    showUpdatedBadge (4s transient badge on live feed update).
  // - Persisted State (localStorage: ve_hr_v10_*):
  //                    viewMode ('card' | 'table' | 'kanban'),
  //                    selectedTier ('all' | 'very_high' | 'high' | 'moderate'),
  //                    minScore (50..90 score slider boundary),
  //                    sortBy ('score' | 'ev' | 'odds').
  // - Derived State (pure computation / useMemo):
  //                    lastUpdatedTimestamp (from dataUpdatedAt / feed items),
  //                    timeAgoText (from lastUpdatedTimestamp and now tick),
  //                    debouncedSearchQuery (250ms debounced input),
  //                    isFilteringPending (searchQuery !== debouncedSearchQuery),
  //                    tierCounts (per-tier distribution of slate items),
  //                    processedData (filtered and deterministically sorted items),
  //                    liveStatusAnnouncement (screen-reader accessible text).
  // - Ref-Guarded Tracking:
  //                    prevDataUpdatedAtRef (suppresses initial mount pulse),
  //                    wasRetryingRef (tracks retry-to-recovery transitions),
  //                    prevIsFailedRef (deduplicates error telemetry dispatches),
  //                    viewButtonRefs (manages accessible keyboard focus rings).
  // =========================================================================

  // Slate controls state with validation & persistence across refreshes
  const [viewMode, setViewMode] = usePersistedState<ViewMode>(
    've_hr_v10_viewMode',
    'card',
    validateViewMode
  );
  const [selectedTier, setSelectedTier] = usePersistedState<TierType>(
    've_hr_v10_selectedTier',
    'all',
    validateSelectedTier
  );
  const [groupBy, setGroupBy] = usePersistedState<GroupByOption>(
    've_hr_v10_groupBy',
    'matchup',
    validateGroupBy
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = usePersistedState<SortOption>(
    've_hr_v10_sortBy',
    'score',
    validateSortBy
  );
  // Starters Only: defaults to true — first-time users see only confirmed lineup starters
  // (real signal) rather than 200-400+ full-roster placeholder players.
  const [startersOnly, setStartersOnly] = usePersistedState<boolean>(
    've_hr_v10_startersOnly',
    true,
    validateStartersOnly
  );

  const handleStartersOnlyToggle = useCallback(() => {
    setStartersOnly((prev) => !prev);
  }, [setStartersOnly]);

  // Relative time tick for stale data indicator
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), NOW_TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Compute feed last-updated timestamp honestly (null if unavailable)
  const lastUpdatedTimestamp = useMemo<number | null>(() => {
    if (typeof dataUpdatedAt === 'number' && Number.isFinite(dataUpdatedAt) && dataUpdatedAt > 0) {
      return dataUpdatedAt;
    }
    if (data.length > 0 && typeof data[0]?.updatedAt === 'string') {
      const parsed = Date.parse(data[0].updatedAt);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  }, [dataUpdatedAt, data]);

  const timeAgoText = useMemo(() => {
    return formatTimeAgo(lastUpdatedTimestamp, now);
  }, [lastUpdatedTimestamp, now]);

  // Passive "Slate updated" telemetry banner when background polling fetches new data
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(false);
  const prevDataUpdatedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      dataUpdatedAt &&
      prevDataUpdatedAtRef.current &&
      dataUpdatedAt > prevDataUpdatedAtRef.current
    ) {
      setShowUpdatedBadge(true);
      const timer = setTimeout(() => setShowUpdatedBadge(false), UPDATED_BADGE_DURATION_MS);
      prevDataUpdatedAtRef.current = dataUpdatedAt;
      return () => clearTimeout(timer);
    }
    if (dataUpdatedAt) {
      prevDataUpdatedAtRef.current = dataUpdatedAt;
    }
  }, [dataUpdatedAt]);

  // Telemetry: Track feed failure and retry recovery transitions without duplicate spamming
  const wasRetryingRef = useRef(false);
  const prevIsFailedRef = useRef(false);

  useEffect(() => {
    try {
      // Transition to isFailed: true (fires once per distinct failure state)
      if (isFailed && !prevIsFailedRef.current) {
        const errorMsg = sanitizeErrorMessage(error);

        trackEvent('hr_feed_failed', {
          feature: 'hr_intelligence_v10',
          failureCount,
          errorMessage: errorMsg,
        });
      }
      prevIsFailedRef.current = isFailed;

      // Transition from isRetrying: true -> loaded successfully (once per recovery)
      if (wasRetryingRef.current && !isRetrying && !error && data.length > 0) {
        trackEvent('hr_feed_retry_recovered', {
          feature: 'hr_intelligence_v10',
          recoveredAfterAttempts: failureCount,
          playerCount: data.length,
        });
        wasRetryingRef.current = false;
      } else if (isRetrying) {
        wasRetryingRef.current = true;
      }
    } catch {
      // Telemetry errors must never crash or block UI rendering
    }
  }, [isFailed, isRetrying, error, data.length, failureCount]);

  // Debounce search input to avoid re-filtering the entire slate on every keystroke
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const isFilteringPending = searchQuery !== debouncedSearchQuery;

  // Button refs for keyboard navigation in view toggle group
  const viewButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  const handleViewModeKeyDown = useCallback(
    (e: React.KeyboardEvent, currentKey: ViewMode) => {
      const currentIndex = VIEW_OPTIONS.findIndex((v) => v.key === currentKey);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % VIEW_OPTIONS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + VIEW_OPTIONS.length) % VIEW_OPTIONS.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = VIEW_OPTIONS.length - 1;
      }

      if (nextIndex !== -1) {
        const nextMode = VIEW_OPTIONS[nextIndex].key;
        setViewMode(nextMode);
        viewButtonRefs.current[nextMode]?.focus();
      }
    },
    [setViewMode]
  );

  const handleSelectTier = useCallback(
    (tier: TierType) => {
      setSelectedTier(tier);
    },
    [setSelectedTier]
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSortBy(e.target.value as SortOption);
    },
    [setSortBy]
  );

  const handleResetFilters = useCallback(() => {
    setSelectedTier('all');
    setSearchQuery('');
  }, [setSelectedTier]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Compute live tier counts from raw data
  const tierCounts = useMemo(() => {
    return {
      all: data.length,
      very_high: data.filter((i) => (i.score?.hrIndex ?? 0) >= TIER_VERY_HIGH_MIN).length,
      high: data.filter(
        (i) =>
          (i.score?.hrIndex ?? 0) >= TIER_HIGH_MIN &&
          (i.score?.hrIndex ?? 0) < TIER_VERY_HIGH_MIN
      ).length,
      moderate: data.filter((i) => (i.score?.hrIndex ?? 0) < TIER_HIGH_MIN).length,
    };
  }, [data]);

  // Total confirmed starters across the full (unfiltered) dataset — for count indicator
  const confirmedStarterCount = useMemo(
    () => data.filter((i) => i.lineupStatus === 'confirmed_starter').length,
    [data]
  );

  const startersFilter = useMemo(
    () => resolveStartersOnlyFilter(startersOnly, confirmedStarterCount, data.length),
    [startersOnly, confirmedStarterCount, data.length],
  );

  // Filter & Sort slate dataset
  // Volume ceiling note: tested at ~400 players; debounced search + memoized filter
  // confirm acceptable performance. content-visibility:auto on card containers handles
  // DOM-level paint budget for off-screen nodes.
  const processedData = useMemo(() => {
    return data
      .filter((item) =>
        filterSlateItem(item, {
          selectedTier,
          searchQuery: debouncedSearchQuery,
          startersOnly: startersFilter.applyStartersOnly,
        })
      )
      .sort((a, b) => sortSlateItems(a, b, sortBy));
  }, [data, selectedTier, debouncedSearchQuery, sortBy, startersFilter.applyStartersOnly]);

  // Accessible live status message for screen readers
  const liveStatusAnnouncement = useMemo(() => {
    if (isRetrying) {
      return STRINGS_EN.liveAnnouncements.retrying(failureCount, MAX_RETRY_ATTEMPTS);
    }
    if (error && data.length === 0) {
      return STRINGS_EN.liveAnnouncements.error;
    }
    if (data.length > 0) {
      const updateMsg =
        lastUpdatedTimestamp && timeAgoText !== STRINGS_EN.timeAgo.unavailable
          ? STRINGS_EN.header.badges.updatedPrefix(timeAgoText)
          : STRINGS_EN.header.badges.timeUnavailable;
      return STRINGS_EN.liveAnnouncements.loaded(
        processedData.length,
        data.length,
        updateMsg
      );
    }
    return STRINGS_EN.liveAnnouncements.loading;
  }, [
    isRetrying,
    failureCount,
    error,
    data.length,
    processedData.length,
    lastUpdatedTimestamp,
    timeAgoText,
  ]);

  return (
    <HrErrorBoundary fallbackTitle={STRINGS_EN.states.errorBoundaryFallbackTitle}>
      <div className="ve-page text-white">
        {/* Polite Live Region for Screen Readers */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {liveStatusAnnouncement}
        </div>

        <main id="main-content" className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {onNavigate && (
            <div className="mb-4 flex items-center">
              <AuroraHqHeaderNav activeSection="hr_v10" onNavigate={onNavigate} />
            </div>
          )}
          {/* Glassmorphic Page Header Hero */}
          <header className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-5 sm:p-7 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all">
            {/* Ambient Mesh Glows */}
            <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/3 h-40 w-60 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-3xl" />

            <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-emerald-300 text-xs font-mono font-bold tracking-wider uppercase mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#00d9a0]" />
                  {STRINGS_EN.header.eyebrow}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                  {STRINGS_EN.header.title}
                </h1>
                <p className="text-white/60 mt-1.5 text-xs sm:text-sm font-normal leading-relaxed">
                  {STRINGS_EN.header.subtitle}
                </p>
              </div>

              {/* Translucent Live Telemetry & Feed Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {showUpdatedBadge && (
                  <span className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold animate-pulse motion-reduce:animate-none shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    {STRINGS_EN.header.badges.slateUpdated}
                  </span>
                )}
                {isRetrying && (
                  <span className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-mono font-bold animate-pulse motion-reduce:animate-none shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                    {STRINGS_EN.header.badges.reconnecting(failureCount, MAX_RETRY_ATTEMPTS)}
                  </span>
                )}
                <span className="whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  {STRINGS_EN.header.badges.liveEngine}
                </span>
                {data.length > 0 && !isFailed && (
                  <span className="whitespace-nowrap hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    {isLastGood
                      ? STRINGS_EN.header.badges.mlbFeedLastGood
                      : STRINGS_EN.header.badges.mlbFeedConnected}
                  </span>
                )}
                {startersFilter.showingProjectedPreview && (
                  <span className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 backdrop-blur-md border border-amber-500/30 text-amber-200 text-xs font-mono font-bold">
                    {STRINGS_EN.header.badges.previewMode}
                  </span>
                )}
                {/* Honest stale data / last-updated indicator (viewer's local timezone) */}
                <span
                  className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-md border border-white/10 text-white/70 text-xs font-mono tabular-nums"
                  title={
                    lastUpdatedTimestamp
                      ? STRINGS_EN.header.badges.tooltipLastUpdated(
                          new Date(lastUpdatedTimestamp).toLocaleTimeString()
                        )
                      : STRINGS_EN.header.badges.tooltipUnavailable
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block" />
                  {lastUpdatedTimestamp && timeAgoText !== STRINGS_EN.timeAgo.unavailable
                    ? STRINGS_EN.header.badges.updatedPrefix(timeAgoText)
                    : STRINGS_EN.header.badges.timeUnavailable}
                </span>
              </div>
            </div>
          </header>

          {startersFilter.showingProjectedPreview && (
            <div
              role="status"
              className="mb-4 rounded-2xl border border-amber-400/35 bg-amber-500/10 backdrop-blur-xl px-4 py-3 text-amber-100 shadow-lg"
            >
              <p className="text-xs font-black uppercase tracking-wider">
                {STRINGS_EN.previewBanner.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-100/80">
                {STRINGS_EN.previewBanner.body}
              </p>
            </div>
          )}

          {/* Tier Filter Quick-Tabs */}
          <div className="mb-4">
            <TierFilterTabs
              counts={tierCounts}
              selectedTier={selectedTier}
              onSelectTier={handleSelectTier}
            />
          </div>

          {/* Starters Only Toggle + Count Indicator */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <button
              id="starters-only-toggle"
              type="button"
              onClick={handleStartersOnlyToggle}
              aria-pressed={startersOnly}
              aria-label={
                startersFilter.showingProjectedPreview
                  ? STRINGS_EN.controls.previewUntilLineupsAria
                  : startersOnly
                    ? STRINGS_EN.controls.startersOnlyAria
                    : STRINGS_EN.controls.fullRosterAria
              }
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold font-mono transition-all backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-vouch-cyan ${
                startersOnly
                  ? startersFilter.showingProjectedPreview
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                startersOnly
                  ? startersFilter.showingProjectedPreview
                    ? 'bg-amber-300'
                    : 'bg-emerald-400'
                  : 'bg-white/30'
              }`} />
              {startersFilter.showingProjectedPreview
                ? STRINGS_EN.controls.previewUntilLineups
                : startersOnly
                  ? STRINGS_EN.controls.startersOnly
                  : STRINGS_EN.controls.fullRoster}
            </button>
            <span className="text-xs font-mono text-white/50 tabular-nums">
              Showing{' '}
              <strong className="text-white/80">{processedData.length}</strong>
              {' '}of{' '}
              <strong className="text-white/80">{data.length}</strong>
              {' '}
              {startersFilter.showingProjectedPreview
                ? STRINGS_EN.controls.showingProjectedPool
                : STRINGS_EN.controls.showingActiveRoster}
              {startersOnly && (
                <span className="ml-1.5 text-emerald-300/80 font-bold">
                  {STRINGS_EN.controls.confirmedStartersCount(confirmedStarterCount)}
                </span>
              )}
            </span>
          </div>

          {/* View Switcher & Slate Filtering Controls */}
          <section
            aria-label="Slate filters"
            className="mb-6 p-3 sm:p-4 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.24)]"
          >
            {/* Row 1 on mobile: View Toggle + Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
              {/* 4-Way View Mode Toggle: Card | Table | Kanban | 3D with Lucide Icons and Translucent Glass */}
              <div
                className="flex items-center justify-between sm:justify-start gap-1 bg-black/40 backdrop-blur-xl p-1 rounded-xl border border-white/10 shrink-0"
                role="group"
                aria-label={STRINGS_EN.views.groupAriaLabel}
              >
                {VIEW_OPTIONS.map(({ key, label, icon: IconComp, ariaLabel }) => {
                  const isActive = viewMode === key;
                  return (
                    <button
                      key={key}
                      ref={(el) => {
                        viewButtonRefs.current[key] = el;
                      }}
                      type="button"
                      onClick={() => handleViewModeChange(key)}
                      onKeyDown={(e) => handleViewModeKeyDown(e, key)}
                      aria-label={ariaLabel}
                      aria-pressed={isActive}
                      className={`min-h-[38px] sm:min-h-0 flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-vouch-cyan ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Input with Debounce Pending Micro-indicator & iOS Safari clear-button spacing */}
              <div className="relative flex-1 min-w-0 sm:max-w-xs">
                <input
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-label={STRINGS_EN.controls.searchAriaLabel}
                  placeholder={STRINGS_EN.controls.searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-3.5 pr-24 py-2 sm:py-1.5 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/10 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400/60 focus:bg-white/[0.06] transition-all [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                />
                {isFilteringPending && (
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1 animate-pulse motion-reduce:animate-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping motion-reduce:animate-none inline-block" />
                    {STRINGS_EN.controls.filteringPending}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2 on mobile / Right column on desktop: Group By & Sort By Selector */}
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3.5 border-t sm:border-t-0 border-white/5 pt-2.5 sm:pt-0 max-w-full">
              {/* Group By Selector (Matchup / Teams vs Tiers) */}
              {(viewMode === 'card' || viewMode === 'table') && (
                <div
                  className="flex items-center gap-1 bg-black/40 backdrop-blur-xl p-1 rounded-xl border border-white/10 shrink-0"
                  role="group"
                  aria-label={STRINGS_EN.grouping.groupAriaLabel}
                >
                  <button
                    id="group-by-matchup-btn"
                    type="button"
                    onClick={() => setGroupBy('matchup')}
                    aria-pressed={groupBy === 'matchup'}
                    aria-label={STRINGS_EN.grouping.matchup.ariaLabel}
                    className={`min-h-[30px] flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-vouch-cyan ${
                      groupBy === 'matchup'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{STRINGS_EN.grouping.matchup.label}</span>
                    <span className="sm:hidden">Matchups</span>
                  </button>
                  <button
                    id="group-by-tier-btn"
                    type="button"
                    onClick={() => setGroupBy('tier')}
                    aria-pressed={groupBy === 'tier'}
                    aria-label={STRINGS_EN.grouping.tier.ariaLabel}
                    className={`min-h-[30px] flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-vouch-cyan ${
                      groupBy === 'tier'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{STRINGS_EN.grouping.tier.label}</span>
                    <span className="sm:hidden">Tiers</span>
                  </button>
                </div>
              )}

              {/* Sort By Selector with edge viewport truncation safety */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0 max-w-[50%] sm:max-w-none">
                <label htmlFor="slate-sort-select" className="text-white/60 font-mono text-[11px] sm:text-xs shrink-0">
                  {STRINGS_EN.controls.sortLabel}
                </label>
                <select
                  id="slate-sort-select"
                  aria-label={STRINGS_EN.controls.sortAriaLabel}
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-400/60 transition-colors max-w-full truncate"
                >
                  <option value="score" className="bg-slate-900 text-white">{STRINGS_EN.controls.sortOptions.score}</option>
                  <option value="ev" className="bg-slate-900 text-white">{STRINGS_EN.controls.sortOptions.ev}</option>
                  <option value="odds" className="bg-slate-900 text-white">{STRINGS_EN.controls.sortOptions.odds}</option>
                </select>
                {sortBy === 'ev' && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    {STRINGS_EN.controls.evRankedChip}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Board Display */}
          {loading && processedData.length === 0 ? (
            <BoardSkeleton />
          ) : isRetrying && data.length === 0 ? (
            <div className="p-5 sm:p-8 text-center rounded-2xl bg-black/20 border border-amber-500/30 text-white/70 text-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin motion-reduce:animate-none" />
              <p className="text-amber-400 font-medium">
                {STRINGS_EN.states.retrying.title(failureCount, MAX_RETRY_ATTEMPTS)}
              </p>
              <p className="text-white/60 text-xs">
                {error ? sanitizeErrorMessage(error) : STRINGS_EN.states.retrying.fallbackError}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition-all shadow-sm flex items-center justify-center"
              >
                {STRINGS_EN.states.retrying.button}
              </button>
            </div>
          ) : error && data.length === 0 ? (
            <div className="p-5 sm:p-8 text-center rounded-2xl bg-black/20 border border-red-500/30 text-white/70 text-sm flex flex-col items-center justify-center gap-3">
              <p className="text-red-400 font-medium">
                {STRINGS_EN.states.error.title(
                  error ? sanitizeErrorMessage(error) : STRINGS_EN.states.error.unknownError
                )}
              </p>
              <p className="text-white/60 text-xs">
                {STRINGS_EN.states.error.description}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-vouch-cyan/20 border border-vouch-cyan/40 text-vouch-cyan hover:bg-vouch-cyan/30 text-xs font-bold transition-all shadow-sm flex items-center justify-center"
              >
                {STRINGS_EN.states.error.button}
              </button>
            </div>
          ) : processedData.length === 0 ? (
            <div className="p-5 sm:p-8 text-center rounded-2xl bg-black/20 border border-white/10 text-white/70 text-sm flex flex-col items-center justify-center gap-3">
              <p className="font-medium text-white/90">
                {STRINGS_EN.states.empty.headline(
                  selectedTier !== 'all' ? `${selectedTier.replace('_', ' ')} tier` : '',
                  searchQuery ? `, "${searchQuery}"` : ''
                )}
              </p>
              <p className="text-xs font-mono text-white/60">
                {STRINGS_EN.states.empty.showingZero} <strong className="text-white/80">0</strong>{' '}
                {STRINGS_EN.states.empty.ofTotal(data.length)} (
                <span className="text-vouch-cyan font-bold">{STRINGS_EN.states.empty.filteredOut(data.length)}</span>
                {STRINGS_EN.states.empty.adjustHint}
              </p>
              {(selectedTier !== 'all' || searchQuery) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[44px] mt-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors shadow-sm flex items-center justify-center"
                >
                  {STRINGS_EN.states.empty.resetButton}
                </button>
              )}
            </div>
          ) : viewMode === '3d' ? (
            <HrStadium3DView items={processedData} />
          ) : viewMode === 'kanban' ? (
            <KanbanView items={processedData} />
          ) : viewMode === 'edge' ? (
            <ChunkAEdgeDesk data={processedData} />
          ) : viewMode === 'stacks' ? (
            <ChunkASlateStacks data={processedData} />
          ) : viewMode === 'matrix' ? (
            <ChunkAProjectionMatrix data={processedData} />
          ) : viewMode === 'extremes' ? (
            <ChunkAMatchupExtremes data={processedData} />
          ) : (
            <ChunkABoard
              items={processedData}
              viewMode={viewMode as any}
              selectedTier={selectedTier}
              groupBy={groupBy}
              sortBy={sortBy}
            />
          )}

        </main>
      </div>
    </HrErrorBoundary>
  );
}
