import { z } from 'zod';

const nullableFiniteNumber = z.number().finite().nullable();

export const HrResearchEvidenceSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  explanation: z.string(),
  direction: z.enum(['positive', 'negative', 'neutral']),
  value: nullableFiniteNumber,
  displayValue: z.string().nullable(),
  sampleSize: z.number().int().nonnegative().nullable(),
  source: z.string().nullable(),
});

export const HrResearchTimelinePointSchema = z.object({
  date: z.string(),
  opponent: z.string().nullable(),
  atBats: z.number().int().nonnegative(),
  hits: z.number().int().nonnegative(),
  homeRuns: z.number().int().nonnegative(),
  totalBases: z.number().int().nonnegative(),
  strikeOuts: z.number().int().nonnegative(),
  hrScore: nullableFiniteNumber,
  barrelRate: nullableFiniteNumber,
  hardHitRate: nullableFiniteNumber,
});

export const HrResearchContactPointSchema = z.object({
  label: z.string(),
  value: nullableFiniteNumber,
  seasonBaseline: nullableFiniteNumber,
  leagueBaseline: nullableFiniteNumber,
  percentile: nullableFiniteNumber,
  sampleSize: z.number().int().nonnegative().nullable(),
});

export const HrResearchPitchMatchupRowSchema = z.object({
  pitchType: z.string(),
  pitchName: z.string(),
  pitcherUsage: nullableFiniteNumber,
  batterAverage: nullableFiniteNumber,
  batterSlugging: nullableFiniteNumber,
  batterExpectedSlugging: nullableFiniteNumber,
  batterWhiffRate: nullableFiniteNumber,
  runValue: nullableFiniteNumber,
  matchupScore: nullableFiniteNumber,
  sampleSize: z.number().int().nonnegative().nullable(),
});

export const HrResearchPitcherTrendPointSchema = z.object({
  date: z.string(),
  opponent: z.string().nullable(),
  inningsPitched: nullableFiniteNumber,
  homeRunsAllowed: nullableFiniteNumber,
  hardHitRateAllowed: nullableFiniteNumber,
  barrelRateAllowed: nullableFiniteNumber,
  flyBallRateAllowed: nullableFiniteNumber,
  averageExitVelocityAllowed: nullableFiniteNumber,
  fastballVelocity: nullableFiniteNumber,
});

export const HrResearchSprayEventSchema = z.object({
  id: z.string(),
  date: z.string().nullable(),
  x: z.number().finite(),
  y: z.number().finite(),
  result: z.string(),
  exitVelocity: nullableFiniteNumber,
  launchAngle: nullableFiniteNumber,
  distance: nullableFiniteNumber,
  isHomeRun: z.boolean(),
});

export const HrResearchScoreContributionSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: nullableFiniteNumber,
  weight: nullableFiniteNumber,
  contribution: nullableFiniteNumber,
  direction: z.enum(['positive', 'negative', 'neutral']),
  explanation: z.string(),
});

export const HrResearchOddsPointSchema = z.object({
  capturedAt: z.string(),
  sportsbook: z.string().nullable(),
  americanOdds: nullableFiniteNumber,
  impliedProbability: nullableFiniteNumber,
});

export const HrResearchResponseSchema = z.object({
  player: z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    team: z.string().min(1),
    bats: z.enum(['L', 'R', 'S']).nullable(),
    headshotUrl: z.string().nullable(),
    teamLogoUrl: z.string().nullable(),
    lineupStatus: z.enum(['confirmed', 'projected', 'scratched', 'unknown']),
    lineupPosition: z.number().int().positive().nullable(),
  }),

  matchup: z.object({
    gamePk: z.number().int().positive().nullable(),
    opponent: z.string(),
    opponentLogoUrl: z.string().nullable(),
    venue: z.string().nullable(),
    gameTime: z.string().nullable(),
    pitcher: z.object({
      id: z.number().int().positive().nullable(),
      name: z.string().nullable(),
      throws: z.enum(['L', 'R']).nullable(),
    }),
  }),

  decision: z.object({
    hrScore: z.number().finite().min(0).max(100),
    modelProbability: nullableFiniteNumber,
    marketProbability: nullableFiniteNumber,
    fairOddsAmerican: nullableFiniteNumber,
    marketOddsAmerican: nullableFiniteNumber,
    playableAtOrAbove: nullableFiniteNumber,
    edgePercentagePoints: nullableFiniteNumber,
    confidence: z.enum(['low', 'moderate', 'high']),
    verdict: z.enum([
      'strong',
      'playable',
      'price_sensitive',
      'watch',
      'pass',
      'unavailable',
    ]),
    summary: z.string(),
  }),

  reasons: z.array(HrResearchEvidenceSchema),
  risks: z.array(HrResearchEvidenceSchema),

  charts: z.object({
    signalTimeline: z.array(HrResearchTimelinePointSchema),
    contactQuality: z.array(HrResearchContactPointSchema),
    pitchArsenal: z.array(HrResearchPitchMatchupRowSchema),
    pitcherVulnerability: z.array(HrResearchPitcherTrendPointSchema),
    sprayEvents: z.array(HrResearchSprayEventSchema),
    scoreContributions: z.array(HrResearchScoreContributionSchema),
    oddsHistory: z.array(HrResearchOddsPointSchema),
  }),

  context: z.object({
    seasonStats: z.record(z.string(), z.union([z.number(), z.string(), z.null()])),
    rolling14Day: z.record(z.string(), nullableFiniteNumber).nullable(),
    batterVsPitcher: z
      .record(z.string(), z.union([z.number(), z.string(), z.null()]))
      .nullable(),
    weather: z
      .record(
        z.string(),
        z.union([z.number(), z.string(), z.boolean(), z.null()]),
      )
      .nullable(),
  }),

  quality: z.object({
    status: z.enum(['complete', 'partial', 'limited', 'stale', 'unavailable']),
    dataConfidence: nullableFiniteNumber,
    truthStatus: z.enum(['official', 'projected', 'blocked', 'unknown']),
    dataSource: z.string(),
    modelVersion: z.string().nullable(),
    generatedAt: z.string(),
    updatedAt: z.string(),
    missingFields: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
});

export type ParsedHrResearchResponse = z.infer<
  typeof HrResearchResponseSchema
>;

export function parseHrResearchResponse(input: unknown): ParsedHrResearchResponse {
  return HrResearchResponseSchema.parse(input);
}

export function safeParseHrResearchResponse(input: unknown) {
  return HrResearchResponseSchema.safeParse(input);
}
