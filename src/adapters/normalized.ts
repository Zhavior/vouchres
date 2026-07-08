/**
 * normalized.ts — Sport-agnostic normalized types.
 *
 * ADDITIVE to the production repo. If the production repo already has
 * normalized types (e.g. NormalizedHrPlayer), this file does NOT replace
 * them — it provides parallel types with the same shape. The adapter
 * functions in hrBoardAdapter.ts output these types.
 *
 * Field names MATCH the backend HrBoardRow payload (no dual vocabulary).
 * The only additions are composite types (NormalizedPlayerPayload) that
 * bundle related fields together for Pro components.
 *
 * Colors (ACCENT) live in theme/colors.ts, not here. Types file = types only.
 */

/* ============================================================================
   Backwards-compat alias: NormalizedHrPlayer
   If the production repo uses NormalizedHrPlayer, this alias makes
   the migration seamless. New code should use NormalizedPlayer.
   ============================================================================ */

/* ============================================================================
   Primitive helpers
   ============================================================================ */

export type SafeNumber = number | null;
export type SafeString = string | null;

/* ============================================================================
   Signal — the universal metric unit
   ============================================================================ */

export interface NormalizedSignal {
  key: string;
  label: string;
  value: SafeNumber;
  max: number;
  color: string;
  hint?: SafeString;
  category?: 'power' | 'matchup' | 'form' | 'confidence' | 'risk';
}

/* ============================================================================
   Player — field names match HrBoardRow backend payload
   ============================================================================ */

export interface NormalizedPlayer {
  playerId: number | string;
  playerName: SafeString;
  team: SafeString;
  opponent: SafeString;
  position?: SafeString;
  headshot?: SafeString;
  venue?: SafeString;
  lineupStatus?: 'confirmed' | 'projected_unconfirmed' | 'projected' | 'unknown';
  grade?: SafeString;
  /** HR Edge score (0-100) — same name as backend `hrEdge` */
  hrEdge?: SafeNumber;
  vouchScore?: SafeNumber;
  riskLabel?: SafeString;
  dataConfidence?: SafeNumber;
  formTag?: SafeString;
  opponentPitcherName?: SafeString;
  opposingPitcherTeam?: SafeString;
  lineupSpot?: SafeNumber;
  reasons?: string[];
  warnings?: string[];
  judgeNote?: SafeString;
  source?: SafeString;
  dataQuality?: 'full' | 'partial' | 'limited' | 'projection_preview' | 'unknown';
}

/* ============================================================================
   Recent Form — field names match backend recentForm
   ============================================================================ */

export interface NormalizedRecentForm {
  gamesChecked?: SafeNumber;
  atBats?: SafeNumber;
  hits?: SafeNumber;
  homeRuns?: SafeNumber;
  doubles?: SafeNumber;
  triples?: SafeNumber;
  extraBaseHits?: SafeNumber;
  totalBases?: SafeNumber;
  slugging?: SafeNumber;
  recentHrRate?: SafeNumber;
  recentPowerScore?: SafeNumber;
}

/* ============================================================================
   Score Breakdown — field names match backend scoreBreakdown
   ============================================================================ */

export interface NormalizedScoreBreakdown {
  hitterPower?: SafeNumber;
  pitcherVulnerability?: SafeNumber;
  parkFactor?: SafeNumber;
  recentForm?: SafeNumber;
  lineupConfidence?: SafeNumber;
  riskPenalty?: SafeNumber;
  finalScore?: SafeNumber;
}

/* ============================================================================
   Matchup — normalized game/pitcher context
   ============================================================================ */

export interface NormalizedMatchup {
  pitcherVulnerability?: SafeNumber;
  parkFactor?: SafeNumber;
  weatherBoost?: SafeNumber;
  hrMultiplier?: SafeString | SafeNumber;
  pitcherHand?: SafeString;
}

/* ============================================================================
   Game — field names match backend HrBoardGame
   ============================================================================ */

export interface NormalizedGame {
  gamePk: number | string;
  matchup: SafeString;
  venue?: SafeString;
  gameTime?: SafeString;
  environmentTag?: 'Hitter-Friendly' | 'Pitcher-Friendly' | 'Neutral' | 'Unknown';
  parkNote?: SafeString;
  weatherNote?: SafeString;
  rankedPlayerCount?: SafeNumber;
}

/* ============================================================================
   Composite — what Pro components actually receive
   ============================================================================ */

export interface NormalizedPlayerPayload {
  player: NormalizedPlayer;
  recentForm?: NormalizedRecentForm;
  scoreBreakdown?: NormalizedScoreBreakdown;
  matchup?: NormalizedMatchup;
  isPro?: boolean;
}

export interface NormalizedGamePayload {
  game: NormalizedGame;
  players: NormalizedPlayer[];
  isPro?: boolean;
}

/* ============================================================================
   Backwards-compat aliases
   If the production repo uses these names, the aliases make migration seamless.
   New code should use the canonical names above.
   ============================================================================ */

/** Alias for NormalizedPlayer — use this if production repo already has NormalizedPlayer. */
export type NormalizedHrPlayer = NormalizedPlayer;

/** Alias for NormalizedPlayerPayload — matches production repo naming if it exists. */
export type NormalizedHrPlayerPayload = NormalizedPlayerPayload;

/** Alias for NormalizedGamePayload — matches production repo naming if it exists. */
export type NormalizedHrGamePayload = NormalizedGamePayload;
