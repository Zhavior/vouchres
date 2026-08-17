import type { HrWatchRow } from '../../hr/types/hrWatch';
import { toHrpi, tierForScore, type HrNextTierDef } from './tierPartition';

/**
 * Projection Matrix — the analytic transform of the HR Next board.
 *
 * Same contract as `slateTelemetry` and `teamRanking`: every value is read from a
 * typed `HrWatchRow` field and can report "unavailable". A row missing either
 * selected axis is *excluded from the plot and listed*, never substituted with a
 * midpoint or a slate average — a fabricated coordinate is a fabricated read.
 *
 * On top of the two plotted axes this module publishes four derived layers, all
 * computed over the plotted pool only:
 *   · percentile ranks + Matrix Score (geometric mean of the two ranks)
 *   · an ordinary least-squares fit with Pearson r and standardised residuals
 *   · the Pareto frontier of the axis pair
 *   · per-quadrant aggregates (mean HRPI, mean EV edge, confirmed lineups)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Metric registry
// ─────────────────────────────────────────────────────────────────────────────

export type MatrixMetricId =
  | 'hrpi'
  | 'gameScore'
  | 'hitterPower'
  | 'pitcherVulnerability'
  | 'pitchMix'
  | 'parkContext'
  | 'parkIndex'
  | 'weather'
  | 'platoon'
  | 'recentForm'
  | 'swingDecisions'
  | 'lineupContext'
  | 'bullpen'
  | 'bvpScore'
  | 'vegasEdgeScore'
  | 'vouchScore'
  | 'dataConfidence'
  | 'modelProb'
  | 'impliedProb'
  | 'evEdge'
  | 'barrelRate'
  | 'avgExitVelo'
  | 'xslg';

export type MatrixMetricGroup = 'Composite' | 'Matchup layers' | 'Market' | 'Statcast';

/** Slate-level joins a metric may need beyond the row itself. */
export interface MatrixReadContext {
  /** Derived game HR score per board row, keyed by `stableId`. */
  gameScoreByRowId?: Map<string, { score: number }>;
}

const EMPTY_CONTEXT: MatrixReadContext = {};

/**
 * One continuous Statcast reading feeding a resolved axis.
 * A component with fewer than four published rows, or no spread across them,
 * cannot be standardised and drops out of the composite.
 */
export interface MatrixResolverComponent {
  label: string;
  read: (row: HrWatchRow) => number | null;
  weight: number;
}

/**
 * How a saturating board layer is rebuilt as a continuous quantity.
 *
 * The pipeline's layer scores are rounded point budgets, so the strongest bats
 * on a slate land on the same number and the matrix stacks them on one pixel.
 * A resolver replaces the layer with a weighted z-composite of the Statcast
 * readings that layer is meant to express, min–max rescaled to 0–100 over the
 * plotted pool. It adds real information rather than nudging a tie apart, and a
 * row publishing none of the components stays unplotted like any missing axis.
 */
export interface MatrixResolver {
  label: string;
  short: string;
  components: readonly MatrixResolverComponent[];
  source: string;
}

export interface MatrixMetricDef {
  id: MatrixMetricId;
  /** Full name for the axis picker. */
  label: string;
  /** Compact name for axis titles, quadrant captions and table headers. */
  short: string;
  group: MatrixMetricGroup;
  /** Fixed display domain, or null to scale to the plotted pool. */
  domain: readonly [number, number] | null;
  /**
   * Physical limits of the quantity, used only to clamp a fitted range's padding.
   * A barrel rate has no useful fixed domain to plot against, but it still cannot
   * go negative, so the axis must never print a -1.7% tick.
   */
  bounds?: readonly [number, number];
  /**
   * Reads the typed field. Returns null when the pipeline published nothing.
   * `ctx` carries slate-level joins (game scores) for metrics that are not
   * properties of the row itself.
   */
  read: (row: HrWatchRow, ctx: MatrixReadContext) => number | null;
  format: (value: number) => string;
  /** Higher values favour the home run outcome. */
  higherIsBetter: boolean;
  /** Where the number comes from — surfaced in the methodology footer. */
  source: string;
  /** Continuous Statcast rebuild for a layer that saturates. */
  resolver?: MatrixResolver;
}

