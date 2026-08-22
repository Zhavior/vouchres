// @vitest-environment happy-dom

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HrNextVerifiedNow } from '../src/features/hr-next/components/HrNextVerifiedNow';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';
import { assessVerifiedNow, buildVerifiedNowSlate } from '../src/features/hr-next/utils/verifiedNow';
import { buildSlateTelemetry } from '../src/features/hr-next/utils/slateTelemetry';

function row(overrides: Partial<HrWatchRow> = {}): HrWatchRow {
  return {
    stableId: 'judge-1', playerName: 'Aaron Judge', playerId: 592450,
    team: 'NYY', opponent: 'BOS', teamLogoUrl: null, opponentLogoUrl: null,
    pitcherName: 'Starter', venue: 'Yankee Stadium', gamePk: 1,
    gameTime: '2026-08-22T23:05:00Z', headshotUrl: null, rank: 1, hrScore: 95,
    hitterPower: 95, pitcherVulnerability: 80, parkFactor: 108,
    recentForm: 90, vouchScore: 90, dataConfidence: 95,
    avgExitVelo: 94, barrelRate: 0.19, hardHitRate: 0.55,
    weather: 82, bullpen: 76, truthStatus: 'official', riskTier: 'Elite',
    oddsLabel: '+260', bookOdds: 260, hrProbability: 0.3, impliedProbability: 0.22,
    reasons: ['Source-complete'], warnings: [], sourceMode: 'confirmed',
    ...overrides,
  } as HrWatchRow;
}

describe('Verified Now truth gate', () => {
  it('requires every decision feed and never treats park context as weather', () => {
    const incomplete = row({ weather: null, truthStatus: 'projected' });
    expect(assessVerifiedNow(incomplete).verified).toBe(false);
    expect(assessVerifiedNow(incomplete).missing).toEqual(expect.arrayContaining(['official_lineup', 'weather']));

    const telemetry = buildSlateTelemetry([incomplete]);
    expect(telemetry.weather.hasFeed).toBe(false);
    expect(telemetry.weather.boostedRows).toBe(0);
    expect(telemetry.weather.topParkIndex).toBe(108);
  });

  it('renders the locked state with exact missing feeds', () => {
    const lockedSlate = buildVerifiedNowSlate([row({ weather: null, bookOdds: null })]);
    render(<HrNextVerifiedNow slate={lockedSlate} onOpenResearch={vi.fn()} onAddToSlip={vi.fn()} />);
    expect(screen.getByText('No source-complete candidates yet')).toBeTruthy();
    expect(screen.getByText(/Weather missing/i)).toBeTruthy();
    expect(screen.getByText(/Book market missing/i)).toBeTruthy();
  });

  it('promotes at most five complete candidates in HRPI order', () => {
    const rows = Array.from({ length: 7 }, (_, index) => row({
      stableId: `player-${index}`,
      playerName: `Player ${index}`,
      hrScore: 80 + index,
    }));
    const slate = buildVerifiedNowSlate(rows);
    expect(slate.completeRows).toBe(7);
    expect(slate.candidates).toHaveLength(5);
    expect(slate.candidates[0].row.playerName).toBe('Player 6');
  });
});
