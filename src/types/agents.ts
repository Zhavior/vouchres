/** Frontend contract for AI capper + judge agents. */
import type { JudgeVerdict } from "./judging";

export interface CapperAgent {
  id: string;
  name: string;
  icon: string;
  personality: string;
  riskTolerance: "conservative" | "balanced" | "aggressive" | "high-variance";
  preferredMarkets: string[];
  researchDepth: "deep" | "moderate" | "surface";
  pickStyle: string;
  weakness: string;
  biasRisk: string;
}

export interface JudgeAgent {
  id: string;
  name: string;
  icon: string;
  role: string;
  personality: string;
  checks: string[];
}

export interface AgentPick {
  agentId: string;
  agentName: string;
  player?: string;
  team: string;
  opponent: string;
  market: string;
  selection: string;
  score: number;
  reasons: string[];
  riskWarnings: string[];
  isParlay?: boolean;
  legs?: number;
  dataQuality: "full" | "partial" | "limited";
}

export interface JudgedPick {
  pick: AgentPick;
  verdict: JudgeVerdict;
}

export interface AgentPicksResponse {
  agent: { id: string; name: string; icon: string };
  picks: JudgedPick[];
}
