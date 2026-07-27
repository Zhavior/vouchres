/**
 * Market taxonomy — maps free-text prop labels/specs (from the UI) to the
 * normalized market codes + thresholds the grader understands.
 *
 * Keep this in sync with the server grader (server/services/grading/sportGraders.ts).
 * Adding NBA/NFL markets later = add entries here keyed by their sport.
 */

import type { SportId } from "./registry";

export interface MarketResolution {
  marketCode: string;
  threshold: number;
}

/** Pull a numeric threshold out of a spec like "Over 1.5 Hits" or "2+ HR". */
function parseThreshold(text: string, fallback: number): number {
  const over = text.match(/over\s+(\d+\.?\d*)/i);
  if (over) return parseFloat(over[1]);
  const plus = text.match(/(\d+)\s*\+/); // "2+"
  if (plus) return parseInt(plus[1], 10);
  return fallback;
}

/**
 * Resolve a leg's market for MLB. `label` is the displayed market
 * ("Anytime HR", "Batter Total Hits"), `spec` is the full selection text.
 */
function resolveMlbMarket(label: string, spec: string): MarketResolution {
  const t = `${label} ${spec}`.toLowerCase();

  // Home runs
  if (/\bhr\b|home\s*run/.test(t)) {
    const th = parseThreshold(t, 1);
    return { marketCode: th >= 2 ? 'hr_multi' : 'hr', threshold: th };
  }
  // RBI
  if (/\brbi\b/.test(t)) {
    return { marketCode: 'rbi', threshold: parseThreshold(t, 1) };
  }
  // Runs
  if (/\brun(s)?\b/.test(t)) {
    return { marketCode: 'run', threshold: parseThreshold(t, 1) };
  }
  // Total bases
  if (/total\s*bases|\btb\b|bases/.test(t)) {
    return { marketCode: 'tb', threshold: parseThreshold(t, 1) };
  }
  // Hits (check last — "total bases" also contains nothing about hits, but
  // "total hits" should map to hits)
  if (/\bhit(s)?\b/.test(t)) {
    return { marketCode: 'hits', threshold: parseThreshold(t, 1) };
  }

  // Unknown — leave code empty so grading reports it rather than guessing.
  return { marketCode: '', threshold: parseThreshold(t, 1) };
}

/** NFL market resolver stub — extend when nflGrader ships. */
function resolveNflMarket(label: string, spec: string): MarketResolution {
  const t = `${label} ${spec}`.toLowerCase();

  if (/\btouchdown\b|\btd\b/.test(t)) {
    return { marketCode: "touchdown", threshold: parseThreshold(t, 1) };
  }
  if (/passing\s*yards?|\bpass\s*yds\b/.test(t)) {
    return { marketCode: "passing_yards", threshold: parseThreshold(t, 1) };
  }
  if (/rushing\s*yards?|\brush\s*yds\b/.test(t)) {
    return { marketCode: "rushing_yards", threshold: parseThreshold(t, 1) };
  }
  if (/receiving\s*yards?|\brec\s*yds\b/.test(t)) {
    return { marketCode: "receiving_yards", threshold: parseThreshold(t, 1) };
  }
  if (/reception(s)?|\brec(s)?\b/.test(t)) {
    return { marketCode: "receptions", threshold: parseThreshold(t, 1) };
  }

  return { marketCode: "", threshold: parseThreshold(t, 1) };
}

/** Sport-dispatched market resolver. NBA/NFL stubs until their graders exist. */
export function resolveMarket(
  sport: SportId,
  label: string,
  spec: string,
): MarketResolution {
  switch (sport) {
    case "mlb":
      return resolveMlbMarket(label, spec);
    case "nfl":
      return resolveNflMarket(label, spec);
    default:
      return { marketCode: "", threshold: 1 };
  }
}
