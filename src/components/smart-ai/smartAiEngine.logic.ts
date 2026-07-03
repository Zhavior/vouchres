export type SmartAiBuilderCategory = 'HITS' | 'RBIS' | 'RUNS' | 'HR';

export interface RealCandidate {
  playerId: string;
  playerName: string;
  gamePk: string;
  team: string;
  opponent: string;
  oddsDecimal: number;
  score: number;
}

export interface PrecomputedPick {
  id: string;
  player: string;
  team: string;
  market: string;
  odds: string;
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  rationale: string;
  gameInfo: string;
  category: string;
  projectedValue: string;
  trend: string;
  source?: string;
}

export type SmartAiMarket = {
  marketName: string;
  customSpec: string;
  odds: number;
};

export function americanToDecimalOdds(am: unknown): number {
  const s = String(am ?? '').trim();

  if (!s) return 3.5;

  if (s.startsWith('+')) {
    const n = Number(s.slice(1));
    return Number.isFinite(n) ? Math.round((1 + n / 100) * 100) / 100 : 3.5;
  }

  if (s.startsWith('-')) {
    const n = Number(s.slice(1));
    return Number.isFinite(n) && n > 0 ? Math.round((1 + 100 / n) * 100) / 100 : 1.8;
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return 3.5;

  return n > 20 ? Math.round((1 + n / 100) * 100) / 100 : n;
}

export function buildSmartAiMarket(
  cand: RealCandidate,
  category: SmartAiBuilderCategory | string,
  threshold: number,
): SmartAiMarket {
  const n = cand.playerName;

  if (category === 'HITS') {
    const odds = threshold === 1 ? 1.4 : threshold === 2 ? 2.3 : 5.0;
    return {
      marketName: `To Record ${threshold}+ Hits`,
      customSpec: `${n} ${threshold}+ Hits`,
      odds,
    };
  }

  if (category === 'RBIS') {
    return {
      marketName: `To Record ${threshold}+ RBIs`,
      customSpec: `${n} ${threshold}+ RBI`,
      odds: 1.7 + threshold * 0.7,
    };
  }

  if (category === 'RUNS') {
    return {
      marketName: `To Record ${threshold}+ Runs`,
      customSpec: `${n} ${threshold}+ Runs`,
      odds: 1.6 + threshold * 0.6,
    };
  }

  const odds = threshold >= 2 ? Math.max(8, cand.oddsDecimal * 4) : cand.oddsDecimal || 3.5;

  return {
    marketName: threshold >= 2 ? 'To Hit 2+ Home Runs' : 'To Hit 1+ Home Run',
    customSpec: `${n} ${threshold}+ HR`,
    odds: Math.round(odds * 100) / 100,
  };
}

export function decimalToAmericanOdds(dec: number): string {
  if (!Number.isFinite(dec) || dec <= 1) return '+100';

  return dec >= 2.0
    ? `+${Math.round((dec - 1) * 100)}`
    : `-${Math.round(100 / (dec - 1))}`;
}
