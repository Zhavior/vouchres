export type SmartAiBuilderCategory = 'HITS' | 'RBIS' | 'RUNS' | 'SB' | 'HR';

/** Real per-signal score breakdown from the validated HR board pipeline. */
export type CandidateScoreBreakdown = {
  hitterPower: number;
  pitcherVulnerability: number;
  parkContext: number;
  lineupVolume: number;
  handednessEdge: number;
  recentForm: number;
  penalties: number;
};

export interface RealCandidate {
  playerId: string;
  playerName: string;
  gamePk: string;
  team: string;
  opponent: string;
  oddsDecimal: number | null;
  score: number;
  opponentPitcherName?: string | null;
  pitcherHand?: string | null;
  pitcherVulnerability?: number | null;
  parkFactor?: number | null;
  venue?: string | null;
  lineupStatus?: string | null;
  // Real board research context (present when the validated pipeline supplies it).
  confidenceTier?: 'elite' | 'strong' | 'watchlist' | 'thin' | 'avoid' | null;
  riskLabel?: string | null;
  estimatedHrProbability?: number | null;
  dataConfidence?: number | null;
  battingOrder?: number | null;
  dataQuality?: string | null;
  reasons?: string[];
  boardWarnings?: string[];
  scoreBreakdown?: CandidateScoreBreakdown | null;
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
  /** Decimal odds when a real market price exists, null when unknown ("Odds TBD"). */
  odds: number | null;
};

/** Convert American (or passthrough decimal) odds to decimal, or null when the
 *  price is missing/invalid. NEVER fabricates a price — a missing market price
 *  must surface as "Odds TBD", not an invented number. */
