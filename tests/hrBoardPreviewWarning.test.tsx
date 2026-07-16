// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HrPlayerCard } from '../src/features/hr/components/Cards/HrPlayerCard';
import { HrCommandCenter } from '../src/features/hr/components/CommandCenter/HrCommandCenter';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function makeProjectedRow(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'proj-1',
    playerName: 'Preview Batter',
    playerId: 12345,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    gamePk: 777001,
    gameTime: '7:05 PM ET',
    headshotUrl: null,
    rank: 1,
    hrScore: 88,
    hitterPower: 80,
    pitcherVulnerability: 75,
    parkFactor: 70,
    recentForm: 72,
    vouchScore: 84,
    dataConfidence: 65,
    truthStatus: 'projected',
    riskTier: 'Watch',
    oddsLabel: '+320',
    reasons: ['Preview roster slot'],
    warnings: ['Official lineup not posted yet. Do not treat as confirmed.'],
    sourceMode: 'curated',
    ...overrides,
  };
}

describe('HR board projected preview warnings', () => {
  it('shows lineup-not-confirmed warning on projected candidate cards', () => {
    render(<HrPlayerCard player={makeProjectedRow()} />);

    expect(screen.getByText('Preview only')).toBeTruthy();
    expect(screen.getByText('Official lineup not posted yet')).toBeTruthy();
    expect(screen.getAllByTitle('Official lineup not posted yet').length).toBeGreaterThan(0);
  });

  it('does not show preview warning on official candidate cards', () => {
    render(
      <HrPlayerCard
        player={makeProjectedRow({
          truthStatus: 'official',
          warnings: [],
        })}
      />,
    );

    expect(screen.getByText('Confirmed lineup')).toBeTruthy();
    expect(screen.queryByText('Official lineup not posted yet')).toBeNull();
  });

  it('labels and opens the player research action explicitly', () => {
    const onViewProfile = vi.fn();
    const player = makeProjectedRow();

    render(<HrPlayerCard player={player} onViewProfile={onViewProfile} />);
    fireEvent.click(screen.getByRole('button', { name: /open player research/i }));

    expect(onViewProfile).toHaveBeenCalledOnce();
    expect(onViewProfile).toHaveBeenCalledWith(player);
  });

  it('shows auto-preview banner when confirmed lineups are not posted', () => {
    render(
      <HrCommandCenter
        mode="curated"
        viewMode="cards"
        onViewModeChange={vi.fn()}
        onRefresh={vi.fn()}
        isRefreshing={false}
        lastUpdated={null}
        lastUpdatedLabel="—"
        date="2026-07-09"
        isToday
        onDateChange={vi.fn()}
        autoSwitchedToPreview
        eliteCount={1}
        strongCount={2}
        watchCount={3}
        sleeperCount={4}
        totalCount={10}
        searchValue=""
        onSearchChange={vi.fn()}
        onSourceModeChange={vi.fn()}
        activeTiers={['elite', 'strong', 'watch', 'sleeper']}
        onToggleTier={vi.fn()}
        visibleCount={10}
        rows={[]}
      />,
    );

    expect(
      screen.getByText(/No confirmed lineups posted yet — showing preview candidates from projected lineups instead/i),
    ).toBeTruthy();
  });
});