function finite(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Model-vs-book divergence as a percentage. Same formula as `slateTelemetry`. */
export function evEdgeFor(row: HrWatchRow): number | null {
  const model = finite(row.hrProbability);
  const implied = finite(row.impliedProbability);
  if (model == null || implied == null || implied <= 0) return null;
  return Math.round(((model - implied) / implied) * 1000) / 10;
}

// Layer scores are continuous now — rounding them for display would put back
// the ties the pipeline just stopped emitting.
const index = (value: number) =>
  Number.isInteger(value) ? String(value) : (Math.round(value * 10) / 10).toFixed(1);
const pct1 = (value: number) => `${Math.round(value * 10) / 10}%`;
const signedPct1 = (value: number) => `${value > 0 ? '+' : ''}${Math.round(value * 10) / 10}%`;

const LAYER_DOMAIN = [0, 100] as const;

/** Barrel rate arrives as a 0–1 fraction; every surface prints it as a percentage. */
const readBarrelPct = (row: HrWatchRow): number | null => {
  const value = finite(row.barrelRate);
  return value == null ? null : Math.round(value * 1000) / 10;
};
const readXslg = (row: HrWatchRow): number | null => finite(row.xslg);
const readExitVelo = (row: HrWatchRow): number | null => finite(row.avgExitVelo);

/**
 * Hitter Power is a weighted blend of ISO, barrel, hard-hit and HR/FB rates.
 * The three Statcast readings the payload actually carries stand in for it, in
 * the same order of importance the layer itself uses.
 */
const HITTER_POWER_RESOLVER: MatrixResolver = {
  label: 'Hitter Power — Statcast resolved',
  short: 'Power (SC)',
  components: [
    { label: 'xSLG', read: readXslg, weight: 0.4 },
    { label: 'Barrel %', read: readBarrelPct, weight: 0.35 },
    { label: 'Avg exit velocity', read: readExitVelo, weight: 0.25 },
  ],
  source:
    'Weighted z-composite of xSLG (0.40), Barrel % (0.35) and average exit velocity (0.25), standardised across the plotted pool and min–max rescaled to 0–100.',
};

export const MATRIX_METRICS: readonly MatrixMetricDef[] = [
  {
    id: 'hrpi',
    label: 'HRPI — board composite',
    short: 'HRPI',
    group: 'Composite',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.hrScore) == null ? null : toHrpi(row.hrScore),
    format: index,
    higherIsBetter: true,
    source: 'Published board hrScore, clamped to 0–100.',
  },
  {
    id: 'gameScore',
    label: 'Game HR Score',
    short: 'Game Score',
    group: 'Composite',
    domain: LAYER_DOMAIN,
    read: (row, ctx) => ctx.gameScoreByRowId?.get(row.stableId)?.score ?? null,
    format: index,
    higherIsBetter: true,
    source: 'Derived per-matchup composite — see the Game HR Score methodology.',
  },
  {
    id: 'hitterPower',
    label: 'Hitter Power',
    short: 'Power',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.hitterPower),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `hitterPower`.',
    resolver: HITTER_POWER_RESOLVER,
  },
  {
    id: 'pitcherVulnerability',
    label: 'Pitcher Vulnerability',
    short: 'Pitcher Vuln',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.pitcherVulnerability),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `pitcherVulnerability`.',
  },
  {
    id: 'pitchMix',
    label: 'Pitch Mix Fit',
    short: 'Pitch Mix',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.pitchMix),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `pitchMix`.',
  },
  {
    id: 'parkContext',
    label: 'Park Context (layer)',
    short: 'Park',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.parkContext) ?? finite(row.parkFactor),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `parkContext`, falling back to `parkFactor`.',
  },
  {
    id: 'parkIndex',
    label: 'Park HR Index (raw)',
    short: 'Park Index',
    group: 'Matchup layers',
    domain: null,
    bounds: [0, 300],
    read: (row) => finite(row.parkIndex),
    format: (value) => String(Math.round(value)),
    higherIsBetter: true,
    source: 'Raw venue HR index `parkIndex`, centred on 100.',
  },
  {
    id: 'weather',
    label: 'Weather Layer',
    short: 'Weather',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.weather),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `weather`; null when the game feed carries no forecast.',
  },
  {
    id: 'platoon',
    label: 'Platoon Edge',
    short: 'Platoon',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.platoon),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `platoon`.',
  },
  {
    id: 'recentForm',
    label: 'Recent Form',
    short: 'Form',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.recentForm),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `recentForm`.',
  },
  {
    id: 'swingDecisions',
    label: 'Swing Decisions',
    short: 'Swing Dec',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.swingDecisions),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `swingDecisions`.',
  },
  {
    id: 'lineupContext',
    label: 'Lineup Context',
    short: 'Lineup',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.lineupContext),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `lineupContext`.',
  },
  {
    id: 'bullpen',
    label: 'Bullpen Exposure',
    short: 'Bullpen',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.bullpen),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `bullpen`.',
  },
  {
    id: 'bvpScore',
    label: 'Batter vs Pitcher',
    short: 'BvP',
    group: 'Matchup layers',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.bvpScore),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `bvpScore`.',
  },
  {
    id: 'vegasEdgeScore',
    label: 'Vegas Edge Score',
    short: 'Vegas Edge',
    group: 'Market',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.vegasEdgeScore),
    format: index,
    higherIsBetter: true,
    source: 'Board sub-score `vegasEdgeScore`.',
  },
  {
    id: 'vouchScore',
    label: 'Community Vouch Score',
    short: 'Vouch',
    group: 'Composite',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.vouchScore),
    format: index,
    higherIsBetter: true,
    source: 'Published `vouchScore`.',
  },
  {
    id: 'dataConfidence',
    label: 'Data Confidence',
    short: 'Confidence',
    group: 'Composite',
    domain: LAYER_DOMAIN,
    read: (row) => finite(row.dataConfidence),
    format: index,
    higherIsBetter: true,
    source: 'Pipeline `dataConfidence`.',
  },
  {
    id: 'modelProb',
    label: 'Model HR Probability',
    short: 'Model %',
    group: 'Market',
    domain: null,
    bounds: [0, 100],
    read: (row) => {
      const value = finite(row.hrProbability);
      return value == null ? null : Math.round(value * 1000) / 10;
    },
    format: pct1,
    higherIsBetter: true,
    source: 'Published `hrProbability`, expressed as a percentage.',
  },
  {
    id: 'impliedProb',
    label: 'Book Implied Probability',
    short: 'Implied %',
    group: 'Market',
    domain: null,
    bounds: [0, 100],
    read: (row) => {
      const value = finite(row.impliedProbability);
      return value == null ? null : Math.round(value * 1000) / 10;
    },
    format: pct1,
    // A shorter price is a more expensive bet — low implied is the favourable side.
    higherIsBetter: false,
    source: 'Published `impliedProbability` (post-vig), expressed as a percentage.',
  },
  {
    id: 'evEdge',
    label: 'EV Edge vs Book',
    short: 'EV Edge',
    group: 'Market',
    domain: null,
    // A model probability of zero floors the edge at -100%.
    bounds: [-100, Number.POSITIVE_INFINITY],
    read: evEdgeFor,
    format: signedPct1,
    higherIsBetter: true,
    source: '(model − implied) ÷ implied, from the two published probabilities.',
  },
  {
    id: 'barrelRate',
    label: 'Barrel Rate',
    short: 'Barrel %',
    group: 'Statcast',
    domain: null,
    bounds: [0, 100],
    read: readBarrelPct,
    format: pct1,
    higherIsBetter: true,
    source: 'Statcast `barrelRate` from the API payload.',
  },
  {
    id: 'avgExitVelo',
    label: 'Average Exit Velocity',
    short: 'Exit Velo',
    group: 'Statcast',
    domain: null,
    // Nothing leaves a bat below 30 mph or above the 125 mph tracked ceiling.
    bounds: [30, 125],
    read: readExitVelo,
    format: (value) => `${Math.round(value * 10) / 10} mph`,
    higherIsBetter: true,
    source: 'Statcast `avgExitVelo` from the API payload.',
  },
  {
    id: 'xslg',
    label: 'Expected Slugging (xSLG)',
    short: 'xSLG',
    group: 'Statcast',
    domain: null,
    // Slugging tops out at 4.000.
    bounds: [0, 4],
    read: (row) => finite(row.xslg),
    format: (value) => value.toFixed(3),
    higherIsBetter: true,
    source: 'Statcast `xslg` from the API payload.',
  },
] as const;

