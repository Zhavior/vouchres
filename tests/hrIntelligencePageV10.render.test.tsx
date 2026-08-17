/**
 * @vitest-environment happy-dom
 */
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('../src/features/hr-v2/hooks/useHrSlateFeed', () => ({
  useHrSlateFeed: vi.fn(),
}));

vi.mock('../src/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../src/lib/sentry', () => ({
  captureReactError: vi.fn(),
}));

import { HrIntelligencePageV10 } from '../src/features/hr-v2/pages/HrIntelligencePageV10';
import { HrErrorBoundary } from '../src/features/hr-v2/components/HrErrorBoundary';
import { useHrSlateFeed } from '../src/features/hr-v2/hooks/useHrSlateFeed';
import { trackEvent } from '../src/lib/analytics';
import { captureReactError } from '../src/lib/sentry';
import { ChunkA } from '../src/features/hr-v2/api/contracts';

const mockedUseHrSlateFeed = vi.mocked(useHrSlateFeed);
const mockedTrackEvent = vi.mocked(trackEvent);
const mockedCaptureReactError = vi.mocked(captureReactError);

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

describe('HrIntelligencePageV10 — Dedicated Render Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Error State and Refetch Trigger', () => {
    it('mocks useHrSlateFeed to return an error state (isFailed: true) and asserts the "Retry Connection" button renders and calls refetch on click', () => {
      const mockRefetch = vi.fn();
      mockedUseHrSlateFeed.mockReturnValue({
        data: [],
        loading: false,
        error: new Error('Network timeout fetching live telemetry'),
        isRetrying: false,
        isFailed: true,
        failureCount: 2,
        dataUpdatedAt: 0,
        refetch: mockRefetch,
      });

      render(<HrIntelligencePageV10 />);

      expect(
        screen.getAllByText(/Failed to load MLB live slate feed/i).length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Network timeout fetching live telemetry/i)).toBeTruthy();

      const retryBtn = screen.getByRole('button', { name: /Retry Connection/i });
      expect(retryBtn).toBeTruthy();

      fireEvent.click(retryBtn);
      expect(mockRefetch).toHaveBeenCalledOnce();
    });
  });

  describe('Retrying State Surfacing', () => {
    it('mocks useHrSlateFeed to return isRetrying: true with failureCount: 1 and asserts the "attempt 1/2" text renders', () => {
      const mockRefetch = vi.fn();
      mockedUseHrSlateFeed.mockReturnValue({
        data: [],
        loading: false,
        error: new Error('Transient socket reset'),
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

      const retryNowBtn = screen.getByRole('button', { name: /Retry Now/i });
      expect(retryNowBtn).toBeTruthy();

      fireEvent.click(retryNowBtn);
      expect(mockRefetch).toHaveBeenCalledOnce();
    });
  });

  describe('View Mode ARIA and Keyboard Navigation', () => {
    it('renders view toggle group, asserts aria-pressed on all 3 buttons, and navigates via ArrowRight key', () => {
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

      // Initial state: Card is active
      expect(cardToggle.getAttribute('aria-pressed')).toBe('true');
      expect(tableToggle.getAttribute('aria-pressed')).toBe('false');
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('false');

      // Focus card toggle and press ArrowRight -> moves focus to and activates Table button
      cardToggle.focus();
      fireEvent.keyDown(cardToggle, { key: 'ArrowRight' });

      expect(tableToggle.getAttribute('aria-pressed')).toBe('true');
      expect(cardToggle.getAttribute('aria-pressed')).toBe('false');
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('false');
      expect(document.activeElement).toBe(tableToggle);

      // Press ArrowRight on Table -> moves focus to and activates Kanban button
      fireEvent.keyDown(tableToggle, { key: 'ArrowRight' });
      expect(kanbanToggle.getAttribute('aria-pressed')).toBe('true');
      expect(tableToggle.getAttribute('aria-pressed')).toBe('false');
      expect(document.activeElement).toBe(kanbanToggle);
    });
  });

  describe('Storage Persistence Integration', () => {
    it('reads initial filter state from localStorage and persists updates', () => {
      // Seed localStorage with pre-existing settings
      localStorage.setItem('ve_hr_v10_viewMode', JSON.stringify('table'));
      localStorage.setItem('ve_hr_v10_minScore', JSON.stringify(75));
      localStorage.setItem('ve_hr_v10_sortBy', JSON.stringify('ev'));

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

      // Table toggle should be active from localStorage
      const tableToggle = screen.getByRole('button', { name: /Table view/i });
      expect(tableToggle.getAttribute('aria-pressed')).toBe('true');

      // Sort select should be 'ev'
      const sortSelect = screen.getByLabelText(/Sort slate by/i) as HTMLSelectElement;
      expect(sortSelect.value).toBe('ev');

      // Changing sort to 'odds' persists to localStorage
      fireEvent.change(sortSelect, { target: { value: 'odds' } });
      expect(JSON.parse(localStorage.getItem('ve_hr_v10_sortBy') || '""')).toBe('odds');
    });
  });

  describe('Accessible Live Status Announcements & Honest Stale Data', () => {
    it('renders polite live region announcing live telemetry status', () => {
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

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.textContent).toMatch(/MLB slate loaded with 2 active players shown/i);
    });

    it('honestly displays "Update time unavailable" when feed timestamps are missing', () => {
      const itemNoTimestamp: ChunkA = {
        ...mockItemA,
        updatedAt: '' as unknown as string,
      };

      mockedUseHrSlateFeed.mockReturnValue({
        data: [itemNoTimestamp],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: 0,
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);
      expect(
        screen.getAllByText(/Update time unavailable/i).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Search Feedback & Reset Semantics', () => {
    it('shows "Filtering…" pending micro-indicator while search debounce is pending', () => {
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

      const searchInput = screen.getByPlaceholderText(/Search player or team.../i);
      fireEvent.change(searchInput, { target: { value: 'Aaron' } });

      // Immediately while debounce is pending, indicator is visible
      expect(screen.getByText(/Filtering…/i)).toBeTruthy();
    });

    it('renders "Reset Search & Filters" button in empty state and resets all filter state on click', () => {
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

      // Filter by moderate tab (empty results)
      const moderateTab = screen.getByRole('tab', { name: /MODERATE/i });
      fireEvent.click(moderateTab);

      // Reset button is visible with exact copy
      const resetBtn = screen.getByRole('button', { name: /Reset Search & Filters/i });
      expect(resetBtn).toBeTruthy();

      // Click reset -> restores ALL tier
      fireEvent.click(resetBtn);
      expect(screen.queryByRole('button', { name: /Reset Search & Filters/i })).toBeNull();
    });
  });

  describe('Error & Telemetry Tracking Hooks', () => {
    it('fires hr_feed_failed telemetry event exactly once when feed transitions to isFailed: true', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [],
        loading: false,
        error: new Error('Socket timed out after 30s'),
        isRetrying: false,
        isFailed: true,
        failureCount: 2,
        dataUpdatedAt: 0,
        refetch: vi.fn(),
      });

      const { rerender } = render(<HrIntelligencePageV10 />);

      expect(mockedTrackEvent).toHaveBeenCalledWith('hr_feed_failed', {
        feature: 'hr_intelligence_v10',
        failureCount: 2,
        errorMessage: 'Socket timed out after 30s',
      });
      expect(mockedTrackEvent).toHaveBeenCalledOnce();

      // Re-rendering with identical state does not duplicate telemetry call
      rerender(<HrIntelligencePageV10 />);
      expect(mockedTrackEvent).toHaveBeenCalledOnce();
    });

    it('fires hr_feed_retry_recovered telemetry event when transitioning from isRetrying to successful loaded state', () => {
      // 1. Initial retrying state
      mockedUseHrSlateFeed.mockReturnValue({
        data: [],
        loading: false,
        error: new Error('Transient 503'),
        isRetrying: true,
        isFailed: false,
        failureCount: 1,
        dataUpdatedAt: 0,
        refetch: vi.fn(),
      });

      const { rerender } = render(<HrIntelligencePageV10 />);
      expect(mockedTrackEvent).not.toHaveBeenCalled();

      // 2. Transition to recovered loaded state
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 1,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      act(() => {
        rerender(<HrIntelligencePageV10 />);
      });

      expect(mockedTrackEvent).toHaveBeenCalledWith('hr_feed_retry_recovered', {
        feature: 'hr_intelligence_v10',
        recoveredAfterAttempts: 1,
        playerCount: 2,
      });
    });

    it('HrErrorBoundary reports caught render errors to Sentry via captureReactError with component context', () => {
      const ProblemComponent = () => {
        throw new Error('Simulated child render failure');
      };

      // Suppress console.error in test output for intentional error boundary catch
      const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <HrErrorBoundary fallbackTitle="Custom Test Error">
          <ProblemComponent />
        </HrErrorBoundary>
      );

      expect(mockedCaptureReactError).toHaveBeenCalledOnce();
      expect(mockedCaptureReactError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Simulated child render failure' }),
        expect.objectContaining({
          boundary: 'HrIntelligencePageV10',
          componentName: 'HrIntelligencePageV10',
          error: 'Simulated child render failure',
          fallbackTitle: 'Custom Test Error',
        })
      );

      expect(screen.getByText('Custom Test Error')).toBeTruthy();
      expect(screen.getByText('Simulated child render failure')).toBeTruthy();

      spyConsole.mockRestore();
    });
  });

  describe('Timer & Ref-Based State Transitions Stress Tests', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('handles rapid successive dataUpdatedAt increases without flickering and clears timer on unmount', () => {
      const initialTimestamp = 100000;
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: initialTimestamp,
        refetch: vi.fn(),
      });

      const { rerender, unmount } = render(<HrIntelligencePageV10 />);
      expect(screen.queryByText(/Slate updated/i)).toBeNull();

      // Rapid update 1 (+100ms)
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: initialTimestamp + 100,
        refetch: vi.fn(),
      });
      act(() => {
        rerender(<HrIntelligencePageV10 />);
      });
      expect(screen.getByText(/Slate updated/i)).toBeTruthy();

      // Rapid update 2 (+250ms) before previous timer (4000ms) expires
      act(() => {
        vi.advanceTimersByTime(250);
      });
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: initialTimestamp + 350,
        refetch: vi.fn(),
      });
      act(() => {
        rerender(<HrIntelligencePageV10 />);
      });
      expect(screen.getByText(/Slate updated/i)).toBeTruthy();

      // Rapid update 3 (+250ms)
      act(() => {
        vi.advanceTimersByTime(250);
      });
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: initialTimestamp + 600,
        refetch: vi.fn(),
      });
      act(() => {
        rerender(<HrIntelligencePageV10 />);
      });
      expect(screen.getByText(/Slate updated/i)).toBeTruthy();

      // Advance by 3900ms (still visible from update 3)
      act(() => {
        vi.advanceTimersByTime(3900);
      });
      expect(screen.getByText(/Slate updated/i)).toBeTruthy();

      // Advance by 200ms (4100ms since update 3 -> badge dismissed)
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.queryByText(/Slate updated/i)).toBeNull();

      // Re-trigger badge and unmount immediately to verify no dangling timer errors
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA, mockItemB],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: initialTimestamp + 10000,
        refetch: vi.fn(),
      });
      act(() => {
        rerender(<HrIntelligencePageV10 />);
      });
      expect(screen.getByText(/Slate updated/i)).toBeTruthy();

      unmount();
      // Advancing time after unmount does not throw or log React unmounted warnings
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    });

    it('unmounts cleanly mid-retry without state leaks or unmounted component errors', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [],
        loading: false,
        error: new Error('Mid-flight failure'),
        isRetrying: true,
        isFailed: false,
        failureCount: 1,
        dataUpdatedAt: 0,
        refetch: vi.fn(),
      });

      const { unmount } = render(<HrIntelligencePageV10 />);
      expect(screen.getByText(/attempt 1\/2/i)).toBeTruthy();

      unmount();
      act(() => {
        vi.advanceTimersByTime(10000);
      });
    });

    it('clears the 5000ms "now" tick interval and 4000ms timeout on unmount', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: 500000,
        refetch: vi.fn(),
      });

      const { unmount, rerender } = render(<HrIntelligencePageV10 />);

      // Trigger the 4000ms timeout
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: 501000,
        refetch: vi.fn(),
      });
      act(() => {
        rerender(<HrIntelligencePageV10 />);
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });

    it('handles rapid arrow key spamming in view toggle without crashing or stale focus refs', () => {
      mockedUseHrSlateFeed.mockReturnValue({
        data: [mockItemA],
        loading: false,
        error: null,
        isRetrying: false,
        isFailed: false,
        failureCount: 0,
        dataUpdatedAt: Date.now(),
        refetch: vi.fn(),
      });

      render(<HrIntelligencePageV10 />);

      const cardBtn = screen.getByRole('button', { name: /Card view/i });
      const tableBtn = screen.getByRole('button', { name: /Table view/i });
      const kanbanBtn = screen.getByRole('button', { name: /Kanban view/i });
      const arena3dBtn = screen.getByRole('button', { name: /3D Stadium/i });

      const edgeBtn = screen.getByRole('button', { name: /Vegas Edge Desk/i });
      const stacksBtn = screen.getByRole('button', { name: /Team Stacks/i });
      const matrixBtn = screen.getByRole('button', { name: /Projection Matrix/i });
      const extremesBtn = screen.getByRole('button', { name: /Matchup Extremes/i });

      // Walk the full ring, then wrap: the toggle grew from 4 views to 8
      // (edge, stacks, matrix, extremes were added), so wrap-around lands on
      // 'extremes' at the end rather than '3d'.
      const ring = [
        cardBtn,
        tableBtn,
        kanbanBtn,
        arena3dBtn,
        edgeBtn,
        stacksBtn,
        matrixBtn,
        extremesBtn,
      ];

      cardBtn.focus();
      for (let i = 0; i < ring.length; i += 1) {
        const next = ring[(i + 1) % ring.length];
        fireEvent.keyDown(ring[i], { key: 'ArrowRight' });
        expect(next.getAttribute('aria-pressed')).toBe('true');
      }

      // One extra press past the wrap to confirm the ring keeps advancing.
      fireEvent.keyDown(cardBtn, { key: 'ArrowRight' });
      expect(tableBtn.getAttribute('aria-pressed')).toBe('true');

      // Test Home and End keys
      fireEvent.keyDown(tableBtn, { key: 'End' });
      expect(extremesBtn.getAttribute('aria-pressed')).toBe('true');

      fireEvent.keyDown(extremesBtn, { key: 'Home' });
      expect(cardBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('renders cleanly with default states when localStorage contains malformed non-JSON strings across all keys', () => {
      localStorage.setItem('ve_hr_v10_viewMode', '<<<MALFORMED_NON_JSON>>>');
      localStorage.setItem('ve_hr_v10_selectedTier', 'undefined');
      localStorage.setItem('ve_hr_v10_minScore', '{not: valid, json}');
      localStorage.setItem('ve_hr_v10_sortBy', 'null:;');

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

      expect(() => render(<HrIntelligencePageV10 />)).not.toThrow();

      // ViewMode falls back to 'card'
      const cardBtn = screen.getByRole('button', { name: /Card view/i });
      expect(cardBtn.getAttribute('aria-pressed')).toBe('true');

      // Sort selector falls back to 'score'
      const sortSelect = screen.getByLabelText(/Sort slate by/i) as HTMLSelectElement;
      expect(sortSelect.value).toBe('score');
    });
  });
});



