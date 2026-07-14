import { getScheduleByDate, todayISO } from "../../mlb/mlbClient";
import { getPitcherStats } from "../../mlb/statsClient";
import { BrainFeatureSnapshotSchema, type BrainFeatureAdapter, type BrainFeatureSnapshot } from "./featureSchemas";

export const MLB_PITCHER_K_FEATURE_ADAPTER_VERSION = "mlb-pitcher-k-features@1";
export const BRAIN_PITCHER_K_TARGET = 5;

export const mlbPitcherKFeatureAdapter: BrainFeatureAdapter<{ date?: string }> = {
  sport: "mlb",
  market: "pitcher_strikeouts",
  adapterVersion: MLB_PITCHER_K_FEATURE_ADAPTER_VERSION,
  async build(input) {
    const date = input.date ?? todayISO();
    const games = await getScheduleByDate(date);
    const observedAt = new Date().toISOString();
    const entries = games.flatMap((game) => [
      game.probablePitchers.away ? { game, pitcher: game.probablePitchers.away, opponent: game.homeTeam } : null,
      game.probablePitchers.home ? { game, pitcher: game.probablePitchers.home, opponent: game.awayTeam } : null,
    ]).filter((entry): entry is NonNullable<typeof entry> => entry != null);

    const statsByPitcher = new Map<number, Awaited<ReturnType<typeof getPitcherStats>>>();
    const results = await Promise.allSettled(entries.map((entry) => getPitcherStats(entry.pitcher.pitcherId)));
    results.forEach((result) => {
      if (result.status === "fulfilled") statsByPitcher.set(result.value.pitcherId, result.value);
    });

    const snapshots: BrainFeatureSnapshot[] = [];
    for (const { game, pitcher, opponent } of entries) {
      const stats = statsByPitcher.get(pitcher.pitcherId);
      const season = stats?.season;
      if (!season || season.gamesStarted < 2 || season.inningsPitched <= 0) continue;
      const seasonKPer9 = season.strikeOuts / season.inningsPitched * 9;
      const recentStarts = stats.recentGames.filter((start) => start.inningsPitched > 0);
      const recentKAverage = recentStarts.length
        ? recentStarts.reduce((sum, start) => sum + start.strikeOuts, 0) / recentStarts.length
        : null;
      const missingFeatures = [
        recentKAverage == null ? "recentKAverage" : null,
        "opposingLineupStrikeoutRate",
        "swingingStrikeRate",
        "pitchCountProjection",
      ].filter((value): value is string => value != null);

      snapshots.push(BrainFeatureSnapshotSchema.parse({
        schemaVersion: "1.0",
        sport: "mlb",
        market: "pitcher_strikeouts",
        eventId: String(game.gamePk),
        subjectId: String(pitcher.pitcherId),
        subjectLabel: pitcher.pitcherName,
        team: pitcher.team,
        opponent: opponent.abbreviation,
        observedAt,
        scheduledAt: game.gameDate,
        adapterVersion: MLB_PITCHER_K_FEATURE_ADAPTER_VERSION,
        quality: missingFeatures.length > 2 ? "limited" : "partial",
        // Probable pitchers are listed on the schedule — not confirmed starters. Keep preview.
        eligibility: "preview",
        features: {
          statTarget: BRAIN_PITCHER_K_TARGET,
          comparator: "gte",
          seasonKPer9,
          recentKAverage,
          seasonStrikeouts: season.strikeOuts,
          inningsPitched: season.inningsPitched,
          gamesStarted: season.gamesStarted,
          probableStarter: true,
          opposingLineupStrikeoutRate: null,
          swingingStrikeRate: null,
          pitchCountProjection: null,
        },
        missingFeatures,
        reasons: [
          `${seasonKPer9.toFixed(1)} strikeouts per nine across ${season.gamesStarted} starts.`,
          recentKAverage == null ? "Recent-start strikeout history unavailable." : `${recentKAverage.toFixed(1)} strikeouts per recent start.`,
          "Listed as a probable starter; not an official confirmed start yet.",
        ],
        risks: [
          "Probable pitcher listings can change before first pitch.",
          "Opponent lineup strikeout rate, swinging-strike rate, and pitch-count projection are not connected.",
        ],
        evidence: [
          { feature: "probablePitcher", source: "MLB Stats API schedule", status: "projected", observedAt },
          { feature: "seasonPitching", source: "MLB Stats API season pitching", status: "verified", observedAt },
          { feature: "recentPitching", source: "MLB Stats API game logs", status: recentKAverage == null ? "missing" : "verified", observedAt },
          { feature: "opposingLineupStrikeoutRate", source: "No lineup split provider connected", status: "missing", observedAt },
        ],
      }));
    }
    return snapshots;
  },
};
