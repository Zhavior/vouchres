// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WorkspaceRenderer from '../src/features/hr/components/workspace/WorkspaceRenderer';
import type { WorkspaceView } from '../src/features/hr/components/workspace/types';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

const player: HrWatchRow = {
  stableId: 'player-1',
  playerName: 'Test Slugger',
  playerId: 101,
  team: 'NYY',
  opponent: 'BOS',
  teamLogoUrl: null,
  opponentLogoUrl: null,
  pitcherName: 'Test Pitcher',
  venue: 'Test Park',
  gamePk: 9001,
  gameTime: null,
  headshotUrl: null,
  rank: 1,
  hrScore: 88,
  hitterPower: 90,
  pitcherVulnerability: 72,
  parkFactor: 64,
  recentForm: 78,
  vouchScore: 55,
  dataConfidence: 91,
  truthStatus: 'official',
  riskTier: 'Elite',
  oddsLabel: '+300',
  bookOdds: 300,
  hrProbability: 0.3,
  impliedProbability: 0.2,
  recentHomeRuns: 5,
  recentHrGames: 4,
  recentGamesChecked: 10,
  last7DayHomeRuns: 3,
  last7DayGamesChecked: 6,
  reasons: ['Strong verified power signal.'],
  warnings: [],
  sourceMode: 'confirmed',
};

const workspaces: Array<[WorkspaceView, string]> = [
  ['edge', 'Edge Desk'],
  ['stacks', 'Slate Stacks'],
  ['matrix', 'Projection Matrix'],
  ['extremes', 'Extremes'],
];

describe('Home Run Intelligence workspace HR badges', () => {
  it.each(workspaces)('shows seven-day history and today result in %s', (workspace) => {
    render(
      <WorkspaceRenderer
        workspace={workspace}
        rows={[player]}
        getHrResult={(playerId) => playerId === player.playerId ? 'hit' : null}
      >
        <div />
      </WorkspaceRenderer>,
    );

    expect(screen.getAllByText('7Days HR:3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Today HR').length).toBeGreaterThan(0);
  });

  it('does not show Today HR without a verified play-by-play hit', () => {
    render(
      <WorkspaceRenderer workspace="edge" rows={[player]} getHrResult={() => null}>
        <div />
      </WorkspaceRenderer>,
    );

    expect(screen.getAllByText('7Days HR:3').length).toBeGreaterThan(0);
    expect(screen.queryByText('Today HR')).toBeNull();
  });
});
