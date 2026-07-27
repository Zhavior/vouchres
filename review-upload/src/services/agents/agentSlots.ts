/**
 * Frontend agent slot contracts — mirrors `GET /api/ai-judges/registry`.
 *
 * ## How to add an agent (extension door)
 * 1. Server: implement `JudgeAgentPlugin` in `server/services/aiJudges/agentRegistry.ts`
 *    and call `registerAgent()` at boot.
 * 2. API: agent metadata appears on `/api/ai-judges/registry` automatically.
 * 3. UI: `AgentDock` + this file pick up new slots via `useAiAgentRegistry()`.
 * 4. Trust-first: agents must honor confirmed vs projected lineup rules (see AGENTS.md).
 */
import { LANDING_JUDGES } from '../../constants/aiJudges';
import type { AgentPluginMeta } from '../../types/aiAgent';

/** One UI slot for a registered judge agent (built-in or plugin). */
export type AgentSlot = AgentPluginMeta & {
  /** Short role label for hub cards */
  role?: string;
  /** One-line focus copy for the AI Edge Lab header grid */
  focus?: string;
};

const HUB_COPY: Record<string, { role: string; focus: string }> = {
  DS: {
    role: 'Math-first game reads',
    focus: 'Checks slate rank, data quality, score logic, and weak spots.',
  },
  PH: {
    role: 'HR threat radar',
    focus: 'Finds hitters with power paths, HR edge, and pitcher mistake zones.',
  },
  MR: {
    role: 'Game rhythm',
    focus: 'Reads recent form, pressure windows, and late-game opportunity.',
  },
  RA: {
    role: 'Skeptical filter',
    focus: 'Flags missing data, projected lineups, and fake confidence traps.',
  },
  PE: {
    role: 'Premium paths',
    focus: 'Blends power, matchup, form, and risk for serious edge hunters.',
  },
};

/** Built-in slots seeded from landing constants — registry API is source of truth at runtime. */
export const BUILTIN_AGENT_SLOTS: AgentSlot[] = LANDING_JUDGES.map((judge) => ({
  id: judge.id,
  displayName: judge.displayName,
  handle: judge.handle,
  tagline: judge.tagline,
  persona: judge.persona,
  specialty: judge.specialty,
  color: judge.color,
  code: judge.code,
  builtin: true,
  singlePickLimit: 1,
  ...HUB_COPY[judge.code],
}));

/** Merge registry metadata with static hub copy for display. */
export function hydrateAgentSlots(agents: AgentPluginMeta[]): AgentSlot[] {
  return agents.map((agent) => ({
    ...agent,
    ...HUB_COPY[agent.code],
  }));
}

export const AGENT_REGISTRY_PATH = '/api/ai-judges/registry';
