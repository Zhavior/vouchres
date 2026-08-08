/**
 * Signal Score (S_HR) — the one number every Home Run Intelligence surface shows.
 *
 *   S_HR = 0.35·P_power + 0.35·V_pitcher + 0.15·F_park + 0.15·W_weather
 *
 * Every term is a 0–100 layer score the validated pipeline already produces:
 *
 *   P_power    Hitter power — ISO, Barrel% and Hard-Hit% percentiles.        (engine/hitterPowerScore.ts)
 *   V_pitcher  Pitcher vulnerability — HR/9, FB% and barrels allowed.        (engine/pitcherVulnerabilityScore.ts)
 *   F_park     Park HR environment — venue HR index normalized to 0–100.     (engine/parkWeatherScore.ts)
 *   W_weather  Micro-weather — wind vector, velocity and temperature index.  (engine/parkWeatherScore.ts)
 *
 * Weights renormalize across the layers a row actually carries, so a slate with
 * no weather feed still scores on a full 0–100 scale instead of silently losing
 * 15 points off every player. A row missing either *core* layer (power or
 * pitcher) keeps the pipeline's own composite instead — a score built from park
 * and weather alone would describe the ballpark, not the hitter.
 */

import type { HrWatchRow } from '../types/hrWatch';

export const SIGNAL_WEIGHTS = {
  power: 0.35,
  pitcher: 0.35,
  park: 0.15,
  weather: 0.15,
} as const;

export type SignalLayerKey = keyof typeof SIGNAL_WEIGHTS;

export interface SignalLayer {
  key: SignalLayerKey;
  label: string;
  weight: number;
  /** 0–100 layer score, or null when the slate has no data for this layer. */
  value: number | null;
}

export interface SignalScoreResult {
  /** Rounded whole integer 0–100 — the only form the UI ever renders. */
  score: number;
  layers: SignalLayer[];
  /** Share of the model's weight the present layers cover (0–1). */
  coverage: number;
  /** `composite` = the S_HR formula ran; `pipeline` = fell back to the server score. */
  source: 'composite' | 'pipeline';
}

