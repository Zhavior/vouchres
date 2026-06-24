/**
 * MLB Intelligence Engine — orchestrator.
 * Pulls the slate once and runs every engine to produce the daily intelligence report.
 */
import { getScheduleByDate, todayISO } from "../mlb/mlbClient";
import { reportCache } from "../mlb/mlbCache";
import { NormalizedGame } from "../mlb/mlbTypes";
import { buildVulnerablePitcherReport, VulnerablePitcherProfile } from "./pitcherVulnerabilityEngine";
import { rankHrTargets, findSneakyHrTargets, HrTarget, SneakyHrTarget } from "./hrEngine";
import { rankRbiTargets, RbiEnvironmentReport } from "./rbiEnvironmentEngine";
import { scoreRunEnvironment, RunEnvironment } from "./runEnvironmentEngine";

export interface DailyMlbReport {
  date: string;
  gameCount: number;
  games: NormalizedGame[];
  vulnerablePitchers: VulnerablePitcherProfile[];
  hrTargets: HrTarget[];
  sneakyHr: SneakyHrTarget[];
  rbi: RbiEnvironmentReport;
  runEnvironments: RunEnvironment[];
  dataQuality: "full" | "partial" | "limited";
  generatedAt: string;
  disclaimer: string;
}

const DISCLAIMER =
  "Probability-based research for entertainment. Not betting advice, not guaranteed outcomes. Past results do not predict future ones.";

export async function buildDailyReport(date = todayISO()): Promise<DailyMlbReport> {
  return reportCache.getOrSet(`daily:${date}`, async () => {
    const games = await getScheduleByDate(date);
    const hasGames = games.length > 0;
    return {
      date,
      gameCount: games.length,
      games,
      vulnerablePitchers: buildVulnerablePitcherReport(games),
      hrTargets: rankHrTargets(games),
      sneakyHr: findSneakyHrTargets(games),
      rbi: rankRbiTargets(games),
      runEnvironments: scoreRunEnvironment(games),
      dataQuality: hasGames ? "partial" : "limited",
      generatedAt: new Date().toISOString(),
      disclaimer: DISCLAIMER,
    };
  }) as Promise<DailyMlbReport>;
}
