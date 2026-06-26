/** Base shapes for VouchEdge capper + judge agents. */

export type RiskTolerance = "conservative" | "balanced" | "aggressive" | "high-variance";
export type ResearchDepth = "deep" | "moderate" | "surface";

export interface CapperAgent {
  id: string;
  name: string;
  icon: string; // emoji / icon placeholder
  personality: string;
  riskTolerance: RiskTolerance;
  preferredMarkets: string[];
  researchDepth: ResearchDepth;
  pickStyle: string;
  weakness: string;
  biasRisk: string;
  /** Prompt template for the (optional) Gemini voice layer. {{context}} is injected. */
  promptTemplate: string;
  /** Field names the agent's pick output is expected to contain. */
  outputSchema: string[];
}

export interface JudgeAgent {
  id: string;
  name: string;
  icon: string;
  role: string;
  personality: string;
  checks: string[];
}

/** A pick produced by a capper agent (pre- or post-judge). */
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
