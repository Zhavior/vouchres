// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import HrIntelligenceV2Page from '../src/features/hr-intelligence-v2/HrIntelligenceV2Page';

vi.mock('../src/features/hr/hooks/useHrBoardViewModel', () => ({
  useHrBoardViewModel: vi.fn(),
}));

vi.mock('../src/features/hr/hooks/useProMode', () => ({
  useProMode: () => [false, vi.fn()],
}));

vi.mock('../src/hooks/queries/usePlayerVouchLayer', () => ({
  usePlayerVouchSummary: vi.fn(() => ({ data: [] })),
  usePlayerVouchLeaderboard: vi.fn(() => ({ data: [] })),
  useTogglePlayerVouch: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('../src/features/hr/hooks/useHrResearch', () => ({
  useHrResearch: vi.fn(() => ({ research: null, loading: false, error: null })),
}));

import { useHrBoardViewModel } from '../src/features/hr/hooks/useHrBoardViewModel';

const mockedVm = vi.mocked(useHrBoardViewModel);

function vm(overrides: Record<string, unknown> = {}) {
  return {
    buckets: { Elite: [], Strong: [], Watch: [], Sleepers: [] },
    rows: [],
    researchRows: [],
    slate: { gameCount: 0, generatedAt: null, loadedAt: null, freshness: 'stale', dataQuality: null, warnings: [], truthMessage: null, note: null, disclaimer: null, hasGames: false },
    stats: { total: 0, elite: 0, strong: 0, watch: 0, sleepers: 0 },
    selectedPlayer: null,
    loading: false,
    error: null,
    refreshError: null,
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
    getHrResult: vi.fn(() => null),
    hrResultsLoading: false,
    syncing: false,
    lastUpdated: null,
    connection: { isLastGood: false },
    ...overrides,
  } as never;
}

describe('HR Intelligence V2 honest states', () => {
  it('shows loading state while the board fetch is in flight', () => {
    mockedVm.mockReturnValue(vm({ loading: true }));
    const { container } = render(<HrIntelligenceV2Page />);
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('shows retry error state when board fetch fails', () => {
    const refresh = vi.fn();
    mockedVm.mockReturnValue(vm({ error: 'Home Run Intelligence could not reach its validated data service.', refresh }));
    render(<HrIntelligenceV2Page />);
    expect(screen.getByText(/could not load/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(refresh).toHaveBeenCalled();
  });

  it('warns when confirmed lineups are empty and preview candidates exist', () => {
    mockedVm.mockReturnValue(vm({
      modeCounts: { confirmed: 0, curated: 3, all: 3 },
      autoSwitchedToPreview: true,
    }));
    render(<HrIntelligenceV2Page />);
    expect(screen.getByText(/No confirmed lineups posted yet/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Show preview candidates/i })).toBeTruthy();
  });
});
