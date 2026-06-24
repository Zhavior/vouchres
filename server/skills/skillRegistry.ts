/**
 * Skill registry. Reusable, schema-described backend capabilities that agents or
 * routes can call uniformly via runSkill(id, input). Each skill wraps an engine or
 * service so the intelligence layer stays the single source of truth.
 */
import { getTodayGames, getScheduleByDate, getProbablePitchers, todayISO } from "../services/mlb/mlbClient";
import { buildVulnerablePitcherReport } from "../services/intelligence/pitcherVulnerabilityEngine";
import { rankHrTargets, findSneakyHrTargets } from "../services/intelligence/hrEngine";
import { rankRbiTargets } from "../services/intelligence/rbiEnvironmentEngine";
import { scoreRunEnvironment } from "../services/intelligence/runEnvironmentEngine";
import { buildParlay } from "../services/intelligence/parlayEngine";
import { runJudgePanel } from "../services/judging/trustJudgeService";
import { PickCandidate } from "../services/judging/judgeTypes";
import { gradeResult, GameOutcome } from "../services/results/resultGrader";
import { gradeAndLearn } from "../services/results/learningNoteService";
import { getCapperTrust } from "../services/trust/trustScoreService";
import { getPick } from "../services/trust/resultLedgerService";

export interface Skill {
  id: string;
  name: string;
  description: string;
  inputSchema: string[];
  outputSchema: string[];
  run: (input: any) => Promise<any>;
}

async function gamesFor(input: any) {
  return input?.date ? getScheduleByDate(input.date) : getTodayGames();
}

export const SKILLS: Skill[] = [
  {
    id: "fetchTodaysGames",
    name: "Fetch Today's Games",
    description: "Normalized MLB schedule for today (or a given date).",
    inputSchema: ["date?"],
    outputSchema: ["games[]"],
    run: async (input) => ({ games: await gamesFor(input) }),
  },
  {
    id: "fetchProbablePitchers",
    name: "Fetch Probable Pitchers",
    description: "Probable pitchers for a date.",
    inputSchema: ["date?"],
    outputSchema: ["pitchers[]"],
    run: async (input) => ({ pitchers: await getProbablePitchers(input?.date ?? todayISO()) }),
  },
  {
    id: "createVulnerablePitcherReport",
    name: "Vulnerable Pitcher Report",
    description: "Vulnerability profile per probable pitcher.",
    inputSchema: ["date?"],
    outputSchema: ["report[]"],
    run: async (input) => ({ report: buildVulnerablePitcherReport(await gamesFor(input)) }),
  },
  {
    id: "rankHrTargets",
    name: "Rank HR Targets",
    description: "Ranked HR matchup targets for the slate.",
    inputSchema: ["date?"],
    outputSchema: ["targets[]"],
    run: async (input) => ({ targets: rankHrTargets(await gamesFor(input)) }),
  },
  {
    id: "findSneakyHrTargets",
    name: "Sneaky HR Finder",
    description: "Non-obvious, higher-risk HR candidates.",
    inputSchema: ["date?"],
    outputSchema: ["sneaky[]"],
    run: async (input) => ({ sneaky: findSneakyHrTargets(await gamesFor(input)) }),
  },
  {
    id: "rankRbiTargets",
    name: "Rank RBI Targets",
    description: "RBI environment + team stack notes.",
    inputSchema: ["date?"],
    outputSchema: ["rbi"],
    run: async (input) => ({ rbi: rankRbiTargets(await gamesFor(input)) }),
  },
  {
    id: "scoreRunEnvironment",
    name: "Score Run Environment",
    description: "Higher-scoring game environment scores.",
    inputSchema: ["date?"],
    outputSchema: ["environments[]"],
    run: async (input) => ({ environments: scoreRunEnvironment(await gamesFor(input)) }),
  },
  {
    id: "buildParlay",
    name: "Build Parlay",
    description: "Assemble a 2-4 leg parlay from the slate (Risk-Judge required).",
    inputSchema: ["date?", "size?"],
    outputSchema: ["parlay"],
    run: async (input) => ({ parlay: buildParlay(await gamesFor(input), input?.size ?? 3) }),
  },
  {
    id: "judgePick",
    name: "Judge Pick",
    description: "Run a pick through the four-judge panel.",
    inputSchema: ["pick"],
    outputSchema: ["verdict"],
    run: async (input) => ({ verdict: runJudgePanel(input.pick as PickCandidate) }),
  },
  {
    id: "gradeResult",
    name: "Grade Result",
    description: "Grade a pending pick against a final game outcome.",
    inputSchema: ["pickId", "outcome"],
    outputSchema: ["status"],
    run: async (input) => {
      const pick = getPick(input.pickId);
      if (!pick) return { status: "pending", error: "pick not found" };
      return { status: gradeResult(pick, input.outcome as GameOutcome) };
    },
  },
  {
    id: "updateTrustScore",
    name: "Update Trust Score",
    description: "Recompute a capper's trust score from the ledger.",
    inputSchema: ["capperId"],
    outputSchema: ["trust"],
    run: async (input) => ({ trust: getCapperTrust(input.capperId) }),
  },
  {
    id: "createLearningNote",
    name: "Create Learning Note",
    description: "Grade a pick and generate an AI learning note.",
    inputSchema: ["pickId", "result", "whatActuallyHappened?"],
    outputSchema: ["pick", "learningNote", "capperTrust"],
    run: async (input) => gradeAndLearn(input.pickId, input.result, input.whatActuallyHappened),
  },
];

export function listSkills(): Omit<Skill, "run">[] {
  return SKILLS.map(({ run, ...meta }) => meta);
}

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id);
}

export async function runSkill(id: string, input: any): Promise<any> {
  const skill = getSkill(id);
  if (!skill) throw new Error(`Unknown skill: ${id}`);
  return skill.run(input);
}
