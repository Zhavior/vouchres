// Domain types — kept in sync with backend OpenAPI spec.
// Phase 2: codegen from /openapi.json

export type Market = "hr" | "hit" | "rbi" | "run" | "tb";
export type RiskTier = "low" | "medium" | "high" | "lottery";
export type PickStatus = "saved" | "locked" | "grading" | "final";
export type PickResult = "pending" | "won" | "lost" | "push" | "void";
export type VouchLevel = "unverified" | "bronze" | "silver" | "gold" | "platinum";
export type Plan = "free" | "pro" | "capper";

export interface User {
  id: string;
  email: string;
  username: string;
  role: "user" | "capper" | "admin";
  region: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface MeResponse {
  user: User;
  trust_score: number;
  vouch_level: VouchLevel;
  plan: Plan;
}

export interface Game {
  id: number;
  away_id: number;
  home_id: number;
  away_abbr?: string;
  home_abbr?: string;
  venue?: string;
  scheduled_first_pitch: string;
  status: "scheduled" | "pre" | "live" | "delayed" | "final" | "postponed" | "cancelled";
  probable_pitcher_away?: number;
  probable_pitcher_home?: number;
  weather?: { temp?: number; wind?: string; condition?: string };
  lineup_confirmed: boolean;
  data_fresh_at?: string | null;
}

export interface ModelScore {
  id: number;
  player_id: number;
  game_id: number;
  market: Market;
  probability: number;
  confidence: number;
  edge: number;
  risk_tier: RiskTier;
  reasoning?: string;
  model_version: string;
}

export interface Pick {
  id: string;
  game_id: number;
  player_id: number;
  market: Market;
  line: number;
  status: PickStatus;
  result: PickResult;
  locked_at: string | null;
  graded_at: string | null;
  created_at: string;
}

export interface TrustComponents {
  verified_performance: number;
  volume_factor: number;
  vouch_factor: number;
  streak_factor: number;
  transparency_factor: number;
  penalty_factor: number;
}

export interface TrustInfo {
  user_id: string;
  trust_score: number;
  vouch_level: VouchLevel;
  verified_picks: number;
  win_rate: number;
  market_records: Record<string, { won: number; lost: number; push: number; void: number }>;
  streak: number;
  components: TrustComponents;
}