const METRIC_BY_ID = new Map<MatrixMetricId, MatrixMetricDef>(
  MATRIX_METRICS.map((metric) => [metric.id, metric]),
);

export function matrixMetric(id: MatrixMetricId): MatrixMetricDef {
  const found = METRIC_BY_ID.get(id);
  if (!found) throw new Error(`Unknown projection matrix metric: ${id}`);
  return found;
}

export const MATRIX_METRIC_GROUPS: readonly MatrixMetricGroup[] = [
  'Composite',
  'Matchup layers',
  'Market',
  'Statcast',
];

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Where each axis splits into quadrants.
 * `median` halves the plotted pool, `midpoint` splits the display range 50/50,
 * and `quartile` cuts at the favourable upper quartile — the top 25% of the
 * pool on an axis where more is better, the bottom 25% where less is better.
 */
export type ThresholdMode = 'median' | 'midpoint' | 'quartile';
/**
 * `full` keeps a metric's declared domain (0–100 for the board layers) so the
 * plot stays comparable as axes are swapped. `fit` scales to the plotted rows,
 * which spreads a pool that only occupies part of its range. Tick labels print
 * real metric values either way, so neither mode can misread as the other.
 */
export type RangeMode = 'full' | 'fit';
export type MatrixQuadrantKey = 'prime' | 'yOnly' | 'xOnly' | 'fade';

