/**
 * Regression utilities (Section 12)
 *
 * Bayesian shrinkage toward the league mean for small samples.
 *
 * Formula:
 *   Regressed Stat = (Player Stat × Player Sample + League Avg × Stabilizer)
 *                    / (Player Sample + Stabilizer)
 *
 * This prevents fake hot streaks from inflating scores. A hitter who hits
 * 4 HRs in his first 40 fly balls is regressed heavily toward the league
 * HR/FB rate (12.2%) because 40 fly balls is well below the stabilizer
 * of 100.
 */

/**
 * Regress a rate stat toward the league mean.
 *
 * @param playerStat The player's rate (e.g., 0.25 for 25% HR/FB)
 * @param playerSample The player's sample size (e.g., 40 fly balls)
 * @param leagueAvg The league average rate (e.g., 0.122)
 * @param stabilizer The sample at which the stat is 50% reliable (e.g., 100)
 * @returns The regressed rate
 */
export function regressStat(
  playerStat: number,
  playerSample: number,
  leagueAvg: number,
  stabilizer: number
): number {
  if (playerSample <= 0) return leagueAvg;
  if (stabilizer <= 0) return playerStat;

  const numerator = playerStat * playerSample + leagueAvg * stabilizer;
  const denominator = playerSample + stabilizer;
  return numerator / denominator;
}

/**
 * Regress HR/FB rate using the standard stabilizer (100 fly balls).
 *
 * Example:
 *   regressHrFb(0.25, 40, 0.122) = (0.25 × 40 + 0.122 × 100) / 140
 *                                = (10 + 12.2) / 140
 *                                = 0.157  (15.7%)
 */
export function regressHrFb(
  playerHrFb: number,
  playerFlyBalls: number,
  leagueHrFb: number = 0.122,
  stabilizer: number = 100
): number {
  return regressStat(playerHrFb, playerFlyBalls, leagueHrFb, stabilizer);
}

/**
 * Regress ISO using the standard stabilizer (300 AB).
 */
export function regressIso(
  playerIso: number,
  playerAtBats: number,
  leagueIso: number = 0.165,
  stabilizer: number = 300
): number {
  return regressStat(playerIso, playerAtBats, leagueIso, stabilizer);
}

/**
 * Regress Barrel% using the standard stabilizer (80 batted balls).
 */
export function regressBarrel(
  playerBarrel: number,
  playerBattedBalls: number,
  leagueBarrel: number = 0.075,
  stabilizer: number = 80
): number {
  return regressStat(playerBarrel, playerBattedBalls, leagueBarrel, stabilizer);
}

/**
 * Regress Hard-Hit% using the standard stabilizer (80 batted balls).
 */
export function regressHardHit(
  playerHardHit: number,
  playerBattedBalls: number,
  leagueHardHit: number = 0.39,
  stabilizer: number = 80
): number {
  return regressStat(playerHardHit, playerBattedBalls, leagueHardHit, stabilizer);
}

/**
 * Convert a raw rate into a league-percentile (0-100).
 *
 * Uses a simplified normal approximation: percentile = Φ((rate - mean) / stddev) × 100
 *
 * For HR/FB, ISO, Barrel%, etc. — these are roughly log-normal in MLB,
 * but the normal approximation is good enough for percentile ranking.
 *
 * For real production, you'd want to precompute the empirical distribution
 * from Statcast data and look up the percentile directly.
 *
 * @param rate The player's rate
 * @param leagueMean League average rate
 * @param leagueStdDev League standard deviation
 * @returns Percentile 0-100 (50 = league average)
 */
export function rateToPercentile(
  rate: number,
  leagueMean: number,
  leagueStdDev: number
): number {
  if (leagueStdDev <= 0) return 50;

  // Approximate normal CDF using the error function
  const z = (rate - leagueMean) / leagueStdDev;
  const percentile = normalCdf(z) * 100;

  // Clamp to 1-99 (avoid claiming 0 or 100 with limited data)
  return Math.max(1, Math.min(99, percentile));
}

/**
 * Approximation of the standard normal CDF.
 * Uses the Abramowitz & Stegun formula 7.1.26 — accurate to ~1e-7.
 */
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) prob = 1 - prob;
  return prob;
}

/**
 * Rough MLB standard deviations (for percentile conversion).
 * These are approximations — real values vary year to year.
 */
export const LEAGUE_STD_DEVS = {
  iso: 0.055,
  barrelRate: 0.045,
  hardHitRate: 0.085,
  hrFbRate: 0.055,
  hr9: 0.35,            // For pitchers
  barrelAllowed: 0.025,
  hardHitAllowed: 0.07,
  fbAllowed: 0.07,
} as const;
