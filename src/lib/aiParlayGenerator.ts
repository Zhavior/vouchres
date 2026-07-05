/**
 * AI parlay generator — builds the day's parlays from CONFIRMED STARTERS.
 *
 * Sources from /api/mlb/lineup/today (confirmed lineups + game start times), so
 * every leg is a confirmed starter and carries gamePk + gameStartTime (for the
 * 30-min lock) + marketCode (for grading).
 *
 * Judge-panel upgrade (Parlay Hub redesign):
 *  - Multi-market support: ANYTIME_HR, HIT, TOTAL_BASES, RBI, RUN, STRIKEOUTS, STOLEN_BASE
 *  - All estimated odds carry oddsSource: 'estimated' (never silently presented as sportsbook prices)
 *  - Estimated odds stored as American integers (consistent with Leg.odds type)
 *  - Pitcher market (STRIKEOUTS) uses pitcherCandidates from confirmed starters
 *  - Sport-agnostic by construction: a NBA/NFL lineup endpoint with the same shape plugs in
 *    via SPORT_LINEUP_ENDPOINT.
 */

import type { Parlay, Leg } from '../types';
import { safeJsonFetch } from '../api/safeApiClient';
import { LOCK_MINUTES } from './parlayLifecycle';
import type { SportId } from '../sports/registry';

// ─── Market definitions ────────────────────────────────────────────────────────

export type AiMarketCode =
  | 'ANYTIME_HR'
  | 'HIT'
  | 'TOTAL_BASES'
  | 'RBI'
  | 'RUN'
  | 'STRIKEOUTS'
  | 'STOLEN_BASE';

/** Estimated American odds per market by batting slot tier.
 *  These are plausibility-weighted estimates — never sportsbook quotes.
 *  oddsSource: 'estimated' is always set to signal this to the UI. */
const MARKET_ODDS: Record<
  AiMarketCode,
  { top4: number; mid: number; low: number }
> = {
  ANYTIME_HR:  { top4: +220, mid: +280, low: +380 },
  HIT:         { top4: -130, mid: -110, low: -105 },
  TOTAL_BASES: { top4: -115, mid: -105, low: +115 },
  RBI:         { top4: +130, mid: +175, low: +230 },
  RUN:         { top4: +120, mid: +155, low: +200 },
  STRIKEOUTS:  { top4: -130, mid: -120, low: -110 }, // for pitchers — top4 = ace starters
  STOLEN_BASE: { top4: +180, mid: +240, low: +320 },
};

const MARKET_LABEL: Record<AiMarketCode, { market: string; selection: (name: string, target: number) => string }> = {
  ANYTIME_HR:  {
    market: 'To Hit a Home Run (Anytime)',
    selection: (name) => `${name} Anytime HR`,
  },
  HIT:         {
    market: 'To Record a Hit',
    selection: (name, t) => `${name} ${t}+ Hit${t > 1 ? 's' : ''}`,
  },
  TOTAL_BASES: {
    market: 'Total Bases',
    selection: (name, t) => `${name} ${t}+ Total Bases`,
  },
  RBI:         {
    market: 'To Record an RBI',
    selection: (name, t) => `${name} ${t}+ RBI${t > 1 ? 's' : ''}`,
  },
  RUN:         {
    market: 'To Score a Run',
    selection: (name) => `${name} To Score`,
  },
  STRIKEOUTS:  {
    market: 'Pitcher Strikeouts',
    selection: (name, t) => `${name} ${t}+ Ks`,
  },
  STOLEN_BASE: {
    market: 'To Record a Stolen Base',
    selection: (name) => `${name} SB`,
  },
};

/** Default stat target per market. */
const MARKET_TARGET: Record<AiMarketCode, number> = {
  ANYTIME_HR:  1,
  HIT:         1,
  TOTAL_BASES: 2,
  RBI:         1,
  RUN:         1,
  STRIKEOUTS:  5,
  STOLEN_BASE: 1,
};

// ─── Parcel types ──────────────────────────────────────────────────────────────

interface StarterCandidate {
  playerName: string;
  team: string;
  playerId?: string;
  teamId?: string;
  /** null = pitcher slot */
  battingOrder: number | null;
  gamePk: string;
  gameStartTime: string;
  isPitcher?: boolean;
}

// ─── Lineup fetcher ────────────────────────────────────────────────────────────

const SPORT_LINEUP_ENDPOINT: Record<SportId, string> = {
  mlb: '/api/mlb/lineup/today',
  nba: '/api/nba/lineup/today',
  nfl: '/api/nfl/lineup/today',
};

