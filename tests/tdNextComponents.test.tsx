// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchupTicker } from '../src/app/td-next/components/MatchupTicker';
import { TelemetryHUD } from '../src/app/td-next/components/TelemetryHUD';
import { SlateAlphaHero } from '../src/app/td-next/components/SlateAlphaHero';
import { PlayerTDCard } from '../src/app/td-next/components/PlayerTDCard';
import { TacticalRadar } from '../src/app/td-next/components/TacticalRadar';
import { TierBoard } from '../src/app/td-next/components/TierBoard';
import {
  MOCK_TOUCHDOWN_PLAYERS,
  INITIAL_NFL_TICKER_GAMES,
  SLATE_TELEMETRY_SNAPSHOT,
} from '../src/features/nfl-touchdown/data/mockTouchdownData';
import type { TacticalRadarFilters } from '../src/types/touchdown';

describe('TD NEXT Component Suite', () => {
  const derrickHenry = MOCK_TOUCHDOWN_PLAYERS.find((p) => p.name === 'Derrick Henry')!;

  describe('MatchupTicker', () => {
    it('renders ticker games with live score and clock', () => {
      const onSelect = vi.fn();
      render(
        <MatchupTicker
          games={INITIAL_NFL_TICKER_GAMES}
          selectedGameId={null}
          onSelectGame={onSelect}
        />
      );

      expect(screen.getByText(/All Slate/i)).toBeTruthy();
      expect(screen.getByText('SF')).toBeTruthy();
      expect(screen.getByText('LAC')).toBeTruthy();
      expect(screen.getAllByText(/BAL/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/MIN/).length).toBeGreaterThan(0);
    });

    it('triggers game selection when clicked', () => {
      const onSelect = vi.fn();
      render(
        <MatchupTicker
          games={INITIAL_NFL_TICKER_GAMES}
          selectedGameId={null}
          onSelectGame={onSelect}
        />
      );

      const sfGame = screen.getByText('SF');
      fireEvent.click(sfGame);
      expect(onSelect).toHaveBeenCalledWith('game-1');
    });
  });

  describe('TelemetryHUD', () => {
    it('displays all 5 telemetry metrics', () => {
      render(<TelemetryHUD telemetry={SLATE_TELEMETRY_SNAPSHOT} />);

      expect(screen.getByText(/SLATE VOLUME/i)).toBeTruthy();
      expect(screen.getByText(/16 GAMES/i)).toBeTruthy();
      expect(screen.getByText(/LIVE RZ ALERTS/i)).toBeTruthy();
      expect(screen.getByText(/2 ACTIVE/i)).toBeTruthy();
      expect(screen.getByText(/AVG REDZONE EFF/i)).toBeTruthy();
      expect(screen.getByText(/58.4%/i)).toBeTruthy();
      expect(screen.getByText(/MAX MISMATCH/i)).toBeTruthy();
      expect(screen.getByText(/SYSTEM ALPHA/i)).toBeTruthy();
      expect(screen.getByText(/88.4 TDPI/i)).toBeTruthy();
    });
  });

  describe('SlateAlphaHero', () => {
    it('renders the marquee card with Derrick Henry details and actions', () => {
      const onDossier = vi.fn();
      const onSlip = vi.fn();

      render(
        <SlateAlphaHero
          player={derrickHenry}
          onOpenDossier={onDossier}
          onAddToSlip={onSlip}
        />
      );

      expect(screen.getByText(/SLATE ALPHA MARQUEE DOSSIER/i)).toBeTruthy();
      expect(screen.getByText('Derrick Henry')).toBeTruthy();
      expect(screen.getByText(/88.4/)).toBeTruthy();
      expect(screen.getByText(/81.2%/)).toBeTruthy();
      expect(screen.getByText(/\+14.2%/)).toBeTruthy();

      const slipBtn = screen.getByText('+ SLIP');
      fireEvent.click(slipBtn);
      expect(onSlip).toHaveBeenCalledWith(derrickHenry);

      const dossierBtn = screen.getByText('DOSSIER');
      fireEvent.click(dossierBtn);
      expect(onDossier).toHaveBeenCalledWith(derrickHenry);
    });
  });

  describe('PlayerTDCard', () => {
    it('renders neobrutalist card with badge, gauges, and actions', () => {
      const onDossier = vi.fn();
      const onSlip = vi.fn();

      render(
        <PlayerTDCard
          player={derrickHenry}
          onOpenDossier={onDossier}
          onAddToSlip={onSlip}
        />
      );

      expect(screen.getByText('Derrick Henry')).toBeTruthy();
      expect(screen.getByText('88.4')).toBeTruthy();
      expect(screen.getByText('TDPI')).toBeTruthy();
      expect(screen.getByText('14 Tch')).toBeTruthy();
      expect(screen.getByText('#29')).toBeTruthy();
      expect(screen.getByText('+14.2% EV')).toBeTruthy();
    });
  });

  describe('TacticalRadar', () => {
    it('renders filters and triggers updates on toggle', () => {
      const onUpdate = vi.fn();
      const onReset = vi.fn();
      const initialFilters: TacticalRadarFilters = {
        searchQuery: '',
        positionFocus: 'ALL',
        rzTouchShareMin25: false,
        inside10TargetMin30: false,
        oppRzDefBottom10: false,
        impliedTotalMin24_5: false,
        redZoneAlertOnly: false,
        positiveEdgeOnly: false,
        selectedGameId: null,
      };

      render(
        <TacticalRadar
          filters={initialFilters}
          onUpdateFilter={onUpdate}
          onResetFilters={onReset}
          filteredCount={10}
          totalCount={12}
        />
      );

      expect(screen.getByText(/Tactical Radar/i)).toBeTruthy();
      expect(screen.getByText(/All Touchdowns/i)).toBeTruthy();
      expect(screen.getByText(/Goal-Line Rushers/i)).toBeTruthy();

      const rzCheckbox = screen.getByLabelText(/RZ Touch Share > 25%/i);
      fireEvent.click(rzCheckbox);
      expect(onUpdate).toHaveBeenCalledWith('rzTouchShareMin25', true);
    });
  });

  describe('TierBoard', () => {
    it('renders all 4 tier columns with players', () => {
      const onDossier = vi.fn();
      const onSlip = vi.fn();

      const tierPartition = {
        ELITE: [derrickHenry],
        STRONG: [],
        VALUE: [],
        SLEEPER: [],
      };

      render(
        <TierBoard
          tierPartition={tierPartition}
          onOpenDossier={onDossier}
          onAddToSlip={onSlip}
        />
      );

      expect(screen.getByText('TIER 1: ELITE TD')).toBeTruthy();
      expect(screen.getByText('TIER 2: STRONG TD')).toBeTruthy();
      expect(screen.getByText('TIER 3: VALUE EDGE')).toBeTruthy();
      expect(screen.getByText('TIER 4: SLEEPER / DART')).toBeTruthy();
    });
  });
});
