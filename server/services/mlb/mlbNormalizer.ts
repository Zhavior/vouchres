/** Turns raw MLB Stats API payloads into clean VouchEdge shapes. */
import {
  NormalizedGame,
  NormalizedPitcher,
  NormalizedPlayer,
  NormalizedTeam,
  NormalizedLinescore,
  headshotUrl,
} from "./mlbTypes";

function side(code?: string): "L" | "R" | "U" {
  return code === "L" ? "L" : code === "R" ? "R" : "U";
}
function batSide(code?: string): "L" | "R" | "S" | "U" {
  return code === "L" ? "L" : code === "R" ? "R" : code === "S" ? "S" : "U";
}

export function normalizeTeam(raw: any): NormalizedTeam {
  const t = raw?.team ?? raw ?? {};
  return {
    teamId: t.id ?? 0,
    name: t.name ?? "TBD",
    abbreviation: t.abbreviation ?? t.teamCode?.toUpperCase() ?? "TBD",
    record: raw?.leagueRecord
      ? { wins: raw.leagueRecord.wins ?? 0, losses: raw.leagueRecord.losses ?? 0 }
      : undefined,
  };
}

export function normalizePitcher(raw: any, team: NormalizedTeam): NormalizedPitcher | null {
  if (!raw?.id) return null;
  return {
    pitcherId: raw.id,
    pitcherName: raw.fullName ?? raw.name ?? "Unannounced",
    throws: side(raw.pitchHand?.code),
    team: team.name,
    teamId: team.teamId,
  };
}

export function normalizePlayer(raw: any, team: NormalizedTeam, battingOrder?: number): NormalizedPlayer {
  const person = raw?.person ?? raw ?? {};
  return {
    playerId: person.id ?? 0,
    playerName: person.fullName ?? "Unknown",
    position: raw?.position?.abbreviation ?? person.primaryPosition?.abbreviation ?? "—",
    bats: batSide(person.batSide?.code),
    team: team.name,
    teamId: team.teamId,
    battingOrder,
    headshot: headshotUrl(person.id ?? 0),
  };
}

export function normalizeLinescore(raw: any): NormalizedLinescore | null {
  if (!raw) return null;
  return {
    currentInning: raw.currentInning,
    inningState: raw.inningState,
    awayRuns: raw.teams?.away?.runs ?? 0,
    homeRuns: raw.teams?.home?.runs ?? 0,
    awayHits: raw.teams?.away?.hits,
    homeHits: raw.teams?.home?.hits,
  };
}

/** Normalize one game node from a schedule `dates[].games[]` entry. */
export function normalizeGame(raw: any): NormalizedGame {
  const away = normalizeTeam(raw?.teams?.away);
  const home = normalizeTeam(raw?.teams?.home);
  const ls = raw?.linescore ? normalizeLinescore(raw.linescore) : null;

  return {
    gamePk: raw?.gamePk ?? 0,
    gameDate: raw?.gameDate ?? "",
    status: raw?.status?.detailedState ?? raw?.status?.abstractGameState ?? "Scheduled",
    awayTeam: away,
    homeTeam: home,
    venue: raw?.venue?.name ?? "TBD",
    probablePitchers: {
      away: normalizePitcher(raw?.teams?.away?.probablePitcher, away),
      home: normalizePitcher(raw?.teams?.home?.probablePitcher, home),
    },
    score: {
      away: raw?.teams?.away?.score ?? ls?.awayRuns ?? 0,
      home: raw?.teams?.home?.score ?? ls?.homeRuns ?? 0,
    },
    inning: ls?.currentInning ?? null,
    linescore: ls,
    weather: null,
    bettingContext: null,
    aiContext: null,
    dataQuality: raw?.teams?.away?.probablePitcher && raw?.teams?.home?.probablePitcher ? "full" : "partial",
  };
}
