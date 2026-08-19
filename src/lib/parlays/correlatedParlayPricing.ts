/**
 * Correlation-aware parlay pricing via a Gaussian copula.
 *
 * The naive combined price multiplies leg probabilities, which is only valid
 * when legs are independent. Sportsbooks price same-game parlays by simulating
 * the game instead, so a correlated stack pays materially less than the product
 * of its legs. This module reproduces the *shape* of that adjustment without a
 * full game simulator:
 *
 *   1. Each leg's price becomes an implied probability p_i.
 *   2. Legs are mapped to standard normals with thresholds z_i = Φ⁻¹(p_i).
 *   3. Correlated normals are drawn using the Cholesky factor of the leg
 *      correlation matrix (see legCorrelation.ts).
 *   4. The joint hit rate across many draws is the parlay probability.
 *
 * With an identity correlation matrix this converges to the naive product, so
 * cross-game slips are unaffected — the adjustment only bites where legs really
 * are related.
 *
 * The sampler is seeded from the leg set, so the same slip always prices to the
 * same number. A price that flickered between renders would be unusable.
 *
 * IMPORTANT: implied probabilities carry the book's overround, and this model
 * does not de-vig them (leg markets arrive unpaired, so the vig is not
 * recoverable). Output is therefore a *model estimate* for research, never a
 * book price, and callers must label it as such.
 */
import { buildCorrelationMatrix, hasMaterialCorrelation, type CorrelationLeg } from './legCorrelation';

export type PricedLeg = CorrelationLeg & {
  /** American (+285 / -110) or decimal (>1) odds. */
  odds?: number | string | null;
};

export type CorrelatedParlayPrice = {
  /** Joint probability of every leg hitting, after correlation. */
  probability: number;
  /** Fair decimal odds implied by `probability`. */
  decimal: number;
  american: string;
  /** Decimal odds the naive independent product would have produced. */
  naiveDecimal: number;
  naiveAmerican: string;
  /**
   * Ratio of correlated price to naive price. Below 1 means the legs help each
   * other and the naive number was too generous; above 1 means they fight.
   */
  correlationFactor: number;
  /** True when at least one pair is materially related. */
  correlated: boolean;
  /** Simulation draws used. */
  samples: number;
};

/** Converts American or decimal odds to decimal. Returns null when unusable. */
export function toDecimalOdds(raw: number | string | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(/^\+/, ''));
  if (!Number.isFinite(n) || n === 0) return null;

  // Decimal odds live in (1, ∞); American odds are ≥ +100 or ≤ −100.
  if (n > 1 && n < 100) return n;
  if (n >= 100) return n / 100 + 1;
  if (n <= -100) return 100 / Math.abs(n) + 1;
  return null;
}

export function decimalToAmerican(decimal: number): string {
  if (!Number.isFinite(decimal) || decimal <= 1) return '—';
  return decimal >= 2
    ? `+${Math.round((decimal - 1) * 100)}`
    : `-${Math.round(100 / (decimal - 1))}`;
}

/**
 * Acklam's inverse normal CDF. Max relative error ~1.15e-9, which is far below
 * the Monte Carlo noise floor at any sample count we use.
 */
