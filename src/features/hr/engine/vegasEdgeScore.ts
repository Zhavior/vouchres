/**
 * Layer 12 — Vegas Edge
 *
 * NOT used for prediction. Used for VALIDATION and EDGE calculation.
 *
 * Edge = Model HR Probability − Sportsbook Implied HR Probability
 *
 * Sportsbook implied probability is calculated from the American odds:
 *   If odds > 0:  impliedProb = 100 / (odds + 100)
 *   If odds < 0:  impliedProb = |odds| / (|odds| + 100)
 *
 * Edge Score (0–100) represents how favourable the model is vs the book.
 * A score of 50 = neutral (model aligns with book).
 * > 50 = model likes the player more than the book (positive edge).
 * < 50 = model likes the player less (negative edge / fade).
 *
 * The edge score is displayed on the card as a "VE Edge" metric — not
 * mixed into the composite HR score.
 */

export interface VegasEdgeInputs {
  /** Our model's estimated HR probability (0–1) */
  modelHrProbability: number;
  /**
   * Sportsbook American odds for "Anytime HR Scorer".
   * e.g. +280 (positive) or -120 (negative, rare for HR props)
   * Pass null if odds are unavailable — score will be neutral.
   */
  bookOdds: number | null;
  /**
   * The overround (vig) on the sportsbook line.
   * Typical: 0.04 to 0.08 (4–8%)
   */
  bookVig?: number;
}

export interface VegasEdgeResult {
  /** The raw edge: modelProbability − impliedProbability */
  edgeRaw: number;
  /** The model's HR probability */
  modelProbability: number;
  /** The book's implied HR probability (after vig removal) */
  impliedProbability: number | null;
  /** The American odds provided */
  bookOdds: number | null;
  /** 0–100: 50 = neutral */
  edgeScore: number;
  /** Classification */
  edgeClass: 'Strong Value' | 'Lean Value' | 'Fair' | 'Slight Fade' | 'Strong Fade' | 'No Line';
  label: string;
  /** Positive = model higher than book; Negative = model lower */
  direction: 'Positive' | 'Neutral' | 'Negative';
}

/** Convert American odds to decimal probability (before vig removal) */
function americanToProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

/** Remove the vig to get the "fair" implied probability */
function devig(rawProb: number, vig: number): number {
  return rawProb / (1 + vig);
}

export function calculateVegasEdge(inputs: VegasEdgeInputs): VegasEdgeResult {
  const { modelHrProbability, bookOdds, bookVig = 0.055 } = inputs;

  if (bookOdds === null) {
    return {
      edgeRaw: 0,
      modelProbability: modelHrProbability,
      impliedProbability: null,
      bookOdds: null,
      edgeScore: 50,
      edgeClass: 'No Line',
      label: '📋 No Line Available',
      direction: 'Neutral',
    };
  }

  const rawImplied = americanToProb(bookOdds);
  const fairImplied = devig(rawImplied, bookVig);
  const edgeRaw = modelHrProbability - fairImplied;

  // Map edge to 0–100 score. 0% edge = 50. ±10% edge = ±50 points.
  const edgeScore = Math.max(0, Math.min(100, 50 + edgeRaw * 500));

  let edgeClass: VegasEdgeResult['edgeClass'];
  let label: string;

  if (edgeRaw >= 0.06) {
    edgeClass = 'Strong Value';
    label = `🟢 Strong Value +${(edgeRaw * 100).toFixed(1)}%`;
  } else if (edgeRaw >= 0.03) {
    edgeClass = 'Lean Value';
    label = `📈 Lean Value +${(edgeRaw * 100).toFixed(1)}%`;
  } else if (edgeRaw >= -0.02) {
    edgeClass = 'Fair';
    label = `⚖️ Fair Value (${edgeRaw >= 0 ? '+' : ''}${(edgeRaw * 100).toFixed(1)}%)`;
  } else if (edgeRaw >= -0.05) {
    edgeClass = 'Slight Fade';
    label = `⚠️ Slight Fade ${(edgeRaw * 100).toFixed(1)}%`;
  } else {
    edgeClass = 'Strong Fade';
    label = `🔴 Fade — Book Priced Higher ${(edgeRaw * 100).toFixed(1)}%`;
  }

  const direction: VegasEdgeResult['direction'] =
    edgeRaw >= 0.02 ? 'Positive' :
    edgeRaw <= -0.02 ? 'Negative' :
    'Neutral';

  return {
    edgeRaw,
    modelProbability: modelHrProbability,
    impliedProbability: fairImplied,
    bookOdds,
    edgeScore: Math.round(edgeScore),
    edgeClass,
    label,
    direction,
  };
}

/** Format American odds for display: +280, -120 */
export function formatOdds(odds: number | null): string {
  if (odds === null) return '—';
  return odds > 0 ? `+${odds}` : `${odds}`;
}

/** Format probability as percentage string */
export function formatProb(prob: number | null): string {
  if (prob === null) return '—';
  return `${(prob * 100).toFixed(1)}%`;
}
