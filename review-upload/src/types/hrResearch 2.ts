/**
 * Canonical frontend contract for HR Intelligence player research.
 *
 * This contract is intentionally separate from HrWatchRow.
 * HrWatchRow powers the ranked board.
 * HrResearchResponse powers the full player investigation experience.
 */

export type HrResearchConfidence = 'low' | 'moderate' | 'high';

export type HrResearchVerdict =
  | 'strong'
  | 'playable'
  | 'price_sensitive'
  | 'watch'
  | 'pass'
  | 'unavailable';

export type HrResearchDirection = 'positive' | 'negative' | 'neutral';

export type HrResearchLineupStatus =
  | 'confirmed'
  | 'projected'
  | 'scratched'
  | 'unknown';

export type HrResearchQualityStatus =
  | 'complete'
  | 'partial'
  | 'limited'
  | 'stale'
  | 'unavailable';

export interface HrResearchEvidence {
  key: string;
  label: string;
  explanation: string;
  direction: HrResearchDirection;
  value: number | null;
  displayValue: string | null;
  sampleSize: number | null;
  source: string | null;
}

export interface HrResearchTimelinePoint {
  date: string;
  opponent: string | null;
  atBats: number;
  hits: number;
  homeRuns: number;
  totalBases: number;
  strikeOuts: number;
  hrScore: number | null;
  barrelRate: number | null;
  hardHitRate: number | null;
}

export interface HrResearchContactPoint {
  label: string;
  value: number | null;
  seasonBaseline: number | null;
  leagueBaseline: number | null;
  percentile: number | null;
  sampleSize: number | null;
}

export interface HrResearchPitchMatchupRow {
  pitchType: string;
  pitchName: string;
  pitcherUsage: number | null;
  batterAverage: number | null;
  batterSlugging: number | null;
  batterExpectedSlugging: number | null;
  batterWhiffRate: number | null;
  runValue: number | null;
  matchupScore: number | null;
  sampleSize: number | null;
}

export interface HrResearchPitcherTrendPoint {
  date: string;
  opponent: string | null;
  inningsPitched: number | null;
  homeRunsAllowed: number | null;
  hardHitRateAllowed: number | null;
  barrelRateAllowed: number | null;
  flyBallRateAllowed: number | null;
  averageExitVelocityAllowed: number | null;
  fastballVelocity: number | null;
}

export interface HrResearchSprayEvent {
  id: string;
  date: string | null;
  x: number;
  y: number;
  result: string;
  exitVelocity: number | null;
  launchAngle: number | null;
  distance: number | null;
  isHomeRun: boolean;
}

export interface HrResearchScoreContribution {
  key: string;
  label: string;
  score: number | null;
  weight: number | null;
  contribution: number | null;
  direction: HrResearchDirection;
  explanation: string;
}

export interface HrResearchOddsPoint {
  capturedAt: string;
  sportsbook: string | null;
  americanOdds: number | null;
  impliedProbability: number | null;
}

export interface HrResearchResponse {
  player: {
    id: number;
    name: string;
    team: string;
    bats: 'L' | 'R' | 'S' | null;
    headshotUrl: string | null;
    teamLogoUrl: string | null;
    lineupStatus: HrResearchLineupStatus;
    lineupPosition: number | null;
  };

  matchup: {
    gamePk: number | null;
    opponent: string;
    opponentLogoUrl: string | null;
    venue: string | null;
    gameTime: string | null;
    pitcher: {
      id: number | null;
      name: string | null;
      throws: 'L' | 'R' | null;
    };
  };

  decision: {
    hrScore: number;
    modelProbability: number | null;
    marketProbability: number | null;
    fairOddsAmerican: number | null;
    marketOddsAmerican: number | null;
    playableAtOrAbove: number | null;
    edgePercentagePoints: number | null;
    confidence: HrResearchConfidence;
    verdict: HrResearchVerdict;
    summary: string;
  };

  reasons: HrResearchEvidence[];
  risks: HrResearchEvidence[];

  charts: {
    signalTimeline: HrResearchTimelinePoint[];
    contactQuality: HrResearchContactPoint[];
    pitchArsenal: HrResearchPitchMatchupRow[];
    pitcherVulnerability: HrResearchPitcherTrendPoint[];
    sprayEvents: HrResearchSprayEvent[];
    scoreContributions: HrResearchScoreContribution[];
    oddsHistory: HrResearchOddsPoint[];
  };

  context: {
    seasonStats: Record<string, number | string | null>;
    rolling14Day: Record<string, number | null> | null;
    batterVsPitcher: Record<string, number | string | null> | null;
    weather: Record<string, number | string | boolean | null> | null;
  };

  quality: {
    status: HrResearchQualityStatus;
    dataConfidence: number | null;
    truthStatus: 'official' | 'projected' | 'blocked' | 'unknown';
    dataSource: string;
    modelVersion: string | null;
    generatedAt: string;
    updatedAt: string;
    missingFields: string[];
    warnings: string[];
  };
}
