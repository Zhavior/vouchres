import { IntelligenceSignal, HrIndexScore, Provenance } from '../../../../src/features/hr-v2/domain/intelligence';
import { GameLifecycle } from '../../../../src/features/hr-v2/domain/game';
import { ConfidenceLevel, ConfidenceMetrics } from '../../../../src/features/hr-v2/domain/confidence';

export interface ScorerInput {
  playerId: string;
  gameLifecycle: GameLifecycle;
  signals: IntelligenceSignal[];
  freshness: Provenance['freshness'];
}

/**
 * Core Logic for deriving the final HR Index and Confidence from disparate signals.
 */
export class HrIndexScorer {
  public static readonly VERSION = 'hr-v10.1';

  public compute(input: ScorerInput): HrIndexScore {
    let totalScore = 0;
    let maxPossible = 0;
    const reasons: string[] = [];

    // Basic weighted sum model for demonstration
    for (const signal of input.signals) {
      // Signals are expected to be 0-100 normalized
      const weight = this.getSignalWeight(signal.id);
      totalScore += (signal.normalizedScore * weight);
      maxPossible += (100 * weight);
      
      if (signal.normalizedScore > 80 && signal.direction === 'positive') {
        reasons.push(`Strong ${signal.name}`);
      }
    }

    const hrIndexRaw = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
    const hrIndex = Math.round(Math.min(100, Math.max(0, hrIndexRaw)));

    const confidence = this.computeConfidence(input.signals, input.gameLifecycle);
    confidence.reasons.push(...reasons.slice(0, 2)); // keep top 2 reasons

    let primaryRecommendation = 'Wait for more data';
    if (hrIndex > 75 && confidence.level === 'high') {
      primaryRecommendation = 'Favorable condition for HR';
    } else if (hrIndex < 40) {
      primaryRecommendation = 'Unfavorable condition for HR';
    }

    return {
      hrIndex,
      confidence,
      primaryRecommendation,
      provenance: {
        generatedAt: new Date().toISOString(),
        versions: {
          scorer: HrIndexScorer.VERSION,
          weather: 'atmo-v4',
          matchup: 'matchup-v7',
        },
        freshness: input.freshness,
      }
    };
  }

  private getSignalWeight(signalId: string): number {
    const weights: Record<string, number> = {
      'BARREL_RATE': 1.5,
      'HARD_HIT': 1.2,
      'PARK_FACTOR': 1.0,
      'WEATHER_WIND': 0.8,
      'PITCHER_TENDENCY': 1.3
    };
    return weights[signalId] || 1.0;
  }

  private computeConfidence(signals: IntelligenceSignal[], lifecycle: GameLifecycle): ConfidenceMetrics {
    // Determine confidence based on data completeness and game state
    let baseConfidence = 0.8; // Default good confidence
    
    // Penalize if missing key signals
    if (signals.length < 3) {
      baseConfidence -= 0.3;
    }

    // Penalize if game is scheduled far in the future
    if (lifecycle === 'scheduled' || lifecycle === 'postponed') {
      baseConfidence -= 0.2;
    }

    const score = Math.max(0, Math.min(1, baseConfidence));
    
    let level: ConfidenceLevel = 'medium';
    if (score >= 0.9) level = 'very_high';
    else if (score >= 0.7) level = 'high';
    else if (score < 0.4) level = 'low';

    return {
      level,
      score,
      reasons: score < 0.5 ? ['Missing critical signal data or game state is uncertain'] : []
    };
  }
}
