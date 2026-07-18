import type { HrEligibleHitter, HrSlateGame } from "./hrEngineTypes";
import { sportsFetchJson } from "../../../lib/sports/sportsHttpClient";
import { TEAM_MISMATCH_REASON } from "../teamAssignmentSafety";

const MLB_API = (process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api").replace(/\/$/, "") + "/v1";

async function fetchJson(url: string, cacheKey: string) {
  return sportsFetchJson<any>(url, {
    cacheKey,
    ttlMs: 5 * 60_000,
    timeoutMs: 8_000,
    retries: 1,
    debugLabel: "hrEngine",
  });
}

function isHitter(positionType: string, positionName: string) {
  const type = positionType.toLowerCase();
  const name = positionName.toLowerCase();

  return type !== "pitcher" && !name.includes("pitcher");
}

async function fetchActiveHittersForTeam(teamId: number) {
  const url = `${MLB_API}/teams/${teamId}/roster?rosterType=active`;
  const data: any = await fetchJson(url, `hrEngine:roster:${teamId}`);
  const roster = data?.roster ?? [];

  return roster
    .filter((row: any) =>
      isHitter(String(row?.position?.type ?? ""), String(row?.position?.name ?? ""))
    )
    .map((row: any) => ({
      playerId: Number(row?.person?.id),
      playerName: String(row?.person?.fullName ?? ""),
      position: String(row?.position?.name ?? "Hitter"),
    }))
    .filter((player: any) => player.playerId && player.playerName);
}

/** Batch people.currentTeam.id so trust gate can catch stale roster assignments. */
async function fetchCurrentTeamIds(playerIds: number[]): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (!playerIds.length) return result;

  const BATCH = 50;
  for (let i = 0; i < playerIds.length; i += BATCH) {
    const batch = playerIds.slice(i, i + BATCH);
    try {
      const url = `${MLB_API}/people?personIds=${batch.join(",")}&hydrate=currentTeam`;
      const data: any = await fetchJson(url, `hrEngine:people:current-team:${batch.join(",")}`);
      for (const person of data?.people ?? []) {
        const playerId = Number(person?.id);
        const currentTeamId = Number(person?.currentTeam?.id);
        if (Number.isFinite(playerId) && Number.isFinite(currentTeamId) && currentTeamId > 0) {
          result.set(playerId, currentTeamId);
        }
      }
    } catch (error) {
      console.warn(
        `[hrEngine] people currentTeam verify failed:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  return result;
}

export async function buildEligiblePlayerPool(games: HrSlateGame[]) {
  const hitters: HrEligibleHitter[] = [];
  const warnings: string[] = [];
  let droppedMismatch = 0;

  await Promise.all(
    games.map(async (game) => {
      const sides = [
        {
          teamId: game.awayTeamId,
          team: game.awayTeam,
          teamName: game.awayTeamName,
          opponentTeamId: game.homeTeamId,
          opponent: game.homeTeam,
          opponentName: game.homeTeamName,
          opponentPitcherId: game.homeProbablePitcherId,
          opponentPitcherName: game.homeProbablePitcherName,
        },
        {
          teamId: game.homeTeamId,
          team: game.homeTeam,
          teamName: game.homeTeamName,
          opponentTeamId: game.awayTeamId,
          opponent: game.awayTeam,
          opponentName: game.awayTeamName,
          opponentPitcherId: game.awayProbablePitcherId,
          opponentPitcherName: game.awayProbablePitcherName,
        },
      ];

      for (const side of sides) {
        try {
          const teamHitters = await fetchActiveHittersForTeam(side.teamId);
          const currentTeams = await fetchCurrentTeamIds(teamHitters.map((h) => h.playerId));

          for (const hitter of teamHitters) {
            const currentTeamId = currentTeams.get(hitter.playerId) ?? null;
            if (currentTeamId != null && currentTeamId !== side.teamId) {
              droppedMismatch += 1;
              continue;
            }

            hitters.push({
              ...hitter,
              teamId: side.teamId,
              team: side.team,
              teamName: side.teamName,
              sourceTeamId: side.teamId,
              activeRosterTeamId: side.teamId,
              currentTeamId,
              opponentTeamId: side.opponentTeamId,
              opponent: side.opponent,
              opponentName: side.opponentName,
              gamePk: game.gamePk,
              gameId: game.gameId,
              venue: game.venue,
              opponentPitcherId: side.opponentPitcherId ?? null,
              opponentPitcherName: side.opponentPitcherName ?? null,
              lineupStatus: "projected_unconfirmed",
            });
          }
        } catch (error: any) {
          warnings.push(`${side.team}: ${error?.message ?? "Could not load active roster"}`);
        }
      }
    })
  );

  if (droppedMismatch > 0) {
    warnings.push(`${droppedMismatch} players dropped: ${TEAM_MISMATCH_REASON}`);
  }

  return {
    hitters,
    warnings,
  };
}
