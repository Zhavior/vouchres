// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/features/hr/hooks/useHrBoardViewModel', () => ({
  useHrBoardViewModel: vi.fn(),
}));

vi.mock('../src/lib/parlays/parlayAddContract', () => ({
  openParlayAdd: vi.fn(),
}));

import HrAuroraMaxPage from '../src/features/hr-max/pages/HrAuroraMaxPage';
import { useHrBoardViewModel } from '../src/features/hr/hooks/useHrBoardViewModel';

const mockedVm = vi.mocked(useHrBoardViewModel);

describe('HR Command Desk loading', () => {
  it('renders the Aurora Max skeleton without Pro-only chunk placeholders', () => {
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

    render(<HrAuroraMaxPage />);

    expect(screen.getByLabelText(/Loading HR Command Desk/i)).toBeTruthy();
    expect(screen.queryByRole('status', { name: /Loading (Pro|top|most|signal)/i })).toBeNull();
  });
});
