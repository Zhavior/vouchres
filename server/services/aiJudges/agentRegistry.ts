/**
 * AI Judge agent plugin registry — extension door for plugging custom agents.
 *
 * ## How to add a new agent
 * 1. Implement `JudgeAgentPlugin` with `scoreCandidate`, `buildSinglePick`, and optional `gradeStrategy`.
 * 2. Call `registerAgent(plugin)` at server boot (before leaderboard routes serve traffic).
 * 3. Expose metadata via `GET /api/ai-judges/registry` for the UI Agent Dock.
 * 4. Trust-first: only confirmed HR board candidates in `candidates[]`; never fake lineups or stats.
 *
 * Built-in judges (DS/PH/MR/RA/PE) register automatically on import.
 */
import {
  builtinJudgePickMeta,
  builtinJudgeReason,
  buildJudgePick,
  passesBuiltinJudgeGate,
  rankCandidatesForJudge,
  scoreBuiltinJudge,
  selectTopPicksForJudge,
  setAgentResolver,
  singlePickLimit,
  type JudgeCandidate,
  type JudgeId,
  type JudgePickMeta,
} from "./judgeScoring";

export type AgentPick = ReturnType<typeof selectTopPicksForJudge>[number];

export type GradeStrategy = {
  /** When true, daily single is a trap-avoid (Risk Auditor style). */
  isAvoidPick?: boolean;
  /** Override default availability grading for specialty agents. */
  gradePick?: (pick: AgentPick) => { gradeable: boolean; label: string };
};

export type AgentPluginMeta = {
  id: string;
  displayName: string;
  handle: string;
  tagline: string;
  persona: string;
  specialty: string;
  color: string;
  code: string;
  builtin: boolean;
  singlePickLimit: number;
  gradeStrategy?: GradeStrategy;
};

/** Plugin contract for AI Edge Lab judge agents. */
export type JudgeAgentPlugin = AgentPluginMeta & {
  scoreCandidate: (candidate: JudgeCandidate) => number;
  pickMeta: () => JudgePickMeta;
  buildReason: (candidate: JudgeCandidate) => string;
  passesGate: (candidate: JudgeCandidate, relaxed: boolean) => boolean;
  buildSinglePick: (candidate: JudgeCandidate, rank?: number) => AgentPick;
  buildPicks: (candidates: JudgeCandidate[]) => AgentPick[];
};

/** @deprecated Use JudgeAgentPlugin */
export type AgentPlugin = JudgeAgentPlugin;

const BUILTIN_META: Omit<AgentPluginMeta, "builtin" | "singlePickLimit" | "gradeStrategy">[] = [
  {
    id: "data_scout",
    displayName: "Data Scout",
    handle: "ai-data-scout",
    tagline: "Clean math. Low hype. Safer profiles.",
    persona: "Finds cleaner HR profiles with better data quality and fewer red flags.",
    specialty: "Math-first slate screening",
    color: "cyan",
    code: "DS",
  },
  {
    id: "power_hunter",
    displayName: "Power Hunter",
    handle: "ai-power-hunter",
    tagline: "Home-run upside hunter.",
    persona: "Chases raw HR upside using hitter power, pitcher vulnerability, and park context.",
    specialty: "HR threat radar",
    color: "orange",
    code: "PH",
  },
  {
    id: "momentum_reader",
    displayName: "Momentum Reader",
    handle: "ai-momentum-reader",
    tagline: "Recent form and rhythm reader.",
    persona: "Reads recent form, lineup volume, and short-term momentum signals.",
    specialty: "Game rhythm & form",
    color: "purple",
    code: "MR",
  },
  {
    id: "risk_auditor",
    displayName: "Risk Auditor",
    handle: "ai-risk-auditor",
    tagline: "Finds traps before they cost you.",
    persona: "Flags thin data, risky profiles, projection problems, and low-confidence picks.",
    specialty: "Skeptical filter",
    color: "red",
    code: "RA",
  },
  {
    id: "pro_edge_agent",
    displayName: "Pro Edge Agent",
    handle: "ai-pro-edge",
    tagline: "Premium blended model.",
    persona: "Blends power, matchup, form, confidence, and risk into one premium read.",
    specialty: "Premium blended edge",
    color: "emerald",
    code: "PE",
  },
];

function wrapBuiltinJudge(
  meta: Omit<AgentPluginMeta, "builtin" | "singlePickLimit" | "gradeStrategy">,
): JudgeAgentPlugin {
  const judgeId = meta.id as JudgeId;
  const gradeStrategy: GradeStrategy | undefined =
    judgeId === "risk_auditor"
      ? {
          isAvoidPick: true,
          gradePick: (pick) => ({
            gradeable: pick.gradeable,
            label: pick.availability?.label ?? "Trap Watch / Avoid Board",
          }),
        }
      : undefined;

  return {
    ...meta,
    builtin: true,
    singlePickLimit: singlePickLimit(judgeId),
    gradeStrategy,
    scoreCandidate: (candidate) => scoreBuiltinJudge(judgeId, candidate),
    pickMeta: () => builtinJudgePickMeta(judgeId),
    buildReason: (candidate) => builtinJudgeReason(judgeId, candidate),
    passesGate: (candidate, relaxed) => passesBuiltinJudgeGate(judgeId, candidate, relaxed),
    buildSinglePick: (candidate, rank = 1) => buildJudgePick(judgeId, candidate, rank),
    buildPicks: (candidates) => {
      const [top] = rankCandidatesForJudge(judgeId, candidates, 1);
      return top ? [buildJudgePick(judgeId, top, 1)] : [];
    },
  };
}

const registry = new Map<string, JudgeAgentPlugin>();

for (const meta of BUILTIN_META) {
  registry.set(meta.id, wrapBuiltinJudge(meta));
}

/** Register a custom agent plugin. Built-in ids cannot be overwritten. */
export function registerAgent(plugin: JudgeAgentPlugin): void {
  if (registry.has(plugin.id) && registry.get(plugin.id)?.builtin) {
    throw new Error(`Cannot overwrite built-in agent: ${plugin.id}`);
  }
  registry.set(plugin.id, {
    ...plugin,
    builtin: plugin.builtin ?? false,
    buildPicks:
      plugin.buildPicks ??
      ((candidates) => {
        const ranked = candidates
          .filter((c) => plugin.passesGate(c, false) || plugin.passesGate(c, true))
          .sort((a, b) => plugin.scoreCandidate(b) - plugin.scoreCandidate(a));
        const top = ranked[0];
        return top ? [plugin.buildSinglePick(top, 1)] : [];
      }),
    buildSinglePick: (candidate, rank = 1) =>
      plugin.buildSinglePick(candidate, rank),
  });
}

export function listAgents(): JudgeAgentPlugin[] {
  return [...registry.values()];
}

export function getAgent(id: string): JudgeAgentPlugin | undefined {
  return registry.get(id);
}

/** Metadata-only view for public API — no scoring functions or secrets. */
export function listAgentMeta(): AgentPluginMeta[] {
  return listAgents().map(
    ({ scoreCandidate: _s, buildPicks: _b, buildSinglePick: _p, pickMeta: _m, buildReason: _r, passesGate: _g, ...meta }) =>
      meta,
  );
}

/** Back-compat alias used by leaderboard + social services. */
export const AI_JUDGES = listAgentMeta();

export const EXTENSION_DOCS_PATH = "server/services/aiJudges/agentRegistry.ts";

setAgentResolver(getAgent);
