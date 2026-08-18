/**
 * Pairwise correlation model for parlay legs.
 *
 * Why this exists: `computeCombinedOdds` multiplies leg prices, which assumes
 * every leg is independent. That is only true across different games. Inside one
 * game the legs move together — if a batter homers, his team scored, the game
 * total rose, and the opposing pitcher's line got worse. Multiplying independent
 * probabilities therefore *overstates* the payout a correlated slip deserves,
 * which is exactly why sportsbooks price same-game parlays through a simulation
 * rather than a product.
 *
 * These coefficients are structural priors, not fitted values. They encode the
 * direction and rough strength of well-established baseball relationships so the
 * pricer stops treating a 4-leg same-game stack as if it were four coin flips.
 * They are deliberately conservative: the goal is "no longer obviously wrong",
 * not a claim of book-grade accuracy. Anything derived from them is labelled as
 * a model estimate, never as a book price.
 */

export type CorrelationLeg = {
  id: string;
  /** Groups legs into the same contest. Legs in different games are independent. */
  gamePk?: string | number | null;
  /** Identifies the player the leg is about, when it is a player prop. */
  playerId?: string | number | null;
  /** Team the leg's subject plays for. */
  teamId?: string | number | null;
  /** Canonical market code, e.g. `home_run`, `total_bases`, `pitcher_strikeouts`. */
  marketCode?: string | null;
  /** batter | pitcher | team — drives the cross-role rules. */
  role?: 'batter' | 'pitcher' | 'team' | null;
};

/** Markets whose outcome rises with the subject's own offensive production. */
const BATTER_OFFENSE = new Set([
  'home_run', 'home_runs', 'hr', 'multi_hr', 'total_bases', 'hits',
  'rbi', 'runs', 'runs_scored', 'hits_runs_rbis', 'stolen_base', 'doubles',
]);

/** Markets that rise when the pitcher suppresses offence. */
const PITCHER_SUPPRESSION = new Set([
  'pitcher_strikeouts', 'strikeouts', 'pitcher_outs', 'outs_recorded',
  'earned_runs_allowed_under', 'pitcher_win', 'hits_allowed_under',
]);

function normalizeMarket(code: string | null | undefined): string {
  return String(code ?? '').trim().toLowerCase();
}

function isBatterOffense(leg: CorrelationLeg): boolean {
  return BATTER_OFFENSE.has(normalizeMarket(leg.marketCode)) || leg.role === 'batter';
}

function isPitcherSuppression(leg: CorrelationLeg): boolean {
  return PITCHER_SUPPRESSION.has(normalizeMarket(leg.marketCode)) || leg.role === 'pitcher';
}

function sameId(a: unknown, b: unknown): boolean {
  if (a == null || b == null || a === '' || b === '') return false;
  return String(a) === String(b);
}

/**
 * Correlation coefficients, strongest relationship first. Each is the ρ used in
 * the Gaussian copula, so +1 is perfectly coupled and −1 perfectly opposed.
 */
export const CORRELATION_PRIORS = {
  /** Same batter, two offensive markets — a HR is also total bases, a run, an RBI. */
  sameBatterOffense: 0.62,
  /** Same pitcher, two suppression markets — Ks and outs move together. */
  samePitcherMarkets: 0.48,
  /** Same team, different batters — they share the lineup, park, and opposing arm. */
  sameTeamOffense: 0.24,
  /** Opposing batters in one game — shared park, weather, and umpire only. */
  sameGameOpposingOffense: 0.09,
  /** A batter producing works directly against the pitcher he is facing. */
  batterVsOpposingPitcher: -0.34,
  /** A batter's own starter suppressing runs is near-orthogonal to his bat. */
  batterWithOwnPitcher: 0.05,
  /** Different games share nothing that the model represents. */
  crossGame: 0,
} as const;

/**
 * Returns ρ for one pair of legs. Symmetric by construction.
 */
export function pairCorrelation(a: CorrelationLeg, b: CorrelationLeg): number {
  if (a.id === b.id) return 1;

  // Legs in different games are treated as independent. League-wide effects
  // (a leaguewide offensive environment) exist but are far too weak to model here.
  if (!sameId(a.gamePk, b.gamePk)) return CORRELATION_PRIORS.crossGame;

  const samePlayer = sameId(a.playerId, b.playerId);
  const sameTeam = sameId(a.teamId, b.teamId);

  if (samePlayer) {
    if (isBatterOffense(a) && isBatterOffense(b)) return CORRELATION_PRIORS.sameBatterOffense;
    if (isPitcherSuppression(a) && isPitcherSuppression(b)) return CORRELATION_PRIORS.samePitcherMarkets;
    // Same player across opposing market families (a two-way player's bat and
    // arm) — treat as weakly coupled rather than guessing a sign.
    return CORRELATION_PRIORS.batterWithOwnPitcher;
  }

  const aOffense = isBatterOffense(a);
  const bOffense = isBatterOffense(b);
  const aPitching = isPitcherSuppression(a);
  const bPitching = isPitcherSuppression(b);

  if (aOffense && bOffense) {
    return sameTeam
      ? CORRELATION_PRIORS.sameTeamOffense
      : CORRELATION_PRIORS.sameGameOpposingOffense;
  }

  // Batter vs pitcher: opposed when they are on different teams (they face each
  // other), roughly independent when the pitcher is the batter's own teammate.
  if ((aOffense && bPitching) || (aPitching && bOffense)) {
    return sameTeam
      ? CORRELATION_PRIORS.batterWithOwnPitcher
      : CORRELATION_PRIORS.batterVsOpposingPitcher;
  }

  if (aPitching && bPitching) {
    // Two pitchers in one game: both suppressing is mildly coupled through a
    // low-scoring game script.
    return sameTeam ? CORRELATION_PRIORS.samePitcherMarkets : CORRELATION_PRIORS.sameTeamOffense;
  }

  return CORRELATION_PRIORS.sameGameOpposingOffense;
}

/**
 * Builds the full symmetric correlation matrix for a slip.
 * Diagonal is 1; entry [i][j] is `pairCorrelation(legs[i], legs[j])`.
 */
export function buildCorrelationMatrix(legs: CorrelationLeg[]): number[][] {
  const n = legs.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));

  for (let i = 0; i < n; i += 1) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < n; j += 1) {
      const rho = pairCorrelation(legs[i], legs[j]);
      matrix[i][j] = rho;
      matrix[j][i] = rho;
    }
  }
  return matrix;
}

/** True when any pair is materially correlated — drives the UI warning. */
export function hasMaterialCorrelation(legs: CorrelationLeg[], threshold = 0.15): boolean {
  for (let i = 0; i < legs.length; i += 1) {
    for (let j = i + 1; j < legs.length; j += 1) {
      if (Math.abs(pairCorrelation(legs[i], legs[j])) >= threshold) return true;
    }
  }
  return false;
}
