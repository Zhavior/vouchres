/** Frontend contract for MLB data + intelligence reports (mirrors server shapes). */

export type DataQuality = "full" | "partial" | "limited";

export interface ApiTeam {
  teamId: number;
  name: string;
  abbreviation: string;
  record?: { wins: number; losses: number };
}

export interface ApiPitcher {
  pitcherId: number;
  pitcherName: string;
  throws: "L" | "R" | "U";
  team: string;
  teamId: number;
}

export interface ApiGame {
  gamePk: number;
  gameDate: string;
  status: string;
  awayTeam: ApiTeam;
  homeTeam: ApiTeam;
  venue: string;
  probablePitchers: { away: ApiPitcher | null; home: ApiPitcher | null };
  score: { away: number; home: number };
  inning: number | null;
  dataQuality: DataQuality;
}

export interface VulnerablePitcher {
  pitcherId: number;
  pitcherName: string;
  team: string;
  opponent: string;
  throws: "L" | "R" | "U";
  vulnerabilityScore: number;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  attackReasons: string[];
  whatCouldGoWrong: string[];
  dataQuality: DataQuality;
  recommendedMarkets: string[];
}

export type HrLabel = "Strong" | "Playable" | "Sneaky" | "Lotto" | "Avoid";

export interface HrTarget {
  targetId: string;
  team: string;
  opponent: string;
  opposingPitcher: string;
  opposingPitcherId: number;
  hrScore: number;
  tier: HrLabel;
  label: HrLabel;
  reasons: string[];
  riskWarnings: string[];
  confidence: "Strong" | "Moderate" | "Speculative";
  judgeStatus: "Pending" | "Approved" | "Needs more data";
  dataQuality: DataQuality;
}

export interface SneakyHrTarget {
  sneakyRank: number;
  team: string;
  opponent: string;
  opposingPitcher: string;
  reason: string;
  risk: "HIGH" | "EXTREME";
  confidence: "Strong" | "Moderate" | "Speculative";
  whatCouldGoWrong: string[];
}

export interface RunEnvironment {
  gamePk: number;
  matchup: string;
  runEnvironmentScore: number;
  tier: "LOW" | "MODERATE" | "HIGH" | "SHOOTOUT";
  reasons: string[];
  warnings: string[];
  suggestedAngles: string[];
}

export interface DailyMlbReport {
  date: string;
  gameCount: number;
  games: ApiGame[];
  vulnerablePitchers: VulnerablePitcher[];
  hrTargets: HrTarget[];
  sneakyHr: SneakyHrTarget[];
  runEnvironments: RunEnvironment[];
  dataQuality: DataQuality;
  generatedAt: string;
  disclaimer: string;
}
