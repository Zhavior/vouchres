/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  calculateEV,
  filterSlateItem,
  sortSlateItems,
  formatTimeAgo,
  safeNumber,
  sanitizeErrorMessage,
  validateViewMode,
  validateSelectedTier,
  validateSortBy,
  validateMinScore,
  VIEW_OPTIONS,
} from '../src/features/hr-v2/pages/HrIntelligencePageV10';
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
} from '../src/features/hr-v2/constants';
import { ChunkA } from '../src/features/hr-v2/api/contracts';
import { useDebouncedValue } from '../src/hooks/useDebouncedValue';
import { usePersistedState } from '../src/hooks/usePersistedState';

const mockItemA: ChunkA = {
  playerId: 'p_1',
  identity: {
    id: 'p_1',
    mlbId: '1',
    name: 'Aaron Judge',
    teamId: 'NYY',
    teamAbbreviation: 'NYY',
    handedness: 'R',
  },
  opponentTeamId: 'BOS',
  opposingPitcherId: 'p_sale',
  opposingPitcherName: 'Chris Sale',
  opposingPitcherHandedness: 'L',
  gameTime: '2026-08-13T19:05:00Z',
  gameState: {
    gameId: 'g_1',
    lifecycle: 'scheduled',
    gameTime: '2026-08-13T19:05:00Z',
    homeTeamId: 'NYY',
    awayTeamId: 'BOS',
    stadiumId: 's_yankee',
    inning: 0,
    inningHalf: 'top',
    scoreDifferential: 0,
    outs: 0,
    runnersOnBase: 0,
  },
  score: {
    hrIndex: 92,
    confidence: { level: 'very_high', score: 0.95, reasons: ['Elite power'] },
    primaryRecommendation: 'Strong HR target',
    provenance: {
      generatedAt: '2026-08-13T12:00:00Z',
      versions: { scorer: '1.0', weather: '1.0', matchup: '1.0' },
      freshness: { batter: 'now', pitcher: 'now', weather: 'now', odds: 'now' },
    },
  },
  rank: 1,
  odds: {
    price: 230,
    impliedProbability: 0.303,
    provider: 'DraftKings',
    updatedAt: '2026-08-13T12:00:00Z',
  },
  lineupStatus: 'confirmed_starter' as const,
  updatedAt: '2026-08-13T12:00:00Z',
};

const mockItemB: ChunkA = {
  ...mockItemA,
  playerId: 'p_2',
  identity: {
    id: 'p_2',
    mlbId: '2',
    name: 'Shohei Ohtani',
    teamId: 'LAD',
    teamAbbreviation: 'LAD',
    handedness: 'L',
  },
  opponentTeamId: 'SF',
  score: {
    ...mockItemA.score,
    hrIndex: 78,
  },
  odds: {
    price: 350,
    impliedProbability: 0.22,
    provider: 'FanDuel',
    updatedAt: '2026-08-13T12:00:00Z',
  },
};

const mockItemC: ChunkA = {
  ...mockItemA,
  playerId: 'p_3',
  identity: {
    id: 'p_3',
    mlbId: '3',
    name: 'Manny Machado',
    teamId: 'SD',
    teamAbbreviation: 'SD',
    handedness: 'R',
  },
  opponentTeamId: 'ARI',
  score: {
    ...mockItemA.score,
    hrIndex: 65,
  },
  odds: null,
};

describe('HrIntelligencePageV10 — Constants', () => {
  it('defines correct tier and slider boundaries', () => {
    expect(TIER_VERY_HIGH_MIN).toBe(85);
    expect(TIER_HIGH_MIN).toBe(70);
    expect(SLIDER_MIN_SCORE).toBe(50);
    expect(SLIDER_MAX_SCORE).toBe(90);
    expect(DEFAULT_MIN_SCORE).toBe(60);
  });

  it('defines 3 accessible view options with aria labels', () => {
    expect(VIEW_OPTIONS).toHaveLength(3);
    expect(VIEW_OPTIONS.map((v) => v.key)).toEqual(['card', 'table', 'kanban']);
    expect(VIEW_OPTIONS.every((v) => Boolean(v.ariaLabel))).toBe(true);
  });
});

