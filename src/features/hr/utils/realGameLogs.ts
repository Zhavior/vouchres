/**
 * Real per-game hitting logs from the public MLB Stats API (open CORS,
 * same client-side-fallback pattern as src/lib/mlbDirect.ts).
 *
 * Used by HrPlayerProfile.tsx to replace fabricated "Recent Form" / "vs
 * Team" data with a batter's actual box-score log. Requires only the
 * batter's own MLB player ID — no pitcher ID needed, unlike batter-vs-
 * pitcher history (which stays labeled "Simulated" until a reliable
 * pitcher ID is available in HrWatchRow).
 *
 * NOT available from this feed: exit velocity (Statcast-only, not part
 * of the public gameLog endpoint). Any "recent form" UI built on this
 * data should omit EV rather than invent it.
 */

const BASE = 'https://statsapi.mlb.com/api';

export interface RealGameLog {
  date: string;
  opponentAbbr: string;
  opponentName: string;
  ab: number;
  hits: number;
  doubles: number;
  triples: number;
  hrs: number;
  rbi: number;
  bb: number;
  strikeOuts: number;
  /** Singles×1 + doubles×2 + triples×3 + HR×4 — a real per-game production metric, used in place of exit velocity (which this feed doesn't provide). */
  totalBases: number;
  result: 'HR' | 'Hit' | 'Out';
}

// Standard MLB team abbreviations, keyed by the full team name the
// gameLog endpoint returns in `split.opponent.name`.
const TEAM_ABBR_BY_NAME: Record<string, string> = {
  'Los Angeles Angels': 'LAA', 'Arizona Diamondbacks': 'AZ', 'Baltimore Orioles': 'BAL',
  'Boston Red Sox': 'BOS', 'Chicago Cubs': 'CHC', 'Cincinnati Reds': 'CIN',
  'Cleveland Guardians': 'CLE', 'Colorado Rockies': 'COL', 'Detroit Tigers': 'DET',
  'Houston Astros': 'HOU', 'Kansas City Royals': 'KC', 'Los Angeles Dodgers': 'LAD',
  'Washington Nationals': 'WSH', 'New York Mets': 'NYM', 'Oakland Athletics': 'ATH',
  'Athletics': 'ATH', 'Pittsburgh Pirates': 'PIT', 'San Diego Padres': 'SD',
  'Seattle Mariners': 'SEA', 'San Francisco Giants': 'SF', 'St. Louis Cardinals': 'STL',
  'Tampa Bay Rays': 'TB', 'Texas Rangers': 'TEX', 'Toronto Blue Jays': 'TOR',
  'Minnesota Twins': 'MIN', 'Philadelphia Phillies': 'PHI', 'Atlanta Braves': 'ATL',
  'Chicago White Sox': 'CHW', 'Miami Marlins': 'MIA', 'New York Yankees': 'NYY',
  'Milwaukee Brewers': 'MIL',
};

function abbrFor(name: string): string {
  return TEAM_ABBR_BY_NAME[name] ?? name.slice(0, 3).toUpperCase();
}

const cache = new Map<string, RealGameLog[] | null>();

/**
 * Fetch a batter's real game-by-game hitting log for the current season,
 * most recent games first. Returns null (not an empty array) on any
 * failure so callers can distinguish "no games yet" from "fetch failed."
 */
export async function fetchRealGameLog(playerId: string | number, season = new Date().getFullYear()): Promise<RealGameLog[] | null> {
  const key = `${playerId}:${season}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch(`${BASE}/v1/people/${playerId}/stats?stats=gameLog&group=hitting&season=${season}`);
    if (!res.ok) { cache.set(key, null); return null; }
    const data = await res.json();
    const splits: any[] = data?.stats?.[0]?.splits ?? [];
    if (!Array.isArray(splits) || splits.length === 0) { cache.set(key, null); return null; }

    const logs: RealGameLog[] = splits
      .map((split): RealGameLog | null => {
        const s = split?.stat;
        if (!s) return null;
        const hrs = Number(s.homeRuns) || 0;
        const hits = Number(s.hits) || 0;
        const doubles = Number(s.doubles) || 0;
        const triples = Number(s.triples) || 0;
        const singles = Math.max(0, hits - doubles - triples - hrs);
        const totalBases = singles + doubles * 2 + triples * 3 + hrs * 4;
        const opponentName = String(split?.opponent?.name ?? 'Unknown');
        return {
          date: split?.date ?? '',
          opponentAbbr: abbrFor(opponentName),
          opponentName,
          ab: Number(s.atBats) || 0,
          hits,
          doubles,
          triples,
          hrs,
          rbi: Number(s.rbi) || 0,
          bb: Number(s.baseOnBalls) || 0,
          strikeOuts: Number(s.strikeOuts) || 0,
          totalBases,
          result: hrs > 0 ? 'HR' : hits > 0 ? 'Hit' : 'Out',
        };
      })
      .filter((g): g is RealGameLog => g != null)
      .reverse(); // API returns oldest-first; we want most-recent-first

    cache.set(key, logs);
    return logs;
  } catch {
    cache.set(key, null);
    return null;
  }
}

/** Last N games from a real game log, most recent first. */
export function lastNGames(logs: RealGameLog[], n: number): RealGameLog[] {
  return logs.slice(0, n);
}

/**
 * Real games against a specific opponent, most recent first. Matches by
 * abbreviation (case-insensitive) since HrWatchRow.opponent is already
 * an abbreviation like "CHW" or "NYY".
 */
export function gamesAgainstOpponent(logs: RealGameLog[], opponentAbbr: string, limit = 5): RealGameLog[] {
  const target = opponentAbbr.trim().toUpperCase();
  return logs.filter((g) => g.opponentAbbr.toUpperCase() === target).slice(0, limit);
}
