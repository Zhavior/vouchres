/**
 * Unified agent catalog — every in-repo agent lane in one install surface.
 * AI Judges (picks) + panel judges + cappers + brand mark.
 * Cursor/Claude cloud agents are NOT installable here (separate runs).
 */
import { listAgentMeta } from "../aiJudges/agentRegistry";
import { CAPPER_AGENTS, JUDGE_AGENTS } from "../../agents/agentRegistry";
import type { CapperAgent, JudgeAgent } from "../../agents/baseAgent";

export type AgentLane = "ai_judge" | "panel_judge" | "capper" | "brand";

export type CatalogAgent = {
  id: string;
  name: string;
  lane: AgentLane;
  code?: string;
  tagline: string;
  specialty: string;
  color?: string;
  builtin: boolean;
  /** How to invoke this agent */
  endpoint?: string;
};

const BRAND_MARK_AGENT: CatalogAgent = {
  id: "brand_mark",
  name: "Brand Mark Judge",
  lane: "brand",
  code: "BM",
  tagline: "Craft bar for the VouchEdge icon — shield + VE monogram, no sportsbook cues.",
  specialty: "Brand / store icon QA",
  color: "cyan",
  builtin: true,
  endpoint: "GET /api/judge/brand-mark",
};

export function buildUnifiedAgentCatalog(): {
  total: number;
  lanes: Record<AgentLane, number>;
  agents: CatalogAgent[];
  notes: string[];
} {
  const aiJudges: CatalogAgent[] = listAgentMeta().map((a) => ({
    id: a.id,
    name: a.displayName,
    lane: "ai_judge" as const,
    code: a.code,
    tagline: a.tagline,
    specialty: a.specialty,
    color: a.color,
    builtin: a.builtin,
    endpoint: `GET /api/ai-judges/agents/${a.id}/run`,
  }));

  const panelJudges: CatalogAgent[] = JUDGE_AGENTS.map((j: JudgeAgent) => ({
    id: j.id,
    name: j.name,
    lane: "panel_judge" as const,
    tagline: j.role,
    specialty: j.checks.slice(0, 2).join(" · "),
    builtin: true,
    endpoint: "POST /api/judge/pick",
  }));

  const cappers: CatalogAgent[] = CAPPER_AGENTS.map((c: CapperAgent) => ({
    id: c.id,
    name: c.name,
    lane: "capper" as const,
    tagline: c.personality,
    specialty: `${c.pickStyle} · ${c.riskTolerance}`,
    builtin: true,
    endpoint: `POST /api/agents/${c.id}/generate-picks`,
  }));

  const agents = [...aiJudges, ...panelJudges, ...cappers, BRAND_MARK_AGENT];

  return {
    total: agents.length,
    lanes: {
      ai_judge: aiJudges.length,
      panel_judge: panelJudges.length,
      capper: cappers.length,
      brand: 1,
    },
    agents,
    notes: [
      "Installed: in-repo agent lanes only.",
      "Cursor/Claude cloud agents (desktop runs) cannot be installed into this API.",
      "AI Judges score HR board candidates. Brand Mark Judge scores the app icon SVG.",
      "Cappers generate researched picks; panel judges score pick quality/risk/bias/trust.",
    ],
  };
}
