import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { createParlayAddSnapshot, openParlayAdd } from '../src/lib/parlays/parlayAddContract';
import { useParlayOsStore } from '../src/stores/parlayOsStore';

const player = {
  id: '592450',
  name: 'Aaron Judge',
  team: 'NYY',
  position: 'RF',
  headshot: '',
  propositions: [],
} as any;

describe('ParlayOS universal add contract', () => {
  beforeEach(() => useParlayOsStore.getState().closePicker());

  it('normalizes the required source and research snapshot', () => {
    const snapshot = createParlayAddSnapshot({
      player,
      propHint: {
        id: 'judge-hr',
        market: 'Home Runs',
        odds: 225,
        spec: 'Aaron Judge 1+ Home Run',
        gamePk: 777,
        playerId: 592450,
      },
      source: 'today',
      dataStatus: 'projected',
      reasoningSnapshot: 'Elite power against this pitch mix.',
      riskSnapshot: 'Lineup is not confirmed.',
      addedAt: '2026-07-16T12:00:00.000Z',
    });

    expect(snapshot).toEqual({
      entityId: '592450',
      gameId: '777',
      market: 'Home Runs',
      line: 'Aaron Judge 1+ Home Run',
      odds: 225,
      source: 'today',
      addedAt: '2026-07-16T12:00:00.000Z',
      dataStatus: 'projected',
      reasoningSnapshot: 'Elite power against this pitch mix.',
      riskSnapshot: 'Lineup is not confirmed.',
    });
  });

  it('opens the canonical picker with the same snapshot', () => {
    const snapshot = openParlayAdd({
      player,
      source: 'player_research',
      dataStatus: 'unknown',
      addedAt: '2026-07-16T12:00:00.000Z',
    });

    const state = useParlayOsStore.getState();
    expect(state.pickerOpen).toBe(true);
    expect(state.pickerContext?.player.id).toBe('592450');
    expect(state.pickerContext?.addSnapshot).toEqual(snapshot);
  });

  it('routes Today, HR, player, pitcher, and Vouch additions through one contract', () => {
    const files = [
      '../src/components/TodayDashboard.tsx',
      '../src/features/hr/pages/HomeRunIntelligencePage.tsx',
      '../src/components/PlayerResearchHub.tsx',
      '../src/pages/pro/TeamMatchupLabPage.tsx',
      '../src/components/vouch-system/VouchCard.tsx',
    ];

    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source, file).toContain('openParlayAdd({');
      expect(source, file).not.toContain('getState().openPicker({');
    }
  });
});