const LAYER_LABELS: Record<SignalLayerKey, string> = {
  power: 'Hitter power',
  pitcher: 'Pitcher vuln',
  park: 'Park factor',
  weather: 'Weather',
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function finite(value: number | null | undefined): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

/**
 * Venue HR index → 0–100 park factor. The index is centred on 100 (league
 * average) and spans roughly 88 (Petco) to 121 (Coors), so each point of index
 * moves the layer score two points off a neutral 50: Coors → 92, Petco → 26.
 */
export function parkIndexToScore(index: number | null | undefined): number | null {
  const raw = finite(index);
  if (raw == null) return null;
  return clamp(50 + (raw - 100) * 2);
}

/**
 * Pipeline `weatherBoost` → 0–100 weather index. The boost is expressed in
 * hrScore points over roughly ±3 (hot and blowing out vs. cold), so a neutral
 * forecast lands on 50 and each boost point moves the layer ten points.
 */
export function weatherBoostToScore(boost: number | null | undefined): number | null {
  const raw = finite(boost);
  if (raw == null) return null;
  return clamp(50 + raw * 10);
}

/** The four weighted layers for a row, with `null` where the slate has no data. */
export function signalLayers(row: HrWatchRow): SignalLayer[] {
  const park = finite(row.parkContext) ?? parkIndexToScore(row.parkIndex);
  const weather = finite(row.weather);

  return [
    { key: 'power', label: LAYER_LABELS.power, weight: SIGNAL_WEIGHTS.power, value: finite(row.hitterPower) },
    { key: 'pitcher', label: LAYER_LABELS.pitcher, weight: SIGNAL_WEIGHTS.pitcher, value: finite(row.pitcherVulnerability) },
    { key: 'park', label: LAYER_LABELS.park, weight: SIGNAL_WEIGHTS.park, value: park },
    { key: 'weather', label: LAYER_LABELS.weather, weight: SIGNAL_WEIGHTS.weather, value: weather },
  ];
}

/**
 * Rows are stable objects rebuilt only when the board payload changes, so the
 * result is cached against the row itself. Sorting and rendering both ask for
 * the same score many times per frame; recomputing it each time turned a 350-row
 * slate into thousands of throwaway layer arrays per render.
 */
const scoreCache = new WeakMap<HrWatchRow, SignalScoreResult>();

export function computeSignalScore(row: HrWatchRow): SignalScoreResult {
  const cached = scoreCache.get(row);
  if (cached) return cached;

  const result = computeSignalScoreUncached(row);
  scoreCache.set(row, result);
  return result;
}

function computeSignalScoreUncached(row: HrWatchRow): SignalScoreResult {
  const layers = signalLayers(row);
  const present = layers.filter((layer) => layer.value != null);
  const coverage = present.reduce((total, layer) => total + layer.weight, 0);

  const hasPower = layers[0].value != null;
  const hasPitcher = layers[1].value != null;

  // Park and weather describe the venue, not the bat. Without at least one core
  // layer we defer to the pipeline composite rather than score the ballpark.
  if (!hasPower || !hasPitcher || coverage <= 0) {
    return {
      score: Math.round(clamp(row.hrScore)),
      layers,
      coverage,
      source: 'pipeline',
    };
  }

  const weighted = present.reduce((total, layer) => total + layer.weight * (layer.value as number), 0);

  return {
    score: Math.round(clamp(weighted / coverage)),
    layers,
    coverage,
    source: 'composite',
  };
}

/** The integer S_HR for a row. */
export function signalScoreValue(row: HrWatchRow): number {
  return computeSignalScore(row).score;
}

/**
 * The number the UI actually shows — the pipeline's own composite.
 *
 * S_HR above is NOT used for display, deliberately. Measured against a live
 * 350-row slate it sits a mean 23 points off `hrScore` with a systematic +22
 * bias, because `hitterPower` saturates at exactly 100 on 48% of rows and the
 * remaining layers barely vary within a game — S_HR degrades into a per-game
 * score rather than a per-hitter one. Tier buckets (Elite/Core/Watch/Deep) are
 * still cut from `hrScore` server-side, so displaying S_HR put 128 "Deep
 * Research" cards on a higher number than the lowest "Elite" card.
 *
 * Two things have to land before S_HR can be the headline number: unsaturate
 * `hitterPower` in the pipeline, and re-derive the tiers from whatever is shown.
 * Until then the score on the card and the column it sits in agree.
 */
export function boardScore(row: HrWatchRow): number {
  return Math.round(clamp(row.hrScore));
}

/* ── Spotlight selection ─────────────────────────────────────────────────── */

export type SpotlightKey = 'top' | 'power' | 'matchup' | 'value';

/** With no market to price against, a "sleeper" has to come from below this rank. */
const SLEEPER_RANK_FLOOR = 10;

export interface SpotlightPick {
  key: SpotlightKey;
  /** Emoji + copy the card renders. */
  icon: string;
  title: string;
  row: HrWatchRow;
  /** The one metric this card is chosen on, already formatted for its pill. */
  metricLabel: string;
  metricValue: string;
}

/**
 * A book price only counts when the book actually posted one. Unknown prices
 * stay unknown — an empty odds pill is dead space, and an invented one is worse.
 */
export function hasRealOdds(row: HrWatchRow): boolean {
  if (row.bookOdds != null && Number.isFinite(row.bookOdds) && row.bookOdds !== 0) return true;
  const label = row.oddsLabel?.trim().toLowerCase() ?? '';
  if (!label) return false;
  return !['-', '—', 'tbd', 'odds tbd', 'odds unavailable', 'unavailable', 'n/a'].includes(label);
}

/** American odds label for a row, or null when no real price exists. */
export function oddsDisplay(row: HrWatchRow): string | null {
  if (!hasRealOdds(row)) return null;
  if (row.bookOdds != null && Number.isFinite(row.bookOdds) && row.bookOdds !== 0) {
    return row.bookOdds > 0 ? `+${Math.round(row.bookOdds)}` : String(Math.round(row.bookOdds));
  }
  return row.oddsLabel.trim();
}

/**
 * Model edge over the book: how much more likely the model thinks the home run
 * is than the posted price implies. Null unless both sides are real numbers.
 */
export function modelEdgePct(row: HrWatchRow): number | null {
  const model = finite(row.hrProbability);
  const implied = finite(row.impliedProbability);
  if (model == null || implied == null) return null;
  return (model - implied) * 100;
}

function bestBy(rows: HrWatchRow[], score: (row: HrWatchRow) => number | null): HrWatchRow | null {
  let best: HrWatchRow | null = null;
  let bestScore = -Infinity;
  for (const row of rows) {
    const value = score(row);
    if (value == null || !Number.isFinite(value)) continue;
    if (value > bestScore) {
      bestScore = value;
      best = row;
    }
  }
  return best;
}

/**
 * The four above-the-fold highlights. Each pick is unique — once a player takes
 * a card they're out of the running for the rest, so the spotlight never shows
 * the same bat four times.
 */
export function selectSpotlight(rows: readonly HrWatchRow[]): SpotlightPick[] {
  const pool = rows.filter((row) => row.truthStatus !== 'blocked');
  if (pool.length === 0) return [];

  const taken = new Set<string>();
  const remaining = () => pool.filter((row) => !taken.has(row.stableId));
  const picks: SpotlightPick[] = [];

  const claim = (
    key: SpotlightKey,
    icon: string,
    title: string,
    row: HrWatchRow | null,
    metricLabel: string,
    metricValue: (row: HrWatchRow) => string,
  ) => {
    if (!row) return;
    taken.add(row.stableId);
    picks.push({ key, icon, title, row, metricLabel, metricValue: metricValue(row) });
  };

  claim(
    'top',
    '🥇',
    'Top overall signal',
    bestBy(remaining(), boardScore),
    'Signal',
    (row) => String(boardScore(row)),
  );

  // Power and vulnerability both tie heavily — `hitterPower` pins at exactly 100
  // on roughly half a slate — so the board score breaks ties. Without it the
  // pick would be whichever of ~168 identical rows happened to sort first.
  claim(
    'power',
    '🔥',
    'Power surge',
    bestBy(remaining(), (row) => {
      const power = finite(row.hitterPower);
      return power == null ? null : power * 1000 + boardScore(row);
    }),
    'Power',
    (row) => String(Math.round(row.hitterPower as number)),
  );

  claim(
    'matchup',
    '🎯',
    'Matchup exploit',
    bestBy(remaining(), (row) => {
      const vulnerability = finite(row.pitcherVulnerability);
      return vulnerability == null ? null : vulnerability * 1000 + boardScore(row);
    }),
    'Pitcher vuln',
    (row) => String(Math.round(row.pitcherVulnerability as number)),
  );

  // Value wants a real posted price to beat.
  const priced = remaining().filter((row) => modelEdgePct(row) != null);
  if (priced.length > 0) {
    claim(
      'value',
      '💣',
      'Value sleeper',
      bestBy(priced, modelEdgePct),
      'Model edge',
      (row) => `+${(modelEdgePct(row) as number).toFixed(1)}%`,
    );
  } else {
    // No book has posted on this slate. Taking the best remaining signal would
    // just be "second best overall" wearing a sleeper label, so the pick comes
    // from below the headline block — a strong bat the board buried.
    const buried = [...remaining()]
      .sort((a, b) => boardScore(b) - boardScore(a))
      .slice(SLEEPER_RANK_FLOOR);

    claim(
      'value',
      '💣',
      'Value sleeper',
      bestBy(buried.length > 0 ? buried : remaining(), boardScore),
      'Signal',
      (row) => String(boardScore(row)),
    );
  }

  return picks;
}
