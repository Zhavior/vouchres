import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Parlay } from '../src/types';
import { buildResultsRecordSummary } from '../src/components/results/resultsRecordModel';

function parlay(overrides: Partial<Parlay>): Parlay {
  return {
    id: 'local-1',
    title: 'Test slip',
    legs: [],
    totalOdds: '',
    oddsValue: 0,
    riskTier: 'MEDIUM',
    status: 'PENDING',
    createdAt: '2026-07-26T00:00:00.000Z',
    ...overrides,
  };
}

describe('Aurora Max results presentation', () => {
  it('computes record counts without inventing financial performance', () => {
    const summary = buildResultsRecordSummary([
      parlay({ id: 'won', status: 'WON', backendPickId: 'pick-won', backendSyncState: 'synced' }),
      parlay({ id: 'lost', status: 'LOST' }),
      parlay({ id: 'pending', trustCommittedAt: '2026-07-26T01:00:00.000Z' }),
      parlay({ id: 'void', status: 'VOID' }),
    ]);

    expect(summary).toEqual({
      total: 4,
      won: 1,
      lost: 1,
      pending: 1,
      voids: 1,
      settled: 2,
      winRate: 50,
      synced: 1,
      localOnly: 3,
      committedBeforeOutcome: 1,
    });
  });

  it('keeps win rate unavailable before any win or loss', () => {
    expect(buildResultsRecordSummary([parlay({})]).winRate).toBeNull();
  });

  it('removes guessed ROI, units, payout, and official grading claims', () => {
    const studio = readFileSync('src/components/results/ResultsStudio.tsx', 'utf8');
    const summary = readFileSync('src/components/results/ResultsLedgerSummary.tsx', 'utf8');

    expect(studio).not.toContain('Net units');
    expect(studio).not.toContain('official box score');
    expect(studio).not.toContain('Graded after final');
    expect(summary).not.toContain('p.oddsValue || 2');
    expect(summary).not.toContain("p.wagerAmount ?? 1");
    expect(summary).not.toContain('label="ROI"');
    expect(summary).not.toContain('label="Units"');
    expect(summary).not.toContain('label="Verified"');
  });

  it('keeps the whole Results route on the landing system', () => {
    // Aurora Max used to own this route. The desk and the slip panel are now
    // one surface in the V4 landing vocabulary, so the old stylesheet and its
    // primitives must not creep back in on either half.
    const slips = readFileSync('src/components/results/ResultsSlipsPanel.tsx', 'utf8');
    const ledger = readFileSync('src/components/results/ResultsLedgerSummary.tsx', 'utf8');

    for (const source of [slips, ledger]) {
      expect(source).not.toContain('AuroraMax');
      expect(source).not.toContain('results-aurora-max');
      expect(source).not.toContain('auroraTokens');
      expect(source).toContain('terminal-text');
    }

    // The slip panel is graded by the desk's feed, not by its own opinion.
    expect(slips).toContain('gradeSlipsForSlate');
  });

  it('grades the slate desk from real feed data only', () => {
    const desk = readFileSync('src/components/results/ResultsStudio.tsx', 'utf8');

    // Landing vocabulary, not Aurora Max.
    expect(desk).toContain('terminal-text');
    expect(desk).toContain('bg-obsidian-950');
    expect(desk).not.toContain('AuroraMax');

    // A tier with no pregame snapshot behind it must read UNKNOWN, never a
    // fabricated fraction, and the desk must not compute outcomes itself.
    expect(desk).toContain('UNKNOWN');
    expect(desk).toContain('useSlateResults');
    expect(desk).not.toMatch(/Math\.random/);
  });
});