export function americanToDecimalOdds(am: unknown): number | null {
  const s = String(am ?? '').trim();

  if (!s) return null;

  if (s.startsWith('+')) {
    const n = Number(s.slice(1));
    return Number.isFinite(n) && n > 0 ? Math.round((1 + n / 100) * 100) / 100 : null;
  }

  if (s.startsWith('-')) {
    const n = Number(s.slice(1));
    return Number.isFinite(n) && n > 0 ? Math.round((1 + 100 / n) * 100) / 100 : null;
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;

  if (n > 20) return Math.round((1 + n / 100) * 100) / 100;
  return n > 1.01 ? n : null;
}

function getCandidateAdapterSignals(candidate: RealCandidate) {
  const availableCount = [
    Boolean(candidate.opponentPitcherName),
    Boolean(candidate.pitcherHand),
    typeof candidate.pitcherVulnerability === 'number',
    typeof candidate.parkFactor === 'number',
    Boolean(candidate.lineupStatus),
  ].filter(Boolean).length;

  const missingCount = 5 - availableCount;

  return {
    availableCount,
    missingCount,
    pitcherVulnerability: typeof candidate.pitcherVulnerability === 'number' ? candidate.pitcherVulnerability : 0,
    parkFactor: typeof candidate.parkFactor === 'number' ? candidate.parkFactor : 0,
    hasLineupStatus: Boolean(candidate.lineupStatus),
    hasPitcherContext: Boolean(candidate.opponentPitcherName || candidate.pitcherHand),
  };
}

function scoreSmartAiCandidateForMarket(candidate: RealCandidate, category: SmartAiBuilderCategory) {
  const signals = getCandidateAdapterSignals(candidate);
  const baseScore = Number.isFinite(candidate.score) ? candidate.score : 0;
  const adapterBonus = signals.availableCount * 2.5;
  const missingPenalty = signals.missingCount * 1.75;

  if (category === 'HITS') {
    return baseScore + adapterBonus + (signals.hasPitcherContext ? 4 : 0) - missingPenalty;
  }

  if (category === 'RBIS') {
    return (
      baseScore +
      adapterBonus +
      signals.pitcherVulnerability * 0.08 +
      (signals.hasLineupStatus ? 5 : 0) -
      missingPenalty * 1.1
    );
  }

  if (category === 'RUNS') {
    return (
      baseScore +
      adapterBonus +
      signals.parkFactor * 0.06 +
      (signals.hasLineupStatus ? 6 : 0) -
      missingPenalty * 1.05
    );
  }

  if (category === 'HR') {
    return (
      baseScore +
      adapterBonus +
      signals.pitcherVulnerability * 0.12 +
      signals.parkFactor * 0.08 -
      missingPenalty * 1.25
    );
  }

  return (
    baseScore +
    adapterBonus +
    (signals.hasPitcherContext ? 3 : 0) +
    (signals.hasLineupStatus ? 4 : 0) -
    missingPenalty * 2.4
  );
}


export function buildSmartAiMarket(
  cand: RealCandidate,
  category: SmartAiBuilderCategory | string,
  threshold: number,
): SmartAiMarket {
  const n = cand.playerName;

  if (category === 'HITS') {
    // No real Hits market feed is wired yet — odds must stay null, never invented.
    return {
      marketName: `To Record ${threshold}+ Hits`,
      customSpec: `${n} ${threshold}+ Hits`,
      odds: null,
    };
  }

  if (category === 'RBIS') {
    return {
      marketName: `To Record ${threshold}+ RBIs`,
      customSpec: `${n} ${threshold}+ RBI`,
      odds: null,
    };
  }

  if (category === 'RUNS') {
    return {
      marketName: `To Record ${threshold}+ Runs`,
      customSpec: `${n} ${threshold}+ Runs`,
      odds: null,
    };
  }

  if (category === 'SB') {
    return {
      marketName: threshold >= 2 ? 'To Record 2+ Stolen Bases' : 'To Record 1+ Stolen Base',
      customSpec: `${n} ${threshold}+ SB`,
      odds: null,
    };
  }

  // HR: the board's implied price only covers 1+ HR. A 2+ HR market price
  // does not exist in our data, so it stays null instead of a scaled guess.
  const odds = threshold >= 2 ? null : cand.oddsDecimal;

  return {
    marketName: threshold >= 2 ? 'To Hit 2+ Home Runs' : 'To Hit 1+ Home Run',
    customSpec: `${n} ${threshold}+ HR`,
    odds: typeof odds === 'number' ? Math.round(odds * 100) / 100 : null,
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
  odds: number | null;
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
  /** Combined decimal odds when EVERY leg has a real price, else null (unknown). */
  oddsValue: number | null;
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
    .sort(
      (a, b) =>
        scoreSmartAiCandidateForMarket(b, builderCategory) -
        scoreSmartAiCandidateForMarket(a, builderCategory)
    )
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
          ...(typeof odds === 'number' ? [] : ['Missing market odds — leg tracks without a price']),
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

  // Combined odds are only real when EVERY leg carries a real price.
  // Never multiply invented placeholders into a displayed/saved return.
  const allLegsPriced = legs.length > 0 && legs.every((l) => typeof l.odds === 'number');
  const combined = allLegsPriced
    ? Math.round(legs.reduce((p, l) => p * (l.odds as number), 1) * 100) / 100
    : null;
  const avgConf = Math.round(
    selected.reduce((sum, candidate) => {
      const marketScore = scoreSmartAiCandidateForMarket(candidate, builderCategory);
      return sum + Math.max(45, Math.min(92, marketScore));
    }, 0) / selected.length
  );

  const confidenceBand = avgConf > 82 ? 'HIGH' : avgConf > 64 ? 'MEDIUM' : 'LOW';
  const riskTier = avgConf > 82 ? 'LOW' : avgConf > 64 ? 'MEDIUM' : 'HIGH';
  const volatilityScore = Math.min(
    100,
    Math.max(15, builderLegs * 16 + (builderThreshold - 1) * 12 + (builderCategory === 'SB' ? 14 : 0) + (builderCategory === 'HR' ? 10 : 0))
  );
  const pricedCandidates = selected.filter((candidate) => typeof candidate.oddsDecimal === 'number');
  const marketValueScore = pricedCandidates.length
    ? Math.round(
        pricedCandidates.reduce((sum, candidate) => sum + Math.min(100, (candidate.oddsDecimal as number) * 18), 0) /
          pricedCandidates.length
      )
    : 0;
  const evidenceScore = Math.round(
    selected.reduce((sum, candidate) => sum + scoreSmartAiCandidateForMarket(candidate, builderCategory), 0) /
      selected.length
  );
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
    totalOdds: combined !== null ? decimalToAmericanOdds(combined) : 'Odds TBD',
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
