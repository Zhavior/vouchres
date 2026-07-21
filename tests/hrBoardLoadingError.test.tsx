// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomeRunIntelligencePage from '../src/features/hr/pages/HomeRunIntelligencePage';

vi.mock('../src/features/hr/hooks/useHrBoardViewModel', () => ({
  useHrBoardViewModel: vi.fn(),
}));

vi.mock('../src/hooks/queries/usePlayerVouchLayer', () => ({
  usePlayerVouchSummary: vi.fn(() => ({ data: [] })),
  usePlayerVouchLeaderboard: vi.fn(() => ({ data: [] })),
  useTogglePlayerVouch: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('../src/features/hr/hooks/useHrResearch', () => ({
  useHrResearch: vi.fn(() => ({ data: null, isLoading: false })),
}));

import { useHrBoardViewModel } from '../src/features/hr/hooks/useHrBoardViewModel';

const mockedVm = vi.mocked(useHrBoardViewModel);
const defaultSlate = {
  gameCount: 0,
  generatedAt: null,
  loadedAt: null,
  freshness: 'stale',
  dataQuality: null,
  warnings: [],
  truthMessage: null,
  note: null,
  disclaimer: null,
  hasGames: false,
} as const;

describe('HomeRunIntelligencePage honest states', () => {
  it('shows loading skeleton while board fetch is in flight', () => {
    mockedVm.mockReturnValue({
      buckets: { Elite: [], Strong: [], Watch: [], Sleepers: [] },
      rows: [],
      researchRows: [],
      slate: { ...defaultSlate },
      stats: { total: 0, elite: 0, strong: 0, watch: 0, sleepers: 0 },
      selectedPlayer: null,
      loading: true,
      error: null,
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
      date: '2026-07-09',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as any);

    const { container } = render(<HomeRunIntelligencePage />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows retry error state when board fetch fails', () => {
    const refresh = vi.fn();
    mockedVm.mockReturnValue({
      buckets: { Elite: [], Strong: [], Watch: [], Sleepers: [] },
      rows: [],
      researchRows: [],
      slate: { ...defaultSlate },
      stats: { total: 0, elite: 0, strong: 0, watch: 0, sleepers: 0 },
      selectedPlayer: null,
      loading: false,
      error: 'Upstream timeout',
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
      refresh,
      date: '2026-07-09',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as any);

    render(<HomeRunIntelligencePage />);
    expect(screen.getByText(/Failed to load Home Run Intelligence/i)).toBeTruthy();
    expect(screen.getByText(/Upstream timeout/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refresh).toHaveBeenCalled();
  });

  it('warns when preview mode is active with no confirmed lineups', () => {
    mockedVm.mockReturnValue({
      buckets: { Elite: [], Strong: [], Watch: [], Sleepers: [] },
      rows: [],
      researchRows: [],
      slate: { ...defaultSlate, gameCount: 1, hasGames: true },
      stats: { total: 1, elite: 0, strong: 1, watch: 0, sleepers: 0 },
      selectedPlayer: null,
      loading: false,
      error: null,
      mode: 'curated',
      viewMode: 'cards',
      search: '',
      selectedTiers: ['Elite', 'Strong', 'Watch', 'Sleepers'],
      modeCounts: { confirmed: 0, curated: 3, all: 3 },
      autoSwitchedToPreview: true,
      setMode: vi.fn(),
      setViewMode: vi.fn(),
      setSearch: vi.fn(),
      setSelectedPlayer: vi.fn(),
      onToggleTier: vi.fn(),
      refresh: vi.fn(),
      date: '2026-07-09',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as any);

    render(<HomeRunIntelligencePage />);
    expect(screen.getByText(/No confirmed lineups posted yet/i)).toBeTruthy();
    expect(screen.getByText(/preview candidates/i)).toBeTruthy();
  });
});
