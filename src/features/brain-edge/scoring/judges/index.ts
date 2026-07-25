import type { NormalizedPlayerPayload } from "../../../../adapters/normalized";

import { barrelJudge } from "./barrelJudge";
import { matchupJudge } from "./matchupJudge";
import type { JudgeResult } from "./types";

export function runJudges(
  payload: NormalizedPlayerPayload
): JudgeResult[] {
  return [
    barrelJudge(payload),
    matchupJudge(payload),
  ];
}
