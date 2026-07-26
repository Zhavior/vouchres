import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildAuroraGraphCandidate,
  formatGraphMetric,
  lineupStatusLabel,
} from '../src/pages/pro/proGraphsPresentation';
import { getBoardGeneratedAt } from '../src/pages/pro/proLabData';

function readProjectFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('Aurora Pro Graphs presentation', () => {
  it('preserves actual HR Board values without re-scoring them', () => {
    const candidate = buildAuroraGraphCandidate({
      playerId: 660271,
      playerName: 'Test Player',
      team: 'TOR',
      opponent: 'NYY',
      gamePk: 12345,
      grade: 'A',
      projectionType: 'Confirmed',
      hrEdge: 81,
      scoreBreakdown: {
        hitterPower: 77,
        pitcherVulnerability: 63,
        parkFactor: 104,
      },
    });

    expect(candidate.key).toBe('mlb:660271:12345');
    expect(candidate.playerId).toBe('660271');
    expect(candidate.grade).toBe('A');
    expect(candidate.lineupStatus).toBe('confirmed');
    expect(candidate.metrics).toEqual({
      hrEdge: 81,
      hitterPower: 77,
      pitcherVulnerability: 63,
      parkFactor: 104,
    });
  });

  it('keeps missing metrics, grade, and generic ids unavailable', () => {
    const candidate = buildAuroraGraphCandidate({
      id: 'internal-row-12345',
      playerName: 'No MLB ID',
      team: 'TOR',
      projectionType: 'Projected',
    });

    expect(candidate.playerId).toBeNull();
    expect(candidate.grade).toBeNull();
    expect(candidate.lineupStatus).toBe('projected');
    expect(candidate.metrics.hrEdge).toBeNull();
    expect(candidate.metrics.hitterPower).toBeNull();
    expect(candidate.metrics.pitcherVulnerability).toBeNull();
    expect(candidate.metrics.parkFactor).toBeNull();
    expect(formatGraphMetric(candidate.metrics.hrEdge)).toBe('Unavailable');
  });

  it('uses plain-language lineup labels', () => {
    expect(lineupStatusLabel('confirmed')).toBe('Confirmed lineup');
    expect(lineupStatusLabel('projected')).toBe('Projected lineup');
    expect(lineupStatusLabel('unavailable')).toBe('Lineup unavailable');
  });

  it('surfaces only a valid HR Board generation time', () => {
    expect(getBoardGeneratedAt({
      data: { generatedAt: '2026-07-26T04:30:00.000Z' },
    })?.toISOString()).toBe('2026-07-26T04:30:00.000Z');
    expect(getBoardGeneratedAt({ generatedAt: 'not-a-date' })).toBeNull();
    expect(getBoardGeneratedAt({})).toBeNull();
  });

  it('removes fabricated graph defaults and migrates to Aurora contracts', () => {
    const page = readProjectFile('src/pages/pro/ProGraphsLabPageZ8.tsx');

    expect(page).toContain("from '../../theme/auroraTokens'");
    expect(page).toContain('AuroraGraphComparisonCard');
    expect(page).not.toMatch(/\?\?\s*(50|60)/);
    expect(page).not.toContain("safeText(row.grade, 'B')");
    expect(page).not.toContain("'MLB Stadium'");
    expect(page).not.toContain('Verified HR Graph Feed Active');
    expect(page).not.toContain('A feed freshness timestamp was not included.');
    expect(page).not.toContain('Graph Pro Z8');
  });
});
