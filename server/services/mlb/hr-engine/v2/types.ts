// HR Probability Engine v2 — input/output contract per docs/hr-master-spec.md.
// Pure types only. No I/O, no framework deps.

export type Handedness = "L" | "R" | "S";
export type RoofStatus = "open" | "closed" | "retractable_open" | "retractable_closed" | "none" | "unknown";
export type DataQualityLabel = "HIGH" | "MEDIUM" | "LOW" | "INVALID";
export type ConfidenceLabel = "HIGH" | "MEDIUM" | "LOW";
export type LineupStatus = "confirmed" | "projected_unconfirmed";

// 1. GAME CONTEXT
export type GameContextV2 = {
  gameId: string;
  date: string;
  awayTeam: string;
  homeTeam: string;
  ballpark: string;
  roofStatus: RoofStatus;
  gameTimeLocal: string;
  impliedTeamTotals: { away: number | null; home: number | null };
  confirmedLineupsStatus: boolean;
};

// 2. BATTER PROFILE
export type SeasonMetrics = {
  EV: number;
  /** Rate fields are normalized to 0..1 at the adapter boundary. */
  FB_percent: number;
  HH_percent: number;
  Barrel_percent: number;
  /** Baseball Savant's public leaderboards expose xwOBA, not xwOBAcon. Null until sourced exactly. */
  xwOBAcon: number | null;
  pull_air_percent: number;
  avg_launch_angle: number;
  sweet_spot_percent: number;
};

export type Rolling30dMetrics = {
  EV: number;
  /** Rate fields are normalized to 0..1 at the adapter boundary. */
  FB_percent: number;
  HH_percent: number;
  Barrel_percent: number;
  xwOBAcon: number;
  pull_air_percent: number;
  avg_launch_angle: number;
  air_hard_hit_rate: number;
};

export type BbeLogEntry = {
  event_date: string;
  launch_angle: number;
  exit_velocity: number;
  barrel_flag: 0 | 1;
  spray_direction: number;
};

export type PitchTypeKey =
  | "four_seam"
  | "sinker"
  | "cutter"
  | "slider"
  | "curve"
  | "changeup";

export type PitchTypeSkill = {
  xwOBA_vs_4seam?: number | null;
  xwOBA_vs_sinker?: number | null;
  xwOBA_vs_cutter?: number | null;
  xwOBA_vs_slider?: number | null;
  xwOBA_vs_curve?: number | null;
  xwOBA_vs_changeup?: number | null;
  sampleCounts?: Partial<Record<PitchTypeKey, number>>;
};

export type SplitProfile = {
  platoon_split_delta: number;
  pull_side_hr_fit: number;
};

export type BatterProfileV2 = {
  batterId: number;
  batterName: string;
  team: string;
  handedness: Handedness;
  projectedLineupSpot: number | null;
  projectedPlateAppearances: number | null;
  starterProbability: number | null;
  seasonMetrics: SeasonMetrics | null;
  rolling30dMetrics: Rolling30dMetrics | null;
  rolling14dBbeLog: BbeLogEntry[];
  pitchTypeSkill: PitchTypeSkill | null;
  splitProfile: SplitProfile | null;
  lineupStatus: LineupStatus;
};

// 3. STARTING PITCHER PROFILE
export type PitchMixUsage = Record<PitchTypeKey, number>;

export type PitcherProfileV2 = {
  pitcherId: number;
  pitcherName: string;
  handedness: Handedness;
  projectedInnings: number | null;
  pitchMixUsage: PitchMixUsage | null;
  swingingStrikePercent: number | null;
  whiffPercent: number | null;
  hrPerFbAllowed: number | null;
  barrelPercentAllowed: number | null;
  flyBallPercentAllowed: number | null;
  xSlgAllowed: number | null;
  FIP: number | null;
  xFIP: number | null;
  recentPitchMixChange: number | null;
  recentVelocityChange: number | null;
  timesThroughOrderExpectation: number | null;
};

// 4. BULLPEN PROFILE
export type BullpenProfileV2 = {
  bullpenId: string;
  last3DaysPitchCount: number | null;
  last2DaysHighLeverageUsage: number | null;
  projectedAvailableRelievers: number | null;
  bullpenHrPerFb: number | null;
  bullpenXFip: number | null;
  bullpenBarrelPercentAllowed: number | null;
  bullpenFatigueIndex: number | null;
};

// 5. ENVIRONMENT
export type EnvironmentVectorV2 = {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  windVectorOutboundMph: number | null;
  parkFactorHrOverall: number;
  parkFactorPullLeft: number;
  parkFactorPullRight: number;
  parkFactorCenter: number;
  weatherConfidence: ConfidenceLabel;
  roofStatus: RoofStatus;
};

// 6. MARKET DATA
export type MarketDataV2 = {
  sportsbookName: string;
  marketTimestamp: string;
  americanOdds: number;
  decimalOdds: number;
  impliedProbabilityRaw: number;
  bestAvailablePriceFlag: boolean;
  marketLimitQuality: ConfidenceLabel;
  consensusPrice: number;
  consensusImpliedProbability: number;
};

export type HrEngineRequestV2 = {
  game: GameContextV2;
  batter: BatterProfileV2;
  pitcher: PitcherProfileV2;
  bullpen: BullpenProfileV2;
  environment: EnvironmentVectorV2;
  market: MarketDataV2 | null;
};

export type ComponentResult = {
  value: number;
  notes: string[];
};

export type SlateValidationResult = {
  dataQuality: DataQualityLabel;
  reasons: string[];
  downgraded: boolean;
};

export type ModelMetadataV2 = {
  modelVersion: string;
  trainingWindow: string;
  calibrationMethod: string;
  lastValidationDate: string;
  coefficientSet: string;
  featureNormalizationVersion: string;
};

export type HrEngineResultV2 = {
  status: "NO ACTION" | "SCORED";
  reason?: string;
  dataQuality: DataQualityLabel;
  confidence: ConfidenceLabel | null;
  components: {
    PCQI: ComponentResult;
    ZFAS: ComponentResult;
    PVM: ComponentResult;
    EPV: ComponentResult;
    OVS: ComponentResult;
  } | null;
  logitHr: number | null;
  pRaw: number | null;
  pCalibrated: number | null;
  pModel: number | null;
  metadata: ModelMetadataV2;
  ledger: string[];
};
