// @vitest-environment happy-dom
/**
 * HOTFIX-HR-EDGE-001 — the Edge Desk must fail closed.
 *
 * A missing market price or a missing model probability makes the edge
 * unknowable. The desk must say so rather than substitute a literal, because
 * an invented implied probability produces an invented +EV recommendation.
 */
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import EdgeDeskView from '../src/features/hr/components/workspace/views/EdgeDeskView';
import type { HrWatchRow } from '../src/features/hr/types/hrWatch';

function makeRow(overrides: Partial<HrWatchRow> & { stableId: string; playerName: string }): HrWatchRow {
  return {
    playerId: 100,
    team: 'NYY',
    opponent: 'BOS',
    teamLogoUrl: null,
    opponentLogoUrl: null,
    pitcherName: 'Opposing Starter',
    venue: null,
    gamePk: 777,
    gameTime: null,
    headshotUrl: null,
    rank: 1,
    hrScore: 82,
    hitterPower: null,
    pitcherVulnerability: null,
    parkFactor: null,
    recentForm: null,
    vouchScore: null,
    dataConfidence: null,
    truthStatus: 'official',
    riskTier: 'Core',
    oddsLabel: '',
    reasons: [],
    warnings: [],
    sourceMode: 'confirmed',
    ...overrides,
  } as HrWatchRow;
}

/** Text of the sibling value rendered next to a label, label stripped. */
function valueFor(label: string): string {
  const parent = screen.getByText(label).parentElement;
  return (parent?.textContent ?? '').replace(label, '').trim();
}

/** Priced: model 30%, book implied 20% => +10.0% edge. */
const pricedRow = makeRow({
  stableId: 'priced-1',
  playerName: 'Priced Player',
  oddsLabel: '+300',
  bookOdds: 300,
  hrProbability: 0.3,
  impliedProbability: 0.2,
});

/** No market price at all — the 0.22 fallback case. */
const noOddsRow = makeRow({
  stableId: 'no-odds-1',
  playerName: 'No Odds Player',
  oddsLabel: '',
  bookOdds: null,
  hrProbability: 0.3,
  impliedProbability: null,
});

/** No model probability — the hrScore/100*0.35 fallback case. */
const noModelProbRow = makeRow({
  stableId: 'no-model-1',
  playerName: 'No Model Prob Player',
  oddsLabel: '+250',
  bookOdds: 250,
  hrProbability: null,
  impliedProbability: 0.2,
});

describe('EdgeDeskView — missing market price', () => {
  it('renders no implied probability and no EV number', () => {
    render(<EdgeDeskView rows={[noOddsRow]} />);

    // The old fallback rendered a book implied probability of 22.0%.
    expect(screen.queryByText('22.0%')).toBeNull();
    expect(valueFor('Book Implied Prob')).toBe('Market unavailable');
    expect(valueFor('EV Edge')).toBe('Market unavailable');
  });

  it('contributes nothing to the +EV count, max EV, or average edge', () => {
    render(<EdgeDeskView rows={[noOddsRow]} />);

    expect(valueFor('+EV Picks')).toBe('0');
    // No priced row means there is no edge to top or average — not a zero one.
    expect(valueFor('Max EV')).toBe('—');
    expect(valueFor('Avg Edge')).toBe('—');
    expect(screen.queryByText('+0.0%')).toBeNull();
    expect(screen.queryByText('0.0%')).toBeNull();
  });

  it('never wins the top-edge banner', () => {
    render(<EdgeDeskView rows={[noOddsRow]} />);
    expect(screen.queryByText('Top +EV Edge')).toBeNull();
  });

  it('still renders the model-side HR information', () => {
    render(<EdgeDeskView rows={[noOddsRow]} />);

    expect(screen.getByText('No Odds Player')).toBeTruthy();
    expect(valueFor('HR Score')).toBe('82');
    expect(valueFor('Model HR Prob')).toBe('30.0%');
  });
});

describe('EdgeDeskView — missing model probability', () => {
  it('renders no EV number and no fabricated model probability', () => {
    render(<EdgeDeskView rows={[noModelProbRow]} />);

    // hrScore 82 => the old fallback produced 82/100 * 0.35 = 28.7%.
    expect(screen.queryByText('28.7%')).toBeNull();
    expect(valueFor('Model HR Prob')).toBe('Model probability unavailable');
    expect(valueFor('EV Edge')).toBe('Market unavailable');
    expect(screen.queryByText('Top +EV Edge')).toBeNull();
    expect(valueFor('+EV Picks')).toBe('0');
  });
});

describe('EdgeDeskView — placeholder odds labels', () => {
  it.each(['TBD', 'Odds Unavailable', 'N/A', '—'])(
    'treats %s as no price rather than a book odds figure',
    (label) => {
      const row = makeRow({
        stableId: `placeholder-${label}`,
        playerName: 'Placeholder Player',
        oddsLabel: label,
        bookOdds: null,
        hrProbability: 0.3,
        impliedProbability: null,
      });

      render(<EdgeDeskView rows={[row]} />);

      // No odds pill at all — the "Book Odds" caption only renders alongside a
      // real price, so its absence proves the placeholder was not promoted to
      // a book price.
      expect(screen.queryByText('Book Odds')).toBeNull();

      // The raw label must not be rendered as a value. An em dash is exempt:
      // the header legitimately shows "—" for Max EV and Avg Edge when nothing
      // on the slate is priced, so matching it here would be ambiguous.
      if (label !== '—') {
        expect(screen.queryByText(label)).toBeNull();
      }

      expect(valueFor('Book Implied Prob')).toBe('Market unavailable');
    },
  );

  it('uses the fail-closed odds label in the top banner, not the raw field', () => {
    const priced = makeRow({
      ...pricedRow,
      stableId: 'banner-priced',
      playerName: 'Banner Player',
      oddsLabel: 'TBD', // raw label is a placeholder; bookOdds is the real price
      bookOdds: 300,
    });

    render(<EdgeDeskView rows={[priced]} />);

    const banner = screen.getByText('Top +EV Edge').closest('div.relative') as HTMLElement;
    expect(within(banner).queryByText('TBD')).toBeNull();
    expect(within(banner).getByText('+300')).toBeTruthy();
  });
});

describe('EdgeDeskView — priced rows', () => {
  it('renders implied probability, EV edge, and the top-edge banner', () => {
    render(<EdgeDeskView rows={[pricedRow]} />);

    expect(valueFor('Model HR Prob')).toBe('30.0%');
    expect(valueFor('Book Implied Prob')).toBe('20.0%');
    expect(valueFor('EV Edge')).toBe('+10.0%');
    expect(screen.getByText('Top +EV Edge')).toBeTruthy();
    expect(valueFor('+EV Picks')).toBe('1');
    expect(screen.queryByText('Market unavailable')).toBeNull();
  });
});

describe('EdgeDeskView — sorting', () => {
  it('places rows with an unknown edge last under the default edge sort', () => {
    const lowEdge = makeRow({
      stableId: 'low-edge',
      playerName: 'Low Edge Player',
      oddsLabel: '+400',
      bookOdds: 400,
      hrProbability: 0.21,
      impliedProbability: 0.2,
    });

    render(<EdgeDeskView rows={[noOddsRow, lowEdge, pricedRow]} />);

    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((node) => node.textContent);

    expect(names).toEqual(['Priced Player', 'Low Edge Player', 'No Odds Player']);
  });
});