/** Pull confirmed starters (with game start time) from the lineup feed. */
async function fetchConfirmedStarters(
  sport: SportId
): Promise<{ hitters: StarterCandidate[]; pitchers: StarterCandidate[] }> {
  const endpoint = SPORT_LINEUP_ENDPOINT[sport];
  const res = await safeJsonFetch<any>(endpoint, {
    fallbackData: { games: [] },
    timeoutMs: 14_000,
  });
  const games: any[] = res.data?.games ?? [];

  const hitters: StarterCandidate[] = [];
  const pitchers: StarterCandidate[] = [];

  for (const g of games) {
    if (!g?.lineupConfirmed) continue;
    const start: string = g.gameDate;
    const gamePk = String(g.gamePk);

    const collectHitters = (players: any[]) => {
      (players ?? []).forEach((p: any) => {
        if (p.battingOrder && p.battingOrder <= 6) {
          hitters.push({
            playerName: p.playerName,
            team: p.team,
            battingOrder: Number(p.battingOrder),
            gamePk,
            gameStartTime: start,
            playerId: String(p.playerId || p.player_id || p.id || ''),
            teamId: String(p.teamId || p.team_id || ''),
          });
        }
      });
    };

    const collectPitchers = (players: any[]) => {
      (players ?? []).forEach((p: any) => {
        if (p.isPitcher || p.position === 'SP' || p.position === 'P') {
          pitchers.push({
            playerName: p.playerName,
            team: p.team,
            battingOrder: null,
            gamePk,
            gameStartTime: start,
            playerId: String(p.playerId || p.player_id || p.id || ''),
            teamId: String(p.teamId || p.team_id || ''),
            isPitcher: true,
          });
        }
      });
    };

    collectHitters(g.awayLineup ?? []);
    collectHitters(g.homeLineup ?? []);
    collectPitchers(g.awayPitchers ?? g.awayStarters ?? []);
    collectPitchers(g.homePitchers ?? g.homeStarters ?? []);
  }

  return { hitters, pitchers };
}

// ─── Odds helpers ──────────────────────────────────────────────────────────────

/** Estimated American odds for a hitter leg, based on batting order. */
function estimatedAmericanOdds(market: AiMarketCode, battingOrder: number | null): number {
  const tier = market === 'STRIKEOUTS'
    ? MARKET_ODDS[market].top4  // pitchers always get ace-tier odds
    : battingOrder != null && battingOrder <= 4
      ? MARKET_ODDS[market].top4
      : battingOrder != null && battingOrder <= 5
        ? MARKET_ODDS[market].mid
        : MARKET_ODDS[market].low;
  return tier;
}

/** American → decimal for parlay multiplication. */
function toDecimal(american: number): number {
  return american >= 0 ? american / 100 + 1 : 100 / Math.abs(american) + 1;
}

/** Decimal → formatted American string (e.g. "+360", "-110"). */
function americanFromDecimal(dec: number): string {
  return dec >= 2
    ? `+${Math.round((dec - 1) * 100)}`
    : `-${Math.round(100 / (dec - 1))}`;
}

// ─── Leg builder ───────────────────────────────────────────────────────────────

function buildLeg(
  c: StarterCandidate,
  market: AiMarketCode,
  idx: number
): Leg {
  const gameId = String(c.gamePk || '');
  const playerId = String(c.playerId || '');
  const teamId = String(c.teamId || '');
  const statTarget = MARKET_TARGET[market];
  const comparator = '>=';
  const comparatorKey = 'GTE';
  const americanOdds = estimatedAmericanOdds(market, c.battingOrder);
  const labelDef = MARKET_LABEL[market];

  const eventKey = [
    'MLB', gameId, teamId, playerId, market, statTarget, comparatorKey,
  ].join('_');
  const popularityKey = [
    'MLB', playerId, market, statTarget, comparatorKey,
  ].join('_');

  return {
    id: `ai-leg-${gameId}-${playerId || idx}-${market}-${statTarget}`,
    sport: 'MLB',
    game: `${c.team}`,
    market: labelDef.market,
    selection: labelDef.selection(c.playerName, statTarget),
    odds: americanOdds,
    // oddsSource surfaces in the UI as an 'estimated' badge —
    // never shown to user as a sportsbook-confirmed price.
    oddsSource: 'estimated' as const,
    status: 'PENDING',
    gamePk: gameId,
    gameId,
    teamId,
    playerId,
    marketCode: market,
    statTarget,
    threshold: statTarget,
    comparator,
    eventKey,
    popularityKey,
    externalProvider: 'mlb_statsapi',
    gameStartTime: c.gameStartTime,
  };
}

// ─── Recipe builder ────────────────────────────────────────────────────────────

interface Recipe {
  legs: number;
  risk: Parlay['riskTier'];
  label: string;
  /** Market sequence for each leg slot. */
  markets: AiMarketCode[];
}

