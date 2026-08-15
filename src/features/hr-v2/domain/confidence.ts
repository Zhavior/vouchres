export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface ConfidenceMetrics {
  level: ConfidenceLevel;
  score: number; // 0.0 to 1.0 representing underlying probability/certainty
  reasons: string[]; // Explanatory strings (e.g., "Strong barrel profile")
}
