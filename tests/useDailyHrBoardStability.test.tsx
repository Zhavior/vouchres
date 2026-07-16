// @vitest-environment happy-dom

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const query = vi.hoisted(() => ({
  data: {
    date: '2026-07-16',
    candidates: [],
    confirmedCandidates: [],
    projectedCandidates: [],
    allProjectedCandidates: [],
    blockedPlayers: [],
    counts: {
      confirmedCandidates: 0,
      projectedCandidates: 0,
      hiddenProjectedCandidates: 0,
      blockedPlayers: 0,
      totalVisiblePool: 0,
    },
  },
  dataUpdatedAt: Date.parse('2026-07-16T12:00:00Z'),
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return { ...actual, useQuery: () => query };
});

import { useDailyHrBoard } from '../src/features/hr/hooks/useDailyHrBoard';

describe('useDailyHrBoard contract stability', () => {
  it('keeps the same contract identity across unrelated rerenders', () => {
    const { result, rerender } = renderHook(() => useDailyHrBoard('2026-07-16'));
    const firstContract = result.current.data;

    rerender();

    expect(result.current.data).toBe(firstContract);
  });
});
