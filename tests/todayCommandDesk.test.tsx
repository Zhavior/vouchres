// @vitest-environment happy-dom

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TodayNextCommandBrief } from '../src/features/today-next/components/TodayNextCommandBrief';
import { TodayNextVitalsRail } from '../src/features/today-next/components/TodayNextVitalsRail';
import { TodayNextSignalPeek } from '../src/features/today-next/components/TodayNextSignalPeek';
import {
  classifyTacticalNews,
  isTacticalMlbItem,
  getCyberFallbackImage,
} from '../src/features/today-next/components/mobile/newsWireFormat';
import type { TodayDecision } from '../src/components/today/todayDecisionModel';
import type { MlbNewsItem } from '../src/features/today-next/hooks/useMlbNewsWire';

const mockDecision: TodayDecision = {
  tone: 'emerald',
  statusLabel: 'Sensors verified',
  title: 'Today’s HR research board is available',
  description: 'Compare verified evidence and risk before choosing a player.',
  ctaLabel: 'Review HR Intelligence ->',
  ctaSection: 'hr_board',
  attention: [],
  resumeLabel: 'Continue tracking',
  resumeTitle: '1 unresolved slip',
  resumeDetail: 'Return to the exact work already in progress.',
  resumeSection: 'live_parlays',
  liveGames: 0,
  upcomingGames: 4,
  finalGames: 0,
};

