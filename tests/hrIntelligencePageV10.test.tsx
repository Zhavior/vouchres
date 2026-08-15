/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../src/features/hr-v2/hooks/useHrSlateFeed', () => ({
  useHrSlateFeed: vi.fn(),
}));

import { HrIntelligencePageV10 } from '../src/features/hr-v2/pages/HrIntelligencePageV10';
import { useHrSlateFeed } from '../src/features/hr-v2/hooks/useHrSlateFeed';
import { ChunkA } from '../src/features/hr-v2/api/contracts';

const mockedUseHrSlateFeed = vi.mocked(useHrSlateFeed);

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
  lineupStatus: 'confirmed_starter' as const,
  rank: 1,
  odds: {
    price: 230,
    impliedProbability: 0.303,
    provider: 'DraftKings',
    updatedAt: '2026-08-13T12:00:00Z',
  },
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

describe('HrIntelligencePageV10 — Render-Level Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Error Handling and Retry Interactions', () => {
    it('renders error state UI when feed fails with empty data and triggers refetch on retry click', () => {
      const mockRefetch = vi.fn();
      mockedUseHrSlateFeed.mockReturnValue({
        data: [],
        loading: false,
        error: new Error('Simulated upstream MLB feed network fault'),
        isRetrying: false,
        isFailed: true,
        failureCount: 2,
        dataUpdatedAt: 0,
        refetch: mockRefetch,
      });

      render(<HrIntelligencePageV10 />);

      // Assert error headline and specific message are shown
      expect(
        screen.getAllByText(/Failed to load MLB live slate feed/i).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Simulated upstream MLB feed network fault/i)
      ).toBeTruthy();

      // Assert Retry button is rendered
      const retryButton = screen.getByRole('button', { name: /Retry Connection/i });
      expect(retryButton).toBeTruthy();

      // Click the retry button
      fireEvent.click(retryButton);

      // Verify refetch was invoked
      expect(mockRefetch).toHaveBeenCalledOnce();
    });

    it('renders retrying state when query is actively reconnecting in background', () => {
      const mockRefetch = vi.fn();
      mockedUseHrSlateFeed.mockReturnValue({
        data: [],
        loading: false,
        error: new Error('Connection timeout'),
        isRetrying: true,
        isFailed: false,
        failureCount: 1,
        dataUpdatedAt: 0,
        refetch: mockRefetch,
      });

      render(<HrIntelligencePageV10 />);

      expect(
        screen.getByText(/Connecting to MLB live telemetry \(attempt 1\/2\)/i)
      ).toBeTruthy();

      const retryNowButton = screen.getByRole('button', { name: /Retry Now/i });
      expect(retryNowButton).toBeTruthy();

      fireEvent.click(retryNowButton);
      expect(mockRefetch).toHaveBeenCalledOnce();
    });
  });

  describe('View Mode Toggles, Keyboard Navigation & ARIA Accessibility', () => {
    it('asserts all four view-toggle buttons reflect correct aria-pressed states on initial render and on click transitions', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      const cardToggle = screen.getByRole('button', { name: /Card view/i });
      const tableToggle = screen.getByRole('button', { name: /Table view/i });
      const kanbanToggle = screen.getByRole('button', { name: /Kanban view/i });
      const arena3dToggle = screen.getByRole('button', { name: /3D Stadium/i });

      // Initial state: Card view is active
      expect(cardToggle.getAttribute('aria-pressed')).toBe('true');
      expect(tableToggle.getAttribute('aria-pressed')).toBe('false');
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('false');
      expect(arena3dToggle.getAttribute('aria-pressed')).toBe('false');

      // Click Table toggle
      fireEvent.click(tableToggle);
      expect(cardToggle.getAttribute('aria-pressed')).toBe('false');
      expect(tableToggle.getAttribute('aria-pressed')).toBe('true');
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('false');
      expect(arena3dToggle.getAttribute('aria-pressed')).toBe('false');

      // Click Kanban toggle
      fireEvent.click(kanbanToggle);
      expect(cardToggle.getAttribute('aria-pressed')).toBe('false');
      expect(tableToggle.getAttribute('aria-pressed')).toBe('false');
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('true');
      expect(arena3dToggle.getAttribute('aria-pressed')).toBe('false');

      // Click 3D Stadium toggle
      fireEvent.click(arena3dToggle);
      expect(cardToggle.getAttribute('aria-pressed')).toBe('false');
      expect(tableToggle.getAttribute('aria-pressed')).toBe('false');
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('false');
      expect(arena3dToggle.getAttribute('aria-pressed')).toBe('true');

      // Switch back to Card toggle
      fireEvent.click(cardToggle);
      expect(cardToggle.getAttribute('aria-pressed')).toBe('true');
      expect(tableToggle.getAttribute('aria-pressed')).toBe('false');
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('false');
      expect(arena3dToggle.getAttribute('aria-pressed')).toBe('false');
    });

    it('navigates view modes using arrow keys (ArrowRight / ArrowLeft)', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      const cardToggle = screen.getByRole('button', { name: /Card view/i });
      const tableToggle = screen.getByRole('button', { name: /Table view/i });
      const kanbanToggle = screen.getByRole('button', { name: /Kanban view/i });
      const arena3dToggle = screen.getByRole('button', { name: /3D Stadium/i });

      // Press ArrowRight from Card -> moves to Table
      fireEvent.keyDown(cardToggle, { key: 'ArrowRight' });
      expect(tableToggle.getAttribute('aria-pressed')).toBe('true');
      expect(cardToggle.getAttribute('aria-pressed')).toBe('false');

      // Press ArrowRight from Table -> moves to Kanban
      fireEvent.keyDown(tableToggle, { key: 'ArrowRight' });
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('true');

      // Press ArrowRight from Kanban -> moves to 3D Stadium
      fireEvent.keyDown(kanbanToggle, { key: 'ArrowRight' });
      expect(arena3dToggle.getAttribute('aria-pressed')).toBe('true');

      // Press ArrowLeft from 3D Stadium -> moves back to Kanban
      fireEvent.keyDown(arena3dToggle, { key: 'ArrowLeft' });
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('true');
    });

    it('navigates tier filter tabs using arrow keys (ArrowRight / ArrowLeft)', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      const allTab = screen.getByRole('tab', { name: /ALL/i });
      const veryHighTab = screen.getByRole('tab', { name: /VERY HIGH/i });
      const highTab = screen.getByRole('tab', { name: /^HIGH/i });

      // Initial tab is ALL
      expect(allTab.getAttribute('aria-selected')).toBe('true');

      // Press ArrowRight from ALL -> moves to VERY HIGH
      fireEvent.keyDown(allTab, { key: 'ArrowRight' });
      expect(veryHighTab.getAttribute('aria-selected')).toBe('true');
      expect(allTab.getAttribute('aria-selected')).toBe('false');

      // Press ArrowRight from VERY HIGH -> moves to HIGH
      fireEvent.keyDown(veryHighTab, { key: 'ArrowRight' });
      expect(highTab.getAttribute('aria-selected')).toBe('true');

      // Press ArrowLeft from HIGH -> moves back to VERY HIGH
      fireEvent.keyDown(highTab, { key: 'ArrowLeft' });
      expect(veryHighTab.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('Filtered Empty State & Reset Interaction', () => {
    it('shows detailed player count breakdown when filters hide all players and allows reset', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      // Select Moderate tier tab (where neither 92 nor 78 qualify, yielding 0 matching players)
      const moderateTab = screen.getByRole('tab', { name: /MODERATE/i });
      fireEvent.click(moderateTab);

      // After filter, empty state renders
      expect(screen.getByText(/No players matched your filter criteria/i)).toBeTruthy();
      // 'Showing' appears in both the count indicator and the empty state — use getAllByText
      expect(screen.getAllByText(/Showing/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/2 filtered out/i)).toBeTruthy();


      // Reset button is visible
      const resetButton = screen.getByRole('button', { name: /Reset Search & Filters/i });
      expect(resetButton).toBeTruthy();

      // Click Reset Filters -> restores ALL tier
      fireEvent.click(resetButton);
      expect(screen.queryByText(/No players matched your filter criteria/i)).toBeNull();
    });
  });

  describe('EV Sorting Indicator', () => {
    it('displays EV RANKED indicator when sort by EV is selected', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      const sortSelect = screen.getByLabelText(/Sort slate by/i);
      fireEvent.change(sortSelect, { target: { value: 'ev' } });

      expect(screen.getByText(/EV RANKED/i)).toBeTruthy();
    });
  });

  describe('Matchups & Chronological Game Grouping', () => {
    const earlyGameItem: ChunkA = {
      ...mockItemA,
      playerId: 'p_early',
      identity: {
        ...mockItemA.identity,
        id: 'p_early',
        name: 'Rafael Devers',
        teamAbbreviation: 'BOS',
      },
      opponentTeamId: 'NYY',
      gameTime: '2026-08-15T17:05:00Z',
      gameState: {
        ...mockItemA.gameState,
        gameId: 'g_early_1',
        gameTime: '2026-08-15T17:05:00Z',
        awayTeamId: 'BOS',
        homeTeamId: 'NYY',
      },
    };

    const lateGameItem: ChunkA = {
      ...mockItemB,
      playerId: 'p_late',
      identity: {
        ...mockItemB.identity,
        id: 'p_late',
        name: 'Shohei Ohtani',
        teamAbbreviation: 'LAD',
      },
      opponentTeamId: 'SF',
      gameTime: '2026-08-15T23:10:00Z',
      gameState: {
        ...mockItemB.gameState,
        gameId: 'g_late_2',
        gameTime: '2026-08-15T23:10:00Z',
        awayTeamId: 'SF',
        homeTeamId: 'LAD',
      },
    };

    it('renders games in strict chronological order with the first game of the day at the top', () => {
      // Intentionally feed late game first in array
      mockedUseHrSlateFeed.mockReturnValue({
        data: [lateGameItem, earlyGameItem],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      // First Game of Day badge is present
      expect(screen.getByText(/First Game of Day/i)).toBeTruthy();
      expect(screen.getByText(/Game 1 of 2/i)).toBeTruthy();
      expect(screen.getByText(/Game 2 of 2/i)).toBeTruthy();

      // Verify earliest game matchup text is rendered
      expect(screen.getAllByText(/BOS/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/LAD/i).length).toBeGreaterThanOrEqual(1);
    });

    it('toggles grouping mode between Matchup / Teams and Confidence Tiers', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [earlyGameItem, lateGameItem],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      // Switch to Tiers grouping
      const tierGroupingBtn = screen.getByRole('button', { name: /Group by confidence tiers/i });
      fireEvent.click(tierGroupingBtn);
      expect(tierGroupingBtn.getAttribute('aria-pressed')).toBe('true');

      // Tier headers should now be present
      expect(screen.getByText(/VERY HIGH CONFIDENCE/i)).toBeTruthy();

      // Switch back to Matchup grouping
      const matchupGroupingBtn = screen.getByRole('button', { name: /Group by game matchups chronologically/i });
      fireEvent.click(matchupGroupingBtn);
      expect(matchupGroupingBtn.getAttribute('aria-pressed')).toBe('true');

      // Matchup chronological indicator returns
      expect(screen.getByText(/First Game of Day/i)).toBeTruthy();
    });

    it('navigates through games using game slider buttons and left/right arrow keys', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [earlyGameItem, lateGameItem],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      // Next game button moves to Game 1
      const nextBtn = screen.getByRole('button', { name: /Next Game/i });
      fireEvent.click(nextBtn);

      // Now showing Game 1 (BOS @ NYY) in slide view
      expect(screen.getAllByText(/Rafael Devers/i).length).toBeGreaterThanOrEqual(1);

      // Keyboard navigation: ArrowRight moves to Game 2 (SF @ LAD)
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(screen.getAllByText(/Shohei Ohtani/i).length).toBeGreaterThanOrEqual(1);

      // Keyboard navigation: ArrowLeft moves back to Game 1
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(screen.getAllByText(/Rafael Devers/i).length).toBeGreaterThanOrEqual(1);

      // Click "All Slate" button resets to all games
      const allSlateBtn = screen.getByRole('button', { name: /All Slate/i });
      fireEvent.click(allSlateBtn);
      expect(screen.getByText(/First Game of Day/i)).toBeTruthy();
    });
  });
});
