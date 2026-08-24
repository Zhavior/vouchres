/**
 * MLB injury report.
 *
 * Reads ESPN's public injuries endpoint — roughly 290 records across all 30
 * clubs — and reduces each one to the fields the product actually joins on.
 *
 * This is deliberately not the news wire. Wire stories carry ESPN athlete ids,
 * which are not MLBAM ids, so a mention can never be joined against the slate
 * with confidence. These records carry a team abbreviation and a position
 * alongside the name, which is enough to match a slate row and say something
 * useful about a candidate rather than merely print a headline.
 *
 * Nothing here is inferred. A record with no status or no athlete name is
 * dropped rather than filled in.
 */
import { sportsFetchJson } from "../../lib/sports/sportsHttpClient";

const INJURIES_URL =
  "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/injuries";
const TTL_MS = 10 * 60_000;
const STALE_IF_ERROR_MS = 6 * 60 * 60_000;

/** How available the player is. Ordered most severe first. */
export type InjuryAvailability = "OUT" | "IL" | "DAY_TO_DAY" | "QUESTIONABLE" | "UNKNOWN";

export interface MlbInjuryRecord {
  id: string;
  playerName: string;
  position: string | null;
  teamAbbrev: string | null;
  teamName: string | null;
  /** ESPN's own label, e.g. "15-Day-IL". Passed through verbatim. */
  status: string;
  /** Human description of the designation, e.g. "15-day IL". */
  designation: string | null;
  availability: InjuryAvailability;
  /** ISO-8601. Null when ESPN omits it — never backfilled with "now". */
  reportedAt: string | null;
  shortComment: string | null;
  longComment: string | null;
}

export interface MlbInjuryPayload {
  injuries: MlbInjuryRecord[];
  teamsReporting: number;
  source: "ESPN";
  fetchedAt: string;
}

interface EspnInjury {
  id?: string;
  status?: string;
  date?: string;
  shortComment?: string;
  longComment?: string;
  type?: { description?: string; abbreviation?: string };
  athlete?: {
    displayName?: string;
    position?: { abbreviation?: string };
    team?: { abbreviation?: string; displayName?: string };
  };
}

interface EspnInjuryTeam {
  displayName?: string;
  injuries?: EspnInjury[];
}

/**
 * ESPN's status strings are not a closed set, so this maps the ones that carry
 * a clear availability meaning and leaves everything else UNKNOWN rather than
 * guessing at a severity the feed did not state.
 */
function toAvailability(status: string): InjuryAvailability {
  const s = status.toLowerCase();
  if (s.includes("out")) return "OUT";
  if (s.includes("il") || s.includes("injured list")) return "IL";
  if (s.includes("day-to-day") || s.includes("day to day")) return "DAY_TO_DAY";
  if (s.includes("questionable") || s.includes("probable")) return "QUESTIONABLE";
  return "UNKNOWN";
}

const SEVERITY: Record<InjuryAvailability, number> = {
  OUT: 0,
  IL: 1,
  DAY_TO_DAY: 2,
  QUESTIONABLE: 3,
  UNKNOWN: 4,
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapInjury(raw: EspnInjury, teamName: string | null): MlbInjuryRecord | null {
  const playerName = text(raw.athlete?.displayName);
  const status = text(raw.status);
  // Without a name or a status the row cannot be joined or explained.
  if (!playerName || !status) return null;

  return {
    id: text(raw.id) ?? `${playerName}-${status}`,
    playerName,
    position: text(raw.athlete?.position?.abbreviation),
    teamAbbrev: text(raw.athlete?.team?.abbreviation),
    teamName: text(raw.athlete?.team?.displayName) ?? teamName,
    status,
    designation: text(raw.type?.description),
    availability: toAvailability(status),
    reportedAt: text(raw.date),
    shortComment: text(raw.shortComment),
    longComment: text(raw.longComment),
  };
}

export async function getMlbInjuries(): Promise<MlbInjuryPayload> {
  const raw = await sportsFetchJson<{ injuries?: EspnInjuryTeam[] }>(INJURIES_URL, {
    ttlMs: TTL_MS,
    staleIfErrorMs: STALE_IF_ERROR_MS,
    cacheKey: "mlb:injuries",
    debugLabel: "mlbInjuries",
  });

  const teams = raw?.injuries ?? [];
  const injuries = teams
    .flatMap((team) =>
      (team.injuries ?? []).map((entry) => mapInjury(entry, text(team.displayName))),
    )
    .filter((entry): entry is MlbInjuryRecord => entry != null)
    .sort((a, b) => {
      const severity = SEVERITY[a.availability] - SEVERITY[b.availability];
      if (severity !== 0) return severity;
      return (Date.parse(b.reportedAt ?? "") || 0) - (Date.parse(a.reportedAt ?? "") || 0);
    });

  return {
    injuries,
    teamsReporting: teams.length,
    source: "ESPN",
    fetchedAt: new Date().toISOString(),
  };
}
