import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { NormalizedPlayerPayload } from '../src/adapters/normalized';
import { PlayerResearchDecisionCard } from '../src/components/player/PlayerResearchDecisionCard';
import { buildAuroraPlayerDecision } from '../src/components/player/buildAuroraPlayerDecision';

function payload(overrides: Partial<NormalizedPlayerPayload['player']> = {}): NormalizedPlayerPayload {
  return {
    player: {
      playerId: 660271,
      playerName: 'Test Player',
      team: 'TOR',
      opponent: 'NYY',
      lineupStatus: 'confirmed',
      dataQuality: 'full',
      ...overrides,
    },
    scoreBreakdown: {
      finalScore: 78,
      pitcherVulnerability: 64,
      lineupConfidence: 83,
    },
    recentForm: { recentPowerScore: 71 },
    matchup: { weatherBoost: 4 },
  };
}

describe('Aurora player decision presentation', () => {
  it('preserves upstream evidence and labels confirmed lineups', () => {
    const decision = buildAuroraPlayerDecision(
      payload({
        grade: 'A',
        reasons: ['Actual board reason', 'Second reason'],
        warnings: ['Board warning'],
        source: 'hr_board',
        dataConfidence: 86,
      }),
      {
        source: 'official_mlb',
        updatedAt: '2026-07-26T12:00:00.000Z',
        warnings: ['Research warning'],
      },
    );

    expect(decision.answer.title).toBe('A research grade');
    expect(decision.answer.summary).toBe('Actual board reason');
    expect(decision.answer.score).toBe(78);
    expect(decision.answer.confidence).toBe(86);
    expect(decision.trust.status).toBe('confirmed');
    expect(decision.trust.source).toBe('hr_board');
    expect(decision.reasons).toEqual(['Actual board reason', 'Second reason']);
    expect(decision.risks).toEqual(['Board warning', 'Research warning']);
  });

  it('does not turn missing score or confidence into zero', () => {
    const decision = buildAuroraPlayerDecision({
      player: {
        playerId: '',
        playerName: 'Unknown Score',
        team: null,
        opponent: null,
        lineupStatus: 'unknown',
        dataQuality: 'unknown',
      },
    });

    expect(decision.answer.score).toBeNull();
    expect(decision.answer.confidence).toBeNull();
    expect(decision.answer.title).toBe('Decision unavailable');
    expect(decision.trust.status).toBe('unavailable');
  });

  it('does not relabel lineup confidence or Vouch score as model evidence', () => {
    const decision = buildAuroraPlayerDecision({
      player: {
        playerId: 660271,
        playerName: 'Separated Metrics',
        team: 'TOR',
        opponent: 'NYY',
        lineupStatus: 'confirmed',
        dataQuality: 'partial',
        vouchScore: 99,
      },
      scoreBreakdown: { lineupConfidence: 88 },
    });

    expect(decision.answer.score).toBeNull();
    expect(decision.answer.confidence).toBeNull();
  });

  it('omits a deep-research action when the consumer has no disclosure target', () => {
    const markup = renderToStaticMarkup(createElement(PlayerResearchDecisionCard, {
      payload: payload(),
    }));

    expect(markup).not.toContain('href="#aurora-deep-research"');
    expect(markup).not.toContain('Review deep research');
  });

  it('clearly marks projection previews and blocked signals', () => {
    const preview = buildAuroraPlayerDecision(payload({ lineupStatus: 'projected_unconfirmed' }));
    const blocked = buildAuroraPlayerDecision(payload({ riskLabel: 'Blocked by data check' }));

    expect(preview.trust.status).toBe('projected');
    expect(preview.answer.title).toBe('Preview — lineup pending');
    expect(preview.answer.actionLabel).toBe('Review preview evidence');
    expect(blocked.trust.status).toBe('blocked');
    expect(blocked.answer.title).toBe('Signal blocked');
  });

  it('keeps fabricated Player Lab claims out of the Aurora integration', () => {
    const page = readFileSync(
      new URL('../src/pages/pro/PlayerEdgeLabPageZ8.tsx', import.meta.url),
      'utf8',
    );

    expect(page).toContain('PlayerResearchDecisionCard');
    expect(page).toContain('AuroraDisclosure');
    expect(page).not.toContain('★★★★★ VERIFIED PLAY');
    expect(page).not.toContain('WHY VOUCHEDGE LIKES THIS');
    expect(page).not.toContain('AI model consensus');
    expect(page).not.toContain('IntelligenceConsole');
    expect(page).not.toContain('verified candidates');
    expect(page).not.toContain('verified player data');
    expect(page).not.toContain('row?.edgePct');
  });
});