describe('safeNumber Utility', () => {
  it('returns the input value when given valid finite numbers', () => {
    expect(safeNumber(42)).toBe(42);
    expect(safeNumber(0)).toBe(0);
    expect(safeNumber(-15.75)).toBe(-15.75);
    expect(safeNumber(3.14159)).toBe(3.14159);
  });

  it('falls back to default fallback (0) for NaN, Infinity, -Infinity', () => {
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber(Infinity)).toBe(0);
    expect(safeNumber(-Infinity)).toBe(0);
  });

  it('falls back to default fallback (0) for non-number types (strings, null, undefined, objects, booleans)', () => {
    expect(safeNumber('42')).toBe(0);
    expect(safeNumber('')).toBe(0);
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber({})).toBe(0);
    expect(safeNumber(true)).toBe(0);
  });

  it('uses custom fallback value when provided', () => {
    expect(safeNumber(NaN, 100)).toBe(100);
    expect(safeNumber(undefined, -1)).toBe(-1);
    expect(safeNumber(null, 60)).toBe(60);
    expect(safeNumber('invalid', 9999)).toBe(9999);
    // Valid number ignores custom fallback
    expect(safeNumber(88, 60)).toBe(88);
  });
});

describe('HrIntelligencePageV10 — Pure Functions & Defensive Guards', () => {
  describe('calculateEV', () => {
    it('calculates EV as hrIndex/100 - impliedProbability', () => {
      // 92/100 - 0.303 = 0.92 - 0.303 = 0.617
      const ev = calculateEV(mockItemA);
      expect(ev).toBeCloseTo(0.617, 3);
    });

    it('returns 0 when odds are null', () => {
      const ev = calculateEV(mockItemC);
      expect(ev).toBe(0);
    });

    it('guards against NaN, undefined, or missing hrIndex gracefully', () => {
      const itemNaN = {
        ...mockItemA,
        score: { ...mockItemA.score, hrIndex: NaN },
      };
      expect(calculateEV(itemNaN)).toBe(0);

      const itemUndef = {
        ...mockItemA,
        score: { ...mockItemA.score, hrIndex: undefined as unknown as number },
      };
      expect(calculateEV(itemUndef)).toBe(0);
    });

    it('guards against NaN, undefined, or missing impliedProbability gracefully', () => {
      const itemNaN = {
        ...mockItemA,
        odds: { price: 250, impliedProbability: NaN, provider: 'DK', updatedAt: '' },
      };
      expect(calculateEV(itemNaN)).toBe(0);

      const itemUndef = {
        ...mockItemA,
        odds: { price: 250, impliedProbability: undefined as unknown as number, provider: 'DK', updatedAt: '' },
      };
      expect(calculateEV(itemUndef)).toBe(0);
    });

    it('returns 0 for negative hrIndex or negative impliedProbability', () => {
      const itemNegProb = {
        ...mockItemA,
        odds: { price: 250, impliedProbability: -0.15, provider: 'DK', updatedAt: '' },
      };
      expect(calculateEV(itemNegProb)).toBe(0);

      const itemNegScore = {
        ...mockItemA,
        score: { ...mockItemA.score, hrIndex: -10 },
      };
      expect(calculateEV(itemNegScore)).toBe(0);
    });

    it('returns 0 when odds are present but impliedProbability is 0', () => {
      const itemZero = {
        ...mockItemA,
        odds: { price: 250, impliedProbability: 0, provider: 'DK', updatedAt: '' },
      };
      expect(calculateEV(itemZero)).toBe(0);
    });

    it('guards against null or undefined item gracefully', () => {
      expect(calculateEV(null as unknown as ChunkA)).toBe(0);
      expect(calculateEV(undefined as unknown as ChunkA)).toBe(0);
    });
  });

  describe('filterSlateItem', () => {
    it('filters by very_high tier (>= 85)', () => {
      expect(filterSlateItem(mockItemA, { selectedTier: 'very_high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(true);
      expect(filterSlateItem(mockItemB, { selectedTier: 'very_high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(mockItemC, { selectedTier: 'very_high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
    });

    it('filters by high tier (70 - 84)', () => {
      expect(filterSlateItem(mockItemA, { selectedTier: 'high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(mockItemB, { selectedTier: 'high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(true);
      expect(filterSlateItem(mockItemC, { selectedTier: 'high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
    });

    it('filters by moderate tier (< 70)', () => {
      expect(filterSlateItem(mockItemA, { selectedTier: 'moderate', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(mockItemB, { selectedTier: 'moderate', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(mockItemC, { selectedTier: 'moderate', searchQuery: '', minScore: 50, startersOnly: false })).toBe(true);
    });

    it('filters by search query matching player name, team abbreviation, or opponent', () => {
      expect(filterSlateItem(mockItemA, { selectedTier: 'all', searchQuery: 'judge', minScore: 50, startersOnly: false })).toBe(true);
      expect(filterSlateItem(mockItemA, { selectedTier: 'all', searchQuery: 'NYY', minScore: 50, startersOnly: false })).toBe(true);
      expect(filterSlateItem(mockItemA, { selectedTier: 'all', searchQuery: 'BOS', minScore: 50, startersOnly: false })).toBe(true);
      expect(filterSlateItem(mockItemA, { selectedTier: 'all', searchQuery: 'Ohtani', minScore: 50, startersOnly: false })).toBe(false);
    });

    it('filters by minScore when tier is "all"', () => {
      expect(filterSlateItem(mockItemB, { selectedTier: 'all', searchQuery: '', minScore: 70, startersOnly: false })).toBe(true);
      expect(filterSlateItem(mockItemB, { selectedTier: 'all', searchQuery: '', minScore: 80, startersOnly: false })).toBe(false);
    });

    it('guards against null item or missing identity/score', () => {
      expect(filterSlateItem(null as unknown as ChunkA, { selectedTier: 'all', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      
      const itemNoIdentity = { ...mockItemA, identity: undefined as unknown as ChunkA['identity'] };
      expect(filterSlateItem(itemNoIdentity, { selectedTier: 'all', searchQuery: '', minScore: 50, startersOnly: false })).toBe(true);

      const itemNoScore = { ...mockItemA, score: undefined as unknown as ChunkA['score'] };
      expect(filterSlateItem(itemNoScore, { selectedTier: 'all', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
    });

    it('handles non-string search queries and falls back to DEFAULT_MIN_SCORE when minScore is non-finite', () => {
      // Non-string searchQuery
      expect(
        filterSlateItem(mockItemA, { selectedTier: 'all', searchQuery: null as unknown as string, minScore: 50, startersOnly: false })
      ).toBe(true);

      // Non-finite minScore fallback to DEFAULT_MIN_SCORE (60)
      // mockItemA has hrIndex 92 >= 60 -> true
      expect(
        filterSlateItem(mockItemA, { selectedTier: 'all', searchQuery: '', minScore: NaN, startersOnly: false })
      ).toBe(true);

      // item with hrIndex 55 < 60 -> false under NaN fallback
      const lowItem = { ...mockItemA, score: { ...mockItemA.score, hrIndex: 55 } };
      expect(
        filterSlateItem(lowItem, { selectedTier: 'all', searchQuery: '', minScore: NaN, startersOnly: false })
      ).toBe(false);
    });
  });

  describe('sortSlateItems', () => {
    it('sorts by score descending by default', () => {
      const sorted = [mockItemB, mockItemA, mockItemC].sort((a, b) => sortSlateItems(a, b, 'score'));
      expect(sorted.map((i) => i.playerId)).toEqual(['p_1', 'p_2', 'p_3']);
    });

    it('sorts by EV descending', () => {
      // Judge EV = 0.92 - 0.303 = 0.617
      // Ohtani EV = 0.78 - 0.22 = 0.56
      // Machado EV = 0
      const sorted = [mockItemC, mockItemB, mockItemA].sort((a, b) => sortSlateItems(a, b, 'ev'));
      expect(sorted.map((i) => i.playerId)).toEqual(['p_1', 'p_2', 'p_3']);
    });

    it('sorts by odds price descending', () => {
      // Ohtani = 350, Judge = 230, Machado = 0 (null odds)
      const sorted = [mockItemA, mockItemC, mockItemB].sort((a, b) => sortSlateItems(a, b, 'odds'));
      expect(sorted.map((i) => i.playerId)).toEqual(['p_2', 'p_1', 'p_3']);
    });

    it('handles null/undefined items on either side without throwing', () => {
      expect(sortSlateItems(null as unknown as ChunkA, mockItemA, 'score')).toBe(1);
      expect(sortSlateItems(mockItemA, null as unknown as ChunkA, 'score')).toBe(-1);
      expect(sortSlateItems(null as unknown as ChunkA, null as unknown as ChunkA, 'score')).toBe(0);
    });

    it('handles missing or undefined odds.price during odds sort', () => {
      const itemNoPrice: ChunkA = {
        ...mockItemA,
        playerId: 'no_price',
        odds: { price: undefined as unknown as number, impliedProbability: 0.2, provider: 'DK', updatedAt: '' },
      };
      const sorted = [itemNoPrice, mockItemA].sort((a, b) => sortSlateItems(a, b, 'odds'));
      expect(sorted[0].playerId).toBe('p_1');
      expect(sorted[1].playerId).toBe('no_price');
    });

    it('guards against NaN prices and scores in sort without crashing', () => {
      const itemNaN: ChunkA = {
        ...mockItemA,
        playerId: 'p_nan',
        score: { ...mockItemA.score, hrIndex: NaN },
        odds: { price: NaN, impliedProbability: NaN, provider: 'DK', updatedAt: '' },
      };

      const sorted = [itemNaN, mockItemA].sort((a, b) => sortSlateItems(a, b, 'odds'));
      expect(sorted[0].playerId).toBe('p_1');
      expect(sorted[1].playerId).toBe('p_nan');

      const sortedEv = [itemNaN, mockItemA].sort((a, b) => sortSlateItems(a, b, 'ev'));
      expect(sortedEv[0].playerId).toBe('p_1');
      expect(sortedEv[1].playerId).toBe('p_nan');
    });
  });

  describe('formatTimeAgo', () => {
    const baseNow = 100000000;

    it('formats exact boundary values accurately', () => {
      // 0s delta -> "just now"
      expect(formatTimeAgo(baseNow, baseNow)).toBe('just now');

      // 4s delta -> "just now" (< 5s)
      expect(formatTimeAgo(baseNow - 4000, baseNow)).toBe('just now');

      // 5s delta -> "5s ago" (>= 5s)
      expect(formatTimeAgo(baseNow - 5000, baseNow)).toBe('5s ago');

      // 59s delta -> "59s ago"
      expect(formatTimeAgo(baseNow - 59000, baseNow)).toBe('59s ago');

      // 60s delta -> "1m ago"
      expect(formatTimeAgo(baseNow - 60000, baseNow)).toBe('1m ago');

      // 3599s delta -> "59m ago"
      expect(formatTimeAgo(baseNow - 3599000, baseNow)).toBe('59m ago');

      // 3600s delta -> "1h ago"
      expect(formatTimeAgo(baseNow - 3600000, baseNow)).toBe('1h ago');
    });

    it('guards against non-finite, zero, and future/negative timestamp inputs by returning "Update time unavailable"', () => {
      expect(formatTimeAgo(0)).toBe('Update time unavailable');
      expect(formatTimeAgo(NaN)).toBe('Update time unavailable');
      expect(formatTimeAgo(Infinity)).toBe('Update time unavailable');
      expect(formatTimeAgo(null)).toBe('Update time unavailable');
      expect(formatTimeAgo(undefined)).toBe('Update time unavailable');
      expect(formatTimeAgo(baseNow + 5000, baseNow)).toBe('Update time unavailable');
    });
  });

  describe('Edge-case Scenarios', () => {
    it('handles empty data array correctly in filter and sort passes', () => {
      const empty: ChunkA[] = [];
      const filtered = empty.filter((item) =>
        filterSlateItem(item, { selectedTier: 'all', searchQuery: '', minScore: 60, startersOnly: false })
      );
      expect(filtered).toEqual([]);

      const sorted = [...empty].sort((a, b) => sortSlateItems(a, b, 'score'));
      expect(sorted).toEqual([]);
    });

    it('handles a dataset where all items are missing odds (odds: null)', () => {
      const item1: ChunkA = {
        ...mockItemA,
        playerId: 'no_odds_1',
        score: { ...mockItemA.score, hrIndex: 90 },
        odds: null,
      };
      const item2: ChunkA = {
        ...mockItemA,
        playerId: 'no_odds_2',
        score: { ...mockItemA.score, hrIndex: 75 },
        odds: null,
      };
      const dataset = [item1, item2];

      expect(calculateEV(item1)).toBe(0);
      expect(calculateEV(item2)).toBe(0);

      const sortedByOdds = [...dataset].sort((a, b) => sortSlateItems(a, b, 'odds'));
      expect(sortedByOdds).toHaveLength(2);

      const sortedByEv = [...dataset].sort((a, b) => sortSlateItems(a, b, 'ev'));
      expect(sortedByEv).toHaveLength(2);

      const sortedByScore = [...dataset].sort((a, b) => sortSlateItems(a, b, 'score'));
      expect(sortedByScore[0].playerId).toBe('no_odds_1');
      expect(sortedByScore[1].playerId).toBe('no_odds_2');
    });

    it('handles duplicate playerIds gracefully across filter and sort', () => {
      const dupAlpha: ChunkA = {
        ...mockItemA,
        playerId: 'dup_id_99',
        score: { ...mockItemA.score, hrIndex: 95 },
      };
      const dupBeta: ChunkA = {
        ...mockItemA,
        playerId: 'dup_id_99',
        score: { ...mockItemA.score, hrIndex: 85 },
      };

      const items = [dupBeta, dupAlpha];
      const filtered = items.filter((item) =>
        filterSlateItem(item, { selectedTier: 'very_high', searchQuery: '', minScore: 50, startersOnly: false })
      );
      expect(filtered).toHaveLength(2);

      const sorted = [...items].sort((a, b) => sortSlateItems(a, b, 'score'));
      expect(sorted[0].score.hrIndex).toBe(95);
      expect(sorted[1].score.hrIndex).toBe(85);
    });

    it('verifies exact boundary values at TIER_VERY_HIGH_MIN (85) and TIER_HIGH_MIN (70)', () => {
      const score85: ChunkA = {
        ...mockItemA,
        playerId: 'boundary_85',
        score: { ...mockItemA.score, hrIndex: 85 },
      };
      const score84_9: ChunkA = {
        ...mockItemA,
        playerId: 'boundary_84_9',
        score: { ...mockItemA.score, hrIndex: 84.9 },
      };
      const score70: ChunkA = {
        ...mockItemA,
        playerId: 'boundary_70',
        score: { ...mockItemA.score, hrIndex: 70 },
      };
      const score69_9: ChunkA = {
        ...mockItemA,
        playerId: 'boundary_69_9',
        score: { ...mockItemA.score, hrIndex: 69.9 },
      };

      // Score 85: exactly on TIER_VERY_HIGH_MIN
      // Must be inclusive for very_high, exclusive for high and moderate
      expect(filterSlateItem(score85, { selectedTier: 'very_high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(true);
      expect(filterSlateItem(score85, { selectedTier: 'high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(score85, { selectedTier: 'moderate', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);

      // Score 84.9: just below TIER_VERY_HIGH_MIN
      // Must be exclusive for very_high, inclusive for high, exclusive for moderate
      expect(filterSlateItem(score84_9, { selectedTier: 'very_high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(score84_9, { selectedTier: 'high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(true);
      expect(filterSlateItem(score84_9, { selectedTier: 'moderate', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);

      // Score 70: exactly on TIER_HIGH_MIN
      // Must be exclusive for very_high, inclusive for high, exclusive for moderate
      expect(filterSlateItem(score70, { selectedTier: 'very_high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(score70, { selectedTier: 'high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(true);
      expect(filterSlateItem(score70, { selectedTier: 'moderate', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);

      // Score 69.9: just below TIER_HIGH_MIN
      // Must be exclusive for very_high and high, inclusive for moderate
      expect(filterSlateItem(score69_9, { selectedTier: 'very_high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(score69_9, { selectedTier: 'high', searchQuery: '', minScore: 50, startersOnly: false })).toBe(false);
      expect(filterSlateItem(score69_9, { selectedTier: 'moderate', searchQuery: '', minScore: 50, startersOnly: false })).toBe(true);
    });
  });
});

describe('useDebouncedValue Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with the given value', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 250));
    expect(result.current).toBe('initial');
  });

  it('updates only after the debounce delay expires', () => {
    const { result, rerender } = renderHook(
      ({ val, delay }: { val: string; delay: number }) => useDebouncedValue(val, delay),
      { initialProps: { val: 'first', delay: 250 } }
    );

    expect(result.current).toBe('first');

    // Rerender with new value
    rerender({ val: 'second', delay: 250 });

    // Still old value immediately
    expect(result.current).toBe('first');

    // Advance halfway
    act(() => {
      vi.advanceTimersByTime(125);
    });
    expect(result.current).toBe('first');

    // Advance rest of delay
    act(() => {
      vi.advanceTimersByTime(130);
    });
    expect(result.current).toBe('second');
  });
});

describe('usePersistedState Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default value if key is not stored', () => {
    const { result } = renderHook(() => usePersistedState('test_key_1', 'default_val'));
    expect(result.current[0]).toBe('default_val');
  });

  it('reads initial value from localStorage if present', () => {
    localStorage.setItem('test_key_2', JSON.stringify('stored_val'));
    const { result } = renderHook(() => usePersistedState('test_key_2', 'fallback'));
    expect(result.current[0]).toBe('stored_val');
  });

  it('updates state and persists to localStorage on state change', () => {
    const { result } = renderHook(() => usePersistedState('test_key_3', 60));
    expect(result.current[0]).toBe(60);

    act(() => {
      result.current[1](75);
    });

    expect(result.current[0]).toBe(75);
    expect(JSON.parse(localStorage.getItem('test_key_3') || '0')).toBe(75);
  });

  it('validates corrupted localStorage values and falls back safely', () => {
    localStorage.setItem('corrupted_view_mode', JSON.stringify('invalid_view_type'));
    const { result: viewResult } = renderHook(() =>
      usePersistedState('corrupted_view_mode', 'card', validateViewMode)
    );
    expect(viewResult.current[0]).toBe('card');

    localStorage.setItem('corrupted_tier', JSON.stringify('legendary_tier'));
    const { result: tierResult } = renderHook(() =>
      usePersistedState('corrupted_tier', 'all', validateSelectedTier)
    );
    expect(tierResult.current[0]).toBe('all');

    localStorage.setItem('corrupted_sort', JSON.stringify(12345));
    const { result: sortResult } = renderHook(() =>
      usePersistedState('corrupted_sort', 'score', validateSortBy)
    );
    expect(sortResult.current[0]).toBe('score');

    // Clamps out-of-bounds slider values
    localStorage.setItem('out_of_bounds_score', JSON.stringify(150));
    const { result: scoreResultMax } = renderHook(() =>
      usePersistedState('out_of_bounds_score', DEFAULT_MIN_SCORE, validateMinScore)
    );
    expect(scoreResultMax.current[0]).toBe(SLIDER_MAX_SCORE);

    localStorage.setItem('underflow_score', JSON.stringify(10));
    const { result: scoreResultMin } = renderHook(() =>
      usePersistedState('underflow_score', DEFAULT_MIN_SCORE, validateMinScore)
    );
    expect(scoreResultMin.current[0]).toBe(SLIDER_MIN_SCORE);
  });
});

describe('HrIntelligencePageV10 — Deterministic Tie-Breaker Sorting', () => {
  it('breaks score ties deterministically using rank ascending and playerId string compare', () => {
    const tieA: ChunkA = {
      ...mockItemA,
      playerId: 'player_z',
      rank: 2,
      score: { ...mockItemA.score, hrIndex: 85 },
    };
    const tieB: ChunkA = {
      ...mockItemA,
      playerId: 'player_a',
      rank: 1,
      score: { ...mockItemA.score, hrIndex: 85 },
    };
    const tieC: ChunkA = {
      ...mockItemA,
      playerId: 'player_b',
      rank: 2,
      score: { ...mockItemA.score, hrIndex: 85 },
    };

    // tieB has rank 1 -> first
    // tieA and tieC both have rank 2 -> tieC ('player_b') before tieA ('player_z')
    const sorted = [tieA, tieB, tieC].sort((a, b) => sortSlateItems(a, b, 'score'));
    expect(sorted.map((i) => i.playerId)).toEqual(['player_a', 'player_b', 'player_z']);
  });

  it('breaks odds ties deterministically using hrIndex descending, rank, and playerId', () => {
    const tieOdds1: ChunkA = {
      ...mockItemA,
      playerId: 'odds_player_low_score',
      score: { ...mockItemA.score, hrIndex: 70 },
      odds: { price: 300, impliedProbability: 0.25, provider: 'DK', updatedAt: '' },
    };
    const tieOdds2: ChunkA = {
      ...mockItemA,
      playerId: 'odds_player_high_score',
      score: { ...mockItemA.score, hrIndex: 88 },
      odds: { price: 300, impliedProbability: 0.25, provider: 'DK', updatedAt: '' },
    };

    const sorted = [tieOdds1, tieOdds2].sort((a, b) => sortSlateItems(a, b, 'odds'));
    expect(sorted[0].playerId).toBe('odds_player_high_score');
    expect(sorted[1].playerId).toBe('odds_player_low_score');
  });

  it('breaks EV ties deterministically using hrIndex descending and playerId', () => {
    // Same EV (0.50): 90/100 - 0.40 = 0.50 vs 80/100 - 0.30 = 0.50
    const itemEvHigh: ChunkA = {
      ...mockItemA,
      playerId: 'ev_high_score',
      score: { ...mockItemA.score, hrIndex: 90 },
      odds: { price: 200, impliedProbability: 0.4, provider: 'DK', updatedAt: '' },
    };
    const itemEvLow: ChunkA = {
      ...mockItemA,
      playerId: 'ev_low_score',
      score: { ...mockItemA.score, hrIndex: 80 },
      odds: { price: 200, impliedProbability: 0.3, provider: 'DK', updatedAt: '' },
    };

    const sorted = [itemEvLow, itemEvHigh].sort((a, b) => sortSlateItems(a, b, 'ev'));
    expect(sorted[0].playerId).toBe('ev_high_score');
    expect(sorted[1].playerId).toBe('ev_low_score');
  });

  describe('Security Sanitization — sanitizeErrorMessage', () => {
    it('returns a generic message when given null or undefined', () => {
      expect(sanitizeErrorMessage(null)).toBe('Unknown telemetry error');
      expect(sanitizeErrorMessage(undefined)).toBe('Unknown telemetry error');
    });

    it('strips multiline stack traces and returns only the clean error line', () => {
      const errorWithStack = new Error('Database connection failed\n    at Client.connect (/Users/dev/project/db.ts:45:12)\n    at processTicksAndRejections');
      const sanitized = sanitizeErrorMessage(errorWithStack);
      expect(sanitized).not.toContain('/Users/dev/project/db.ts');
      expect(sanitized).not.toContain('at Client.connect');
      expect(sanitized).toBe('Database connection failed');
    });

    it('redacts internal filesystem paths and sensitive server directories', () => {
      const errorWithPath = 'Failed to load file at /Users/boydsantos/secret/config.json';
      const sanitized = sanitizeErrorMessage(errorWithPath);
      expect(sanitized).not.toContain('/Users/boydsantos/secret/config.json');
      expect(sanitized).toContain('[path]');
    });

    it('redacts URLs containing backend endpoints or database connection strings', () => {
      const errorWithUrl = 'Fetch failed from https://internal-api.vouchedge.xyz/v1/auth?token=secret123';
      const sanitized = sanitizeErrorMessage(errorWithUrl);
      expect(sanitized).not.toContain('https://internal-api.vouchedge.xyz');
      expect(sanitized).not.toContain('secret123');
    });

    it('redacts auth tokens, api keys, and bearer tokens', () => {
      const errorWithToken = 'Unauthorized: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and Bearer 99887766';
      const sanitized = sanitizeErrorMessage(errorWithToken);
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(sanitized).not.toContain('99887766');
    });
  });

  describe('Malformed Non-JSON LocalStorage Recovery', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('falls back safely for malformed non-JSON in ve_hr_v10_viewMode', () => {
      localStorage.setItem('ve_hr_v10_viewMode', '{bad-json::');
      const { result } = renderHook(() =>
        usePersistedState('ve_hr_v10_viewMode', 'card', validateViewMode)
      );
      expect(result.current[0]).toBe('card');
    });

    it('falls back safely for malformed non-JSON in ve_hr_v10_selectedTier', () => {
      localStorage.setItem('ve_hr_v10_selectedTier', 'undefined');
      const { result } = renderHook(() =>
        usePersistedState('ve_hr_v10_selectedTier', 'all', validateSelectedTier)
      );
      expect(result.current[0]).toBe('all');
    });

    it('falls back safely for malformed non-JSON in ve_hr_v10_minScore', () => {
      localStorage.setItem('ve_hr_v10_minScore', 'NaN_non_json_string');
      const { result } = renderHook(() =>
        usePersistedState('ve_hr_v10_minScore', DEFAULT_MIN_SCORE, validateMinScore)
      );
      expect(result.current[0]).toBe(DEFAULT_MIN_SCORE);
    });

    it('falls back safely for malformed non-JSON in ve_hr_v10_sortBy', () => {
      localStorage.setItem('ve_hr_v10_sortBy', '[invalid json array');
      const { result } = renderHook(() =>
        usePersistedState('ve_hr_v10_sortBy', 'score', validateSortBy)
      );
      expect(result.current[0]).toBe('score');
    });
  });

  describe('Named Feature Constants Integrity', () => {
    it('defines exact expected numerical timing, boundary, and retry constants', () => {
      expect(SEARCH_DEBOUNCE_MS).toBe(250);
      expect(NOW_TICK_INTERVAL_MS).toBe(5000);
      expect(UPDATED_BADGE_DURATION_MS).toBe(4000);
      expect(SORT_DIFF_EPSILON).toBe(0.00001);
      expect(UNRANKED_FALLBACK).toBe(9999);
      expect(MAX_RETRY_ATTEMPTS).toBe(2);
    });
  });

  describe('Timezone & Locale Invariance for formatTimeAgo', () => {
    it('produces identical delta outputs regardless of epoch offset origin', () => {
      const baseNow = 1750000000000;
      // 3 seconds ago
      expect(formatTimeAgo(baseNow - 3000, baseNow)).toBe('just now');
      // 45 seconds ago
      expect(formatTimeAgo(baseNow - 45000, baseNow)).toBe('45s ago');
      // 12 minutes ago
      expect(formatTimeAgo(baseNow - 12 * 60 * 1000, baseNow)).toBe('12m ago');
      // 3 hours ago
      expect(formatTimeAgo(baseNow - 3 * 3600 * 1000, baseNow)).toBe('3h ago');
    });

    it('remains invariant across simulated timezone shifts because it uses millisecond math', () => {
      const utcTime = new Date('2026-08-13T12:00:00Z').getTime();
      const currentNow = new Date('2026-08-13T12:05:00Z').getTime(); // 5 minutes later

      // Same millisecond delta regardless of whether evaluated in UTC, EST, or JST
      const result = formatTimeAgo(utcTime, currentNow);
      expect(result).toBe('5m ago');
    });
  });
});