export interface MatrixPoint {
  id: string;
  row: HrWatchRow;
  x: number;
  y: number;
  /** Size-metric value; null when the pipeline published none for this row. */
  size: number | null;
  /** Axis position normalised to the plotted scale, 0–1. */
  nx: number;
  ny: number;
  /** Radius weight 0–1 across the plotted pool; 0 when `size` is null. */
  nSize: number;
  quadrant: MatrixQuadrantKey;
  hrpi: number;
  tier: HrNextTierDef;
  evEdgePct: number | null;
  /** Percentile rank of this row's X / Y within the plotted pool, 0–100. */
  xPct: number;
  yPct: number;
  /** Geometric mean of the two percentile ranks — see MATRIX_SCORE_METHODOLOGY. */
  matrixScore: number;
  /** Standardised residual against the least-squares fit; null when no fit. */
  residualZ: number | null;
  onFrontier: boolean;
}

export interface MatrixExclusion {
  row: HrWatchRow;
  /** Which selected axes the pipeline did not publish for this row. */
  missing: string[];
}

export interface MatrixScale {
  min: number;
  max: number;
  /** Quadrant split value in metric units. */
  threshold: number;
  /** Where the split sits on the 0–1 normalised axis. */
  thresholdNorm: number;
  ticks: number[];
  /** True when the metric declares a fixed domain rather than scaling to the pool. */
  isFixed: boolean;
}

export interface MatrixQuadrant {
  key: MatrixQuadrantKey;
  label: string;
  /** Truthful caption built from the two live axis names. */
  detail: string;
  accent: string;
  count: number;
  meanHrpi: number | null;
  /** Mean EV edge over the quadrant's priced rows; null when none are priced. */
  meanEvPct: number | null;
  pricedRows: number;
  confirmed: number;
}

export interface MatrixFit {
  n: number;
  /** Pearson correlation between the two plotted axes. */
  r: number;
  slope: number;
  intercept: number;
  residualSd: number;
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
}

export interface ProjectionMatrixModel {
  xMetric: MatrixMetricDef;
  yMetric: MatrixMetricDef;
  sizeMetric: MatrixMetricDef;
  points: MatrixPoint[];
  excluded: MatrixExclusion[];
  totalRows: number;
  xScale: MatrixScale;
  yScale: MatrixScale;
  quadrants: MatrixQuadrant[];
  fit: MatrixFit | null;
  /** Pareto-optimal points, ordered by X ascending for the frontier path. */
  frontier: MatrixPoint[];
  /** Rows in the pool publishing each metric, for the axis picker. */
  coverage: Record<MatrixMetricId, number>;
  /** Rows carrying no size-metric value, so the legend can say so. */
  unsizedRows: number;
  /** Statcast rebuilds actually applied to the plotted axes. */
  resolutions: MatrixResolution[];
  /** Distinct plotted (X, Y) pairs — the tie count the plot has to draw. */
  distinctCoordinates: number;
}

export const MATRIX_COVERAGE_METHODOLOGY =
  'Only rows the pipeline published on both selected axes are plotted. A missing layer is never substituted with a midpoint or a slate average — those rows are listed as unplotted instead.';

export const MATRIX_SCORE_METHODOLOGY =
  'Matrix Score is the geometric mean of a row\'s percentile rank on each selected axis, taken across the plotted pool. A row has to rank well on both axes to score high. It ranks this slate — it is not a probability.';

export const MATRIX_FIT_METHODOLOGY =
  'The trend line is an ordinary least-squares fit of the Y axis on the X axis over the plotted rows. Residual σ is a row\'s distance from that line in standard deviations: positive means the row beats what this slate\'s own relationship predicts.';

