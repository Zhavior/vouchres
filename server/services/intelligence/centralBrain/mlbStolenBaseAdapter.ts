import { getCachedValidatedHrBoard } from "../../hubs/hrBoardHub";
import { getScheduleByDate, todayISO } from "../../mlb/mlbClient";
import { getHitterStats } from "../../mlb/statsClient";
import { getActiveHittersByTeam } from "../../mlb/teamRosterClient";
import { BrainFeatureSnapshotSchema, type BrainFeatureAdapter, type BrainFeatureSnapshot } from "./featureSchemas";

export const MLB_SB_FEATURE_ADAPTER_VERSION = "mlb-stolen-base-features@1";

export const mlbStolenBaseFeatureAdapter: BrainFeatureAdapter<{ date?: string }> = {
  sport: "mlb",
  market: "stolen_base",
  adapterVersion: MLB_SB_FEATURE_ADAPTER_VERSION,
  async build(input) {
    const date = input.date ?? todayISO();
    const [games, validatedBoard] = await Promise.all([getScheduleByDate(date), getCachedValidatedHrBoard(date)]);
    const teamIds = [...new Set(games.flatMap((game) => [game.homeTeam.teamId, game.awayTeam.teamId]))];
    const rosters = await getActiveHittersByTeam(teamIds);
    const lineupByPlayer = new Map<number, "eligible" | "preview">([
      ...validatedBoard.candidates.map((candidate) => [candidate.playerId, "eligible"] as const),
      ...validatedBoard.projectedCandidates.map((candidate) => [candidate.playerId, "preview"] as const),
    ]);
    const players = [...rosters.values()].flat();
    const stats = new Map<number, Awaited<ReturnType<typeof getHitterStats>>>();
    for (let index = 0; index < players.length; index += 10) {
      const batch = players.slice(index, index + 10);
      const results = await Promise.allSettled(batch.map((player) => getHitterStats(player.playerId)));
      results.forEach((result) => {
        if (result.status === "fulfilled") stats.set(result.value.playerId, result.value);
      });
    }

    const observedAt = validatedBoard.debug.lastRefresh;
    const snapshots: BrainFeatureSnapshot[] = [];
    for (const game of games) {
      for (const side of [
        { team: game.awayTeam, opponent: game.homeTeam, homeAway: "away" },
        { team: game.homeTeam, opponent: game.awayTeam, homeAway: "home" },
      ] as const) {
        for (const player of rosters.get(side.team.teamId) ?? []) {
          const hitter = stats.get(player.playerId);
          const season = hitter?.season;
          if (!season?.gamesPlayed) continue;
          const attempts = season.stolenBases + season.caughtStealing;
          if (attempts < 2) continue;
          const recentAttempts = hitter.recentGames.reduce((sum, item) => sum + item.stolenBases + item.caughtStealing, 0);
          const successRate = attempts ? season.stolenBases / attempts : 0;
          const attemptsPerGame = attempts / season.gamesPlayed;
          const estimatedProbability = Math.max(0.01, Math.min(0.55, attemptsPerGame * successRate));
          const eligibility = lineupByPlayer.get(player.playerId) ?? "preview";
          snapshots.push(BrainFeatureSnapshotSchema.parse({
            schemaVersion: "1.0", sport: "mlb", market: "stolen_base", eventId: String(game.gamePk),
            subjectId: String(player.playerId), subjectLabel: player.playerName, team: side.team.abbreviation,
            opponent: side.opponent.abbreviation, observedAt, scheduledAt: game.gameDate,
            adapterVersion: MLB_SB_FEATURE_ADAPTER_VERSION, quality: "limited", eligibility,
            features: {
              estimatedStolenBaseProbability: estimatedProbability,
              seasonStolenBases: season.stolenBases,
              seasonCaughtStealing: season.caughtStealing,
              stealSuccessRate: successRate,
              attemptsPerGame,
              recentAttempts,
              onBasePercentage: season.onBasePercentage,
              lineupConfirmed: eligibility === "eligible",
              homeAway: side.homeAway,
              sprintSpeed: null,
              catcherPopTime: null,
              pitcherDeliveryTime: null,
            },
            missingFeatures: ["sprintSpeed", "catcherPopTime", "pitcherDeliveryTime"],
            reasons: [`${season.stolenBases} stolen bases in ${season.gamesPlayed} games.`, `${Math.round(successRate * 100)}% success on ${attempts} attempts.`],
            risks: ["Sprint speed, catcher pop time, and pitcher delivery time are not connected."],
            evidence: [
              { feature: "stolenBaseHistory", source: "MLB Stats API season and game logs", status: "verified", observedAt },
              { feature: "lineup", source: "MLB Stats API boxscore", status: eligibility === "eligible" ? "verified" : "projected", observedAt },
              { feature: "sprintSpeed", source: "No Statcast provider connected", status: "missing", observedAt },
              { feature: "catcherPopTime", source: "No Statcast provider connected", status: "missing", observedAt },
            ],
          }));
        }
      }
    }
    return snapshots;
  },
};
