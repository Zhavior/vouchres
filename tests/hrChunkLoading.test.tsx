// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/features/hr/hooks/useHrBoardViewModel', () => ({
  useHrBoardViewModel: vi.fn(),
}));

vi.mock('../src/features/hr/hooks/useProMode', () => ({
  useProMode: () => [true, vi.fn()],
}));

vi.mock('../src/hooks/queries/usePlayerVouchLayer', () => ({
  usePlayerVouchSummary: () => ({ data: [] }),
  usePlayerVouchLeaderboard: () => ({ data: [] }),
  useTogglePlayerVouch: () => ({ mutate: vi.fn(), variables: null }),
}));

import HomeRunIntelligencePageZ8 from '../src/features/hr/pages/HomeRunIntelligencePageZ8';
import { useHrBoardViewModel } from '../src/features/hr/hooks/useHrBoardViewModel';

const mockedVm = vi.mocked(useHrBoardViewModel);

describe('HR feature loading', () => {
  it('renders the complete HR feature without nested chunk placeholders', () => {
    mockedVm.mockReturnValue({
      buckets: { Elite: [], Strong: [], Watch: [], Sleepers: [] },
      rows: [],
      researchRows: [],
      slate: {
        gameCount: 1,
        generatedAt: null,
        loadedAt: null,
        freshness: 'fresh',
        dataQuality: null,
        warnings: [],
        truthMessage: null,
        note: null,
        disclaimer: null,
        hasGames: true,
      },
      stats: { total: 0, elite: 0, strong: 0, watch: 0, sleepers: 0 },
      selectedPlayer: null,
      loading: true,
      syncing: false,
      error: null,
      refreshError: null,
      connection: null,
      lastUpdated: null,
      mode: 'confirmed',
      viewMode: 'cards',
      search: '',
      selectedTiers: ['Elite', 'Strong', 'Watch', 'Sleepers'],
      modeCounts: { confirmed: 0, curated: 0, all: 0 },
      autoSwitchedToPreview: false,
      setMode: vi.fn(),
      setViewMode: vi.fn(),
      setSearch: vi.fn(),
      setSelectedPlayer: vi.fn(),
      onToggleTier: vi.fn(),
      refresh: vi.fn(),
      date: '2026-08-08',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as any);

    render(<HomeRunIntelligencePageZ8 />);

    expect(screen.getByRole('heading', { name: /Every bat that can leave the yard/i })).toBeTruthy();
    expect(screen.queryByRole('status', { name: /Loading .* (panel|workspace|players)/i })).toBeNull();
  });
});
