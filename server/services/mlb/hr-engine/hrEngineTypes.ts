export type HrRiskTier = "Strong" | "Playable" | "Sneaky" | "Longshot";

export type HrDataQuality =
  | "official_lineup"
  | "projection_preview"
  | "vercel_safe_projection_preview"
  | "partial"
  | "unavailable";

export type HrEngineInput = {
  date?: string;
  previewLimit?: number;
};

export type HrSlateGame = {
  gamePk: number;
  gameId: string;
  date: string;
  gameDate: string;
  status: string;
  venue: string;

  awayTeamId: number;
  awayTeam: string;
  awayTeamName: string;

  homeTeamId: number;
  homeTeam: string;
  homeTeamName: string;

  awayProbablePitcherId?: number | null;
  awayProbablePitcherName?: string | null;
  homeProbablePitcherId?: number | null;
  homeProbablePitcherName?: string | null;
};

export type HrHitterStats = {
  gamesPlayed?: number;
  atBats?: number;
  plateAppearances?: number;
  homeRuns?: number;
  doubles?: number;
  triples?: number;
  hits?: number;
  slugging?: number;
  ops?: number;
  avg?: number;
  hrRate?: number;
  isoProxy?: number;
};

export type HrRecentForm = {
  gamesChecked: number;
  atBats: number;
  hits: number;
  homeRuns: number;
  doubles: number;
  triples: number;
  extraBaseHits: number;
  totalBases: number;
  slugging: number;
  recentHrRate: number;
  recentPowerScore: number;
};

export type HrPitcherStats = {
  gamesPlayed?: number;
  gamesStarted?: number;
  inningsPitched?: number;
  homeRunsAllowed?: number;
  walks?: number;
  strikeOuts?: number;
  earnedRuns?: number;
  era?: number;
  whip?: number;
  hr9?: number;
  k9?: number;
  bb9?: number;
};

export type HrEligibleHitter = {
  playerId: number;
  playerName: string;
  position: string;
  hitterStats?: HrHitterStats;
  recentForm?: HrRecentForm;

  teamId: number;
  team: string;
  teamName: string;
  /** Provenance — set from the roster fetch team; used by applyTrustGate. */
  sourceTeamId?: number;
  activeRosterTeamId?: number;
  currentTeamId?: number | null;

  opponentTeamId: number;
  opponent: string;
  opponentName: string;

  gamePk: number;
  gameId: string;
  venue: string;

  opponentPitcherId?: number | null;
  opponentPitcherName?: string | null;
  opponentPitcherStats?: HrPitcherStats;

  lineupStatus: "confirmed" | "projected_unconfirmed";
};

export type HrScoreBreakdown = {
  hitterPower: number;
  pitcherVulnerability: number;
  parkFactor: number;
  recentForm: number;
  lineupConfidence: number;
  riskPenalty: number;
  finalScore: number;
};

export type HrCandidate = {
  playerId: number;
  playerName: string;

  team: string;
  teamId: number;
  sourceTeamId?: number;
  activeRosterTeamId?: number;
  currentTeamId?: number | null;
  opponent: string;
  opponentTeam: string;
  opponentTeamId: number;

  gamePk: number;
  gameId: string;
  venue: string;

  opponentPitcherName?: string | null;
  opponentPitcherId?: number | null;

  lineupStatus: "confirmed" | "projected_unconfirmed";
  dataQuality: HrDataQuality;
  dataConfidence: number;

  hrScore: number;
  riskTier: HrRiskTier;
  scoreBreakdown: HrScoreBreakdown;
  recentForm?: HrRecentForm;

  reasons: string[];
  warnings: string[];

  status: "confirmed" | "preview" | "blocked" | "waiting";
  registryConflict?: boolean;
};

export type HrPreviewMeta = {
  previewLimit: number;
  eligiblePreviewPoolCount: number;
  scoredPreviewPoolCount: number;
  projectedPreviewCount: number;
};

export type HrEngineDebug = {
  runtime: string;
  trueTeamMismatchBlocked: number;
  registryConflictWarnings: number;
  pitcherMissingBlocked: number;
  hitterStatsMissingBlocked: number;
  /** @deprecated alias — structured team mismatch keys, not a name handlist */
  badPairingAuditBlocked: string[];
  warnings: string[];
};

export type HrBoardResponse = {
  status: "ready" | "error";
  date: string;
  season: string;
  gameCount: number;

  candidates: HrCandidate[];
  projectedCandidates: HrCandidate[];

  previewMeta: HrPreviewMeta;
  debug: HrEngineDebug;

  dataQuality: HrDataQuality;
  source: string;
  runtime: string;
  updatedAt: string;
  warning?: string;
};
