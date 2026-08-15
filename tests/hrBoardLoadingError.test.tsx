// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HrAuroraMaxPage from '../src/features/hr-max/pages/HrAuroraMaxPage';

vi.mock('../src/features/hr/hooks/useHrBoardViewModel', () => ({
  useHrBoardViewModel: vi.fn(),
}));

vi.mock('../src/lib/parlays/parlayAddContract', () => ({
  openParlayAdd: vi.fn(),
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

describe('HR Command Desk honest states', () => {
  it('shows loading skeleton while board fetch is in flight', () => {
    mockedVm.mockReturnValue({
      buckets: { Elite: [], Strong: [], Watch: [], Sleepers: [] },
      rows: [],
      researchRows: [],
      slate: { ...defaultSlate },
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
      date: '2026-07-09',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as any);

    render(<HrAuroraMaxPage />);
    expect(screen.getByLabelText(/Loading HR Command Desk/i)).toBeTruthy();
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
      syncing: false,
      error: 'Upstream timeout',
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
      refresh,
      date: '2026-07-09',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as any);

    render(<HrAuroraMaxPage />);
    expect(screen.getByText(/Board unavailable/i)).toBeTruthy();
    expect(screen.getByText(/Upstream timeout/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Retry board/i }));
    expect(refresh).toHaveBeenCalled();
  });

  it('warns when preview mode is active with no confirmed lineups', () => {
    mockedVm.mockReturnValue({
      buckets: { Elite: [], Strong: [], Watch: [], Sleepers: [] },
      rows: [
        {
          stableId: 'judge-99',
          playerName: 'Aaron Judge',
          playerId: 592450,
          team: 'NYY',
          opponent: 'BOS',
          teamLogoUrl: null,
          opponentLogoUrl: null,
          pitcherName: 'Garrett Crochet',
          venue: 'Yankee Stadium',
          gamePk: 777,
          gameTime: '7:05 PM',
          headshotUrl: null,
          rank: 1,
          hrScore: 89,
          hitterPower: 90,
          pitcherVulnerability: 80,
          parkFactor: 70,
          recentForm: 72,
          vouchScore: 88,
          dataConfidence: 84,
          truthStatus: 'projected',
          riskTier: 'Elite',
          oddsLabel: '+210',
          reasons: ['Projected lineup preview'],
          warnings: ['Official lineup not confirmed'],
          sourceMode: 'curated',
        },
      ],
      researchRows: [],
      slate: { ...defaultSlate, gameCount: 1, hasGames: true },
      stats: { total: 1, elite: 1, strong: 0, watch: 0, sleepers: 0 },
      selectedPlayer: null,
      loading: false,
      syncing: false,
      error: null,
      refreshError: null,
      connection: null,
      lastUpdated: null,
      mode: 'confirmed',
      viewMode: 'cards',
      search: '',
      selectedTiers: ['Elite', 'Strong', 'Watch', 'Sleepers'],
      modeCounts: { confirmed: 0, curated: 1, all: 1 },
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

    render(<HrAuroraMaxPage />);
    expect(screen.getByText(/Confirmed lineups are not posted yet/i)).toBeTruthy();
  });
});
