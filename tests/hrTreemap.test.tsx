// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HrTreemap } from '../src/features/hr/components/Treemap/HrTreemap';
import type { HrBuckets } from '../src/features/hr/hooks/useHrBoardViewModel';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function makeRow(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'judge',
    playerName: 'Aaron Judge',
    playerId: 592450,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: '/nyy.svg',
    opponentLogoUrl: null,
    gamePk: 10,
    gameTime: null,
    headshotUrl: null,
    rank: 1,
    hrScore: 96,
    hitterPower: 95,
    pitcherVulnerability: 80,
    parkFactor: 72,
    recentForm: 88,
    vouchScore: 9,
    dataConfidence: 94,
    truthStatus: 'official',
    riskTier: 'Elite',
    oddsLabel: '+250',
    reasons: ['Power advantage'],
    warnings: [],
    sourceMode: 'confirmed',
    ...overrides,
  };
}

describe('HR signal map', () => {
  it('makes a verified player home run obvious in player and team modes', () => {
    const player = makeRow();
    const buckets: HrBuckets = { Elite: [player], Strong: [], Watch: [], Sleepers: [] };

    render(
      <HrTreemap
        buckets={buckets}
        onSelectPlayer={vi.fn()}
        getHrResult={(playerId) => playerId === player.playerId ? 'hit' : null}
      />,
    );

    expect(screen.getByText('HOME RUN')).toBeTruthy();
    expect(screen.getByText('1 verified HR')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Teams' }));

    expect(screen.getByText('1 HOME RUN')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /NYY, 1 HR candidates, 1 verified home runs/i }));
    expect(screen.getByText('NYY HR candidates')).toBeTruthy();
  });
});
