import type { MLBPlayer } from "../../../types";
import type { PitchMixRow, PlayerEdgeResearchPayload, StatcastQuality } from "../../../pages/pro/usePlayerEdgeResearch";
import type { PitcherResearchPayload } from "../../../pages/pro/usePitcherResearch";
import { MLB_TEAM_OPTIONS } from "../../../lib/mlbTeamOptions";
import { classifyMlbRole } from "./positionGuard";
import type { Batter, BvPHistory, BvpGameSide, Pitcher, PitchStat } from "./types";
import { BVP_TRUTH_LABEL } from "./types";

export function playerMatchesBatterTeam(player: { team: string }, batterTeamAbbr: string): boolean {
  const team = player.team.trim();
  const needle = batterTeamAbbr.trim().toUpperCase();
  if (!team || !needle) return false;
  if (team.toUpperCase() === needle) return true;
  const byAbbr = MLB_TEAM_OPTIONS.find((opt) => opt.abbreviation.toUpperCase() === needle);
  if (byAbbr && team === byAbbr.name) return true;
  const byName = MLB_TEAM_OPTIONS.find((opt) => opt.name === team);
  return byName?.abbreviation.toUpperCase() === needle;
}

export type TodayGamePitcher = {
  pitcherId: number;
  pitcherName: string;
  throws: "L" | "R" | "U";
  team: string;
  teamId: number;
};

export type TodayGame = {
  gamePk: number;
  awayTeam?: { abbreviation?: string; name?: string };
  homeTeam?: { abbreviation?: string; name?: string };
  probablePitchers?: {
    away: TodayGamePitcher | null;
    home: TodayGamePitcher | null;
  };
};

export function usagePct(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  return raw <= 1 ? raw * 100 : raw;
}

export function isoFromSeason(avg: number | null | undefined, slg: number | null | undefined): number | null {
  if (avg == null || slg == null || !Number.isFinite(avg) || !Number.isFinite(slg)) return null;
  return slg - avg;
}

export function bbShare(atBats: number | null | undefined, walks: number | null | undefined): number | null {
  if (atBats == null || walks == null || !Number.isFinite(atBats) || !Number.isFinite(walks)) return null;
  const den = atBats + walks;
  if (den <= 0) return null;
  return (walks / den) * 100;
}

export function mergeArsenal(pitcherMix: PitchMixRow[], batterMix: PitchMixRow[]): PitchStat[] {
  return pitcherMix.map((row) => {
    const vs = batterMix.find((item) => item.pitchType === row.pitchType);
    return {
      pitchType: row.pitchType,
      pitchName: row.pitchName || row.pitchType,
      usagePct: usagePct(row.pitchUsage),
      batterWoba: vs?.woba ?? null,
      batterRunValue: null,
      pitches: row.pitches ?? null,
    };
  });
}

export function gameSidesFromToday(games: TodayGame[]): BvpGameSide[] {
  const sides: BvpGameSide[] = [];
  for (const game of games) {
    const awayAbbr = game.awayTeam?.abbreviation || game.awayTeam?.name || "AWAY";
    const homeAbbr = game.homeTeam?.abbreviation || game.homeTeam?.name || "HOME";
    const away = game.probablePitchers?.away;
    const home = game.probablePitchers?.home;
    if (away?.pitcherId) {
      sides.push({
        id: `${game.gamePk}-away-${away.pitcherId}`,
        gamePk: game.gamePk,
        gameLabel: `${homeAbbr} vs ${away.pitcherName}`,
        venueSplit: "home",
        pitcherId: String(away.pitcherId),
        pitcherName: away.pitcherName,
        pitcherThrows: away.throws === "L" || away.throws === "R" ? away.throws : "U",
        pitcherTeamAbbr: awayAbbr,
        batterTeamAbbr: homeAbbr,
      });
    }
    if (home?.pitcherId) {
      sides.push({
        id: `${game.gamePk}-home-${home.pitcherId}`,
        gamePk: game.gamePk,
        gameLabel: `${awayAbbr} @ ${home.pitcherName}`,
        venueSplit: "away",
        pitcherId: String(home.pitcherId),
        pitcherName: home.pitcherName,
        pitcherThrows: home.throws === "L" || home.throws === "R" ? home.throws : "U",
        pitcherTeamAbbr: homeAbbr,
        batterTeamAbbr: awayAbbr,
      });
    }
  }
  return sides;
}

export function rosterBatters(players: MLBPlayer[]): MLBPlayer[] {
  return players.filter((player) => classifyMlbRole(player.position) === "batter");
}

export function rosterPitchers(players: MLBPlayer[]): MLBPlayer[] {
  return players.filter((player) => classifyMlbRole(player.position) === "pitcher");
}

export function toBatterCard(
  player: MLBPlayer,
  statcast: StatcastQuality | null | undefined,
  research: PlayerEdgeResearchPayload | null,
): Batter {
  const sc = research?.statcast ?? statcast ?? null;
  const season = research?.season;
  return {
    id: player.id,
    name: player.name,
    team: player.team,
    position: player.position,
    bats: player.bats === "L" || player.bats === "S" ? player.bats : "R",
    xSlg: sc?.xslg ?? null,
    hardHitPct: sc?.hardHitPct ?? null,
    iso: isoFromSeason(season?.avg ?? null, season?.slg ?? null),
    exitVelo: sc?.avgExitVelo ?? null,
  };
}

export function toPitcherCard(
  identity: { id: string; name: string; team: string; position: string; throws: "L" | "R" },
  research: PitcherResearchPayload | null,
): Pitcher {
  const season = research?.season;
  return {
    id: identity.id,
    name: identity.name,
    team: identity.team,
    position: identity.position,
    throws: identity.throws,
    era: season?.era ?? null,
    whip: season?.whip ?? null,
    barrelRateAllowed: null,
    hr9VsLhb: null,
    hr9VsRhb: null,
    hr9: season?.homeRunsPer9 ?? null,
    pitchMix: mergeArsenal(research?.pitchMix ?? [], []),
  };
}

export function historyFromEdge(research: PlayerEdgeResearchPayload | null): BvPHistory {
  const bvp = research?.batterVsPitcher;
  if (!bvp || !bvp.ab) {
    return {
      atBats: bvp?.ab ?? null,
      hits: bvp?.h ?? null,
      homeRuns: bvp?.hr ?? null,
      strikeouts: bvp?.k ?? null,
      walks: bvp?.bb ?? null,
      walkRate: bbShare(bvp?.ab, bvp?.bb),
      hardHitRate: null,
      battingAverage: bvp?.avg ?? null,
      ops: bvp?.ops ?? null,
    };
  }
  return {
    atBats: bvp.ab,
    hits: bvp.h,
    homeRuns: bvp.hr,
    strikeouts: bvp.k,
    walks: bvp.bb,
    walkRate: bbShare(bvp.ab, bvp.bb),
    hardHitRate: null,
    battingAverage: bvp.avg,
    ops: bvp.ops,
  };
}

export function liveTruthLabel(warnings: string[]): string {
  return warnings.length ? `${BVP_TRUTH_LABEL} · limited` : BVP_TRUTH_LABEL;
}
