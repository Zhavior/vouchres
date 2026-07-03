export type SmartAiBuilderCategory = 'HITS' | 'RBIS' | 'RUNS' | 'SB' | 'HR';

export interface RealCandidate {
  playerId: string;
  playerName: string;
  gamePk: string;
  team: string;
  opponent: string;
  oddsDecimal: number;
  score: number;
  opponentPitcherName?: string | null;
  pitcherHand?: string | null;
  pitcherVulnerability?: number | null;
  parkFactor?: number | null;
  venue?: string | null;
  lineupStatus?: string | null;
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
  opponentPitcherName?: string | null;
  pitcherHand?: string | null;
  pitcherVulnerability?: number | null;
  parkFactor?: number | null;
  venue?: string | null;
  lineupStatus?: string | null;
  dataWarnings: string[];
  researcherNotes: string[];
};

type MarketResearchProfile = {
  dataCompleteness: number;
  roleFit: SmartAiResearchSignals['roleFit'];
  warningFlags: string[];
  whyThisPick: string[];
  whatCouldGoWrong: string[];
};

function buildMarketResearchProfile(params: {
  builderCategory: SmartAiBuilderCategory;
  builderThreshold: number;
  builderLegs: number;
  evidenceScore: number;
}): MarketResearchProfile {
  const { builderCategory, builderThreshold, builderLegs, evidenceScore } = params;

  const sharedWarnings = [
    'Missing Statcast rolling window',
    'Missing confirmed probable pitcher',
    'Missing confirmed pitcher hand',
    'Missing confirmed lineup context',
    'Missing park-factor adjustment',
  ];

  const sharedWhy = [
    'Selected from today\'s verified Smart AI candidate pool.',
    `Average verified-board evidence score: ${evidenceScore}.`,
    `Builder category ${builderCategory} with threshold ${builderThreshold}.`,
  ];

  const sharedRisk = [
    'Advanced market-specific data is not fully wired into this return yet.',
    'Probable pitcher, pitcher handedness, bullpen context, and lineup context are not fully confirmed in this helper yet.',
    'Higher leg counts increase parlay volatility even when individual candidates look strong.',
  ];

  const baseRoleFit: SmartAiResearchSignals['roleFit'] =
    builderLegs <= 2 ? ['single', 'parlay'] : builderLegs <= 4 ? ['parlay', 'ladder'] : ['ladder', 'avoid'];

  if (builderCategory === 'HITS') {
    return {
      dataCompleteness: 46,
      roleFit: baseRoleFit,
      warningFlags: [
        ...sharedWarnings,
        'Missing recent contact-quality trend',
        'Missing batter-vs-pitcher handedness split confirmation',
        'Missing opposing pitcher contact-allowed profile',
      ],
      whyThisPick: [
        ...sharedWhy,
        'Hits markets need contact quality, recent form, lineup spot, pitcher hand, and opposing pitcher contact-allowed profile.',
        'Use as a Hits research flag until recent batted-ball quality and matchup splits are wired.',
      ],
      whatCouldGoWrong: [
        ...sharedRisk,
        'A low-contact day, strong pitcher command, defensive positioning, or rest-day lineup change can break the hits angle.',
      ],
    };
  }

  if (builderCategory === 'RBIS') {
    return {
      dataCompleteness: 40,
      roleFit: builderLegs <= 1 ? ['single'] : ['parlay', 'avoid'],
      warningFlags: [
        ...sharedWarnings,
        'Missing projected batting order',
        'Missing teammate on-base context',
        'Missing opposing pitcher traffic-allowed profile',
        'Missing team run-total context',
      ],
      whyThisPick: [
        ...sharedWhy,
        'RBI markets need lineup opportunity, teammates reaching base, pitcher traffic allowed, and team run environment.',
        'Use as an RBI opportunity flag until batting order and teammate context are wired.',
      ],
      whatCouldGoWrong: [
        ...sharedRisk,
        'RBI legs can fail even on a good player day if teammates do not reach base ahead of him.',
        'Low team total, bad lineup spot, or a pitcher limiting traffic can remove RBI chances.',
      ],
    };
  }

  if (builderCategory === 'RUNS') {
    return {
      dataCompleteness: 42,
      roleFit: baseRoleFit,
      warningFlags: [
        ...sharedWarnings,
        'Missing on-base path confirmation',
        'Missing hitters-behind context',
        'Missing team scoring environment',
        'Missing opposing pitcher run-prevention profile',
      ],
      whyThisPick: [
        ...sharedWhy,
        'Runs markets need on-base path, lineup position, hitters behind the player, team scoring environment, and pitcher context.',
        'Use as a team-context Runs research flag until lineup and run environment are confirmed.',
      ],
      whatCouldGoWrong: [
        ...sharedRisk,
        'Runs legs can fail if the player reaches base but hitters behind him do not drive him in.',
        'Bad lineup placement, weak team context, or low-scoring game script can break the Runs angle.',
      ],
    };
  }

  if (builderCategory === 'HR') {
    return {
      dataCompleteness: 38,
      roleFit: builderThreshold >= 2 ? ['ladder', 'avoid'] : ['single', 'parlay'],
      warningFlags: [
        ...sharedWarnings,
        'Missing barrel-rate rolling window',
        'Missing hard-hit and launch-angle quality',
        'Missing opposing pitcher HR-allowed profile',
        'Missing weather/wind carry confirmation',
      ],
      whyThisPick: [
        ...sharedWhy,
        'Home Run markets need barrel rate, hard-hit rate, launch-angle quality, pitcher HR weakness, park factor, weather, and lineup confirmation.',
        'Use as an HR Watch flag until Statcast, pitcher HR profile, and weather are wired.',
      ],
      whatCouldGoWrong: [
        ...sharedRisk,
        'HR markets are naturally high volatility even when the matchup looks strong.',
        'A pitcher avoiding the zone, park/weather suppression, or missing lineup confirmation can break the HR angle.',
      ],
    };
  }

  return {
    dataCompleteness: 34,
    roleFit: builderThreshold >= 2 ? ['ladder', 'avoid'] : ['single'],
    warningFlags: [
      ...sharedWarnings,
      'Missing pitcher/catcher run-game data',
      'Missing confirmed catcher throw-out profile',
      'Missing player steal-attempt rate',
      'Confirm lineup and on-base path before trusting stolen-base markets',
    ],
    whyThisPick: [
      ...sharedWhy,
      'Possible stolen-base angle from the verified Smart AI candidate pool.',
      'This player is being surfaced as an SB Watch candidate, not a fully confirmed run-game edge yet.',
      'Best used as a research flag until pitcher hold, catcher arm, lineup spot, steal tendency, and on-base path are wired.',
    ],
    whatCouldGoWrong: [
      ...sharedRisk,
      'Stolen-base markets can fail if the player does not reach first base.',
      'A strong catcher, quick pitcher delivery, pickoff risk, pitchout risk, or bad game script can remove the steal attempt.',
      'This helper does not yet verify catcher pop time, pitcher hold time, pickoff tendency, or team steal aggression.',
    ],
  };
}

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
        opponentPitcherName: c.opponentPitcherName ?? null,
        pitcherHand: c.pitcherHand ?? null,
        pitcherVulnerability: typeof c.pitcherVulnerability === 'number' ? c.pitcherVulnerability : null,
        parkFactor: typeof c.parkFactor === 'number' ? c.parkFactor : null,
        venue: c.venue ?? null,
        lineupStatus: c.lineupStatus ?? null,
        dataWarnings: [
          'Missing Statcast rolling window',
          'Using verified board score only',
          ...(c.opponentPitcherName ? [] : ['Missing probable pitcher data']),
          ...(c.pitcherHand ? [] : ['Missing confirmed pitcher hand']),
          ...(typeof c.pitcherVulnerability === 'number' ? [] : ['Missing pitcher vulnerability profile']),
          ...(typeof c.parkFactor === 'number' ? [] : ['Missing park-factor adjustment']),
          ...(c.lineupStatus ? [] : ['Missing confirmed lineup context']),
        ],
        researcherNotes: [
          `${c.playerName} ranks inside the selected Smart AI candidate pool for this build.`,
          `${c.team} vs ${c.opponent} is tied to gamePk ${c.gamePk} for grading identity.`,
          ...(c.opponentPitcherName
            ? [`Opponent pitcher context: ${c.opponentPitcherName}${c.pitcherHand ? ` (${c.pitcherHand})` : ''}.`]
            : ['Opponent pitcher context is not available from the current adapter payload.']),
          ...(typeof c.pitcherVulnerability === 'number'
            ? [`Pitcher vulnerability score available from adapter: ${c.pitcherVulnerability}.`]
            : []),
          ...(typeof c.parkFactor === 'number'
            ? [`Park factor available from adapter: ${c.parkFactor}.`]
            : []),
          ...(c.venue ? [`Venue context available from adapter: ${c.venue}.`] : []),
          ...(c.lineupStatus ? [`Lineup status from adapter: ${c.lineupStatus}.`] : []),
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
  const volatilityScore = Math.min(
    100,
    Math.max(15, builderLegs * 16 + (builderThreshold - 1) * 12 + (builderCategory === 'SB' ? 14 : 0) + (builderCategory === 'HR' ? 10 : 0))
  );
  const marketValueScore = Math.round(
    selected.reduce((sum, candidate) => sum + Math.min(100, candidate.oddsDecimal * 18), 0) / selected.length
  );
  const evidenceScore = Math.round(selected.reduce((sum, candidate) => sum + candidate.score, 0) / selected.length);
  const marketResearch = buildMarketResearchProfile({
    builderCategory,
    builderThreshold,
    builderLegs,
    evidenceScore,
  });

  const adapterCompletenessScore = Math.round(
    selected.reduce((sum, candidate) => {
      const availableSignals = [
        Boolean(candidate.opponentPitcherName),
        Boolean(candidate.pitcherHand),
        typeof candidate.pitcherVulnerability === 'number',
        typeof candidate.parkFactor === 'number',
        Boolean(candidate.lineupStatus),
      ].filter(Boolean).length;

      return sum + availableSignals * 6;
    }, 0) / selected.length
  );

  const missingDataPenalty = Math.round(
    selected.reduce((sum, candidate) => {
      const missingSignals = [
        !candidate.opponentPitcherName,
        !candidate.pitcherHand,
        typeof candidate.pitcherVulnerability !== 'number',
        typeof candidate.parkFactor !== 'number',
        !candidate.lineupStatus,
      ].filter(Boolean).length;

      return sum + missingSignals * 3;
    }, 0) / selected.length
  );

  const dataCompleteness = Math.max(
    20,
    Math.min(92, marketResearch.dataCompleteness + adapterCompletenessScore - missingDataPenalty)
  );

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
      roleFit: marketResearch.roleFit,
      warningFlags: marketResearch.warningFlags,
      whyThisPick: marketResearch.whyThisPick,
      whatCouldGoWrong: marketResearch.whatCouldGoWrong,
    },
  };
}