export const MATRIX_RESOLUTION_METHODOLOGY =
  'Statcast resolve replaces a saturating board layer with a weighted z-composite of the Statcast readings behind it, rescaled to 0–100 over the plotted pool. It separates rows the layer rounds together by adding measurements, never by nudging a tie apart. Rows publishing none of the components are held out of the plot.';

export const MATRIX_THRESHOLD_METHODOLOGY =
  'Median splits each axis at the middle of the plotted pool, upper quartile at the favourable 25% of it, and fixed at the midpoint of the display range. Percentiles are read on the favourable side, so a lower-is-better axis cuts at its 25th percentile.';

export const MATRIX_FRONTIER_METHODOLOGY =
  'Frontier rows are Pareto-optimal for the axis pair: no other plotted row is at least equal on both axes and strictly better on one.';

const QUADRANT_ACCENTS: Record<MatrixQuadrantKey, string> = {
  prime: '#10B981',
  yOnly: '#6EE7B7',
  xOnly: '#F59E0B',
  fade: '#64748B',
};

const QUADRANT_LABELS: Record<MatrixQuadrantKey, string> = {
  prime: 'Prime Overlap',
  yOnly: 'Single Edge · Y',
  xOnly: 'Single Edge · X',
  fade: 'Fade Zone',
};

/** Linear-interpolated quantile of an ascending-sorted pool. */
function quantile(sortedAsc: number[], fraction: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const position = (sortedAsc.length - 1) * Math.max(0, Math.min(1, fraction));
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sortedAsc[lower];
  return sortedAsc[lower] + (sortedAsc[upper] - sortedAsc[lower]) * (position - lower);
}

/** Mid-rank percentile of `value` within an ascending-sorted pool, 0–100. */
function percentileOf(sortedAsc: number[], value: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  let lower = 0;
  let upper = 0;
  for (const candidate of sortedAsc) {
    if (candidate < value) lower += 1;
    if (candidate <= value) upper += 1;
  }
  return Math.round(((lower + upper) / 2 / n) * 1000) / 10;
}

function buildScale(
  values: number[],
  def: MatrixMetricDef,
  mode: ThresholdMode,
  rangeMode: RangeMode,
): MatrixScale {
  let min: number;
  let max: number;

  const useDeclaredDomain = def.domain != null && rangeMode === 'full';

  if (def.domain && useDeclaredDomain) {
    [min, max] = def.domain;
  } else {
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const value of values) {
      if (value < lo) lo = value;
      if (value > hi) hi = value;
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      lo = 0;
      hi = 1;
    } else if (hi === lo) {
      const pad = Math.abs(hi) > 1 ? Math.abs(hi) * 0.1 : 1;
      lo -= pad;
      hi += pad;
    } else {
      const pad = (hi - lo) * 0.08;
      lo -= pad;
      hi += pad;
    }
    // Breathing room must not invent values the metric cannot take — a fitted
    // Hitter Power axis may not print a -2 or a 108 tick, and a barrel rate may
    // not go negative.
    if (def.bounds) {
      lo = Math.max(def.bounds[0], lo);
      hi = Math.min(def.bounds[1], hi);
    }
    if (def.domain) {
      lo = Math.max(def.domain[0], lo);
      hi = Math.min(def.domain[1], hi);
    }
    min = lo;
    max = hi;
  }

  const span = max - min;
  const sorted = [...values].sort((left, right) => left - right);

  let threshold: number;
  if (sorted.length === 0 || mode === 'midpoint') {
    threshold = (min + max) / 2;
  } else if (mode === 'quartile') {
    // Cut where the favourable quarter of the pool begins, which is the 25th
    // percentile of the raw values when a lower reading is the better one.
    threshold = quantile(sorted, def.higherIsBetter ? 0.75 : 0.25);
  } else {
    threshold = quantile(sorted, 0.5);
  }

  const thresholdNorm = span > 0 ? Math.max(0, Math.min(1, (threshold - min) / span)) : 0.5;

  const ticks: number[] = [];
  for (let step = 0; step <= 4; step += 1) {
    ticks.push(min + (span * step) / 4);
  }

  return { min, max, threshold, thresholdNorm, ticks, isFixed: useDeclaredDomain };
}

function normalise(value: number, scale: MatrixScale): number {
  const span = scale.max - scale.min;
  if (span <= 0) return 0.5;
  return Math.max(0, Math.min(1, (value - scale.min) / span));
}

/** True when the value sits on the favourable side of the axis split. */
function isFavourable(value: number, scale: MatrixScale, def: MatrixMetricDef): boolean {
  return def.higherIsBetter ? value >= scale.threshold : value <= scale.threshold;
}

