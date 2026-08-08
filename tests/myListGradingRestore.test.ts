import { describe, expect, it } from 'vitest';
import { mergeLiveProgressIntoSlips } from '../src/domain/parlay/mergeLiveProgress';
import type { SmartParlaySlip } from '../src/domain/parlay/smartParlayTypes';
import { SLIP_STATUS_META } from '../src/components/parlay/types/parlayOsTypes';
import {
  buildParlayLegSettledNotification,
  typeEnabled,
  type NotificationPrefs,
} from '../server/services/notifications/notificationService';

function pendingSlip(): SmartParlaySlip {
  return {
    id: 'list-1',
    sourceId: 'list-1',
    publicId: 'list-1',
    title: 'My List',
    status: 'pending',
    statusLabel: 'Pending',
    summary: '2 picks',
    oddsLabel: '+300',
    legCount: 2,
    legs: [1, 2].map((index) => ({
      id: `leg-${index}`,
      playerName: `Player ${index}`,
      marketLabel: 'Home run',
      selection: `Player ${index} HR`,
      oddsLabel: '+150',
      headshotUrl: null,
      status: 'pending',
      statusLabel: 'Pending',
      resultLabel: 'Pending',
      sport: 'mlb',
      identityComplete: true,
      marketCode: 'ANYTIME_HR',
      statTarget: 1,
    })),
    isLiveLike: false,
    identity: { complete: true, issues: [] },
    proofPickId: null,
  };
}

describe('My List grading restoration', () => {
  it('marks a list ready to grade only after every tracked game is final', () => {
    const progress = new Map([
      ['leg-1', { id: 'leg-1', current: 1, target: 1, label: 'HR hit', gameStatus: 'FINAL' }],
      ['leg-2', { id: 'leg-2', current: 0, target: 1, label: 'Final', gameStatus: 'GAME OVER' }],
    ]);

    const [list] = mergeLiveProgressIntoSlips([pendingSlip()], progress);

    expect(list.status).toBe('ready_to_grade');
    expect(SLIP_STATUS_META[list.status].label).toBe('Ready to grade');
  });

  it('keeps a list live while at least one game is in progress', () => {
    const progress = new Map([
      ['leg-1', { id: 'leg-1', current: 0, target: 1, label: 'Awaiting HR', gameStatus: 'LIVE' }],
    ]);

    const [list] = mergeLiveProgressIntoSlips([pendingSlip()], progress);

    expect(list.status).toBe('live');
    expect(list.legs[0].status).toBe('live');
  });

  it('builds deduplicated pick-grade alerts under the parlay alert preference', () => {
    const alert = buildParlayLegSettledNotification({
      parlayId: 'list-1',
      legIndex: 2,
      status: 'won',
      selection: 'Player 2 HR',
    });
    const prefs: NotificationPrefs = {
      in_app_enabled: true,
      hr_alerts_enabled: true,
      parlay_alerts_enabled: true,
      follow_alerts_enabled: true,
      tail_alerts_enabled: true,
      browser_push_enabled: false,
    };

    expect(alert.dedupeKey).toBe('PARLAY_LEG_SETTLED:list-1:2:won');
    expect(typeEnabled(alert.type, prefs)).toBe(true);
    expect(typeEnabled(alert.type, { ...prefs, parlay_alerts_enabled: false })).toBe(false);
  });
});
