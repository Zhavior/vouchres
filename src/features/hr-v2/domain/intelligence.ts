import { ConfidenceMetrics } from './confidence';

export interface IntelligenceVersions {
  scorer: string;
  weather: string;
  matchup: string;
}

export interface IntelligenceFreshness {
  batter: string; // ISO8601
  pitcher: string;
  weather: string;
  odds: string;
}

export interface Provenance {
  generatedAt: string; // ISO8601
  versions: IntelligenceVersions;
  freshness: IntelligenceFreshness;
}

export interface IntelligenceSignal {
  id: string; // Stable identifier for the signal (e.g., 'BARREL_RATE')
  name: string;
  value: number | string;
  normalizedScore: number; // 0 to 100
  direction: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0.0 to 1.0
  freshness: string; // ISO8601
  source: string; // e.g., 'Baseball Savant', 'MLB API'
}

export interface HrIndexScore {
  hrIndex: number;
  confidence: ConfidenceMetrics;
  primaryRecommendation: string;
  provenance: Provenance;
  /**
   * Indicates the data basis for this score.
   * - 'confirmed_lineup': Player appears in a posted game lineup — score uses real slot-aware bonus.
   * - 'roster_baseline': Player is on the active roster only — score is a placeholder lower bound,
   *   capped strictly below any confirmed_lineup score in the same slate.
   *
   * Optional to preserve backwards compatibility with existing mock data that pre-dates this field.
   */
  scoreBasis?: 'confirmed_lineup' | 'roster_baseline';
  /**
   * Probability (0-1) produced by the model. 
   * Required for expected value (EV) calculations.
   */
  modelProbability?: number | null;
}
