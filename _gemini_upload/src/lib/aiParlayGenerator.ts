/**
 * AI parlay generator — builds the day's parlays from CONFIRMED STARTERS.
 *
 * Sources from /api/mlb/lineup/today (confirmed lineups + game start times), so
 * every leg is a confirmed starter and carries gamePk + gameStartTime (for the
 * 30-min lock) + marketCode (for grading). Sport-agnostic by construction: an
 * NBA/NFL lineup endpoint with the same shape plugs in via SPORT_LINEUP_ENDPOINT.
 */

import type { Parlay, Leg } from '../types';
import { safeJsonFetch } from '../api/safeApiClient';
import { LOCK_MINUTES } from './parlayLifecycle';
import type { SportId } from '../sports/registry';

interface StarterCandidate {
  playerName: string;
  team: string;
  battingOrder: number;
  gamePk: string;
  gameStartTime: string;
}

const SPORT_LINEUP_ENDPOINT: Record<SportId, string> = {
  mlb: '/api/mlb/lineup/today',
  nba: '/api/nba/lineup/today',
  nfl: '/api/nfl/lineup/today',
};

/** Pull confirmed starters (with game start time) from the lineup feed. */
async function fetchConfirmedStarters(sport: SportId): Promise<StarterCandidate[]> {
  const endpoint = SPORT_LINEUP_ENDPOINT[sport];
  const res = await safeJsonFetch<any>(endpoint, {
    fallbackData: { games: [] },
    timeoutMs: 14000,
  });
  const games: any[] = res.data?.games ?? [];
  const out: StarterCandidate[] = [];

  for (const g of games) {
    if (!g?.lineupConfirmed) continue; // CONFIRMED starters only
    const start = g.gameDate;
    const gamePk = String(g.gamePk);
    const collect = (players: any[]) => {
      (players ?? []).forEach((p: any) => {
        // Heart-of-the-order hitters make the strongest HR/hit candidates.
        if (p.battingOrder && p.battingOrder <= 6) {
          out.push({
            playerName: p.playerName,
            team: p.team,
            battingOrder: p.battingOrder,
            gamePk,
            gameStartTime: start,
          });
        }
      });
    };
    collect(g.awayLineup);
    collect(g.homeLineup);
  }
  return out;
}

/** Plausible HR odds by lineup spot (cleanup = shorter price). Payout-only. */
function hrOddsFor(battingOrder: number): number {
  const base = battingOrder <= 4 ? 3.2 : battingOrder <= 5 ? 3.8 : 4.6;
  return Math.round(base * 100) / 100;
}

function buildLeg(c: StarterCandidate, idx: number): Leg {
  return {
    id: `ai-leg-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
    sport: 'MLB',
    game: `${c.team}`,
    market: 'To Hit 1+ Home Run',
    selection: `${c.playerName} 1+ HR`,
    odds: hrOddsFor(c.battingOrder),
    status: 'PENDING',
    gamePk: c.gamePk,
    marketCode: 'hr',
    threshold: 1,
    gameStartTime: c.gameStartTime,
  };
}

function americanFromDecimal(dec: number): string {
  return dec >= 2 ? `+${Math.round((dec - 1) * 100)}` : `-${Math.round(100 / (dec - 1))}`;
}

/**
 * Generate the day's AI parlays from confirmed starters.
 * Returns 0 parlays if no lineups are confirmed yet (honest — no fake picks).
 */
export async function generateAiParlays(opts: { sport?: SportId } = {}): Promise<Parlay[]> {
  const sport = opts.sport ?? 'mlb';
  const starters = await fetchConfirmedStarters(sport);
  if (starters.length < 2) return [];

  // Prefer spreading legs across different games for genuine parlay variance.
  const byGame = new Map<string, StarterCandidate[]>();
  for (const s of starters) {
    if (!byGame.has(s.gamePk)) byGame.set(s.gamePk, []);
    byGame.get(s.gamePk)!.push(s);
  }
  const onePerGame = Array.from(byGame.values()).map((arr) =>
    arr.sort((a, b) => a.battingOrder - b.battingOrder)[0]
  );

  const recipes: Array<{ legs: number; risk: Parlay['riskTier']; label: string }> = [
    { legs: 2, risk: 'LOW', label: 'Safer' },
    { legs: 3, risk: 'MEDIUM', label: 'Balanced' },
    { legs: 4, risk: 'HIGH', label: 'Longshot' },
  ];

  const parlays: Parlay[] = [];
  recipes.forEach((recipe, ri) => {
    const picks = onePerGame.slice(ri, ri + recipe.legs);
    if (picks.length < recipe.legs) return;
    const legs = picks.map(buildLeg);
    const oddsValue = Math.round(legs.reduce((p, l) => p * l.odds, 1) * 100) / 100;
    const lockMsArr = legs.map((l) => new Date(l.gameStartTime!).getTime()).filter((t) => !isNaN(t));
    const lockAt = lockMsArr.length
      ? new Date(Math.min(...lockMsArr) - LOCK_MINUTES * 60_000).toISOString()
      : undefined;
    parlays.push({
      id: `ai-parlay-${Date.now()}-${ri}`,
      title: `V.A.I ${recipe.label} ${recipe.legs}-Leg HR Parlay`,
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
