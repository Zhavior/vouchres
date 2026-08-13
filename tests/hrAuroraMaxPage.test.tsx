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

function vm(overrides: Record<string, unknown> = {}) {
  return {
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
        truthStatus: 'official',
        riskTier: 'Elite',
        oddsLabel: '+210',
        reasons: ['Power baseline and pitcher vulnerability align.'],
        warnings: [],
        sourceMode: 'confirmed',
      },
    ],
    researchRows: [],
    slate: {
      gameCount: 1,
      generatedAt: new Date('2026-08-13T16:00:00Z'),
      loadedAt: new Date('2026-08-13T16:01:00Z'),
      freshness: 'fresh',
      dataQuality: 'full',
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
    connection: { source: 'validated_hr_board_pipeline' },
    lastUpdated: new Date('2026-08-13T16:01:00Z'),
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
    date: '2026-08-13',
    setDate: vi.fn(),
    isToday: true,
    getHrResult: vi.fn(),
    hrResultsLoading: false,
    ...overrides,
  } as any;
}

describe('HR Command Desk page', () => {
  it('renders the Aurora Max desk from live board rows without the old board chrome', () => {
    mockedVm.mockReturnValue(vm());
    render(<HrAuroraMaxPage />);

    expect(screen.getByRole('heading', { name: /Research command desk/i })).toBeTruthy();
    expect(screen.getAllByText('Aaron Judge').length).toBeGreaterThan(0);
    expect(screen.getByText(/Power baseline and pitcher vulnerability align/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Confirmed only/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Every bat that can leave the yard/i })).toBeNull();
  });

  it('keeps missing board truth visible instead of painting a fake slate', () => {
    mockedVm.mockReturnValue(vm({
      rows: [],
      stats: { total: 0, elite: 0, strong: 0, watch: 0, sleepers: 0 },
      modeCounts: { confirmed: 0, curated: 2, all: 2 },
      slate: {
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
      },
    }));
    render(<HrAuroraMaxPage />);

    expect(screen.getByText(/No confirmed-lineup rows are on this slate yet/i)).toBeTruthy();
  });
});