function quadrantFor(xFav: boolean, yFav: boolean): MatrixQuadrantKey {
  if (xFav && yFav) return 'prime';
  if (yFav) return 'yOnly';
  if (xFav) return 'xOnly';
  return 'fade';
}

function pearson(xs: number[], ys: number[]): MatrixFit | null {
  const n = xs.length;
  if (n < 4) return null;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  if (sxx <= 0 || syy <= 0) return null;

  const r = sxy / Math.sqrt(sxx * syy);
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;

  let residualSquares = 0;
  for (let i = 0; i < n; i += 1) {
    const residual = ys[i] - (intercept + slope * xs[i]);
    residualSquares += residual * residual;
  }
  // Two estimated parameters, so n - 2 degrees of freedom.
  const residualSd = n > 2 ? Math.sqrt(residualSquares / (n - 2)) : 0;

  const magnitude = Math.abs(r);
  return {
    n,
    r: Math.round(r * 1000) / 1000,
    slope,
    intercept,
    residualSd,
    strength: magnitude >= 0.6 ? 'strong' : magnitude >= 0.3 ? 'moderate' : 'weak',
    direction: r >= 0 ? 'positive' : 'negative',
  };
}

interface Oriented {
  ox: number;
  oy: number;
}

/**
 * Pareto frontier over the axis pair, oriented so "greater is favourable" on both
 * axes. O(n²) dominance testing — a slate is a few hundred rows and the result is
 * memoized, so the clarity is worth more than the sweep.
 */
function markFrontier(oriented: Oriented[]): boolean[] {
  const n = oriented.length;
  const flags = new Array<boolean>(n).fill(true);
  for (let i = 0; i < n; i += 1) {
    const a = oriented[i];
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue;
      const b = oriented[j];
      if (b.ox >= a.ox && b.oy >= a.oy && (b.ox > a.ox || b.oy > a.oy)) {
        flags[i] = false;
        break;
      }
    }
  }
  return flags;
}

export function buildMetricCoverage(
  rows: HrWatchRow[],
  ctx: MatrixReadContext = EMPTY_CONTEXT,
): Record<MatrixMetricId, number> {
  const coverage = {} as Record<MatrixMetricId, number>;
  for (const metric of MATRIX_METRICS) {
    let count = 0;
    for (const row of rows) {
      if (metric.read(row, ctx) != null) count += 1;
    }
    coverage[metric.id] = count;
  }
  return coverage;
}

/** What a Statcast resolution actually managed to do, for the UI to state. */
export interface MatrixResolution {
  metricId: MatrixMetricId;
  label: string;
  /** Components with enough published rows and spread to standardise. */
  componentsUsed: string[];
  /** Components dropped for want of published rows or of any spread. */
  componentsDropped: string[];
  resolvedRows: number;
  /** Rows the published layer covers but the Statcast composite cannot. */
  unresolvedRows: number;
}

/** Standardised (population z) values of one component across the pool. */
function standardise(values: number[]): { mean: number; sd: number } | null {
  if (values.length < 4) return null;
  let sum = 0;
  for (const value of values) sum += value;
  const mean = sum / values.length;
  let squares = 0;
  for (const value of values) squares += (value - mean) * (value - mean);
  const sd = Math.sqrt(squares / values.length);
  return sd > 0 ? { mean, sd } : null;
}

/**
 * Rebuild a saturating layer as a continuous 0–100 index from its Statcast
 * components. Returns null when no component has enough published spread to
 * standardise — the caller then keeps the published layer rather than inventing
 * a resolution out of one or two readings.
 */
