/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { todayISO } from '../src/hooks/queries/hrBoardQuery';
import { queryKeys } from '../src/hooks/queries/queryKeys';
import { useHrSlateFeed } from '../src/features/hr-v2/hooks/useHrSlateFeed';

describe('useHrSlateFeed', () => {
  it('reads the shared hrBoard query cache and does not call statsapi.mlb.com', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const date = todayISO();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(queryKeys.hrBoard(date), {
      date,
      candidates: [
        {
          playerId: 592450,
          playerName: 'Aaron Judge',
          team: 'NYY',
          opponent: 'BOS',
          hrScore: 91,
          lineupStatus: 'confirmed',
          opponentPitcherName: 'Garrett Crochet',
        },
      ],
      meta: { source: 'validated_hr_board_pipeline' },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useHrSlateFeed(), { wrapper });

    expect(result.current.data[0]?.identity.name).toBe('Aaron Judge');
    expect(result.current.data[0]?.identity.mlbId).toBe('592450');
    expect(result.current.data[0]?.lineupStatus).toBe('confirmed_starter');
    expect(result.current.isLastGood).toBe(false);
    expect(result.current.feedSource).toBe('validated_hr_board_pipeline');
    expect(
      fetchSpy.mock.calls.some((call) => String(call[0]).includes('statsapi.mlb.com')),
    ).toBe(false);

    vi.unstubAllGlobals();
    client.clear();
  });
});