describe('Today Command Desk Specifications', () => {
  describe('Hero Intel Callout', () => {
    it('renders the Stage 01 status badge and primary CTA with hard offset box shadow', () => {
      const onRoute = vi.fn();
      render(
        <TodayNextCommandBrief
          decision={mockDecision}
          firstPitch={null}
          liveGames={[]}
          onRoute={onRoute}
        />,
      );

      expect(screen.getByText(/STAGE 01: PRE-PITCH THESIS/i)).not.toBeNull();
      const ctaBtn = screen.getByRole('button', { name: /Review HR Intelligence ->/i });
      expect(ctaBtn).not.toBeNull();
      expect(ctaBtn.className).toContain('tn-cta');

      fireEvent.click(ctaBtn);
      expect(onRoute).toHaveBeenCalledWith('hr_board');
    });

    it('renders the collapsible pre-game lock banner when first pitch is pending', () => {
      const onRoute = vi.fn();
      render(
        <TodayNextCommandBrief
          decision={mockDecision}
          firstPitch={{
            game: {
              gamePk: 12345,
              gameDate: '2026-08-20T23:05:00Z',
              venue: 'Yankee Stadium',
              awayTeam: { name: 'Boston Red Sox', abbreviation: 'BOS' },
              homeTeam: { name: 'New York Yankees', abbreviation: 'NYY' },
            },
            kickoffMs: Date.now() + 3600000,
            countdownMs: 3600000,
            isMounted: true,
          }}
          liveGames={[]}
          onRoute={onRoute}
        />,
      );

      expect(screen.getByText(/COUNTDOWN TO LOCK:/i)).not.toBeNull();
      expect(screen.getByText(/MATCHUP LOCK TELEMETRY/i)).not.toBeNull();
      expect(screen.getByText(/Yankee Stadium/i)).not.toBeNull();
    });
  });

  describe('Curated MLB Tactical Intel Wire Classification', () => {
    it('strictly classifies lineup, pitcher, weather, and deviation items', () => {
      const lineupItem: MlbNewsItem = {
        id: '1',
        headline: 'Judge batting second in confirmed lineup',
        description: 'New York announces starting batting order.',
        publishedAt: '2026-08-20T14:00:00Z',
        category: 'LINEUP',
        playerMentions: [],
        url: null,
        image: null,
        paragraphs: ['Aaron Judge is in the lineup.'],
        hasFullStory: true,
      };
      expect(classifyTacticalNews(lineupItem)).toBe('LINEUP');

      const pitcherItem: MlbNewsItem = {
        id: '2',
        headline: 'Gerrit Cole arm fatigue reported, bullpen active',
        description: 'Starter pulled due to shoulder tightness.',
        publishedAt: '2026-08-20T14:00:00Z',
        category: 'INJURY',
        playerMentions: [],
        url: null,
        image: null,
        paragraphs: ['Bullpen usage spiked yesterday.'],
        hasFullStory: true,
      };
      expect(classifyTacticalNews(pitcherItem)).toBe('PITCHER');

      const weatherItem: MlbNewsItem = {
        id: '3',
        headline: 'Heavy wind blowing out 18mph to dead center',
        description: 'Rain delay risk minimal, humidity rising at Wrigley.',
        publishedAt: '2026-08-20T14:00:00Z',
        category: 'NEWS',
        playerMentions: [],
        url: null,
        image: null,
        paragraphs: ['Wind forecast supports ball carry.'],
        hasFullStory: true,
      };
      expect(classifyTacticalNews(weatherItem)).toBe('WEATHER');

      const statcastItem: MlbNewsItem = {
        id: '4',
        headline: 'Statcast exit velo spike: 114.5 mph average barrel rate',
        description: 'Hard-hit deviation detected over last 7 games.',
        publishedAt: '2026-08-20T14:00:00Z',
        category: 'ALERT',
        playerMentions: [],
        url: null,
        image: null,
        paragraphs: ['Power anomaly verified.'],
        hasFullStory: true,
      };
      expect(classifyTacticalNews(statcastItem)).toBe('DEVIATION');
    });

    it('filters out non-tactical entertainment/concert noise', () => {
      const concertStory: MlbNewsItem = {
        id: '99',
        headline: 'Nick Jonas announces concert tour dates across major stadiums',
        description: 'Pop star to visit several ballparks this fall.',
        publishedAt: '2026-08-20T14:00:00Z',
        category: 'NEWS',
        playerMentions: [],
        url: null,
        image: null,
        paragraphs: ['Tour tickets go on sale.'],
        hasFullStory: true,
      };
      expect(isTacticalMlbItem(concertStory)).toBe(false);
    });

    it('generates a valid cybernetic fallback SVG data URI', () => {
      const fallback = getCyberFallbackImage('LINEUP');
      expect(fallback).toContain('data:image/svg+xml;utf8');
      expect(fallback).toContain('LINEUP');
    });
  });

  describe('Signal Quick Table & Vitals Rail', () => {
    it('renders the 5-item telemetry vitals strip with verified statuses', () => {
      render(
        <TodayNextVitalsRail
          vitals={{
            matchups: 15,
            live: 2,
            final: 1,
            upcoming: 12,
            hrSignals: 42,
            confirmed: 18,
            pendingSlips: 1,
            dataQuality: 'full',
          }}
        />,
      );

      expect(screen.getAllByText('MATCHUPS').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('LIVE NOW')).not.toBeNull();
      expect(screen.getByText('RESEARCH ROWS')).not.toBeNull();
      expect(screen.getByText('42')).not.toBeNull();
    });

    it('renders the Signal Quick Table with 3-tier sub-scores and Add to Slip action', () => {
      const onRoute = vi.fn();
      const onAddPlayer = vi.fn();
      const mockSignals = [
        {
          id: 'sig-1',
          playerName: 'Shohei Ohtani',
          team: 'LAD',
          opponent: 'SF',
          score: 89,
          tier: 'Top Tier',
          oddsLabel: '+280',
          confirmed: true,
          headline: 'Elite barrel rate against hanging sliders',
          hitterPower: 94,
          pitcherVuln: 78,
          parkFactor: 112,
        },
      ];

      render(
        <TodayNextSignalPeek
          signals={mockSignals}
          totalRows={42}
          onRoute={onRoute}
          onAddPlayer={onAddPlayer}
          rawRows={[
            {
              stableId: 'sig-1',
              playerName: 'Shohei Ohtani',
              team: 'LAD',
              opponent: 'SF',
              hrScore: 89,
              truthStatus: 'official',
              reasons: ['Elite barrel rate'],
              warnings: [],
              hitterPower: 94,
              pitcherVulnerability: 78,
              parkFactor: 112,
            } as any,
          ]}
        />,
      );

      expect(screen.getByText('Shohei Ohtani')).not.toBeNull();
      expect(screen.getByText('P:94')).not.toBeNull();
      expect(screen.getByText('V:78')).not.toBeNull();
      expect(screen.getByText('K:112')).not.toBeNull();
      expect(screen.getAllByText('89').length).toBeGreaterThanOrEqual(1);

      const addBtn = screen.getByRole('button', { name: /ADD SLIP/i });
      fireEvent.click(addBtn);
      expect(onAddPlayer).toHaveBeenCalled();
    });
  });

  describe('Today Loading State & Telemetry Integration', () => {
    it('renders TodayNextSkeleton with accessible loading attributes and responsive structures', async () => {
      const { TodayNextSkeleton } = await import('../src/features/today-next/components/TodayNextSkeleton');
      const { container } = render(<TodayNextSkeleton />);

      const skeletonEl = container.querySelector('.today-next');
      expect(skeletonEl).not.toBeNull();
      expect(skeletonEl?.getAttribute('aria-busy')).toBe('true');
      expect(skeletonEl?.getAttribute('aria-live')).toBe('polite');

      const shimmerBlocks = container.querySelectorAll('.tn-skeleton');
      expect(shimmerBlocks.length).toBeGreaterThan(10);
    });

    it('mounts data-performance-page="today" on TodayNextPage so Core Web Vitals are tracked', async () => {
      const { isTodayPerformancePage } = await import('../src/lib/todayWebVitals');
      const { TodayNextPage } = await import('../src/features/today-next/pages/TodayNextPage');
      const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query');

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      expect(isTodayPerformancePage()).toBe(false);
      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <TodayNextPage />
        </QueryClientProvider>,
      );
      expect(isTodayPerformancePage()).toBe(true);
      unmount();
      expect(isTodayPerformancePage()).toBe(false);
    });
  });
});