function buildResolution(
  rows: HrWatchRow[],
  def: MatrixMetricDef,
): { byId: Map<string, number>; info: MatrixResolution } | null {
  const resolver = def.resolver;
  if (!resolver) return null;

  const componentsUsed: { component: MatrixResolverComponent; mean: number; sd: number }[] = [];
  const componentsDropped: string[] = [];

  for (const component of resolver.components) {
    const values: number[] = [];
    for (const row of rows) {
      const value = component.read(row);
      if (value != null) values.push(value);
    }
    const stats = standardise(values);
    if (stats) componentsUsed.push({ component, ...stats });
    else componentsDropped.push(component.label);
  }

  if (componentsUsed.length === 0) return null;

  // Mean weighted z per row, so a row publishing two of three components stays
  // on the same scale as a row publishing all three.
  const composites = new Map<string, number>();
  for (const row of rows) {
    let weighted = 0;
    let weight = 0;
    for (const { component, mean, sd } of componentsUsed) {
      const value = component.read(row);
      if (value == null) continue;
      weighted += component.weight * ((value - mean) / sd);
      weight += component.weight;
    }
    if (weight > 0) composites.set(row.stableId, weighted / weight);
  }

  if (composites.size === 0) return null;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of composites.values()) {
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const span = max - min;
  const byId = new Map<string, number>();
  for (const [id, value] of composites) {
    byId.set(id, span > 0 ? Math.round(((value - min) / span) * 1000) / 10 : 50);
  }

  let publishedRows = 0;
  for (const row of rows) {
    if (def.read(row, EMPTY_CONTEXT) != null) publishedRows += 1;
  }

  return {
    byId,
    info: {
      metricId: def.id,
      label: resolver.label,
      componentsUsed: componentsUsed.map((entry) => entry.component.label),
      componentsDropped,
      resolvedRows: byId.size,
      unresolvedRows: Math.max(0, publishedRows - byId.size),
    },
  };
}

/** Swap a metric for its Statcast-resolved twin, keeping every other trait. */
function resolvedMetricDef(def: MatrixMetricDef, byId: Map<string, number>): MatrixMetricDef {
  const resolver = def.resolver!;
  return {
    ...def,
    label: resolver.label,
    short: resolver.short,
    domain: LAYER_DOMAIN,
    bounds: LAYER_DOMAIN,
    format: (value) => (Math.round(value * 10) / 10).toFixed(1),
    read: (row) => byId.get(row.stableId) ?? null,
    source: resolver.source,
  };
}

export interface ProjectionMatrixOptions {
  xId: MatrixMetricId;
  yId: MatrixMetricId;
  sizeId: MatrixMetricId;
  thresholdMode: ThresholdMode;
  rangeMode: RangeMode;
  /**
   * Rebuild saturating layers from their Statcast components on the plotted
   * axes. Ignored for any axis whose metric declares no resolver.
   */
  resolveWithStatcast?: boolean;
  /** Slate-level joins for metrics that are not row properties. */
  context?: MatrixReadContext;
}

