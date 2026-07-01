import type { HrEligibleHitter, HrSlateGame } from "./hrEngineTypes.js";

const MLB_API = "https://statsapi.mlb.com/api/v1";

async function fetchJson(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MLB fetch failed ${response.status}: ${url}`);
  }

  return response.json();
}

function isHitter(positionType: string, positionName: string) {
  const type = positionType.toLowerCase();
  const name = positionName.toLowerCase();

  return type !== "pitcher" && !name.includes("pitcher");
}

async function fetchActiveHittersForTeam(teamId: number) {
  const url = `${MLB_API}/teams/${teamId}/roster?rosterType=active`;
  const data: any = await fetchJson(url);
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

export async function buildEligiblePlayerPool(games: HrSlateGame[]) {
  const hitters: HrEligibleHitter[] = [];
  const warnings: string[] = [];

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

          for (const hitter of teamHitters) {
            hitters.push({
              ...hitter,
              teamId: side.teamId,
              team: side.team,
              teamName: side.teamName,
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

  return {
    hitters,
    warnings,
  };
}
