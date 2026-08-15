// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithClient(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

vi.mock('../src/features/hr/hooks/useHrBoardViewModel', () => ({
  useHrBoardViewModel: vi.fn(),
}));

vi.mock('../src/lib/parlays/parlayAddContract', () => ({
  openParlayAdd: vi.fn(),
}));

vi.mock('../src/hooks/queries/usePlayerVouchLayer', () => ({
  usePlayerVouchSummary: vi.fn(() => ({ data: [] })),
  usePlayerVouchLeaderboard: vi.fn(() => ({ data: [] })),
  useTogglePlayerVouch: vi.fn(() => ({ mutate: vi.fn(), variables: null })),
}));

vi.mock('../src/context/AppShellContext', () => ({
  useAppProfile: vi.fn(() => ({
    id: 'user-1',
    displayName: 'Admin User',
    isAdmin: true,
    admin: true,
  })),
}));

import { HomeRunIntelligencePageLegacy } from '../src/features/hr/pages/HomeRunIntelligencePageLegacy';
import { useHrBoardViewModel } from '../src/features/hr/hooks/useHrBoardViewModel';
import { useAppProfile } from '../src/context/AppShellContext';
import { openParlayAdd } from '../src/lib/parlays/parlayAddContract';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

const mockedVm = vi.mocked(useHrBoardViewModel);
const mockedProfile = vi.mocked(useAppProfile);

function makeTestRow(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
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
    hrScore: 99,
    hitterPower: 98,
    pitcherVulnerability: 88,
    parkFactor: 110,
    recentForm: 92,
    recentHomeRuns: 3,
    recentHrGames: 2,
    recentGamesChecked: 7,
    vouchScore: 95,
    dataConfidence: 90,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+200',
    reasons: ['Elite barrel rate against power-sinker profile'],
    warnings: [],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('HomeRunIntelligencePageLegacy', () => {
  it('renders flagship HR intelligence page with header, hero top signal, and virtualized card columns', () => {
    const row = makeTestRow();
    mockedVm.mockReturnValue({
      buckets: { Elite: [row], Strong: [], Watch: [], Sleepers: [] },
      rows: [row],
      researchRows: [row],
      slate: {
        gameCount: 12,
        generatedAt: '2026-08-15T00:00:00Z',
        loadedAt: '2026-08-15T00:00:00Z',
        freshness: 'fresh',
        dataQuality: 'official',
        warnings: [],
        truthMessage: null,
        note: null,
        disclaimer: null,
        hasGames: true,
      },
      stats: { total: 1, elite: 1, strong: 0, watch: 0, sleepers: 0 },
      selectedPlayer: null,
      loading: false,
      syncing: false,
      error: null,
      refreshError: null,
      connection: { source: 'validated_hr_board' },
      lastUpdated: new Date(),
      mode: 'confirmed',
      viewMode: 'cards',
      search: '',
      selectedTiers: ['Elite', 'Strong', 'Watch', 'Sleepers'],
      modeCounts: { confirmed: 1, curated: 0, all: 1 },
      autoSwitchedToPreview: false,
      setMode: vi.fn(),
      setViewMode: vi.fn(),
      setSearch: vi.fn(),
      setSelectedPlayer: vi.fn(),
      onToggleTier: vi.fn(),
      refresh: vi.fn(),
      date: '2026-08-15',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as any);

    const onSectionChange = vi.fn();
    renderWithClient(<HomeRunIntelligencePageLegacy onSectionChange={onSectionChange} />);

    // Renders top signal hero
    expect(screen.getAllByText('Aaron Judge').length).toBeGreaterThan(0);
    expect(screen.getByText('12 games')).toBeTruthy();

    // Renders Admin bar for admin profile
    expect(screen.getByText(/Admin HR Lab/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Aurora HQ/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Command Desk/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /HR Intel V10/i })).toBeTruthy();

    // Admin switch button works
    fireEvent.click(screen.getByRole('button', { name: /Aurora HQ/i }));
    expect(onSectionChange).toHaveBeenCalledWith('aurora_hr_hq');
  });

  it('hides the Admin HR Lab bar for non-admin users', () => {
    mockedProfile.mockReturnValue({
      id: 'regular-user',
      displayName: 'Normal User',
      isAdmin: false,
      admin: false,
    } as any);

    const row = makeTestRow();
    mockedVm.mockReturnValue({
      buckets: { Elite: [row], Strong: [], Watch: [], Sleepers: [] },
      rows: [row],
      researchRows: [row],
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
      modeCounts: { confirmed: 1, curated: 0, all: 1 },
      autoSwitchedToPreview: false,
      setMode: vi.fn(),
      setViewMode: vi.fn(),
      setSearch: vi.fn(),
      setSelectedPlayer: vi.fn(),
      onToggleTier: vi.fn(),
      refresh: vi.fn(),
      date: '2026-08-15',
      setDate: vi.fn(),
      isToday: true,
      getHrResult: vi.fn(),
      hrResultsLoading: false,
    } as any);

    renderWithClient(<HomeRunIntelligencePageLegacy onSectionChange={vi.fn()} />);
    expect(screen.queryByText('Admin HR Lab')).toBeNull();
  });
});
