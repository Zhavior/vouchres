import type { NormalizedPlayerPayload } from "../../../../adapters/normalized";

import { buildBrainContext } from "../brainContext";

import { barrelJudge } from "./barrelJudge";
import { matchupJudge } from "./matchupJudge";

import type { JudgeResult } from "./types";

export function runJudges(
  payload: NormalizedPlayerPayload,
): JudgeResult[] {
  const context = buildBrainContext(payload);

  return [
    barrelJudge(context),
    matchupJudge(context),
  ];
}
