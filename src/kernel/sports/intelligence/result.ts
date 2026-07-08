export type SportsIntelligenceResult = {
  playerId: string;
  score: number;
  rank: number;
  confidence: number;
  prediction: number;
  metadata?: Record<string, unknown>;
};
