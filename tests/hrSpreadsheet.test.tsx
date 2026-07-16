// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HrSpreadsheet } from '../src/features/hr/components/Table/HrSpreadsheet';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function makeRow(overrides: Partial<HrWatchRow>): HrWatchRow {
  return {
    stableId: 'row-1',
    playerName: 'First Hitter',
    playerId: 1,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'First Pitcher',
    venue: 'First Park',
    gamePk: 10,
    gameTime: '2026-07-16T23:05:00Z',
    headshotUrl: null,
    rank: 1,
    hrScore: 95,
    hitterPower: 90,
    pitcherVulnerability: 75,
    parkFactor: 70,
    recentForm: 65,
    vouchScore: 8,
    dataConfidence: 90,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+300',
    reasons: ['Power advantage'],
    warnings: ['Weather risk'],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('HR matchup slider', () => {
  it('filters the table to the selected team-versus-team game', () => {
    render(
      <HrSpreadsheet
        rows={[
          makeRow({ stableId: 'first', playerName: 'First Hitter' }),
          makeRow({ stableId: 'second', playerName: 'Second Hitter', team: 'TOR', opponent: 'BAL', gamePk: 20 }),
        ]}
        freshness="fresh"
        generatedAt={new Date()}
        onSelectPlayer={vi.fn()}
      />,
    );

    expect(screen.getAllByText('First Hitter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Second Hitter').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Show TOR vs BAL' }));

    expect(screen.queryByText('First Hitter')).toBeNull();
    expect(screen.getAllByText('Second Hitter').length).toBeGreaterThan(0);
  });

  it('compresses the selector when only one game is available', () => {
    render(
      <HrSpreadsheet
        rows={[makeRow({})]}
        freshness="fresh"
        generatedAt={new Date()}
        onSelectPlayer={vi.fn()}
      />,
    );

    expect(screen.queryByText('Slate matchups')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Previous matchup' })).toBeNull();
  });

  it('explains the score, hides an empty market column, and exposes explicit actions', () => {
    const onSelectPlayer = vi.fn();
    const onAddToSlip = vi.fn();
    render(
      <HrSpreadsheet
        rows={[makeRow({ oddsLabel: 'Odds TBD', bookOdds: null, impliedProbability: null })]}
        freshness="fresh"
        generatedAt={new Date()}
        onSelectPlayer={onSelectPlayer}
        onAddToSlip={onAddToSlip}
      />,
    );

    expect(screen.getAllByText('95').length).toBeGreaterThan(0);
    expect(screen.getAllByText('/100').length).toBeGreaterThan(0);
    expect(screen.getByText(/Market odds unavailable for this preview slate/)).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: 'Market' })).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: /Research/ })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Slip/ })[0]);
    expect(onSelectPlayer).toHaveBeenCalledTimes(1);
    expect(onAddToSlip).toHaveBeenCalledTimes(1);
  });

  it('expands detailed signal inputs without hiding the full player name', () => {
    render(
      <HrSpreadsheet
        rows={[makeRow({ playerName: 'A Very Long Complete Player Name' })]}
        freshness="fresh"
        generatedAt={new Date()}
        onSelectPlayer={vi.fn()}
      />,
    );

    expect(screen.getAllByText('A Very Long Complete Player Name').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { name: 'Show details for A Very Long Complete Player Name' })[0]);
    expect(screen.getAllByText('Signal inputs').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Data confidence').length).toBeGreaterThan(0);
  });

  it('shows shared projected-lineup state once at matchup level and sanitizes public copy', () => {
    render(
      <HrSpreadsheet
        rows={[
          makeRow({
            truthStatus: 'projected',
            sourceMode: 'curated',
            reasons: ['Backend roster registry mismatch'],
            warnings: ['Official lineup not posted yet', 'Weather may reduce carry'],
          }),
        ]}
        freshness="fresh"
        generatedAt={new Date()}
        onSelectPlayer={vi.fn()}
      />,
    );

    expect(screen.getByText('1 projected player; official batting order not posted.')).toBeTruthy();
    expect(screen.queryByText(/roster registry mismatch/i)).toBeNull();
    expect(screen.getAllByText(/Today's signal combines/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Weather may reduce carry').length).toBeGreaterThan(0);
  });

  it('keeps confirmed and data states in Status while using a compact expansion control', () => {
    const { container } = render(
      <HrSpreadsheet
        rows={[makeRow({ truthStatus: 'official', dataConfidence: 90 })]}
        freshness="fresh"
        generatedAt={new Date()}
        onSelectPlayer={vi.fn()}
      />,
    );

    expect(screen.queryByText(/official batting order not posted/i)).toBeNull();
    expect(screen.getAllByText('Confirmed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Data 90%').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Details' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Show details for First Hitter' }).length).toBeGreaterThan(0);
    expect(container.querySelector('thead')?.className).toContain('sticky');

    const expandControls = screen.getAllByRole('button', { name: 'Show details for First Hitter' });
    fireEvent.keyDown(expandControls[0], { key: 'Enter' });
    expect(screen.getAllByText('Signal inputs').length).toBeGreaterThan(0);
  });
});