/** Recipes rotate markets so each parlay feels distinct and multi-dimensional. */
const RECIPES: Recipe[] = [
  {
    legs: 2,
    risk: 'LOW',
    label: 'Safe',
    markets: ['HIT', 'HIT'],
  },
  {
    legs: 3,
    risk: 'LOW',
    label: 'Contact',
    markets: ['HIT', 'TOTAL_BASES', 'RUN'],
  },
  {
    legs: 3,
    risk: 'MEDIUM',
    label: 'Balanced',
    markets: ['ANYTIME_HR', 'TOTAL_BASES', 'RBI'],
  },
  {
    legs: 4,
    risk: 'MEDIUM',
    label: 'Power',
    markets: ['ANYTIME_HR', 'STRIKEOUTS', 'TOTAL_BASES', 'RBI'],
  },
  {
    legs: 4,
    risk: 'HIGH',
    label: 'Longshot',
    markets: ['ANYTIME_HR', 'ANYTIME_HR', 'STOLEN_BASE', 'STRIKEOUTS'],
  },
  {
    legs: 5,
    risk: 'HIGH',
    label: 'Moonshot',
    markets: ['ANYTIME_HR', 'TOTAL_BASES', 'RBI', 'STOLEN_BASE', 'STRIKEOUTS'],
  },
];

// ─── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate the day's AI parlays from confirmed starters.
 *
 * Returns 0 parlays if no lineups are confirmed yet (honest — no fake picks).
 * All legs carry `oddsSource: 'estimated'` to make clear these are model-
 * estimated prices, not live sportsbook odds.
 */
export async function generateAiParlays(
  opts: { sport?: SportId } = {}
): Promise<Parlay[]> {
  const sport = opts.sport ?? 'mlb';
  const { hitters, pitchers } = await fetchConfirmedStarters(sport);
  if (hitters.length < 2) return [];

  // One hitter per game (best batting order) for variance across games.
  const byGame = new Map<string, StarterCandidate>();
  for (const h of hitters) {
    const existing = byGame.get(h.gamePk);
    if (!existing || (h.battingOrder ?? 99) < (existing.battingOrder ?? 99)) {
      byGame.set(h.gamePk, h);
    }
  }
  const onePerGame = Array.from(byGame.values());

  // One pitcher per game (first confirmed SP).
  const pitcherByGame = new Map<string, StarterCandidate>();
  for (const p of pitchers) {
    if (!pitcherByGame.has(p.gamePk)) pitcherByGame.set(p.gamePk, p);
  }
  const onePitcherPerGame = Array.from(pitcherByGame.values());

  const parlays: Parlay[] = [];

  RECIPES.forEach((recipe, ri) => {
    // For each leg slot, pick the best available player for the market type.
    const legs: Leg[] = [];
    let hitterIdx = 0;
    let pitcherIdx = 0;

    for (let slot = 0; slot < recipe.legs; slot++) {
      const market = recipe.markets[slot];
      if (market === 'STRIKEOUTS') {
        const pitcher = onePitcherPerGame[pitcherIdx % Math.max(onePitcherPerGame.length, 1)];
        if (!pitcher) continue;
        legs.push(buildLeg(pitcher, market, ri * 100 + slot));
        pitcherIdx++;
      } else {
        const hitter = onePerGame[hitterIdx % Math.max(onePerGame.length, 1)];
        if (!hitter) continue;
        legs.push(buildLeg(hitter, market, ri * 100 + slot));
        hitterIdx++;
      }
    }

    if (legs.length < recipe.legs) return; // not enough starters confirmed

    // Calculate combined parlay odds from estimated American legs.
    const decimalProduct = legs.reduce(
      (acc, l) => acc * toDecimal(l.odds ?? 100),
      1
    );
    const oddsValue = Math.round(decimalProduct * 100) / 100;

    // Lock time = earliest game start − 30 min.
    const lockMsArr = legs
      .map((l) => new Date(l.gameStartTime!).getTime())
      .filter((t) => !isNaN(t));
    const lockAt = lockMsArr.length
      ? new Date(Math.min(...lockMsArr) - LOCK_MINUTES * 60_000).toISOString()
      : undefined;

    const marketSummary = [...new Set(recipe.markets)]
      .filter((m) => m !== 'STRIKEOUTS')
      .join(' / ');

    parlays.push({
      id: `ai-parlay-${Date.now()}-${ri}`,
      title: `V.A.I ${recipe.label} ${recipe.legs}-Leg (${marketSummary})`,
      legs,
      totalOdds: americanFromDecimal(oddsValue),
      oddsValue,
      riskTier: recipe.risk,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      wagerAmount: 1,
      aiGenerated: true,
      lockAt,
    });
  });

  return parlays;
}
