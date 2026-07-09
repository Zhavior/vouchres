/** Shared AI judge agent contracts — frontend + backend metadata only. */

export type AgentPluginId =
  | 'data_scout'
  | 'power_hunter'
  | 'momentum_reader'
  | 'risk_auditor'
  | 'pro_edge_agent'
  | (string & {});

export type AgentPluginMeta = {
  id: AgentPluginId;
  displayName: string;
  handle: string;
  tagline: string;
  persona: string;
  specialty: string;
  color: string;
  code: string;
  builtin: boolean;
  singlePickLimit: number;
};

export type AgentAvailability = {
  status: string;
  label: string;
  gradeable: boolean;
  reasons: string[];
};

/** Daily single-leg pick published by an AI judge agent. */
export type AgentPick = {
  rank: number;
  judgeId: AgentPluginId;
  playerId: number | string | null;
  playerName: string;
  team: string;
  opponent: string;
  opponentPitcherName: string;
  venue: string;
  pickType: string;
  market: string;
  specialtyLabel: string;
  singlePickLabel: string;
  judgeReason: string;
  hrScore: number;
  agentScore: number;
  estimatedHrProbability: number | null;
  confidenceTier: string | null;
  riskTier: string | null;
  lineupStatus: string | null;
  injuryStatus: string | null;
  activeRosterStatus: boolean | null;
  availability: AgentAvailability;
  reasons: string[];
  warnings: string[];
  gradeable: boolean;
  isAvoidPick: boolean;
};

export type AgentRegistryResponse = {
  ok: true;
  status: 'ready';
  agents: AgentPluginMeta[];
  customSlotEnabled: boolean;
  extensionDocs: string;
};

export type AgentRunStubResponse = {
  ok: true;
  status: 'stub';
  agentId: string;
  message: string;
};