export function buildProjectionMatrix(
  rows: HrWatchRow[],
  {
    xId,
    yId,
    sizeId,
    thresholdMode,
    rangeMode,
    resolveWithStatcast = false,
    context = EMPTY_CONTEXT,
  }: ProjectionMatrixOptions,
): ProjectionMatrixModel {
  const sizeMetric = matrixMetric(sizeId);

  // Resolve at most one composite per distinct axis metric, so plotting a
  // metric against itself does not standardise the same pool twice.
  const resolutionCache = new Map<MatrixMetricId, ReturnType<typeof buildResolution>>();
  const resolutions: MatrixResolution[] = [];

  const axisMetric = (id: MatrixMetricId): MatrixMetricDef => {
    const def = matrixMetric(id);
    if (!resolveWithStatcast || !def.resolver) return def;
    if (!resolutionCache.has(id)) {
      const built = buildResolution(rows, def);
      resolutionCache.set(id, built);
      if (built) resolutions.push(built.info);
    }
    const resolution = resolutionCache.get(id);
    return resolution ? resolvedMetricDef(def, resolution.byId) : def;
  };

  const xMetric = axisMetric(xId);
  const yMetric = axisMetric(yId);

  interface Draft {
    row: HrWatchRow;
    x: number;
    y: number;
    size: number | null;
  }

  const drafts: Draft[] = [];
  const excluded: MatrixExclusion[] = [];

  for (const row of rows) {
    const x = xMetric.read(row, context);
    const y = yMetric.read(row, context);
    if (x == null || y == null) {
      const missing: string[] = [];
      if (x == null) missing.push(xMetric.label);
      if (y == null && yMetric.id !== xMetric.id) missing.push(yMetric.label);
      excluded.push({ row, missing });
      continue;
    }
    drafts.push({ row, x, y, size: sizeMetric.read(row, context) });
  }

  const xValues = drafts.map((draft) => draft.x);
  const yValues = drafts.map((draft) => draft.y);
  const xScale = buildScale(xValues, xMetric, thresholdMode, rangeMode);
  const yScale = buildScale(yValues, yMetric, thresholdMode, rangeMode);

  const xSorted = [...xValues].sort((left, right) => left - right);
  const ySorted = [...yValues].sort((left, right) => left - right);

  const sizeValues = drafts
    .map((draft) => draft.size)
    .filter((value): value is number => value != null);
  const sizeMin = sizeValues.length > 0 ? Math.min(...sizeValues) : 0;
  const sizeMax = sizeValues.length > 0 ? Math.max(...sizeValues) : 0;
  const sizeSpan = sizeMax - sizeMin;

  const fit = pearson(xValues, yValues);

  const oriented: Oriented[] = drafts.map((draft) => ({
    ox: xMetric.higherIsBetter ? draft.x : -draft.x,
    oy: yMetric.higherIsBetter ? draft.y : -draft.y,
  }));
  const frontierFlags = markFrontier(oriented);

  const points: MatrixPoint[] = drafts.map((draft, i) => {
    const xFav = isFavourable(draft.x, xScale, xMetric);
    const yFav = isFavourable(draft.y, yScale, yMetric);

    // Percentile is always read on the favourable side, so Matrix Score means the
    // same thing whichever direction the metric runs.
    const rawXPct = percentileOf(xSorted, draft.x);
    const rawYPct = percentileOf(ySorted, draft.y);
    const xPct = xMetric.higherIsBetter ? rawXPct : Math.round((100 - rawXPct) * 10) / 10;
    const yPct = yMetric.higherIsBetter ? rawYPct : Math.round((100 - rawYPct) * 10) / 10;

    const residualZ = fit && fit.residualSd > 0
      ? Math.round(((draft.y - (fit.intercept + fit.slope * draft.x)) / fit.residualSd) * 100) / 100
      : null;

    return {
      id: draft.row.stableId,
      row: draft.row,
      x: draft.x,
      y: draft.y,
      size: draft.size,
      nx: normalise(draft.x, xScale),
      ny: normalise(draft.y, yScale),
      nSize: draft.size != null && sizeSpan > 0 ? (draft.size - sizeMin) / sizeSpan : 0,
      quadrant: quadrantFor(xFav, yFav),
      hrpi: toHrpi(draft.row.hrScore),
      tier: tierForScore(draft.row.hrScore),
      evEdgePct: evEdgeFor(draft.row),
      xPct,
      yPct,
      matrixScore: Math.round(Math.sqrt(Math.max(0, xPct) * Math.max(0, yPct))),
      residualZ,
      onFrontier: frontierFlags[i],
    };
  });

  const xHigh = xMetric.higherIsBetter ? 'High' : 'Low';
  const yHigh = yMetric.higherIsBetter ? 'High' : 'Low';
  const xLow = xMetric.higherIsBetter ? 'Low' : 'High';
  const yLow = yMetric.higherIsBetter ? 'Low' : 'High';

  const quadrantDetail: Record<MatrixQuadrantKey, string> = {
    prime: `${xHigh} ${xMetric.short} · ${yHigh} ${yMetric.short}`,
    yOnly: `${xLow} ${xMetric.short} · ${yHigh} ${yMetric.short}`,
    xOnly: `${xHigh} ${xMetric.short} · ${yLow} ${yMetric.short}`,
    fade: `${xLow} ${xMetric.short} · ${yLow} ${yMetric.short}`,
  };

  const quadrants: MatrixQuadrant[] = (['prime', 'yOnly', 'xOnly', 'fade'] as const).map((key) => {
    const members = points.filter((point) => point.quadrant === key);
    let hrpiSum = 0;
    let evSum = 0;
    let priced = 0;
    let confirmed = 0;
    for (const point of members) {
      hrpiSum += point.hrpi;
      if (point.evEdgePct != null) {
        evSum += point.evEdgePct;
        priced += 1;
      }
      if (point.row.truthStatus === 'official') confirmed += 1;
    }
    return {
      key,
      label: QUADRANT_LABELS[key],
      detail: quadrantDetail[key],
      accent: QUADRANT_ACCENTS[key],
      count: members.length,
      meanHrpi: members.length > 0 ? Math.round(hrpiSum / members.length) : null,
      meanEvPct: priced > 0 ? Math.round((evSum / priced) * 10) / 10 : null,
      pricedRows: priced,
      confirmed,
    };
  });

  const frontier = points
    .filter((point) => point.onFrontier)
    .sort((left, right) => left.nx - right.nx);

  return {
    xMetric,
    yMetric,
    sizeMetric,
    points,
    excluded,
    totalRows: rows.length,
    xScale,
    yScale,
    quadrants,
    fit,
    frontier,
    coverage: buildMetricCoverage(rows, context),
    unsizedRows: drafts.length - sizeValues.length,
    resolutions,
    distinctCoordinates: new Set(drafts.map((draft) => `${draft.x}|${draft.y}`)).size,
  };
}
