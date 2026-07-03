export type SmartAiBuilderCategory = 'HITS' | 'RBIS' | 'RUNS' | 'SB' | 'HR';

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

  if (category === 'SB') {
    return {
      marketName: threshold >= 2 ? 'To Record 2+ Stolen Bases' : 'To Record 1+ Stolen Base',
      customSpec: `${n} ${threshold}+ SB`,
      odds: threshold >= 2 ? 5.5 : 2.15,
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


export type SmartAiDynamicLeg = {
  playerId: string;
  playerName: string;
  gamePk: string;
  team: string;
  marketName: string;
  customSpec: string;
  odds: number;
  isFinal: false;
  justification: string;
  researchProfile?: SmartAiLegResearchProfile;
};

export type SmartAiDynamicDisplayPlayer = {
  id: string;
  name: string;
  team: string;
  headshot?: string;
  position?: string;
  number?: string | number;
  injuryStatus?: string;
  playerId?: string;
  playerName?: string;
  gamePk?: string;
  opponent?: string;
  oddsDecimal?: number;
  score?: number;
};

export type SmartAiResearchSignals = {
  researchGrade: 'A' | 'B' | 'C' | 'D';
  confidenceBand: 'LOW' | 'MEDIUM' | 'HIGH';
  dataCompleteness: number;
  evidenceScore: number;
  marketValueScore: number;
  volatilityScore: number;
  matchupScore: number;
  roleFit: Array<'single' | 'parlay' | 'ladder' | 'avoid'>;
  warningFlags: string[];
  whyThisPick: string[];
  whatCouldGoWrong: string[];
};

export type SmartAiLegResearchProfile = {
  boardRank: number;
  verifiedBoardScore: number;
  opponent: string;
  gamePk: string;
  dataWarnings: string[];
  researcherNotes: string[];
};

export type SmartAiDynamicParlay = {
  legs: SmartAiDynamicLeg[];
  totalOdds: string;
  oddsValue: number;
  aiConfidenceScore: number;
  players: SmartAiDynamicDisplayPlayer[];
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  researchSignals: SmartAiResearchSignals;
};

export function buildSmartAiDynamicParlay(params: {
  realCandidates: RealCandidate[];
  builderLegs: number;
  builderCategory: SmartAiBuilderCategory;
  builderThreshold: number;
}): SmartAiDynamicParlay | null {
  const { realCandidates, builderLegs, builderCategory, builderThreshold } = params;

  if (!realCandidates.length) return null;

  const selected = realCandidates
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, builderLegs);

  if (selected.length === 0) return null;

  const legs = selected.map((c, index) => {
    const { marketName, customSpec, odds } = buildSmartAiMarket(c, builderCategory, builderThreshold);

    return {
      playerId: c.playerId,
      playerName: c.playerName,
      gamePk: c.gamePk,
      team: c.team,
      marketName,
      customSpec,
      odds,
      isFinal: false as const,
      justification: `Confirmed on today's verified board — ${c.team} vs ${c.opponent}. Live MLB game (graded from the official boxscore).`,
      researchProfile: {
        boardRank: index + 1,
        verifiedBoardScore: c.score,
        opponent: c.opponent,
        gamePk: c.gamePk,
        dataWarnings: [
          'Missing Statcast rolling window',
          'Missing confirmed pitcher hand',
          'Using verified board score only',
        ],
        researcherNotes: [
          `${c.playerName} ranks inside the selected Smart AI candidate pool for this build.`,
          `${c.team} vs ${c.opponent} is tied to gamePk ${c.gamePk} for grading identity.`,
        ],
      },
    };
  });

  const combined = Math.round(legs.reduce((p, l) => p * l.odds, 1) * 100) / 100;
  const avgConf = Math.round(
    selected.reduce((s, c, i) => s + Math.max(45, 92 - i * 3), 0) / selected.length
  );

  const confidenceBand = avgConf > 82 ? 'HIGH' : avgConf > 64 ? 'MEDIUM' : 'LOW';
  const riskTier = avgConf > 82 ? 'LOW' : avgConf > 64 ? 'MEDIUM' : 'HIGH';
  const isStolenBaseBuild = builderCategory === 'SB';
  const volatilityScore = Math.min(
    100,
    Math.max(15, builderLegs * 16 + (builderThreshold - 1) * 12 + (isStolenBaseBuild ? 14 : 0))
  );
  const marketValueScore = Math.round(
    selected.reduce((sum, candidate) => sum + Math.min(100, candidate.oddsDecimal * 18), 0) / selected.length
  );
  const evidenceScore = Math.round(selected.reduce((sum, candidate) => sum + candidate.score, 0) / selected.length);
  const dataCompleteness = isStolenBaseBuild ? 34 : 42;

  const sharedWarningFlags = [
    'Missing Statcast rolling window',
    'Missing confirmed pitcher hand',
    'Missing park-factor adjustment',
  ];

  const stolenBaseWarningFlags = [
    'Missing pitcher/catcher run-game data',
    'Missing confirmed catcher throw-out profile',
    'Confirm lineup and on-base path before trusting stolen-base markets',
  ];

  const sharedWhyThisPick = [
    'Selected from today\'s verified Smart AI candidate pool.',
    `Average verified-board evidence score: ${evidenceScore}.`,
    `Builder category ${builderCategory} with threshold ${builderThreshold}.`,
  ];

  const stolenBaseWhyThisPick = [
    'Possible stolen-base angle from the verified Smart AI candidate pool.',
    'This player is being surfaced as an SB Watch candidate, not a fully confirmed run-game edge yet.',
    'Best used as a research flag until pitcher hold, catcher arm, lineup spot, and on-base path are wired.',
  ];

  const sharedWhatCouldGoWrong = [
    'Advanced contact-quality data is not wired into this return yet.',
    'Pitcher handedness and bullpen context are not confirmed in this helper yet.',
    'Higher leg counts increase parlay volatility even when individual candidates look strong.',
  ];

  const stolenBaseWhatCouldGoWrong = [
    'Stolen-base markets can fail if the player does not reach first base.',
    'A strong catcher, quick pitcher delivery, pitchout risk, or bad game script can remove the steal attempt.',
    'This helper does not yet verify catcher pop time, pitcher hold time, pickoff tendency, or team steal aggression.',
  ];

  return {
    legs,
    totalOdds: decimalToAmericanOdds(combined),
    oddsValue: combined,
    aiConfidenceScore: avgConf,
    players: selected.map((c) => ({
      id: c.playerId,
      name: c.playerName,
      team: c.team,
      playerId: c.playerId,
      playerName: c.playerName,
      gamePk: c.gamePk,
      opponent: c.opponent,
      oddsDecimal: c.oddsDecimal,
      score: c.score,
    })),
    riskTier,
    researchSignals: {
      researchGrade: evidenceScore >= 85 && dataCompleteness >= 70 ? 'A' : evidenceScore >= 75 ? 'B' : evidenceScore >= 62 ? 'C' : 'D',
      confidenceBand,
      dataCompleteness,
      evidenceScore,
      marketValueScore,
      volatilityScore,
      matchupScore: evidenceScore,
      roleFit: builderLegs <= 2 ? ['single', 'parlay'] : builderLegs <= 4 ? ['parlay', 'ladder'] : ['ladder', 'avoid'],
      warningFlags: isStolenBaseBuild
        ? [...sharedWarningFlags, ...stolenBaseWarningFlags]
        : sharedWarningFlags,
      whyThisPick: isStolenBaseBuild
        ? [...sharedWhyThisPick, ...stolenBaseWhyThisPick]
        : sharedWhyThisPick,
      whatCouldGoWrong: isStolenBaseBuild
        ? [...sharedWhatCouldGoWrong, ...stolenBaseWhatCouldGoWrong]
        : sharedWhatCouldGoWrong,
    },
  };
}
