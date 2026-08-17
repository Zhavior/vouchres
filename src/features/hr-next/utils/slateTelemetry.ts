import type { HrWatchRow } from '../../hr/types/hrWatch';
import { toHrpi, tierForScore, type HrNextTierDef } from './tierPartition';

/**
 * Slate-level telemetry derived strictly from typed `HrWatchRow` fields.
 * Every metric can report "unavailable" — nothing here fabricates a number when
 * the pipeline did not publish one.
 */

export interface SlateVolumeMetric {
  games: number;
  players: number;
}

export interface LineupStatusMetric {
  confirmed: number;
  projected: number;
  unknown: number;
  total: number;
  /** Percentage of the pool with an official batting order, or null when empty. */
  confirmedPct: number | null;
}

export interface WeatherEdgeMetric {
  /** Rows in a boosted HR environment (park index >= 104 or weather layer >= 70). */
  boostedRows: number;
  /** Highest raw venue HR index on the slate, centred on 100. Null when absent. */
  topParkIndex: number | null;
  topParkVenue: string | null;
  /** Mean of the published 0–100 weather layer. Null when no row carries one. */
  averageWeatherIndex: number | null;
  hasFeed: boolean;
}

export interface TopCollisionMetric {
  playerName: string;
  team: string;
  hrpi: number;
  tier: HrNextTierDef;
}

export interface SlateAlpha {
  row: HrWatchRow;
  hrpi: number;
  tier: HrNextTierDef;
  /** Model-vs-book divergence as a percentage, null when odds are unavailable. */
  evEdgePct: number | null;
  modelProbPct: number | null;
  impliedProbPct: number | null;
  oddsLabel: string | null;
  /** True when no row on the slate carried both probabilities, so this is the
   *  HRPI leader standing in rather than a genuine divergence read. */
  isFallback: boolean;
}

export interface SlateTelemetry {
  volume: SlateVolumeMetric;
  lineup: LineupStatusMetric;
  weather: WeatherEdgeMetric;
  topCollision: TopCollisionMetric | null;
  alpha: SlateAlpha | null;
}

function evEdgeFor(row: HrWatchRow): number | null {
  const model = typeof row.hrProbability === 'number' && Number.isFinite(row.hrProbability)
    ? row.hrProbability
    : null;
  const implied = typeof row.impliedProbability === 'number' && Number.isFinite(row.impliedProbability)
    ? row.impliedProbability
    : null;
  if (model == null || implied == null || implied <= 0) return null;
  return Math.round(((model - implied) / implied) * 1000) / 10;
}

export function buildSlateTelemetry(rows: HrWatchRow[]): SlateTelemetry {
  const games = new Set<string>();
  let confirmed = 0;
  let projected = 0;
  let unknown = 0;

  let boostedRows = 0;
  let topParkIndex: number | null = null;
  let topParkVenue: string | null = null;
  let weatherSum = 0;
  let weatherCount = 0;

  let topCollision: TopCollisionMetric | null = null;
  let alpha: SlateAlpha | null = null;
  let bestEdge = Number.NEGATIVE_INFINITY;

  for (const row of rows) {
    if (row.gamePk != null) games.add(String(row.gamePk));

    if (row.truthStatus === 'official') confirmed += 1;
    else if (row.truthStatus === 'projected') projected += 1;
    else unknown += 1;

    const parkIndex = typeof row.parkIndex === 'number' && Number.isFinite(row.parkIndex)
      ? row.parkIndex
      : typeof row.parkFactor === 'number' && Number.isFinite(row.parkFactor)
        ? row.parkFactor
        : null;
    const weather = typeof row.weather === 'number' && Number.isFinite(row.weather) ? row.weather : null;

    if (weather != null) {
      weatherSum += weather;
      weatherCount += 1;
    }
    if ((parkIndex != null && parkIndex >= 104) || (weather != null && weather >= 70)) {
      boostedRows += 1;
    }
    if (parkIndex != null && (topParkIndex == null || parkIndex > topParkIndex)) {
      topParkIndex = parkIndex;
      topParkVenue = row.venue?.trim() || row.opponent?.trim() || null;
    }

    const hrpi = toHrpi(row.hrScore);
    if (!topCollision || hrpi > topCollision.hrpi) {
      topCollision = { playerName: row.playerName, team: row.team, hrpi, tier: tierForScore(row.hrScore) };
    }

    const edge = evEdgeFor(row);
    if (edge != null && edge > bestEdge) {
      bestEdge = edge;
      alpha = {
        row,
        hrpi,
        tier: tierForScore(row.hrScore),
        evEdgePct: edge,
        modelProbPct: Math.round((row.hrProbability as number) * 1000) / 10,
        impliedProbPct: Math.round((row.impliedProbability as number) * 1000) / 10,
        oddsLabel: row.oddsLabel?.trim() || null,
        isFallback: false,
      };
    }
  }

  // No row on the slate carried both a model and an implied probability — stand
  // in the HRPI leader and label it as such rather than inventing a divergence.
  if (!alpha && rows.length > 0) {
    let leader = rows[0];
    for (const row of rows) {
      if (row.hrScore > leader.hrScore) leader = row;
    }
    alpha = {
      row: leader,
      hrpi: toHrpi(leader.hrScore),
      tier: tierForScore(leader.hrScore),
      evEdgePct: null,
      modelProbPct: typeof leader.hrProbability === 'number' && Number.isFinite(leader.hrProbability)
        ? Math.round(leader.hrProbability * 1000) / 10
        : null,
      impliedProbPct: null,
      oddsLabel: leader.oddsLabel?.trim() || null,
      isFallback: true,
    };
  }

  const total = rows.length;

  return {
    volume: { games: games.size, players: total },
    lineup: {
      confirmed,
      projected,
      unknown,
      total,
      confirmedPct: total > 0 ? Math.round((confirmed / total) * 100) : null,
    },
    weather: {
      boostedRows,
      topParkIndex,
      topParkVenue,
      averageWeatherIndex: weatherCount > 0 ? Math.round(weatherSum / weatherCount) : null,
      hasFeed: weatherCount > 0 || topParkIndex != null,
    },
    topCollision,
    alpha,
  };
}
