import type { SportsIntelligenceResult } from './result';

export type CreateSportsIntelligenceResultInput = {
  playerId: string;
  score: number;
  rank: number;
  confidence: number;
  prediction: number;
  metadata?: Record<string, unknown>;
};

export function createSportsIntelligenceResult(
  input: CreateSportsIntelligenceResultInput,
): SportsIntelligenceResult {
  return {
    playerId: input.playerId,
    score: input.score,
    rank: input.rank,
    confidence: input.confidence,
    prediction: input.prediction,
    metadata: input.metadata,
  };
}
