// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HrMaxRadarHUD } from '../src/features/hr-max/components/HrMaxRadarHUD';
import { HrMaxTelemetryStrip } from '../src/features/hr-max/components/HrMaxTelemetryStrip';
import { HrMaxGameStacksView } from '../src/features/hr-max/components/HrMaxGameStacksView';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import { mapHrWatchToDeskRow } from '../src/features/hr-max/mapHrWatchToDesk';

const mockWatchRow1: HrWatchRow = {
  stableId: 'judge-99',
  playerName: 'Aaron Judge',
  playerId: 592450,
  team: 'NYY',
  opponent: 'TOR',
  teamLogoUrl: null,
  opponentLogoUrl: null,
  pitcherName: 'Kevin Gausman',
  venue: 'Rogers Centre',
  gamePk: 1001,
  gameTime: '7:05 PM',
  headshotUrl: null,
  rank: 1,
  hrScore: 92,
  hitterPower: 95,
  pitcherVulnerability: 82,
  parkFactor: 88,
  parkContext: 88,
  parkIndex: 106,
  weather: 75,
  pitchMix: 90,
  recentForm: 84,
  bvpScore: 78,
  vouchScore: 96,
  dataConfidence: 94,
  truthStatus: 'official',
  riskTier: 'Elite',
  oddsLabel: '+240',
  bookOdds: 240,
  hrProbability: 0.35,
  impliedProbability: 0.29,
  recentHomeRuns: 3,
  recentHrGames: 2,
  recentGamesChecked: 5,
  reasons: ['Elite barrel rate', 'High flyball pitcher vulnerability'],
  warnings: [],
  sourceMode: 'confirmed',
};

const mockWatchRow2: HrWatchRow = {
  stableId: 'guerrero-27',
  playerName: 'Vladimir Guerrero Jr.',
  playerId: 665489,
  team: 'TOR',
  opponent: 'NYY',
  teamLogoUrl: null,
  opponentLogoUrl: null,
  pitcherName: 'Gerrit Cole',
  venue: 'Rogers Centre',
  gamePk: 1001,
  gameTime: '7:05 PM',
  headshotUrl: null,
  rank: 2,
  hrScore: 81,
  hitterPower: 86,
  pitcherVulnerability: 68,
  parkFactor: 88,
  parkContext: 88,
  parkIndex: 106,
  weather: 75,
  pitchMix: 70,
  recentForm: 75,
  bvpScore: 65,
  vouchScore: 82,
  dataConfidence: 88,
  truthStatus: 'official',
  riskTier: 'Elite',
  oddsLabel: '+310',
  bookOdds: 310,
  hrProbability: 0.27,
  impliedProbability: 0.24,
  recentHomeRuns: 1,
  recentHrGames: 1,
  recentGamesChecked: 5,
  reasons: ['Solid hard hit rate'],
  warnings: [],
  sourceMode: 'confirmed',
};

const mockDeskRow1 = mapHrWatchToDeskRow(mockWatchRow1, 'fresh', new Date(), 'mlb_live');
const mockDeskRow2 = mapHrWatchToDeskRow(mockWatchRow2, 'fresh', new Date(), 'mlb_live');

describe('HR Command Desk Tactical HUD Components', () => {
  describe('HrMaxRadarHUD', () => {
    it('renders 5-factor SVG radar with score values', () => {
      const { container } = render(<HrMaxRadarHUD row={mockWatchRow1} size={260} />);
      
      expect(container.querySelector('svg')).toBeTruthy();
      expect(container.querySelector('polygon')).toBeTruthy();
      expect(container.querySelector('path')).toBeTruthy();
      
      expect(screen.getAllByText(/Power/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Pitcher/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Park/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Arsenal/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Form/i).length).toBeGreaterThan(0);
    });

    it('handles missing metrics gracefully without throwing', () => {
      const emptyRow: HrWatchRow = {
        ...mockWatchRow1,
        hitterPower: null,
        pitcherVulnerability: null,
        parkFactor: null,
        parkContext: null,
        pitchMix: null,
        bvpScore: null,
        recentForm: null,
      };

      const { container } = render(<HrMaxRadarHUD row={emptyRow} size={260} />);
      expect(container.querySelector('svg')).toBeTruthy();
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
  });

  describe('HrMaxTelemetryStrip', () => {
    it('displays slate confirmation count and top EV pick', () => {
      const onSelect = vi.fn();
      render(
        <HrMaxTelemetryStrip
          rows={[mockDeskRow1, mockDeskRow2]}
          confirmedCount={2}
          totalCount={2}
          onSelectPlayer={onSelect}
        />,
      );

      expect(screen.getByText(/Slate Telemetry/i)).toBeTruthy();
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
      expect(screen.getByText('Aaron Judge')).toBeTruthy();
      expect(screen.getByText('+20.7%')).toBeTruthy();
    });
  });

  describe('HrMaxGameStacksView', () => {
    it('groups batters into game matchups with opposing starting pitchers', () => {
      const onSelect = vi.fn();
      const onToggleSaved = vi.fn();
      const onAddToSlip = vi.fn();

      render(
        <HrMaxGameStacksView
          rows={[mockDeskRow1, mockDeskRow2]}
          activeId={null}
          isSaved={() => false}
          onSelect={onSelect}
          onToggleSaved={onToggleSaved}
          onAddToSlip={onAddToSlip}
        />,
      );

      expect(screen.getAllByText(/NYY/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/TOR/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Aaron Judge')).toBeTruthy();
      expect(screen.getByText('Vladimir Guerrero Jr.')).toBeTruthy();
    });
  });
});