export function inverseNormalCdf(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
    / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Cholesky factorisation with a ridge fallback.
 *
 * A matrix of hand-set pairwise priors is not guaranteed positive definite —
 * e.g. three legs each correlated 0.9 with one another is not a realisable
 * covariance. Rather than fail, shrink the off-diagonals toward zero until the
 * factorisation succeeds. Shrinking is conservative: it moves the model back
 * toward independence, never toward a stronger claim than the priors support.
 */
export function choleskyWithShrinkage(matrix: number[][]): number[][] {
  const n = matrix.length;

  for (let attempt = 0; attempt <= 12; attempt += 1) {
    const shrink = attempt === 0 ? 1 : 1 - attempt * 0.08;
    const working = matrix.map((row, i) =>
      row.map((value, j) => (i === j ? 1 : value * shrink)));

    const L: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    let ok = true;

    for (let i = 0; i < n && ok; i += 1) {
      for (let j = 0; j <= i; j += 1) {
        let sum = working[i][j];
        for (let k = 0; k < j; k += 1) sum -= L[i][k] * L[j][k];

        if (i === j) {
          if (sum <= 1e-12) { ok = false; break; }
          L[i][i] = Math.sqrt(sum);
        } else {
          L[i][j] = sum / L[j][j];
        }
      }
    }

    if (ok) return L;
  }

  // Fully degenerate — fall back to independence (identity factor).
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

/** mulberry32 — small, fast, and deterministic given a seed. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable seed so an unchanged slip always prices identically. */
function seedFromLegs(legs: PricedLeg[]): number {
  let hash = 2166136261;
  for (const leg of legs) {
    const key = `${leg.id}|${leg.odds}|${leg.gamePk}|${leg.playerId}|${leg.marketCode}`;
    for (let i = 0; i < key.length; i += 1) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return hash >>> 0;
}

/** Box–Muller, returning one standard normal per call from a cached pair. */
function makeNormalSampler(rng: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    // u must be > 0 for the log; rng() can return exactly 0.
    const u = Math.max(rng(), Number.MIN_VALUE);
    const v = rng();
    const radius = Math.sqrt(-2 * Math.log(u));
    const theta = 2 * Math.PI * v;
    spare = radius * Math.sin(theta);
    return radius * Math.cos(theta);
  };
}

export type PriceOptions = {
  /** Draws per pricing call. 20k keeps the standard error near 0.3pp. */
  samples?: number;
};

/**
 * Prices a slip with correlation applied. Returns null when any leg lacks a
 * usable price — a partial slip must not be shown a confident number.
 */
export function priceCorrelatedParlay(
  legs: PricedLeg[],
  options: PriceOptions = {},
): CorrelatedParlayPrice | null {
  if (legs.length === 0) return null;

  const decimals = legs.map((leg) => toDecimalOdds(leg.odds));
  if (decimals.some((d) => d == null)) return null;

  const probabilities = (decimals as number[]).map((d) => 1 / d);
  // Guard the copula thresholds against degenerate certainty.
  const clamped = probabilities.map((p) => Math.min(Math.max(p, 1e-6), 1 - 1e-6));

  const naiveDecimal = (decimals as number[]).reduce((product, d) => product * d, 1);
  const correlated = hasMaterialCorrelation(legs);

  // Independent slips have an exact answer; skip the simulation noise entirely.
  if (!correlated || legs.length === 1) {
    const probability = clamped.reduce((product, p) => product * p, 1);
    return {
      probability,
      decimal: naiveDecimal,
      american: decimalToAmerican(naiveDecimal),
      naiveDecimal,
      naiveAmerican: decimalToAmerican(naiveDecimal),
      correlationFactor: 1,
      correlated: false,
      samples: 0,
    };
  }

  const samples = Math.max(2000, Math.min(options.samples ?? 20000, 100000));
  const L = choleskyWithShrinkage(buildCorrelationMatrix(legs));
  const thresholds = clamped.map((p) => inverseNormalCdf(p));

  const rng = makeRng(seedFromLegs(legs));
  const normal = makeNormalSampler(rng);
  const n = legs.length;
  const z = new Array<number>(n);

  let hits = 0;
  for (let s = 0; s < samples; s += 1) {
    for (let i = 0; i < n; i += 1) z[i] = normal();

    let allHit = true;
    for (let i = 0; i < n && allHit; i += 1) {
      // Row i of L times z gives a correlated normal with unit variance.
      let correlatedZ = 0;
      for (let k = 0; k <= i; k += 1) correlatedZ += L[i][k] * z[k];
      // Leg hits when its normal falls below Φ⁻¹(p) — P(Z < z_i) = p_i.
      if (correlatedZ >= thresholds[i]) allHit = false;
    }
    if (allHit) hits += 1;
  }

  // Never report a zero probability: with 20k draws a genuine 1-in-50k slip can
  // miss entirely, and dividing by zero would yield Infinity odds.
  const probability = Math.max(hits / samples, 1 / (samples * 10));
  const decimal = 1 / probability;

  return {
    probability,
    decimal: Math.round(decimal * 100) / 100,
    american: decimalToAmerican(decimal),
    naiveDecimal: Math.round(naiveDecimal * 100) / 100,
    naiveAmerican: decimalToAmerican(naiveDecimal),
    correlationFactor: Math.round((decimal / naiveDecimal) * 1000) / 1000,
    correlated: true,
    samples,
  };
}
