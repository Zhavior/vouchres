// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TodayAuroraHero, { type TodayHeroState } from '../src/components/today/TodayAuroraHero';
import type { TodayDecision } from '../src/components/today/todayDecisionModel';

const decision: TodayDecision = {
  tone: 'emerald',
  statusLabel: 'Report complete',
  title: 'Today’s HR research board is available',
  description: 'Compare verified evidence and risk before choosing a player.',
  ctaLabel: 'Review HR Intelligence',
  ctaSection: 'hr_max',
  attention: [],
  resumeLabel: 'Continue tracking',
  resumeTitle: '1 unresolved slip',
  resumeDetail: 'Return to the exact work already in progress.',
  resumeSection: 'live_parlays',
  liveGames: 0,
  upcomingGames: 4,
  finalGames: 0,
};

function renderHero(state: TodayHeroState = 'pregame') {
  const onSectionChange = vi.fn();
  const result = render(
    <TodayAuroraHero
      decision={decision}
      displayName="Boyd Santos"
      freshnessLabel="Updated 2 min ago"
      state={state}
      onSectionChange={onSectionChange}
    />,
  );
  return { ...result, onSectionChange };
}

describe('Today Aurora state-aware hero', () => {
  it.each<TodayHeroState>(['loading', 'live', 'pregame', 'postgame', 'no-slate', 'degraded'])(
    'exposes the %s state to styling and assistive tests',
    (state) => {
      const { container } = renderHero(state);
      const hero = container.querySelector('#today-aurora-hero');
      expect(hero?.getAttribute('data-state')).toBe(state);
      expect(hero?.getAttribute('data-performance-page')).toBe('today');
    },
  );

  it('personalizes the greeting without changing the evidence-based decision copy', () => {
    renderHero();
    expect(screen.getByText(/Boyd$/)).not.toBeNull();
    expect(screen.getByRole('heading', { name: decision.title })).not.toBeNull();
    expect(screen.getByText('Updated 2 min ago')).not.toBeNull();
  });

  it('routes its primary action to the decision model destination', () => {
    const { onSectionChange } = renderHero();
    fireEvent.click(screen.getByTestId('today-primary-action'));
    expect(onSectionChange).toHaveBeenCalledOnce();
    expect(onSectionChange).toHaveBeenCalledWith('hr_max');
  });
});
